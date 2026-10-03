const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres' });
async function run() {
  await client.connect();
  const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name");
  for (const r of tablesRes.rows) {
    const countRes = await client.query(`SELECT COUNT(*) FROM "${r.table_name}"`);
    console.log(`${r.table_name.padEnd(28)} : ${countRes.rows[0].count} filas`);
  }
  await client.end();
}
run().catch(console.error);
