import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Lw0oRBoFJALB8aud@db.wwrgcgdfwhimbftdkeii.supabase.co:5432/postgres';

async function run() {
  const query = process.argv[2];
  if (!query) {
    console.error(JSON.stringify({ error: 'Nenhuma query fornecida' }));
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    const res = await client.query(query);
    console.log(JSON.stringify({
      success: true,
      rows: res.rows,
      rowCount: res.rowCount,
      fields: res.fields?.map(f => f.name),
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
