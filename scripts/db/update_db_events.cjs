const { Client } = require('pg')

async function run() {
  const connectionString = (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })())
  
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to database')

    // Create dynamic_events table to store active events pending user action
    await client.query(`
      CREATE TABLE IF NOT EXISTS dynamic_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        manager_id UUID REFERENCES managers(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        options JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, RESOLVED
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('Created dynamic_events table.')

    // Add RLS
    await client.query(`
      ALTER TABLE dynamic_events ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Public dynamic_events" ON dynamic_events;
      CREATE POLICY "Public dynamic_events" ON dynamic_events FOR ALL USING (true);
    `)

  } catch (err) {
    console.error('Error updating schema:', err)
  } finally {
    await client.end()
    console.log('Disconnected.')
  }
}

run()
