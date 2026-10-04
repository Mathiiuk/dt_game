-- Aplicada en Supabase como: batch_rpc_players_fixtures_standings (tarea f3-p1-weekly-cascade)
-- Reemplaza cientos de UPDATE secuenciales del ciclo semanal por una llamada RPC por conjunto de filas.

-- Actualización masiva de jugadores (sólo las claves presentes en cada objeto del arreglo)
CREATE OR REPLACE FUNCTION public.batch_update_players(rows jsonb) RETURNS int
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE n int;
BEGIN
  UPDATE public.players p SET
    state_fitness = CASE WHEN e ? 'state_fitness' THEN (e->>'state_fitness')::int ELSE p.state_fitness END,
    state_morale  = CASE WHEN e ? 'state_morale'  THEN (e->>'state_morale')::int  ELSE p.state_morale END,
    injury_days   = CASE WHEN e ? 'injury_days'   THEN (e->>'injury_days')::int   ELSE p.injury_days END,
    injury_type   = CASE WHEN e ? 'injury_type'   THEN e->>'injury_type'          ELSE p.injury_type END,
    is_injured    = CASE WHEN e ? 'is_injured'    THEN (e->>'is_injured')::boolean ELSE p.is_injured END,
    attr_pace     = CASE WHEN e ? 'attr_pace'     THEN (e->>'attr_pace')::int     ELSE p.attr_pace END,
    attr_passing  = CASE WHEN e ? 'attr_passing'  THEN (e->>'attr_passing')::int  ELSE p.attr_passing END,
    attr_defending= CASE WHEN e ? 'attr_defending' THEN (e->>'attr_defending')::int ELSE p.attr_defending END,
    attr_shooting = CASE WHEN e ? 'attr_shooting' THEN (e->>'attr_shooting')::int ELSE p.attr_shooting END,
    matches_played= CASE WHEN e ? 'matches_played' THEN (e->>'matches_played')::int ELSE p.matches_played END,
    goals_scored  = CASE WHEN e ? 'goals_scored'  THEN (e->>'goals_scored')::int  ELSE p.goals_scored END,
    club_status   = CASE WHEN e ? 'club_status'   THEN e->>'club_status'          ELSE p.club_status END,
    legend_reason = CASE WHEN e ? 'legend_reason' THEN e->>'legend_reason'        ELSE p.legend_reason END,
    is_idol       = CASE WHEN e ? 'is_idol'       THEN (e->>'is_idol')::boolean   ELSE p.is_idol END
  FROM jsonb_array_elements(rows) e
  WHERE p.id = (e->>'id')::uuid;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Suma minutos oficiales a varios jugadores de una vez
CREATE OR REPLACE FUNCTION public.increment_players_minutes(player_ids uuid[], mins int) RETURNS int
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE n int;
BEGIN
  UPDATE public.players SET minutes_played_season = coalesce(minutes_played_season, 0) + mins WHERE id = ANY(player_ids);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Cierra partidos simulados de IA y devuelve los ids efectivamente cerrados.
-- Idempotente: sólo toca fixtures todavía abiertos (evita doble conteo en la tabla si dos procesos coinciden)
DROP FUNCTION IF EXISTS public.batch_finish_fixtures(jsonb);
CREATE OR REPLACE FUNCTION public.batch_finish_fixtures(rows jsonb) RETURNS jsonb
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE closed jsonb;
BEGIN
  WITH upd AS (
    UPDATE public.fixtures f SET
      home_score = (e->>'home_score')::int,
      away_score = (e->>'away_score')::int,
      status = 'PLAYED'
    FROM jsonb_array_elements(rows) e
    WHERE f.id = (e->>'id')::uuid AND f.status IN ('SCHEDULED', 'PENDING')
    RETURNING f.id
  )
  SELECT coalesce(jsonb_agg(id), '[]'::jsonb) INTO closed FROM upd;
  RETURN closed;
END $$;

-- Aplica deltas de tabla de posiciones (varios clubes y partidos en una sola llamada)
CREATE OR REPLACE FUNCTION public.apply_standings_deltas(rows jsonb) RETURNS int
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE n int;
BEGIN
  UPDATE public.standings s SET
    played = s.played + (e->>'played')::int,
    won = s.won + (e->>'won')::int,
    drawn = s.drawn + (e->>'drawn')::int,
    lost = s.lost + (e->>'lost')::int,
    goals_for = s.goals_for + (e->>'goals_for')::int,
    goals_against = s.goals_against + (e->>'goals_against')::int,
    points = s.points + (e->>'points')::int,
    goal_difference = (s.goals_for + (e->>'goals_for')::int) - (s.goals_against + (e->>'goals_against')::int),
    form = left((e->>'form') || ',' || coalesce(s.form, ''), 9),
    updated_at = now()
  FROM jsonb_array_elements(rows) e
  WHERE s.competition_id = (e->>'competition_id')::uuid AND s.club_id = (e->>'club_id')::uuid;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Recuperación médica semanal en lote (player_injuries)
CREATE OR REPLACE FUNCTION public.batch_update_injuries(rows jsonb) RETURNS int
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE n int;
BEGIN
  UPDATE public.player_injuries i SET
    weeks_remaining = (e->>'weeks_remaining')::int,
    is_cleared = (e->>'is_cleared')::boolean,
    cleared_at = CASE WHEN (e->>'is_cleared')::boolean THEN now() ELSE i.cleared_at END
  FROM jsonb_array_elements(rows) e
  WHERE i.id = (e->>'id')::uuid;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Una sola conferencia de prensa por partido (elimina duplicados previos y lo garantiza a futuro)
DELETE FROM public.press_conferences a USING public.press_conferences b
 WHERE a.fixture_id IS NOT NULL AND a.fixture_id = b.fixture_id AND a.ctid < b.ctid;
CREATE UNIQUE INDEX IF NOT EXISTS uq_press_conferences_fixture ON public.press_conferences(fixture_id) WHERE fixture_id IS NOT NULL;
