-- Cierre de temporada que se puede retomar.
--
-- Problema: el cierre tiene dos partes. La base (`close_season_atomic`) cierra la temporada de una vez; después la app evoluciona
-- a los jugadores, arma la liga del año siguiente y genera los partidos. Si la segunda parte se interrumpía, la temporada quedaba
-- cerrada en la base y reintentar decía "ya fue cerrada" sin completar nada: el club se quedaba sin partidos.
--
-- Solución: `season_close_progress` guarda por dónde va el cierre de cada club y año.
--   DB_DONE -> EVOLUTION_DONE -> LEAGUE_READY -> COMPLETE
-- La inserta `close_season_atomic` en la MISMA transacción del cierre (sin ventana entre una cosa y la otra) con el resultado completo
-- (`payload.result`); la app marca cada etapa al terminarla y, si se interrumpe, retoma desde la última con esos mismos resultados:
-- no se vuelve a envejecer a nadie, no se vuelve a pagar el premio ni se vuelve a sortear nada.

create table if not exists public.season_close_progress (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  career_id uuid,
  season_year integer not null,
  stage text not null default 'DB_DONE' check (stage in ('DB_DONE', 'EVOLUTION_DONE', 'LEAGUE_READY', 'COMPLETE')),
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  owner_user_id uuid default auth.uid(),
  constraint uq_season_close_progress unique (club_id, season_year)
);

alter table public.season_close_progress enable row level security;
drop policy if exists owner_all on public.season_close_progress;
create policy owner_all on public.season_close_progress for all to authenticated
  using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));

create index if not exists idx_season_close_progress_pending on public.season_close_progress (club_id) where stage <> 'COMPLETE';

