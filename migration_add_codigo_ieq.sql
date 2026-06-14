-- Migração: Adicionar campo codigo_ieq à tabela de membros
ALTER TABLE public.membros ADD COLUMN IF NOT EXISTS codigo_ieq INTEGER;
