const { Client } = require('pg')

async function run() {
  const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to PostgreSQL')

    // 1. Add fields to players for matches, goals, and club status (Referente / Ídolo / Leyenda)
    await client.query(`
      ALTER TABLE players 
      ADD COLUMN IF NOT EXISTS matches_played INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS goals_scored INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS assists INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS clean_sheets INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS club_status VARCHAR(20) DEFAULT 'regular',
      ADD COLUMN IF NOT EXISTS legend_reason TEXT;
    `)
    console.log('Updated players table with stats & club_status.')

    // 2. Add columns to season_history if missing
    await client.query(`
      ALTER TABLE season_history
      ADD COLUMN IF NOT EXISTS competition_name VARCHAR(100) DEFAULT 'Liga de Ascenso',
      ADD COLUMN IF NOT EXISTS promoted BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS relegated BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS champion BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS points INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS goals_for INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS goals_against INT DEFAULT 0;
    `)
    console.log('Updated season_history table.')

    // 3. Create club_milestones table
    await client.query(`
      CREATE TABLE IF NOT EXISTS club_milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        year INT NOT NULL,
        game_date VARCHAR(30),
        title VARCHAR(150) NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'milestone',
        importance INT DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE club_milestones ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public club_milestones" ON club_milestones;
      CREATE POLICY "Public club_milestones" ON club_milestones FOR ALL USING (true);
    `)
    console.log('Created club_milestones table.')

    // 4. Create club_records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS club_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        record_type VARCHAR(50) NOT NULL,
        title VARCHAR(100) NOT NULL,
        record_value TEXT NOT NULL,
        holder_name TEXT,
        holder_id UUID,
        record_date VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_club_record_type UNIQUE (club_id, record_type)
      );
      ALTER TABLE club_records ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public club_records" ON club_records;
      CREATE POLICY "Public club_records" ON club_records FOR ALL USING (true);
    `)
    console.log('Created club_records table.')

  } catch (err) {
    console.error('Migration error:', err)
  } finally {
    await client.end()
    console.log('Done.')
  }
}

run()
