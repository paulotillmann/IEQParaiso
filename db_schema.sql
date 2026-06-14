-- 1. Enums e Tipos
CREATE TYPE public.perfil_usuario AS ENUM ('administrador', 'secretaria', 'pastor');
CREATE TYPE public.estado_civil_membro AS ENUM ('solteiro', 'casado', 'divorciado', 'viuvo');

-- 2. Tabela: cargos
CREATE TABLE IF NOT EXISTS public.cargos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) UNIQUE NOT NULL,
    descricao VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela: usuarios (Profiles vinculados ao auth.users)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    perfil public.perfil_usuario NOT NULL DEFAULT 'secretaria',
    ativo BOOLEAN NOT NULL DEFAULT true,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela: membros
CREATE TABLE IF NOT EXISTS public.membros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(200) NOT NULL,
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    endereco VARCHAR(255),
    cidade VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL,
    data_nascimento DATE,
    estado_civil public.estado_civil_membro,
    data_batismo DATE,
    data_ingresso DATE NOT NULL DEFAULT CURRENT_DATE,
    foto_url VARCHAR(500),
    observacoes TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    cargo_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE RESTRICT,
    codigo_ieq INTEGER,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Função e Triggers para atualizado_em
CREATE OR REPLACE FUNCTION public.set_current_timestamp_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cargos_atualizado_em
    BEFORE UPDATE ON public.cargos
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_atualizado_em();

CREATE TRIGGER set_usuarios_atualizado_em
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_atualizado_em();

CREATE TRIGGER set_membros_atualizado_em
    BEFORE UPDATE ON public.membros
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_atualizado_em();

-- 6. Trigger para sincronização do auth.users com public.usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_first_user BOOLEAN;
    default_perfil public.perfil_usuario;
    is_active BOOLEAN;
BEGIN
    -- Se for o primeiro usuário do banco, será Administrador e ativo, senão Secretária e inativo
    SELECT NOT EXISTS (SELECT 1 FROM public.usuarios) INTO is_first_user;
    
    IF is_first_user THEN
        default_perfil := 'administrador';
        is_active := true;
    ELSE
        default_perfil := 'secretaria';
        is_active := false;
    END IF;

    INSERT INTO public.usuarios (id, nome, email, perfil, ativo)
    VALUES (
        new.id,
        coalesce(new.raw_user_meta_data->>'nome', 'Novo Usuário'),
        new.email,
        coalesce((new.raw_user_meta_data->>'perfil')::public.perfil_usuario, default_perfil),
        is_active
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Carga de Dados Inicial para cargos
INSERT INTO public.cargos (nome, descricao, ativo) VALUES
('Pastor', 'Pastor titular ou auxiliar da igreja', true),
('Secretária', 'Responsável pela gestão administrativa e membresia', true),
('Líder', 'Líder de célula, departamento ou ministério', true),
('Diácono', 'Diácono integrado ao corpo diaconal', true),
('Obreiro', 'Obreiro credenciado', true),
('Membro', 'Membro comungante da igreja', true)
ON CONFLICT (nome) DO NOTHING;

-- 8. Ativação de Row Level Security (RLS)
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membros ENABLE ROW LEVEL SECURITY;

-- 9. Funções Auxiliares de Políticas (Security Definitive)
CREATE OR REPLACE FUNCTION public.get_my_perfil()
RETURNS public.perfil_usuario AS $$
    SELECT perfil FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS BOOLEAN AS $$
    SELECT ativo FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 10. Políticas RLS para cargos
CREATE POLICY "Permitir leitura de cargos para usuários autenticados e ativos"
    ON public.cargos FOR SELECT
    TO authenticated
    USING (public.is_user_active() = true);

CREATE POLICY "Permitir modificações de cargos para administradores ativos"
    ON public.cargos FOR ALL
    TO authenticated
    USING (public.is_user_active() = true AND public.get_my_perfil() = 'administrador')
    WITH CHECK (public.is_user_active() = true AND public.get_my_perfil() = 'administrador');

-- 11. Políticas RLS para membros
CREATE POLICY "Permitir leitura de membros para usuários autenticados e ativos"
    ON public.membros FOR SELECT
    TO authenticated
    USING (public.is_user_active() = true);

CREATE POLICY "Permitir modificações de membros para administradores e secretárias ativas"
    ON public.membros FOR ALL
    TO authenticated
    USING (public.is_user_active() = true AND public.get_my_perfil() IN ('administrador', 'secretaria'))
    WITH CHECK (public.is_user_active() = true AND public.get_my_perfil() IN ('administrador', 'secretaria'));

-- 12. Políticas RLS para usuarios
CREATE POLICY "Permitir leitura do próprio perfil ou todos para administradores ativos"
    ON public.usuarios FOR SELECT
    TO authenticated
    USING (public.is_user_active() = true AND (auth.uid() = id OR public.get_my_perfil() = 'administrador'));

CREATE POLICY "Permitir modificações de usuários para administradores ativos"
    ON public.usuarios FOR ALL
    TO authenticated
    USING (public.is_user_active() = true AND public.get_my_perfil() = 'administrador')
    WITH CHECK (public.is_user_active() = true AND public.get_my_perfil() = 'administrador');

-- 13. Vinculação retroativa do Administrador inicial
INSERT INTO public.usuarios (id, nome, email, perfil, ativo)
VALUES ('6bb4be31-e555-40e2-8c70-0b4ea6dc47cc', 'Paulo G. Tillmann', 'paulogtillmann@gmail.com', 'administrador', true)
ON CONFLICT (id) DO NOTHING;

-- 14. Tabela: visitantes
CREATE TABLE IF NOT EXISTS public.visitantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(200) NOT NULL,
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    endereco VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL DEFAULT 'Araguari',
    uf VARCHAR(2) NOT NULL DEFAULT 'MG',
    quem_convidou VARCHAR(200),
    observacoes TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para visitantes atualizado_em
CREATE TRIGGER set_visitantes_atualizado_em
    BEFORE UPDATE ON public.visitantes
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_atualizado_em();

-- Ativação de RLS para visitantes
ALTER TABLE public.visitantes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para visitantes
CREATE POLICY "Permitir leitura de visitantes para usuários autenticados e ativos"
    ON public.visitantes FOR SELECT
    TO authenticated
    USING (public.is_user_active() = true);

CREATE POLICY "Permitir modificações de visitantes para administradores e secretárias ativas"
    ON public.visitantes FOR ALL
    TO authenticated
    USING (public.is_user_active() = true AND public.get_my_perfil() IN ('administrador', 'secretaria'))
    WITH CHECK (public.is_user_active() = true AND public.get_my_perfil() IN ('administrador', 'secretaria'));


-- 15. Tipo Enum para Cultos
CREATE TYPE public.tipo_culto AS ENUM ('normal', 'especial');

-- 16. Tabela: cultos
CREATE TABLE IF NOT EXISTS public.cultos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(150) NOT NULL,
    tipo public.tipo_culto NOT NULL DEFAULT 'normal',
    descricao TEXT,
    data_culto DATE NOT NULL,
    horario_inicio TIME,
    horario_fim TIME,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para cultos atualizado_em
CREATE TRIGGER set_cultos_atualizado_em
    BEFORE UPDATE ON public.cultos
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_atualizado_em();

-- Ativação de RLS para cultos
ALTER TABLE public.cultos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cultos
CREATE POLICY "Permitir leitura de cultos para usuários autenticados e ativos"
    ON public.cultos FOR SELECT
    TO authenticated
    USING (public.is_user_active() = true);

CREATE POLICY "Permitir modificações de cultos para administradores e secretárias ativas"
    ON public.cultos FOR ALL
    TO authenticated
    USING (public.is_user_active() = true AND public.get_my_perfil() IN ('administrador', 'secretaria'))
    WITH CHECK (public.is_user_active() = true AND public.get_my_perfil() IN ('administrador', 'secretaria'));


-- 17. Tabela: presenca_membros
CREATE TABLE IF NOT EXISTS public.presenca_membros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    culto_id UUID NOT NULL REFERENCES public.cultos(id) ON DELETE CASCADE,
    membro_id UUID NOT NULL REFERENCES public.membros(id) ON DELETE CASCADE,
    presente BOOLEAN NOT NULL DEFAULT true,
    registrado_por UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    registrado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- CA40 - Garantir que não haja duplicidade de presença
    CONSTRAINT unique_culto_membro UNIQUE (culto_id, membro_id)
);

