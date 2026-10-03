const { Client } = require('pg')

async function run() {
  const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'
  
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to database')

    // Create club_finances table
    await client.query(`
      CREATE TABLE IF NOT EXISTS club_finances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        transaction_type VARCHAR(50) NOT NULL, -- INCOME, EXPENSE
        category VARCHAR(50) NOT NULL, -- MATCH_DAY, TV, SPONSOR, SALARY, TRANSFER, MAINTENANCE
        amount NUMERIC NOT NULL,
        description TEXT,
        game_date VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('Created club_finances table.')

    // Add RLS
    await client.query(`
      ALTER TABLE club_finances ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Public club_finances" ON club_finances;
      CREATE POLICY "Public club_finances" ON club_finances FOR ALL USING (true);
    `)
    console.log('Configured RLS for club_finances.')

  } catch (err) {
    console.error('Error updating schema:', err)
  } finally {
    await client.end()
    console.log('Disconnected.')
  }
}

run()
