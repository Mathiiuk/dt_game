const { Client } = require('pg')

async function run() {
  const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to PostgreSQL')

    // 1. Create international_tournaments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS international_tournaments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        season_year INT NOT NULL,
        tier INT DEFAULT 1,
        status VARCHAR(30) DEFAULT 'in_progress',
        champion_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
        prize_pool NUMERIC DEFAULT 1500000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE international_tournaments ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public international_tournaments" ON international_tournaments;
      CREATE POLICY "Public international_tournaments" ON international_tournaments FOR ALL USING (true);
    `)
    console.log('Created international_tournaments table.')

    // 2. Create international_fixtures table
    await client.query(`
      CREATE TABLE IF NOT EXISTS international_fixtures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tournament_id UUID REFERENCES international_tournaments(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        match_number INT DEFAULT 1,
        home_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
        away_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
        match_date VARCHAR(30),
        home_score INT,
        away_score INT,
        played BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE international_fixtures ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public international_fixtures" ON international_fixtures;
      CREATE POLICY "Public international_fixtures" ON international_fixtures FOR ALL USING (true);
    `)
    console.log('Created international_fixtures table.')

    // 3. Ensure clubs has in_international_cup column
    await client.query(`
      ALTER TABLE clubs
      ADD COLUMN IF NOT EXISTS in_international_cup BOOLEAN DEFAULT false;
    `)
    console.log('Verified clubs in_international_cup column.')

  } catch (err) {
    console.error('Migration error:', err)
  } finally {
    await client.end()
    console.log('Done.')
  }
}

run()
