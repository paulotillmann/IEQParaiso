import pg from 'pg';
import fs from 'fs';
import path from 'path';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Lw0oRBoFJALB8aud@db.wwrgcgdfwhimbftdkeii.supabase.co:5432/postgres';

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(JSON.stringify({ error: 'Nenhum caminho de arquivo SQL fornecido' }));
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(JSON.stringify({ error: `Arquivo não encontrado: ${resolvedPath}` }));
    process.exit(1);
  }

  const sql = fs.readFileSync(resolvedPath, 'utf-8');
  console.log(`Lendo arquivo de migração: ${path.basename(resolvedPath)}...`);

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados Supabase IEQParaiso. Executando migração...');
    
    // Executa o script SQL completo
    await client.query(sql);
    
    console.log(JSON.stringify({
      success: true,
      message: `Migração '${path.basename(resolvedPath)}' executada com sucesso.`
    }, null, 2));
  } catch (err) {
    console.error(JSON.stringify({
      success: false,
      error: err.message,
    }, null, 2));
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
