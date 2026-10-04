const { Client } = require('pg')

const connectionString = (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })())

const tables = [
  'managers', 'clubs', 'players', 'tactics', 'competitions', 
  'standings', 'offers', 'agents', 'scout_reports', 'staff', 
  'season_history', 'manager_history'
]

async function run() {
  const client = new Client({ connectionString })
  try {
    await client.connect()

    for (const table of tables) {
      const sql = `ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;`
      await client.query(sql)
      console.log(`Added updated_at to ${table}`)
    }
    
    // Create a function to auto-update updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = now();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)
    
    // Add triggers for all tables
    for (const table of tables) {
      await client.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON public.${table};
        CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON public.${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `)
      console.log(`Added trigger to ${table}`)
    }

    console.log('Database cleanup completed successfully!')
  } catch (err) {
    console.error('Error updating DB', err)
  } finally {
    await client.end()
  }
}

run()
