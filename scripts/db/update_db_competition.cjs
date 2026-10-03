const { Client } = require('pg')

const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'

const sql = `
ALTER TABLE public.clubs ALTER COLUMN manager_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.fixtures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    competition_id uuid REFERENCES public.competitions(id) NOT NULL,
    match_week int NOT NULL,
    home_team_id uuid REFERENCES public.clubs(id) NOT NULL,
    away_team_id uuid REFERENCES public.clubs(id) NOT NULL,
    status text DEFAULT 'PENDING',
    home_score int DEFAULT 0,
    away_score int DEFAULT 0,
    match_date date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
`

async function run() {
  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query(sql)
    console.log('Database updated successfully for competition engine (fixtures & clubs)!')
  } catch (err) {
    console.error('Error updating DB', err)
  } finally {
    await client.end()
  }
}

run()
