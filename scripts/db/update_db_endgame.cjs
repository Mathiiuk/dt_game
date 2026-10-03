const { Client } = require('pg');

const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres';

async function updateDbEndgame() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log('=== CREANDO TABLA Y SOPORTE DE ENDGAME Y LEGADO DINÁSTICO (FASE 40) ===\n');

  try {
    // 1. Asegurar columna is_retired en managers
    await client.query(`
      ALTER TABLE public.managers 
      ADD COLUMN IF NOT EXISTS is_retired BOOLEAN DEFAULT false;
    `);

    // 2. Crear tabla career_snapshots
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.career_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        manager_id UUID REFERENCES public.managers(id) ON DELETE SET NULL,
        manager_name VARCHAR(120) NOT NULL,
        club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
        club_name VARCHAR(100),
        legacy_score INT NOT NULL DEFAULT 0,
        legacy_rank VARCHAR(80) NOT NULL,
        total_matches INT NOT NULL DEFAULT 0,
        total_won INT NOT NULL DEFAULT 0,
        total_drawn INT NOT NULL DEFAULT 0,
        total_lost INT NOT NULL DEFAULT 0,
        win_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
        titles_count INT NOT NULL DEFAULT 0,
        trophies JSONB DEFAULT '[]'::jsonb,
        career_headline VARCHAR(255) NOT NULL,
        epilogue_text TEXT NOT NULL,
        newspaper_edition VARCHAR(80) DEFAULT 'Edición Especial de Despedida',
        hall_of_fame_id UUID REFERENCES public.hall_of_fame(id) ON DELETE SET NULL,
        is_retired BOOLEAN DEFAULT true,
        retired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE public.career_snapshots ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Public career_snapshots" ON public.career_snapshots;
      CREATE POLICY "Public career_snapshots" ON public.career_snapshots FOR ALL TO public USING (true) WITH CHECK (true);

      CREATE INDEX IF NOT EXISTS idx_career_snapshots_mgr ON public.career_snapshots(manager_id);
      CREATE INDEX IF NOT EXISTS idx_career_snapshots_club ON public.career_snapshots(club_id);
      CREATE INDEX IF NOT EXISTS idx_career_snapshots_hof ON public.career_snapshots(hall_of_fame_id);
      CREATE INDEX IF NOT EXISTS idx_career_snapshots_score ON public.career_snapshots(legacy_score DESC);
    `);
    console.log('  [OK] Tabla career_snapshots creada con índices y RLS.');

  } catch (err) {
    console.error('Error durante la migración de endgame:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateDbEndgame();
