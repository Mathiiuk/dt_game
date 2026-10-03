const { Client } = require('pg')

const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'

const sql = `
CREATE TABLE IF NOT EXISTS public.match_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id uuid REFERENCES public.clubs(id) NOT NULL,
    opponent_name text NOT NULL,
    home_score int NOT NULL,
    away_score int NOT NULL,
    is_home boolean NOT NULL,
    match_date date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_history_club ON public.match_history(club_id);
`

async function run() {
  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query(sql)
    console.log('Database updated successfully for match_history!')
  } catch (err) {
    console.error('Error updating DB', err)
  } finally {
    await client.end()
  }
}

run()
