const { Client } = require('pg');

const connectionString = (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })());

async function updateDbAchievements() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log('=== CREANDO TABLA Y DEFINICIONES DE LOGROS DE CARRERA (FASE 39) ===\n');

  try {
    // 1. Crear tabla career_achievements
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.career_achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        manager_id UUID NOT NULL REFERENCES public.managers(id) ON DELETE CASCADE,
        achievement_code VARCHAR(80) NOT NULL,
        category VARCHAR(40) NOT NULL,
        title VARCHAR(120) NOT NULL,
        description TEXT NOT NULL,
        rarity VARCHAR(30) NOT NULL DEFAULT 'common',
        current_progress INT NOT NULL DEFAULT 0,
        target_progress INT NOT NULL DEFAULT 1,
        is_unlocked BOOLEAN NOT NULL DEFAULT false,
        unlocked_at TIMESTAMP WITH TIME ZONE,
        is_claimed BOOLEAN NOT NULL DEFAULT false,
        claimed_at TIMESTAMP WITH TIME ZONE,
        reward_xp INT NOT NULL DEFAULT 100,
        reward_reputation INT NOT NULL DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_manager_achievement UNIQUE (manager_id, achievement_code)
      );

      ALTER TABLE public.career_achievements ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Public career_achievements" ON public.career_achievements;
      CREATE POLICY "Public career_achievements" ON public.career_achievements FOR ALL TO public USING (true) WITH CHECK (true);

      CREATE INDEX IF NOT EXISTS idx_career_achievements_mgr ON public.career_achievements(manager_id);
      CREATE INDEX IF NOT EXISTS idx_career_achievements_code ON public.career_achievements(achievement_code);
      CREATE INDEX IF NOT EXISTS idx_career_achievements_cat ON public.career_achievements(category);
      CREATE INDEX IF NOT EXISTS idx_career_achievements_status ON public.career_achievements(is_unlocked, is_claimed);
    `);
    console.log('  [OK] Tabla career_achievements e índices creados con éxito.');

  } catch (err) {
    console.error('Error durante la migración de logros:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateDbAchievements();
