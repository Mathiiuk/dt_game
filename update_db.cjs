const { Client } = require('pg')

const connectionString = (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })())

const sql = `
CREATE TABLE IF NOT EXISTS public.game_config (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    category text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial configs
INSERT INTO public.game_config (key, value, category, description) VALUES
('xp_per_win', '50', 'progression', 'XP awarded for winning a match'),
('xp_per_draw', '20', 'progression', 'XP awarded for drawing a match'),
('xp_per_loss', '5', 'progression', 'XP awarded for losing a match'),
('player_age_min', '15', 'generation', 'Minimum age for new youth players'),
('player_age_max', '38', 'generation', 'Age at which players are likely to retire'),
('starting_budget_amateur', '500000', 'economy', 'Starting budget for an amateur club'),
('match_fitness_cost', '15', 'simulation', 'Fitness points lost per full match played'),
('training_fitness_cost', '10', 'simulation', 'Fitness points lost per normal training week'),
('fitness_recovery_per_day', '3', 'simulation', 'Fitness points recovered per resting day'),
('injury_base_prob', '0.05', 'simulation', 'Base probability of injury if fitness is below threshold'),
('injury_fitness_threshold', '60', 'simulation', 'Fitness level below which injury probability spikes')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  updated_at = EXCLUDED.updated_at;
`

async function run() {
  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query(sql)
    console.log('Database updated successfully!')
  } catch (err) {
    console.error('Error updating DB', err)
  } finally {
    await client.end()
  }
}

run()
