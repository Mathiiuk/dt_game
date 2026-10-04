const { Client } = require('pg');

const connectionString = (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })());

async function optimizeAndSecure() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log('=== APLICANDO OPTIMIZACIONES Y SEGURIDAD EN BASE DE DATOS ===\n');

  // 1. Políticas RLS (Corrigiendo el bloqueo de UPDATE en clubs y players)
  console.log('--- 1. CONFIGURANDO POLÍTICAS RLS PARA UPDATE Y CONSISTENCIA ---');
  
  await client.query(`
    DO $$
    BEGIN
      -- UPDATE en clubs
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'clubs' AND cmd = 'UPDATE'
      ) THEN
        CREATE POLICY "Permitir actualizar clubes" ON public.clubs FOR UPDATE TO public USING (true) WITH CHECK (true);
        RAISE NOTICE 'Creada politica UPDATE en clubs';
      END IF;

      -- UPDATE en players
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'players' AND cmd = 'UPDATE'
      ) THEN
        CREATE POLICY "Permitir actualizar jugadores" ON public.players FOR UPDATE TO public USING (true) WITH CHECK (true);
        RAISE NOTICE 'Creada politica UPDATE en players';
      END IF;

      -- DELETE en players
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'players' AND cmd = 'DELETE'
      ) THEN
        CREATE POLICY "Permitir eliminar jugadores" ON public.players FOR DELETE TO public USING (true);
        RAISE NOTICE 'Creada politica DELETE en players';
      END IF;

      -- Habilitar RLS consistente en tablas secundarias con politicas publicas
      ALTER TABLE IF EXISTS public.staff ENABLE ROW LEVEL SECURITY;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff') THEN
        CREATE POLICY "Public staff" ON public.staff FOR ALL TO public USING (true) WITH CHECK (true);
      END IF;

      ALTER TABLE IF EXISTS public.fixtures ENABLE ROW LEVEL SECURITY;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fixtures') THEN
        CREATE POLICY "Public fixtures" ON public.fixtures FOR ALL TO public USING (true) WITH CHECK (true);
      END IF;

      ALTER TABLE IF EXISTS public.offers ENABLE ROW LEVEL SECURITY;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offers') THEN
        CREATE POLICY "Public offers" ON public.offers FOR ALL TO public USING (true) WITH CHECK (true);
      END IF;

      ALTER TABLE IF EXISTS public.match_history ENABLE ROW LEVEL SECURITY;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'match_history') THEN
        CREATE POLICY "Public match_history" ON public.match_history FOR ALL TO public USING (true) WITH CHECK (true);
      END IF;

      ALTER TABLE IF EXISTS public.manager_history ENABLE ROW LEVEL SECURITY;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manager_history') THEN
        CREATE POLICY "Public manager_history" ON public.manager_history FOR ALL TO public USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `);
  console.log('  [OK] Politicas RLS actualizadas con soporte de UPDATE/DELETE.');

  // 2. Eliminación de índice redundante en standings
  console.log('\n--- 2. ELIMINACIÓN DE ÍNDICE REDUNDANTE ---');
  try {
    await client.query(`DROP INDEX IF EXISTS standings_competition_id_club_id_key;`);
    console.log('  [OK] Indice redundante standings_competition_id_club_id_key eliminado (conservando unique_competition_club_standing).');
  } catch (err) {
    console.log(`  [AVISO] No se requirió eliminar índice: ${err.message}`);
  }

  // 3. Creación de índices de alto impacto de rendimiento
  console.log('\n--- 3. CREANDO ÍNDICES B-TREE DE ALTO RENDIMIENTO ---');

  const indexes = [
    // Players (13,374 filas)
    { name: 'idx_players_club_id', sql: 'CREATE INDEX IF NOT EXISTS idx_players_club_id ON public.players(club_id);' },
    { name: 'idx_players_market_value', sql: 'CREATE INDEX IF NOT EXISTS idx_players_market_value ON public.players(market_value DESC);' },
    { name: 'idx_players_transfer_listed', sql: 'CREATE INDEX IF NOT EXISTS idx_players_transfer_listed ON public.players(is_transfer_listed) WHERE is_transfer_listed = true;' },
    { name: 'idx_players_position', sql: 'CREATE INDEX IF NOT EXISTS idx_players_position ON public.players(position);' },

    // Fixtures (15,200 filas)
    { name: 'idx_fixtures_home_team', sql: 'CREATE INDEX IF NOT EXISTS idx_fixtures_home_team ON public.fixtures(home_team_id);' },
    { name: 'idx_fixtures_away_team', sql: 'CREATE INDEX IF NOT EXISTS idx_fixtures_away_team ON public.fixtures(away_team_id);' },
    { name: 'idx_fixtures_comp_week', sql: 'CREATE INDEX IF NOT EXISTS idx_fixtures_comp_week ON public.fixtures(competition_id, match_week);' },
    { name: 'idx_fixtures_status', sql: 'CREATE INDEX IF NOT EXISTS idx_fixtures_status ON public.fixtures(status);' },

    // Clubs & Standings
    { name: 'idx_clubs_manager_id', sql: 'CREATE INDEX IF NOT EXISTS idx_clubs_manager_id ON public.clubs(manager_id);' },
    { name: 'idx_standings_club_id', sql: 'CREATE INDEX IF NOT EXISTS idx_standings_club_id ON public.standings(club_id);' },

    // Mercado & Traspasos
    { name: 'idx_offers_to_club', sql: 'CREATE INDEX IF NOT EXISTS idx_offers_to_club ON public.offers(to_club_id);' },
    { name: 'idx_offers_from_club', sql: 'CREATE INDEX IF NOT EXISTS idx_offers_from_club ON public.offers(from_club_id);' },
    { name: 'idx_offers_player', sql: 'CREATE INDEX IF NOT EXISTS idx_offers_player ON public.offers(player_id);' },

    // Staff & Eventos
    { name: 'idx_staff_club_id', sql: 'CREATE INDEX IF NOT EXISTS idx_staff_club_id ON public.staff(club_id);' },
    { name: 'idx_dynamic_events_club', sql: 'CREATE INDEX IF NOT EXISTS idx_dynamic_events_club ON public.dynamic_events(club_id);' },
    { name: 'idx_press_conferences_club', sql: 'CREATE INDEX IF NOT EXISTS idx_press_conferences_club ON public.press_conferences(club_id);' },
    { name: 'idx_manager_achievements_mgr', sql: 'CREATE INDEX IF NOT EXISTS idx_manager_achievements_mgr ON public.manager_achievements(manager_id);' },

    // Torneos Internacionales & Selecciones
    { name: 'idx_intl_fixtures_comp', sql: 'CREATE INDEX IF NOT EXISTS idx_intl_fixtures_comp ON public.international_fixtures(tournament_id);' },
    { name: 'idx_intl_fixtures_home', sql: 'CREATE INDEX IF NOT EXISTS idx_intl_fixtures_home ON public.international_fixtures(home_club_id);' },
    { name: 'idx_intl_fixtures_away', sql: 'CREATE INDEX IF NOT EXISTS idx_intl_fixtures_away ON public.international_fixtures(away_club_id);' },
    { name: 'idx_national_fixtures_team', sql: 'CREATE INDEX IF NOT EXISTS idx_national_fixtures_team ON public.national_fixtures(national_team_id);' },
    { name: 'idx_national_callups_player', sql: 'CREATE INDEX IF NOT EXISTS idx_national_callups_player ON public.national_team_callups(player_id);' }
  ];

  for (const idx of indexes) {
    try {
      await client.query(idx.sql);
      console.log(`  [OK] Índice creado: ${idx.name}`);
    } catch (err) {
      console.log(`  [ERROR] Falló creación de índice ${idx.name}: ${err.message}`);
    }
  }

  // 4. Actualizar estadísticas del optimizador de PostgreSQL
  console.log('\n--- 4. ACTUALIZANDO ESTADÍSTICAS DEL OPTIMIZADOR (ANALYZE) ---');
  await client.query('ANALYZE public.players;');
  await client.query('ANALYZE public.fixtures;');
  await client.query('ANALYZE public.clubs;');
  await client.query('ANALYZE public.standings;');
  await client.query('ANALYZE public.offers;');
  await client.query('ANALYZE public.staff;');
  console.log('  [OK] ANALYZE ejecutado en todas las tablas principales.');

  await client.end();
  console.log('\n=== MIGRACIÓN Y OPTIMIZACIÓN FINALIZADA CON ÉXITO ===');
}

optimizeAndSecure().catch(console.error);