CREATE OR REPLACE FUNCTION public.close_season_atomic(
    p_club_id uuid,
    p_season_year integer,
    p_career_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_snapshot_exists boolean;
    v_competition_id uuid;
    v_champion_id uuid;
    v_runner_up_id uuid;
    v_promoted_ids uuid[];
    v_relegated_ids uuid[];
    v_prize jsonb;
    v_total_prize numeric;
    v_new_tier int;
    v_old_tier int;
    v_new_budget numeric;
    v_new_wage_budget numeric;
    v_is_champion boolean;
    v_is_promoted boolean;
    v_expired_count int;
    v_next_year int;
    v_next_game_date text;
    v_user_position int;
    v_standings_json jsonb;
    v_top_scorer_id uuid;
    v_top_scorer_goals int;
    v_result jsonb;
    v_game_date date;
BEGIN
    -- 1. Idempotencia: Verificar si ya se cerró la temporada
    IF p_career_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM season_snapshots 
            WHERE career_id = p_career_id AND season_year = p_season_year
        ) INTO v_snapshot_exists;
        
        IF v_snapshot_exists THEN
            RETURN jsonb_build_object('alreadyClosed', true);
        END IF;
    END IF;

    -- Sin carrera (partida clásica) no hay snapshot que consultar: la marca de avance del cierre dice si esa temporada ya se cerró
    IF EXISTS (SELECT 1 FROM season_close_progress WHERE club_id = p_club_id AND season_year = p_season_year) THEN
        RETURN jsonb_build_object('alreadyClosed', true);
    END IF;

    -- Solo se cierra una temporada terminada: la última semana (la 52) llega 357 días después del 1 de julio del año de inicio.
    -- Sin esta guarda se podía pedir el premio con la temporada a medias (la pantalla ya lo impedía, pero la base no).
    SELECT game_date INTO v_game_date FROM clubs WHERE id = p_club_id;
    IF v_game_date IS NULL OR v_game_date < (p_season_year || '-07-01')::date + 357 THEN
        RAISE EXCEPTION 'La temporada % todavía no terminó: se cierra en la última semana.', p_season_year;
    END IF;

    -- 2. Identificar la liga y obtener posiciones
    SELECT competition_id INTO v_competition_id 
    FROM standings WHERE club_id = p_club_id;
    
    IF v_competition_id IS NULL THEN
        RAISE EXCEPTION 'El club % no está en ninguna liga en %.', p_club_id, p_season_year;
    END IF;

    -- Obtener la tabla completa ordenada como JSON
    SELECT jsonb_agg(row_to_json(s)) INTO v_standings_json
    FROM (
        SELECT st.*, jsonb_build_object('id', c.id, 'name', c.name, 'short_name', c.short_name) as club
        FROM standings st
        JOIN clubs c ON st.club_id = c.id
        WHERE st.competition_id = v_competition_id
        ORDER BY st.points DESC, st.goal_difference DESC, st.goals_for DESC
    ) s;

    -- Extraer clubes clave (Campeón, Subcampeón, Ascensos y Descensos)
    v_champion_id := (v_standings_json->0->>'club_id')::uuid;
    v_runner_up_id := (v_standings_json->1->>'club_id')::uuid;
    
    SELECT array_agg((value->>'club_id')::uuid) INTO v_promoted_ids FROM jsonb_array_elements(v_standings_json) WITH ORDINALITY WHERE ORDINALITY <= 2;
    SELECT array_agg((value->>'club_id')::uuid) INTO v_relegated_ids FROM (SELECT value FROM jsonb_array_elements(v_standings_json) WITH ORDINALITY ORDER BY ORDINALITY DESC LIMIT 3) sub;
    
    -- Posición del usuario
    SELECT ordinality::int INTO v_user_position
    FROM jsonb_array_elements(v_standings_json) WITH ORDINALITY
    WHERE (value->>'club_id')::uuid = p_club_id;

    -- 3. Liquidar el premio de la temporada y recategorizar al club
    -- Llamamos a la función existente (fijar server_result antes por seguridad, aunque la misma fn podría hacerlo)
    SET LOCAL app.server_result = '1';
    
    -- settle_season_prize devuelve un jsonb (no una fila con columnas): se lee clave por clave
    v_prize := settle_season_prize(p_club_id, p_season_year, p_career_id);
    
    v_total_prize := (v_prize->>'total')::numeric;
    v_new_tier := (v_prize->>'new_tier')::int;
    v_old_tier := COALESCE((v_prize->>'old_tier')::int, 5);
    v_new_budget := (v_prize->>'new_budget')::numeric;
    v_new_wage_budget := (v_prize->>'new_wage_budget')::numeric;
    v_top_scorer_id := (v_prize->>'top_scorer_player_id')::uuid;
    v_top_scorer_goals := (v_prize->>'top_scorer_goals')::int;

    v_is_champion := (v_champion_id = p_club_id);
    v_is_promoted := (v_promoted_ids @> ARRAY[p_club_id]) OR (v_new_tier < v_old_tier);

    -- 4. Crear Snapshot Inmutable
    INSERT INTO season_snapshots (
        career_id, season_year, division_tier, champion_club_id, 
        runner_up_club_id, promoted_club_ids, relegated_club_ids, 
        top_scorer_player_id, top_scorer_goals, best_player_id, final_standings_json
    ) VALUES (
        p_career_id, p_season_year, v_old_tier, v_champion_id, 
        v_runner_up_id, v_promoted_ids, v_relegated_ids, 
        v_top_scorer_id, v_top_scorer_goals, v_top_scorer_id, v_standings_json
    );

    -- 5. Hitos y Hemeroteca para el Campeón / Ascenso
    IF v_is_champion THEN
        INSERT INTO club_milestones (club_id, year, title, description, category, importance)
        VALUES (p_club_id, p_season_year, 'Campeón de División (Temporada ' || p_season_year || ')', 'El club se corona campeón absoluto sumando una nueva estrella histórica a sus vitrinas.', 'title', 5)
        ON CONFLICT DO NOTHING;
        
        INSERT INTO club_hemeroteca (club_id, season_year, headline, snippet, media_source, tag)
        VALUES (p_club_id, p_season_year, '¡Gloria Eterna! El club se corona campeón indiscutido', 'Una campaña inolvidable que culmina con la vuelta olímpica. La ciudad festeja una conquista histórica que perdurará en la memoria de los hinchas.', 'El Gráfico del Potrero', 'CAMPEON');
    ELSIF v_is_promoted THEN
        INSERT INTO club_milestones (club_id, year, title, description, category, importance)
        VALUES (p_club_id, p_season_year, 'Ascenso Histórico a División Superior', 'El club logra el codiciado ascenso a una categoría de mayor jerarquía.', 'promotion', 4)
        ON CONFLICT DO NOTHING;
        
        INSERT INTO club_hemeroteca (club_id, season_year, headline, snippet, media_source, tag)
        VALUES (p_club_id, p_season_year, 'Hazaña cumplida: ¡Ascenso asegurado!', 'Con garra y corazón, el equipo selló su boleto a la categoría superior desatando el delirio en las tribunas.', 'Crónica Barrial', 'ASCENSO');
    END IF;

    -- 6. Reporte Financiero Anual
    INSERT INTO annual_financial_statements (
        club_id, season_year, total_income, total_expenses, net_profit_loss, 
        prize_money_received, approved_transfer_budget_next_year, approved_wage_budget_next_year
    ) VALUES (
        p_club_id, p_season_year, (v_total_prize + 55000), 42000, ((v_total_prize + 55000) - 42000),
        v_total_prize, ROUND(v_new_budget * 0.7), v_new_wage_budget
    ) ON CONFLICT (club_id, season_year) DO UPDATE SET
        total_income = EXCLUDED.total_income,
        net_profit_loss = EXCLUDED.net_profit_loss,
        prize_money_received = EXCLUDED.prize_money_received,
        approved_transfer_budget_next_year = EXCLUDED.approved_transfer_budget_next_year,
        approved_wage_budget_next_year = EXCLUDED.approved_wage_budget_next_year;

    -- 7. Devolver préstamos
    PERFORM return_loans(p_club_id);

    -- 8. Liberar Contratos Vencidos
    WITH expired AS (
        UPDATE players 
        SET club_id = NULL, is_transfer_listed = FALSE, asking_price = NULL
        WHERE club_id = p_club_id AND contract_end <= (p_season_year + 1 || '-06-30')::date
        RETURNING id
    )
    SELECT count(*) INTO v_expired_count FROM expired;

    -- 9. Avanzar el tiempo y actualizar historial del manager
    v_next_year := p_season_year + 1;
    v_next_game_date := v_next_year || '-07-01';

    INSERT INTO season_history (club_id, season_year, position)
    VALUES (p_club_id, p_season_year, v_user_position)
    ON CONFLICT DO NOTHING;

    UPDATE clubs SET game_date = v_next_game_date::date WHERE id = p_club_id;
    
    UPDATE players 
    SET contract_years = GREATEST(1, EXTRACT(YEAR FROM contract_end) - v_next_year)
    WHERE club_id = p_club_id AND contract_end IS NOT NULL;

    IF p_career_id IS NOT NULL THEN
        UPDATE career_calendar
        SET current_season_year = v_next_year, current_week = 1, "current_date" = v_next_game_date::date,
            transfer_window_open = true, season_phase = 'PRE_SEASON'
        WHERE career_id = p_career_id;
    END IF;

    -- 10. Limpieza y preparación para el frontend
    -- Las posiciones de standings de ESTA liga se pondrán a 0 desde el frontend si el club no asciende, o se creará una nueva.
    -- (La generación de nuevos clubes bots y fixture requiere generador procedural JS, por eso se hace allí)

    v_result := jsonb_build_object(
        'success', true,
        'userPosition', v_user_position,
        'championClubId', v_champion_id,
        'runnerUpClubId', v_runner_up_id,
        'isPromoted', v_is_promoted,
        'totalPrizeAwarded', v_total_prize,
        'newBudget', v_new_budget,
        'newWageBudget', v_new_wage_budget,
        'newTier', v_new_tier,
        'oldTier', v_old_tier,
        'expiredCount', v_expired_count,
        'newSeasonYear', v_next_year,
        'standingsJson', v_standings_json
    );

    -- 11. Marca de avance: en la MISMA transacción que el cierre. Si el resto del cierre (que corre en la app) se interrumpe,
    -- la temporada queda marcada como "a medias" y se retoma desde acá con estos mismos resultados.
    INSERT INTO season_close_progress (club_id, career_id, season_year, stage, payload)
    VALUES (p_club_id, p_career_id, p_season_year, 'DB_DONE', jsonb_build_object('result', v_result))
    ON CONFLICT (club_id, season_year) DO NOTHING;

    RETURN v_result;
END;
$$;

-- Fija el search_path de la función (aviso de seguridad del linter de Supabase)
ALTER FUNCTION public.close_season_atomic(uuid, integer, uuid) SET search_path = public, pg_temp;
