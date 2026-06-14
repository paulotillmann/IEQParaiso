import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://wwrgcgdfwhimbftdkeii.supabase.co';
const supabaseAnonKey = 'sb_publishable_jmuZQ9sWZ1GCS91wdwKHQw_9znucyDN';

// Credenciais de Autenticação Supabase fornecidas pelo usuário
const supabaseEmail = 'ieq@email.com';
const supabasePassword = 'ieq12345';

// Configurações do Bubble.io
const bubbleUrl = 'https://hsc.santacasaaraguari.org.br/version-test/api/1.1/obj/IEQ_Visitante';
const bubbleToken = '3f3f85633f29b79f6b95dcc04a1988d6';

// Inicializar cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Helper para estruturar metadados do Bubble em 'observacoes'
function buildObservacoes(item) {
  const lines = ["[Importado do Bubble.io]"];
  lines.push(`- ID Original: ${item._id}`);
  
  if (item.ComoChegou) {
    lines.push(`- Como chegou: ${item.ComoChegou.trim()}`);
  }
  
  if (item.FrequentaOutraIgreja !== undefined) {
    lines.push(`- Frequenta outra igreja: ${item.FrequentaOutraIgreja ? 'Sim' : 'Não'}`);
  }
  
  if (item.QualIgreja && item.QualIgreja.trim()) {
    lines.push(`- Qual igreja: ${item.QualIgreja.trim()}`);
  }
  
  if (item.QualEvento && item.QualEvento.trim()) {
    lines.push(`- Qual evento: ${item.QualEvento.trim()}`);
  }
  
  if (item.CadastradoPor && item.CadastradoPor.trim()) {
    lines.push(`- Cadastrado por: ${item.CadastradoPor.trim()}`);
  }
  
  return lines.join('\n');
}

// Buscar dados do Bubble.io com paginação recursiva
async function fetchAllBubbleVisitors() {
  let allResults = [];
  let cursor = 0;
  let limit = 100;
  let hasMore = true;

  console.log("Iniciando busca de visitantes no Bubble.io...");

  while (hasMore) {
    const url = `${bubbleUrl}?limit=${limit}&cursor=${cursor}`;
    console.log(`Buscando registros do cursor ${cursor} (limite ${limit})...`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bubbleToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados do Bubble: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.response?.results || [];
    allResults = allResults.concat(results);

    const remaining = data.response?.remaining || 0;
    console.log(`  Buscados ${results.length} registros neste lote. Restantes no Bubble: ${remaining}`);

    if (remaining === 0 || results.length === 0) {
      hasMore = false;
    } else {
      cursor += results.length;
    }
  }

  console.log(`Total de visitantes recuperados do Bubble: ${allResults.length}`);
  return allResults;
}

async function run() {
  try {
    // 1. Fazer Login no Supabase
    console.log(`\nAutenticando no Supabase com ${supabaseEmail}...`);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: supabaseEmail,
      password: supabasePassword
    });

    if (signInError) {
      console.error("Falha na autenticação do Supabase:", signInError.message);
      return;
    }
    console.log("Autenticação bem-sucedida! User ID:", signInData.user?.id);

    // 2. Buscar dados do Bubble.io
    const bubbleVisitors = await fetchAllBubbleVisitors();
    if (bubbleVisitors.length === 0) {
      console.log("Nenhum visitante encontrado no Bubble para importar.");
      return;
    }

    // 3. Mapear e preparar registros
    console.log("\nMapeando dados para a estrutura do Supabase...");
    const mappedRecords = bubbleVisitors.map(item => {
      const telClean = item.Telefone ? item.Telefone.trim() : null;
      
      return {
        nome_completo: (item.NomeVisitante || 'Sem Nome').trim(),
        telefone: telClean,
        whatsapp: telClean, // Mapeado para ambos por padrão
        cidade: 'Araguari', // Default conforme schema
        uf: 'MG',           // Default conforme schema
        quem_convidou: item.ConvidadoPor ? item.ConvidadoPor.trim() : null,
        observacoes: buildObservacoes(item),
        ativo: true,
        criado_em: item["Created Date"] ? new Date(item["Created Date"]).toISOString() : new Date().toISOString(),
        atualizado_em: item["Modified Date"] ? new Date(item["Modified Date"]).toISOString() : new Date().toISOString()
      };
    });

    // 4. Inserir no Supabase (em lotes de 50 para evitar sobrecarga ou limites da API)
    console.log(`\nInserindo ${mappedRecords.length} registros no Supabase...`);
    const batchSize = 50;
    let insertedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < mappedRecords.length; i += batchSize) {
      const batch = mappedRecords.slice(i, i + batchSize);
      console.log(`Inserindo lote ${Math.floor(i / batchSize) + 1} (${batch.length} registros)...`);
      
      const { data, error } = await supabase
        .from('visitantes')
        .insert(batch)
        .select();

      if (error) {
        console.error(`  Erro ao inserir lote:`, error);
        errorCount += batch.length;
      } else {
        console.log(`  Sucesso: Lote inserido com ${data.length} registros.`);
        insertedCount += data.length;
      }
    }

    console.log("\n================================================");
    console.log("RELATÓRIO DE IMPORTAÇÃO:");
    console.log(`- Total de registros lidos do Bubble: ${bubbleVisitors.length}`);
    console.log(`- Total de registros importados com sucesso: ${insertedCount}`);
    console.log(`- Total de registros com falha na inserção: ${errorCount}`);
    console.log("================================================");

  } catch (err) {
    console.error("Ocorreu um erro geral durante o processo:", err);
  }
}

run();
