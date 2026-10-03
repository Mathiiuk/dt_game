const { Client } = require('pg')

const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'

const sql = `
CREATE TABLE IF NOT EXISTS public.level_config (
    level int PRIMARY KEY,
    xp_required int NOT NULL,
    unlocks jsonb DEFAULT '{}'::jsonb
);

-- Seed levels
INSERT INTO public.level_config (level, xp_required, unlocks) VALUES
(1, 0, '{"features": ["basic_tactics", "basic_training"]}'),
(2, 500, '{"features": ["scouting_basic"]}'),
(3, 1200, '{"features": ["youth_academy_basic"]}'),
(4, 2200, '{"features": ["advanced_tactics"]}'),
(5, 3500, '{"features": ["staff_hiring"]}'),
(6, 5000, '{"features": ["international_scouting"]}'),
(7, 7000, '{"features": ["stadium_upgrades"]}'),
(8, 9500, '{"features": ["board_requests"]}'),
(9, 12500, '{"features": ["advanced_training"]}'),
(10, 16000, '{"features": ["national_teams"]}'),
(11, 20000, '{"features": ["hall_of_fame"]}')
ON CONFLICT (level) DO UPDATE SET 
  xp_required = EXCLUDED.xp_required,
  unlocks = EXCLUDED.unlocks;
`

async function run() {
  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query(sql)
    console.log('Database updated successfully for level_config!')
  } catch (err) {
    console.error('Error updating DB', err)
  } finally {
    await client.end()
  }
}

run()
