const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgresql://postgres.pswzgpcutmmnawanlxdw:Aaravab%40123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('--- DATABASE & CURRENT USER ---');
  const who = await client.query('SELECT current_database(), current_user, current_schema()');
  console.log(who.rows[0]);

  console.log('--- TABLES IN PUBLIC SCHEMA ---');
  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log(tables.rows.map(r => r.table_name));

  for (const t of tables.rows) {
    const res = await client.query(`SELECT count(*) FROM public."${t.table_name}"`);
    console.log(`public."${t.table_name}" -> ${res.rows[0].count} rows`);
  }

  console.log('--- SAMPLE USERS ---');
  const users = await client.query('SELECT id, email, name, role FROM public."User" LIMIT 5');
  console.log(users.rows);

  await client.end();
}

check().catch(console.error);
