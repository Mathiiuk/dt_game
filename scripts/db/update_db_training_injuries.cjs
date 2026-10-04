const { Client } = require('pg')

async function run() {
  const connectionString = (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })())
  
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to database')

    // Add training configuration to clubs
    await client.query(`
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS training_focus VARCHAR(20) DEFAULT 'EQUILIBRADO';
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS training_intensity INT DEFAULT 50;
    `)
    console.log('Added training config to clubs.')

    // Add detailed injuries
    await client.query(`
      ALTER TABLE players ADD COLUMN IF NOT EXISTS injury_risk INT DEFAULT 0;
    `)
    console.log('Added injury_risk to players.')

  } catch (err) {
    console.error('Error updating schema:', err)
  } finally {
    await client.end()
    console.log('Disconnected.')
  }
}

run()
