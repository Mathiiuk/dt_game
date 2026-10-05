-- GENERADO por scripts/gen-rating-sql.mjs desde src/domain/ratings.js. No editar a mano: cambiar los pesos y regenerar.
-- Posiciones unificadas (PO DFC LI LD MCD MC MCO MI MD EI ED DC) y media estilo FIFA por posición (attr_overall).
-- La parte de datos (conversión de posiciones y escala) corre UNA sola vez: queda registrada en game_data_migrations.

CREATE TABLE IF NOT EXISTS public.game_data_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- 1) Posición vieja -> posición actual
CREATE OR REPLACE FUNCTION public.normalize_position(code text) RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE upper(regexp_replace(coalesce(code, ''), '[0-9]+$', ''))
    WHEN 'PO' THEN 'PO' WHEN 'DFC' THEN 'DFC' WHEN 'LI' THEN 'LI' WHEN 'LD' THEN 'LD'
    WHEN 'MCD' THEN 'MCD' WHEN 'MC' THEN 'MC' WHEN 'MCO' THEN 'MCO' WHEN 'MI' THEN 'MI' WHEN 'MD' THEN 'MD'
    WHEN 'EI' THEN 'EI' WHEN 'ED' THEN 'ED' WHEN 'DC' THEN 'DC'
    WHEN 'GK' THEN 'PO' WHEN 'POR' THEN 'PO'
    WHEN 'CB' THEN 'DFC' WHEN 'LCB' THEN 'DFC' WHEN 'RCB' THEN 'DFC' WHEN 'DF' THEN 'DFC' WHEN 'DEF' THEN 'DFC'
    WHEN 'LB' THEN 'LI' WHEN 'LWB' THEN 'LI' WHEN 'RB' THEN 'LD' WHEN 'RWB' THEN 'LD'
    WHEN 'DM' THEN 'MCD' WHEN 'CDM' THEN 'MCD' WHEN 'LDM' THEN 'MCD' WHEN 'RDM' THEN 'MCD'
    WHEN 'CM' THEN 'MC' WHEN 'LCM' THEN 'MC' WHEN 'RCM' THEN 'MC' WHEN 'MED' THEN 'MC'
    WHEN 'AM' THEN 'MCO' WHEN 'CAM' THEN 'MCO'
    WHEN 'LM' THEN 'MI' WHEN 'RM' THEN 'MD'
    WHEN 'LW' THEN 'EI' WHEN 'RW' THEN 'ED'
    WHEN 'ST' THEN 'DC' WHEN 'LST' THEN 'DC' WHEN 'RST' THEN 'DC' WHEN 'CF' THEN 'DC' WHEN 'FW' THEN 'DC' WHEN 'DEL' THEN 'DC'
    ELSE 'MC'
  END
$$;

