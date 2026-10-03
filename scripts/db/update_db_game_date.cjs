const { Client } = require('pg')

async function run() {
  const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to database')

    // Add game_date to clubs
    await client.query(`
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS game_date VARCHAR(20) DEFAULT '2026-08-01';
      UPDATE clubs SET game_date = '2026-08-01' WHERE game_date IS NULL;
    `)
    console.log('Added game_date column to clubs with default 2026-08-01.')

  } catch (err) {
    console.error('Error updating schema:', err)
  } finally {
    await client.end()
    console.log('Disconnected.')
  }
}

run()
