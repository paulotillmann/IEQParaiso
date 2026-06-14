-- Migração: Adicionar campos tipo_entrada e valor_oferta_missoes à tabela dizimos_ofertas
ALTER TABLE public.dizimos_ofertas 
ADD COLUMN IF NOT EXISTS tipo_entrada VARCHAR(50) NOT NULL DEFAULT 'dinheiro' CHECK (tipo_entrada IN ('dinheiro', 'pix')),
ADD COLUMN IF NOT EXISTS valor_oferta_missoes NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (valor_oferta_missoes >= 0);
