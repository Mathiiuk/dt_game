const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres' });
async function check() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clubs'");
  console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));
  await client.end();
}
check().catch(console.error);
