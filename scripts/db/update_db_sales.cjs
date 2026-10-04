const { Client } = require('pg')

const connectionString = (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })())

async function main() {
  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query('BEGIN');
    
    // Add is_transfer_listed to players
    await client.query(`
      ALTER TABLE public.players 
      ADD COLUMN IF NOT EXISTS is_transfer_listed boolean DEFAULT false;
    `);

    await client.query('COMMIT');
    console.log('Migración completada: is_transfer_listed añadido.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error:', e);
  } finally {
    await client.end()
  }
}

main();
