const { Client } = require('pg');
const client = new Client({ connectionString: (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })()) });
async function check() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clubs'");
  console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));
  await client.end();
}
check().catch(console.error);
