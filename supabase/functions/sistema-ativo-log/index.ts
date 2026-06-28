import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas na Edge Function.')
    }
    
    // Inicializar cliente do Supabase com a chave Service Role para ignorar RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Obter data/hora atual no fuso de Brasília (UTC-3)
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium'
    })
    const dataHoraAtual = formatter.format(new Date())
    const mensagem = `Sistema ativo no dia ${dataHoraAtual}`

    // Inserir o log na tabela logs_atividade
    const { error } = await supabase
      .from('logs_atividade')
      .insert({
        usuario_nome: 'Sistema (Cron)',
        usuario_email: 'sistema@system.local',
        acao: 'cron',
        tabela: 'sistema',
        dados_novos: { mensagem }
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, message: mensagem }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro na execução do Cron:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
