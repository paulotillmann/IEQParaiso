-- 1. Tabela: dizimos_ofertas
CREATE TABLE IF NOT EXISTS public.dizimos_ofertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    culto_id UUID NOT NULL REFERENCES public.cultos(id) ON DELETE CASCADE,
    membro_id UUID NOT NULL REFERENCES public.membros(id) ON DELETE CASCADE,
    valor_dizimo NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (valor_dizimo >= 0),
    valor_oferta_adoracao NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (valor_oferta_adoracao >= 0),
    valor_oferta_gerais NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (valor_oferta_gerais >= 0),
    registrado_por UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Garantir registro único de financeiro por membro no mesmo culto
    CONSTRAINT unique_culto_membro_financeiro UNIQUE (culto_id, membro_id)
);

-- 2. Trigger para atualizar o campo atualizado_em automaticamente
CREATE TRIGGER set_dizimos_ofertas_atualizado_em
    BEFORE UPDATE ON public.dizimos_ofertas
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_atualizado_em();

-- 3. Ativação de Row Level Security (RLS)
ALTER TABLE public.dizimos_ofertas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para dizimos_ofertas
CREATE POLICY "Permitir leitura de dízimos e ofertas para usuários ativos"
    ON public.dizimos_ofertas FOR SELECT
    TO authenticated
    USING (public.is_user_active() = true);

CREATE POLICY "Permitir modificações de dízimos e ofertas para administradores e secretarias"
    ON public.dizimos_ofertas FOR ALL
    TO authenticated
    USING (public.is_user_active() = true AND public.get_my_perfil() IN ('administrador', 'secretaria'))
    WITH CHECK (public.is_user_active() = true AND public.get_my_perfil() IN ('administrador', 'secretaria'));