-- 18. Tabela: presenca_visitantes
CREATE TABLE IF NOT EXISTS public.presenca_visitantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    culto_id UUID NOT NULL REFERENCES public.cultos(id) ON DELETE CASCADE,
    visitante_id UUID NOT NULL REFERENCES public.visitantes(id) ON DELETE CASCADE,
    presente BOOLEAN NOT NULL DEFAULT true,
    registrado_por UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    registrado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- CA40 - Garantir que não haja duplicidade de presença
    CONSTRAINT unique_culto_visitante UNIQUE (culto_id, visitante_id)
);

-- Ativação de RLS para presenças
ALTER TABLE public.presenca_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presenca_visitantes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para presenca_membros
CREATE POLICY "Permitir leitura de presenças de membros para usuários ativos"
    ON public.presenca_membros FOR SELECT
    TO authenticated
    USING (public.is_user_active() = true);

CREATE POLICY "Permitir alteração de presenças de membros para secretárias e administradores ativos"
    ON public.presenca_membros FOR ALL
    TO authenticated
    USING (public.is_user_active() = true AND public.get_my_perfil() IN ('administrador', 'secretaria'))
    WITH CHECK (public.is_user_active() = true AND public.get_my_perfil() IN ('administrador', 'secretaria'));

-- Políticas RLS para presenca_visitantes
CREATE POLICY "Permitir leitura de presenças de visitantes para usuários ativos"
    ON public.presenca_visitantes FOR SELECT
    TO authenticated
    USING (public.is_user_active() = true);

CREATE POLICY "Permitir alteração de presenças de visitantes para secretárias e administradores ativos"
    ON public.presenca_visitantes FOR ALL
    TO authenticated
    USING (public.is_user_active() = true AND public.get_my_perfil() IN ('administrador', 'secretaria'))
    WITH CHECK (public.is_user_active() = true AND public.get_my_perfil() IN ('administrador', 'secretaria'));



