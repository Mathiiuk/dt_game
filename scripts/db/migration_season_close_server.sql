-- ==============================================================================
-- Migración: Cierre de Temporada en Servidor y Temporada de 38 fechas (Ida y Vuelta)
-- ==============================================================================

-- Función principal para el cierre de temporada atómico en el servidor
-- Realiza: Snapshot, Hitos (Milestones), Hemeroteca, Finanzas Anuales, Devolución de Préstamos, Contratos y Avance de Calendario.
-- Nota: La evolución biológica de los atributos y el sorteo de rivales nuevos para el fixture siguiente
-- seguirán siendo gestionados por JS justo después de esta llamada.

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
    v_prize_result record;
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
    SELECT ord INTO v_user_position
    FROM jsonb_array_elements(v_standings_json) WITH ORDINALITY
    WHERE (value->>'club_id')::uuid = p_club_id;

    -- 3. Liquidar el premio de la temporada y recategorizar al club
    -- Llamamos a la función existente (fijar server_result antes por seguridad, aunque la misma fn podría hacerlo)
    SET LOCAL app.server_result = '1';
    
    SELECT * INTO v_prize_result FROM settle_season_prize(p_club_id, p_season_year, p_career_id);
    
    v_total_prize := v_prize_result.total;
    v_new_tier := v_prize_result.new_tier;
    v_old_tier := COALESCE(v_prize_result.old_tier, 5);
    v_new_budget := v_prize_result.new_budget;
    v_new_wage_budget := v_prize_result.new_wage_budget;
    v_top_scorer_id := v_prize_result.top_scorer_player_id;
    v_top_scorer_goals := v_prize_result.top_scorer_goals;

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
        
        INSERT INTO hemeroteca_articles (club_id, season_year, headline, snippet, media_source, tag)
        VALUES (p_club_id, p_season_year, '¡Gloria Eterna! El club se corona campeón indiscutido', 'Una campaña inolvidable que culmina con la vuelta olímpica. La ciudad festeja una conquista histórica que perdurará en la memoria de los hinchas.', 'El Gráfico del Potrero', 'CAMPEON');
    ELSIF v_is_promoted THEN
        INSERT INTO club_milestones (club_id, year, title, description, category, importance)
        VALUES (p_club_id, p_season_year, 'Ascenso Histórico a División Superior', 'El club logra el codiciado ascenso a una categoría de mayor jerarquía.', 'promotion', 4)
        ON CONFLICT DO NOTHING;
        
        INSERT INTO hemeroteca_articles (club_id, season_year, headline, snippet, media_source, tag)
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

    RETURN jsonb_build_object(
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
END;
$$;
