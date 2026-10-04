const { Client } = require('pg')

async function run() {
  const connectionString = (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })())
  
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to database')

    // Add board_confidence to clubs
    await client.query(`
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS board_confidence INT DEFAULT 80;
    `)
    console.log('Added board_confidence to clubs.')

  } catch (err) {
    console.error('Error updating schema:', err)
  } finally {
    await client.end()
    console.log('Disconnected.')
  }
}

run()
