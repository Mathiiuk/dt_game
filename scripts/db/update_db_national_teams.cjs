const { Client } = require('pg')

async function run() {
  const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to PostgreSQL')

    // 1. Create national_teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS national_teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        category VARCHAR(30) DEFAULT 'senior',
        reputation INT DEFAULT 85,
        manager_id UUID REFERENCES managers(id) ON DELETE SET NULL,
        flag_code VARCHAR(10) DEFAULT 'ARG',
        colors VARCHAR(50) DEFAULT 'Celeste y Blanco',
        matches_played INT DEFAULT 0,
        matches_won INT DEFAULT 0,
        matches_drawn INT DEFAULT 0,
        matches_lost INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE national_teams ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public national_teams" ON national_teams;
      CREATE POLICY "Public national_teams" ON national_teams FOR ALL USING (true);
    `)
    console.log('Created national_teams table.')

    // 2. Add national_team_id to managers if missing
    await client.query(`
      ALTER TABLE managers
      ADD COLUMN IF NOT EXISTS national_team_id UUID REFERENCES national_teams(id) ON DELETE SET NULL;
    `)
    console.log('Verified national_team_id column on managers.')

    // 3. Create national_team_callups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS national_team_callups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        national_team_id UUID REFERENCES national_teams(id) ON DELETE CASCADE,
        player_id UUID REFERENCES players(id) ON DELETE CASCADE,
        is_starter BOOLEAN DEFAULT false,
        caps INT DEFAULT 0,
        international_goals INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_national_callup UNIQUE (national_team_id, player_id)
      );
      ALTER TABLE national_team_callups ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public national_team_callups" ON national_team_callups;
      CREATE POLICY "Public national_team_callups" ON national_team_callups FOR ALL USING (true);
    `)
    console.log('Created national_team_callups table.')

    // 4. Create national_fixtures table
    await client.query(`
      CREATE TABLE IF NOT EXISTS national_fixtures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        national_team_id UUID REFERENCES national_teams(id) ON DELETE CASCADE,
        opponent_name VARCHAR(100) NOT NULL,
        tournament_name VARCHAR(100) DEFAULT 'Fecha FIFA / Eliminatorias',
        match_date VARCHAR(30),
        home_score INT,
        away_score INT,
        is_home BOOLEAN DEFAULT true,
        played BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE national_fixtures ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public national_fixtures" ON national_fixtures;
      CREATE POLICY "Public national_fixtures" ON national_fixtures FOR ALL USING (true);
    `)
    console.log('Created national_fixtures table.')

    // 5. Seed default national teams if table is empty
    const checkTeams = await client.query('SELECT count(*) FROM national_teams')
    if (parseInt(checkTeams.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO national_teams (name, category, reputation, flag_code, colors) VALUES
        ('Argentina', 'senior', 95, 'ARG', 'Celeste y Blanco'),
        ('Argentina Sub-23', 'u23', 88, 'ARG', 'Celeste y Blanco'),
        ('Argentina Sub-20', 'u20', 82, 'ARG', 'Celeste y Blanco'),
        ('Uruguay', 'senior', 86, 'URU', 'Celeste'),
        ('Colombia', 'senior', 84, 'COL', 'Amarillo y Azul'),
        ('Chile', 'senior', 80, 'CHI', 'Rojo');
      `)
      console.log('Seeded default national teams.')
    }

  } catch (err) {
    console.error('Migration error:', err)
  } finally {
    await client.end()
    console.log('Done.')
  }
}

run()
