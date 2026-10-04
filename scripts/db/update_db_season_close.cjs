const { Client } = require('pg')

async function run() {
  const connectionString = (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })())
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to database')

    // Create season_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS season_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        manager_id UUID REFERENCES managers(id) ON DELETE SET NULL,
        season_year INT NOT NULL,
        competition_name VARCHAR(100),
        position INT,
        points INT,
        won INT,
        drawn INT,
        lost INT,
        goals_for INT,
        goals_against INT,
        promoted BOOLEAN DEFAULT false,
        relegated BOOLEAN DEFAULT false,
        champion BOOLEAN DEFAULT false,
        prize_money NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE season_history ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public season_history" ON season_history;
      CREATE POLICY "Public season_history" ON season_history FOR ALL USING (true);
    `)
    console.log('Created season_history table.')

    // Create manager_achievements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS manager_achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        manager_id UUID REFERENCES managers(id) ON DELETE CASCADE,
        club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
        title VARCHAR(100) NOT NULL,
        year INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE manager_achievements ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public manager_achievements" ON manager_achievements;
      CREATE POLICY "Public manager_achievements" ON manager_achievements FOR ALL USING (true);
    `)
    console.log('Created manager_achievements table.')

  } catch (err) {
    console.error('Error updating schema:', err)
  } finally {
    await client.end()
    console.log('Disconnected.')
  }
}

run()
