const { Client } = require('pg')

async function run() {
  const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to database')

    // Add squad morale and cohesion to clubs
    await client.query(`
      ALTER TABLE clubs
        ADD COLUMN IF NOT EXISTS squad_morale INT DEFAULT 70,
        ADD COLUMN IF NOT EXISTS squad_cohesion INT DEFAULT 70;
    `)
    console.log('Added squad_morale and squad_cohesion to clubs.')

    // Add individual morale to players
    await client.query(`
      ALTER TABLE players
        ADD COLUMN IF NOT EXISTS morale INT DEFAULT 70;
    `)
    console.log('Added morale to players.')

    // Press conferences log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS press_conferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        manager_id UUID REFERENCES managers(id) ON DELETE CASCADE,
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer_chosen TEXT NOT NULL,
        tone VARCHAR(20) NOT NULL,
        morale_effect INT DEFAULT 0,
        fans_effect INT DEFAULT 0,
        board_effect INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE press_conferences ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public press_conferences" ON press_conferences;
      CREATE POLICY "Public press_conferences" ON press_conferences FOR ALL USING (true);
    `)
    console.log('Created press_conferences table.')

  } catch (err) {
    console.error('Error:', err)
  } finally {
    await client.end()
    console.log('Disconnected.')
  }
}

run()
