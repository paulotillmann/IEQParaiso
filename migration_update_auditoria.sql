-- =====================================================================
-- MIGRAÇÃO: ATUALIZAÇÃO DE AUDITORIA (DÍZIMOS/OFERTAS E LOGIN/LOGOFF)
-- =====================================================================

-- 1. Criar Trigger de Auditoria para a tabela dizimos_ofertas
DROP TRIGGER IF EXISTS audit_dizimos_ofertas_trigger ON public.dizimos_ofertas;

CREATE TRIGGER audit_dizimos_ofertas_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.dizimos_ofertas
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 2. Criar RPC: registrar_login
CREATE OR REPLACE FUNCTION public.registrar_login()
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
            'login',
            'sessao'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar RPC: registrar_logoff
CREATE OR REPLACE FUNCTION public.registrar_logoff()
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
            'logoff',
            'sessao'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