-- 2) Media estilo FIFA según la posición del jugador (mismos pesos que src/domain/ratings.js)
CREATE OR REPLACE FUNCTION public.sync_player_overall() RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $fn$
BEGIN
  NEW.position := public.normalize_position(NEW.position);
  NEW.attr_overall := LEAST(99, GREATEST(1, CASE NEW.position
    WHEN 'PO' THEN round(COALESCE(NEW.attr_positioning, 50) * 0.3 + COALESCE(NEW.attr_concentration, 50) * 0.2 + COALESCE(NEW.attr_decisions, 50) * 0.15 + COALESCE(NEW.attr_mentality, 50) * 0.1 + COALESCE(NEW.attr_control, 50) * 0.05 + COALESCE(NEW.attr_strength, 50) * 0.05 + COALESCE(NEW.attr_vision, 50) * 0.05 + COALESCE(NEW.attr_passing, 50) * 0.05 + COALESCE(NEW.attr_acceleration, 50) * 0.05)
    WHEN 'DFC' THEN round(COALESCE(NEW.attr_marking, 50) * 0.22 + COALESCE(NEW.attr_tackling, 50) * 0.22 + COALESCE(NEW.attr_heading, 50) * 0.14 + COALESCE(NEW.attr_strength, 50) * 0.12 + COALESCE(NEW.attr_positioning, 50) * 0.1 + COALESCE(NEW.attr_concentration, 50) * 0.06 + COALESCE(NEW.attr_pace, 50) * 0.04 + COALESCE(NEW.attr_mentality, 50) * 0.04 + COALESCE(NEW.attr_decisions, 50) * 0.04 + COALESCE(NEW.attr_passing, 50) * 0.02)
    WHEN 'LI' THEN round(COALESCE(NEW.attr_pace, 50) * 0.14 + COALESCE(NEW.attr_acceleration, 50) * 0.08 + COALESCE(NEW.attr_tackling, 50) * 0.14 + COALESCE(NEW.attr_marking, 50) * 0.12 + COALESCE(NEW.attr_stamina, 50) * 0.12 + COALESCE(NEW.attr_passing, 50) * 0.1 + COALESCE(NEW.attr_technique, 50) * 0.08 + COALESCE(NEW.attr_dribbling, 50) * 0.06 + COALESCE(NEW.attr_positioning, 50) * 0.08 + COALESCE(NEW.attr_decisions, 50) * 0.04 + COALESCE(NEW.attr_strength, 50) * 0.04)
    WHEN 'LD' THEN round(COALESCE(NEW.attr_pace, 50) * 0.14 + COALESCE(NEW.attr_acceleration, 50) * 0.08 + COALESCE(NEW.attr_tackling, 50) * 0.14 + COALESCE(NEW.attr_marking, 50) * 0.12 + COALESCE(NEW.attr_stamina, 50) * 0.12 + COALESCE(NEW.attr_passing, 50) * 0.1 + COALESCE(NEW.attr_technique, 50) * 0.08 + COALESCE(NEW.attr_dribbling, 50) * 0.06 + COALESCE(NEW.attr_positioning, 50) * 0.08 + COALESCE(NEW.attr_decisions, 50) * 0.04 + COALESCE(NEW.attr_strength, 50) * 0.04)
    WHEN 'MCD' THEN round(COALESCE(NEW.attr_tackling, 50) * 0.18 + COALESCE(NEW.attr_marking, 50) * 0.14 + COALESCE(NEW.attr_positioning, 50) * 0.12 + COALESCE(NEW.attr_passing, 50) * 0.14 + COALESCE(NEW.attr_strength, 50) * 0.1 + COALESCE(NEW.attr_stamina, 50) * 0.1 + COALESCE(NEW.attr_decisions, 50) * 0.08 + COALESCE(NEW.attr_vision, 50) * 0.05 + COALESCE(NEW.attr_concentration, 50) * 0.05 + COALESCE(NEW.attr_control, 50) * 0.04)
    WHEN 'MC' THEN round(COALESCE(NEW.attr_passing, 50) * 0.18 + COALESCE(NEW.attr_vision, 50) * 0.14 + COALESCE(NEW.attr_control, 50) * 0.12 + COALESCE(NEW.attr_technique, 50) * 0.1 + COALESCE(NEW.attr_stamina, 50) * 0.12 + COALESCE(NEW.attr_decisions, 50) * 0.1 + COALESCE(NEW.attr_tackling, 50) * 0.06 + COALESCE(NEW.attr_shooting, 50) * 0.06 + COALESCE(NEW.attr_dribbling, 50) * 0.06 + COALESCE(NEW.attr_positioning, 50) * 0.06)
    WHEN 'MCO' THEN round(COALESCE(NEW.attr_vision, 50) * 0.18 + COALESCE(NEW.attr_passing, 50) * 0.16 + COALESCE(NEW.attr_technique, 50) * 0.14 + COALESCE(NEW.attr_dribbling, 50) * 0.12 + COALESCE(NEW.attr_control, 50) * 0.1 + COALESCE(NEW.attr_shooting, 50) * 0.1 + COALESCE(NEW.attr_decisions, 50) * 0.08 + COALESCE(NEW.attr_finishing, 50) * 0.06 + COALESCE(NEW.attr_acceleration, 50) * 0.06)
    WHEN 'MI' THEN round(COALESCE(NEW.attr_pace, 50) * 0.14 + COALESCE(NEW.attr_acceleration, 50) * 0.1 + COALESCE(NEW.attr_dribbling, 50) * 0.14 + COALESCE(NEW.attr_passing, 50) * 0.12 + COALESCE(NEW.attr_technique, 50) * 0.1 + COALESCE(NEW.attr_stamina, 50) * 0.12 + COALESCE(NEW.attr_vision, 50) * 0.08 + COALESCE(NEW.attr_shooting, 50) * 0.06 + COALESCE(NEW.attr_control, 50) * 0.08 + COALESCE(NEW.attr_decisions, 50) * 0.06)
    WHEN 'MD' THEN round(COALESCE(NEW.attr_pace, 50) * 0.14 + COALESCE(NEW.attr_acceleration, 50) * 0.1 + COALESCE(NEW.attr_dribbling, 50) * 0.14 + COALESCE(NEW.attr_passing, 50) * 0.12 + COALESCE(NEW.attr_technique, 50) * 0.1 + COALESCE(NEW.attr_stamina, 50) * 0.12 + COALESCE(NEW.attr_vision, 50) * 0.08 + COALESCE(NEW.attr_shooting, 50) * 0.06 + COALESCE(NEW.attr_control, 50) * 0.08 + COALESCE(NEW.attr_decisions, 50) * 0.06)
    WHEN 'EI' THEN round(COALESCE(NEW.attr_pace, 50) * 0.16 + COALESCE(NEW.attr_acceleration, 50) * 0.12 + COALESCE(NEW.attr_dribbling, 50) * 0.18 + COALESCE(NEW.attr_technique, 50) * 0.1 + COALESCE(NEW.attr_finishing, 50) * 0.12 + COALESCE(NEW.attr_shooting, 50) * 0.1 + COALESCE(NEW.attr_passing, 50) * 0.08 + COALESCE(NEW.attr_control, 50) * 0.08 + COALESCE(NEW.attr_vision, 50) * 0.06)
    WHEN 'ED' THEN round(COALESCE(NEW.attr_pace, 50) * 0.16 + COALESCE(NEW.attr_acceleration, 50) * 0.12 + COALESCE(NEW.attr_dribbling, 50) * 0.18 + COALESCE(NEW.attr_technique, 50) * 0.1 + COALESCE(NEW.attr_finishing, 50) * 0.12 + COALESCE(NEW.attr_shooting, 50) * 0.1 + COALESCE(NEW.attr_passing, 50) * 0.08 + COALESCE(NEW.attr_control, 50) * 0.08 + COALESCE(NEW.attr_vision, 50) * 0.06)
    WHEN 'DC' THEN round(COALESCE(NEW.attr_finishing, 50) * 0.24 + COALESCE(NEW.attr_shooting, 50) * 0.12 + COALESCE(NEW.attr_positioning, 50) * 0.1 + COALESCE(NEW.attr_heading, 50) * 0.1 + COALESCE(NEW.attr_strength, 50) * 0.1 + COALESCE(NEW.attr_control, 50) * 0.08 + COALESCE(NEW.attr_pace, 50) * 0.08 + COALESCE(NEW.attr_dribbling, 50) * 0.06 + COALESCE(NEW.attr_acceleration, 50) * 0.06 + COALESCE(NEW.attr_decisions, 50) * 0.06)
    ELSE 50
  END));
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_sync_player_overall ON public.players;
CREATE TRIGGER trg_sync_player_overall
  BEFORE INSERT OR UPDATE OF position, attr_pace, attr_acceleration, attr_strength, attr_stamina, attr_technique, attr_passing, attr_control, attr_dribbling, attr_finishing, attr_shooting, attr_heading, attr_marking, attr_tackling, attr_positioning, attr_vision, attr_decisions, attr_mentality, attr_concentration, attr_leadership, attr_aggression, attr_professionalism ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.sync_player_overall();

