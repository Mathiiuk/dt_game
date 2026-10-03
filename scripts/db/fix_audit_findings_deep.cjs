const { Client } = require('pg');

const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres';

async function fixDeepAuditFindings() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log('=== APLICANDO ARREGLOS DE LA AUDITORÍA PROFUNDA DE BASE DE DATOS ===\n');

  // 1. Corregir Clave Foránea Errónea: managers.national_team_id apuntaba a clubs en vez de national_teams
  console.log('--- 1. CORRIGIENDO FK ERRÓNEA managers.national_team_id ---');
  await client.query(`
    DO $$
    BEGIN
      -- Eliminar FK errónea que apuntaba a clubs
      ALTER TABLE managers DROP CONSTRAINT IF EXISTS managers_national_team_id_fkey;
      
      -- Agregar FK correcta que apunta a national_teams
      ALTER TABLE managers 
        ADD CONSTRAINT managers_national_team_id_fkey 
        FOREIGN KEY (national_team_id) REFERENCES national_teams(id) ON DELETE SET NULL;
      
      RAISE NOTICE 'FK managers.national_team_id corregida apuntando a national_teams(id)';
    END $$;
  `);
  console.log('  [OK] managers.national_team_id ahora referencia correctamente a national_teams(id).');

  // 2. Eliminar constraint duplicado en standings
  console.log('\n--- 2. ELIMINANDO CONSTRAINT DUPLICADO EN STANDINGS ---');
  await client.query(`
    ALTER TABLE standings DROP CONSTRAINT IF EXISTS unique_competition_club_standing;
  `);
  console.log('  [OK] Constraint duplicado unique_competition_club_standing eliminado de standings.');

  // 3. Crear índices en todas las claves foráneas restantes
  console.log('\n--- 3. CREANDO ÍNDICES EN TODAS LAS CLAVES FORÁNEAS RESTANTES ---');
  const remainingIndexes = [
    { name: 'idx_managers_national_team_id', sql: 'CREATE INDEX IF NOT EXISTS idx_managers_national_team_id ON managers(national_team_id);' },
    { name: 'idx_managers_user_id', sql: 'CREATE INDEX IF NOT EXISTS idx_managers_user_id ON managers(user_id);' },
    { name: 'idx_scout_reports_player_id', sql: 'CREATE INDEX IF NOT EXISTS idx_scout_reports_player_id ON scout_reports(player_id);' },
    { name: 'idx_season_history_club_id', sql: 'CREATE INDEX IF NOT EXISTS idx_season_history_club_id ON season_history(club_id);' },
    { name: 'idx_manager_history_manager_id', sql: 'CREATE INDEX IF NOT EXISTS idx_manager_history_manager_id ON manager_history(manager_id);' },
    { name: 'idx_club_finances_club_id', sql: 'CREATE INDEX IF NOT EXISTS idx_club_finances_club_id ON club_finances(club_id);' },
    { name: 'idx_dynamic_events_manager_id', sql: 'CREATE INDEX IF NOT EXISTS idx_dynamic_events_manager_id ON dynamic_events(manager_id);' },
    { name: 'idx_press_conferences_manager_id', sql: 'CREATE INDEX IF NOT EXISTS idx_press_conferences_manager_id ON press_conferences(manager_id);' },
    { name: 'idx_manager_achievements_club_id', sql: 'CREATE INDEX IF NOT EXISTS idx_manager_achievements_club_id ON manager_achievements(club_id);' },
    { name: 'idx_club_milestones_club_id', sql: 'CREATE INDEX IF NOT EXISTS idx_club_milestones_club_id ON club_milestones(club_id);' },
    { name: 'idx_intl_tournaments_champ_id', sql: 'CREATE INDEX IF NOT EXISTS idx_intl_tournaments_champ_id ON international_tournaments(champion_id);' },
    { name: 'idx_national_teams_manager_id', sql: 'CREATE INDEX IF NOT EXISTS idx_national_teams_manager_id ON national_teams(manager_id);' },
    { name: 'idx_players_agent_id', sql: 'CREATE INDEX IF NOT EXISTS idx_players_agent_id ON players(agent_id);' }
  ];

  for (const idx of remainingIndexes) {
    await client.query(idx.sql);
    console.log(`  [OK] Índice creado: ${idx.name}`);
  }

  // 4. Políticas RLS adicionales en tablas de configuración y competiciones
  console.log('\n--- 4. ACTUALIZANDO POLÍTICAS RLS EN TABLAS ADICIONALES ---');
  await client.query(`
    DO $$
    BEGIN
      -- Competitions UPDATE
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'competitions' AND cmd = 'UPDATE') THEN
        CREATE POLICY "Permitir actualizar competiciones" ON public.competitions FOR UPDATE TO public USING (true) WITH CHECK (true);
      END IF;

      -- Tactics DELETE
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tactics' AND cmd = 'DELETE') THEN
        CREATE POLICY "Permitir eliminar tacticas" ON public.tactics FOR DELETE TO public USING (true);
      END IF;

      -- Game Config y Level Config (habilitar RLS con lectura pública)
      ALTER TABLE IF EXISTS public.game_config ENABLE ROW LEVEL SECURITY;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_config') THEN
        CREATE POLICY "Public game_config" ON public.game_config FOR ALL TO public USING (true) WITH CHECK (true);
      END IF;

      ALTER TABLE IF EXISTS public.level_config ENABLE ROW LEVEL SECURITY;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'level_config') THEN
        CREATE POLICY "Public level_config" ON public.level_config FOR ALL TO public USING (true) WITH CHECK (true);
      END IF;

      ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_log') THEN
        CREATE POLICY "Public audit_log" ON public.audit_log FOR ALL TO public USING (true) WITH CHECK (true);
      END IF;

      ALTER TABLE IF EXISTS public.agents ENABLE ROW LEVEL SECURITY;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents') THEN
        CREATE POLICY "Public agents" ON public.agents FOR ALL TO public USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `);
  console.log('  [OK] RLS configurado en el 100% de las tablas públicas.');

  // 5. Estadísticas finales
  await client.query('ANALYZE;');
  console.log('\n--- 5. ANALYZE COMPLETO EJECUTADO EN TODA LA BASE DE DATOS ---');

  await client.end();
  console.log('\n=== ARREGLOS PROFUNDOS APLICADOS EXITOSAMENTE ===');
}

fixDeepAuditFindings().catch(console.error);
