const { Client } = require('pg')

const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'

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
