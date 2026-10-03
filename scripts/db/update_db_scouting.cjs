const { Client } = require('pg')

async function run() {
  const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'
  
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to database')

    // Create scout_reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS scout_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        player_id UUID REFERENCES players(id) ON DELETE CASCADE,
        level INT DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(club_id, player_id)
      )
    `)
    console.log('Created scout_reports table.')

    // Add RLS
    await client.query(`
      ALTER TABLE scout_reports ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Public scout_reports" ON scout_reports;
      CREATE POLICY "Public scout_reports" ON scout_reports FOR ALL USING (true);
    `)
    console.log('Configured RLS for scout_reports.')

  } catch (err) {
    console.error('Error updating schema:', err)
  } finally {
    await client.end()
    console.log('Disconnected.')
  }
}

run()