-- 3) Datos existentes (una sola vez)
DO $data$
BEGIN
  IF EXISTS (SELECT 1 FROM public.game_data_migrations WHERE name = 'positions_and_fifa_scale_v1') THEN
    RETURN;
  END IF;

  -- Respaldo previo (se puede borrar cuando se confirme que todo está bien)
  CREATE TABLE IF NOT EXISTS public.players_backup_positions_v1 AS TABLE public.players;

  -- Escala: todos los atributos y el potencial suben 7 puntos (los planteles de división 5 pasan de ~45-60 a ~52-67)
  UPDATE public.players SET
    attr_pace = LEAST(99, COALESCE(attr_pace, 50) + 7),
    attr_acceleration = LEAST(99, COALESCE(attr_acceleration, 50) + 7),
    attr_strength = LEAST(99, COALESCE(attr_strength, 50) + 7),
    attr_stamina = LEAST(99, COALESCE(attr_stamina, 50) + 7),
    attr_technique = LEAST(99, COALESCE(attr_technique, 50) + 7),
    attr_passing = LEAST(99, COALESCE(attr_passing, 50) + 7),
    attr_control = LEAST(99, COALESCE(attr_control, 50) + 7),
    attr_dribbling = LEAST(99, COALESCE(attr_dribbling, 50) + 7),
    attr_finishing = LEAST(99, COALESCE(attr_finishing, 50) + 7),
    attr_shooting = LEAST(99, COALESCE(attr_shooting, 50) + 7),
    attr_heading = LEAST(99, COALESCE(attr_heading, 50) + 7),
    attr_marking = LEAST(99, COALESCE(attr_marking, 50) + 7),
    attr_tackling = LEAST(99, COALESCE(attr_tackling, 50) + 7),
    attr_positioning = LEAST(99, COALESCE(attr_positioning, 50) + 7),
    attr_vision = LEAST(99, COALESCE(attr_vision, 50) + 7),
    attr_decisions = LEAST(99, COALESCE(attr_decisions, 50) + 7),
    attr_mentality = LEAST(99, COALESCE(attr_mentality, 50) + 7),
    attr_concentration = LEAST(99, COALESCE(attr_concentration, 50) + 7),
    attr_leadership = LEAST(99, COALESCE(attr_leadership, 50) + 7),
    attr_aggression = LEAST(99, COALESCE(attr_aggression, 50) + 7),
    attr_professionalism = LEAST(99, COALESCE(attr_professionalism, 50) + 7),
    attr_potential = LEAST(99, COALESCE(attr_potential, 60) + 7),
    market_value = round(market_value * 1.14),
    release_clause = CASE WHEN release_clause IS NULL THEN NULL ELSE round(release_clause * 1.14) END;

  -- Posición y media (el trigger convierte la posición y recalcula attr_overall)
  UPDATE public.players SET position = position;

  -- El potencial nunca puede ser menor que la media actual
  UPDATE public.players SET attr_potential = attr_overall WHERE attr_potential < attr_overall;

  UPDATE public.youth_candidates SET position = public.normalize_position(position);
  UPDATE public.player_training_assignments SET retraining_position = public.normalize_position(retraining_position)
    WHERE retraining_position IS NOT NULL;

  -- Los puestos guardados de las alineaciones usaban los nombres viejos: se regeneran desde la pizarra
  DELETE FROM public.tactic_lineup_slots;

  INSERT INTO public.game_data_migrations(name) VALUES ('positions_and_fifa_scale_v1');
END $data$;
