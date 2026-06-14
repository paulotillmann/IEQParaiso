-- =====================================================================
-- MIGRAÇÃO: LOGS DE AUDITORIA E ACESSO
-- =====================================================================

-- 1. Criar Tabela: logs_atividade
CREATE TABLE IF NOT EXISTS public.logs_atividade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(255) NOT NULL,
    usuario_email VARCHAR(255) NOT NULL,
    acao VARCHAR(50) NOT NULL, -- 'acesso', 'inclusao', 'alteracao', 'exclusao'
    tabela VARCHAR(100),
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.logs_atividade ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas RLS
CREATE POLICY "Permitir leitura de logs apenas para administradores ativos"
    ON public.logs_atividade FOR SELECT
    TO authenticated
    USING (public.is_user_active() = true AND public.get_my_perfil() = 'administrador');

-- 4. Criar Função Trigger de Auditoria
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    user_name VARCHAR(150);
    user_email VARCHAR(255);
    action_type VARCHAR(50);
    old_data JSONB := null;
    new_data JSONB := null;
    record_id UUID;
BEGIN
    -- Obter o ID do usuário autenticado no Supabase
    current_user_id := auth.uid();
    
    -- Se houver um usuário autenticado, busca nome e e-mail na tabela de usuários
    IF current_user_id IS NOT NULL THEN
        SELECT nome, email INTO user_name, user_email 
        FROM public.usuarios 
        WHERE id = current_user_id;
    END IF;
    
    -- Fallback específico: quando o primeiro usuário é inserido através da trigger handle_new_user,
    -- o auth.uid() pode estar nulo na transação interna da trigger. Usamos os dados do próprio registro.
    IF current_user_id IS NULL AND TG_TABLE_NAME = 'usuarios' AND TG_OP = 'INSERT' THEN
        current_user_id := NEW.id;
        user_name := NEW.nome;
        user_email := NEW.email;
    END IF;
    
    -- Configurar ação e dados a serem guardados com base no tipo de operação
    IF (TG_OP = 'INSERT') THEN
        action_type := 'inclusao';
        new_data := to_jsonb(NEW);
        record_id := NEW.id;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Otimização: Ignorar logs para atualizações automáticas de 'ultimo_acesso' feitas pelo frontend na tabela usuarios
        IF TG_TABLE_NAME = 'usuarios' AND 
           OLD.nome = NEW.nome AND 
           OLD.email = NEW.email AND 
           OLD.perfil = NEW.perfil AND 
           OLD.ativo = NEW.ativo AND 
           OLD.ultimo_acesso IS DISTINCT FROM NEW.ultimo_acesso THEN
            RETURN NEW;
        END IF;
        
        action_type := 'alteracao';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        record_id := NEW.id;
    ELSIF (TG_OP = 'DELETE') THEN
        action_type := 'exclusao';
        old_data := to_jsonb(OLD);
        record_id := OLD.id;
    END IF;
    
    -- Inserir registro na tabela de auditoria
    INSERT INTO public.logs_atividade (
        usuario_id,
        usuario_nome,
        usuario_email,
        acao,
        tabela,
        registro_id,
        dados_anteriores,
        dados_novos
    ) VALUES (
        current_user_id,
        coalesce(user_name, 'Sistema'),
        coalesce(user_email, 'sistema@system.local'),
        action_type,
        TG_TABLE_NAME,
        record_id,
        old_data,
        new_data
    );
    
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar Triggers para monitoramento nas tabelas de negócio
-- 5.1 Cargos
CREATE TRIGGER audit_cargos_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.cargos
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 5.2 Usuários (Profiles)
CREATE TRIGGER audit_usuarios_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 5.3 Membros
CREATE TRIGGER audit_membros_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.membros
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 5.4 Visitantes
CREATE TRIGGER audit_visitantes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.visitantes
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 5.5 Cultos
CREATE TRIGGER audit_cultos_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.cultos
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 5.6 Presença de Membros
CREATE TRIGGER audit_presenca_membros_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.presenca_membros
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 5.7 Presença de Visitantes
CREATE TRIGGER audit_presenca_visitantes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.presenca_visitantes
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 6. Criar RPC: registrar_acesso
CREATE OR REPLACE FUNCTION public.registrar_acesso()
RETURNS VOID AS $$
DECLARE
    current_user_id UUID;
    user_name VARCHAR(150);
    user_email VARCHAR(255);
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NOT NULL THEN
        SELECT nome, email INTO user_name, user_email 
        FROM public.usuarios 
        WHERE id = current_user_id;
        
        INSERT INTO public.logs_atividade (
            usuario_id,
            usuario_nome,
            usuario_email,
            acao,
            tabela
        ) VALUES (
            current_user_id,
            coalesce(user_name, 'Desconhecido'),
            coalesce(user_email, ''),
            'acesso',
            'sessao'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
