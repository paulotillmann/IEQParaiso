-- =====================================================================
-- MIGRAÇÃO: AGENDAMENTO DIÁRIO DE STATUS ATIVO (PG_CRON)
-- =====================================================================

-- 1. Habilitar a extensão pg_cron (se ainda não estiver ativa)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Remover o job com segurança se já existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sistema-ativo-log-job-direct') THEN
        PERFORM cron.unschedule('sistema-ativo-log-job-direct');
    END IF;
END
$$;

-- 3. Agendar a inserção diária às 11:00 UTC (08:00h Horário de Brasília)
SELECT cron.schedule(
    'sistema-ativo-log-job-direct',
    '0 11 * * *',
    $$
    INSERT INTO public.logs_atividade (
        usuario_nome,
        usuario_email,
        acao,
        tabela,
        dados_novos
    ) VALUES (
        'Sistema (Cron)',
        'sistema@system.local',
        'cron',
        'sistema',
        jsonb_build_object('mensagem', 'Sistema ativo no dia ' || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS'))
    );
    $$
);
