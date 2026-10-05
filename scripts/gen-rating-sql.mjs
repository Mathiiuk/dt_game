// Genera scripts/db/migration_position_ratings.sql desde los pesos de src/domain/ratings.js (única fuente de verdad).
// Uso: node scripts/gen-rating-sql.mjs        (escribe el archivo)
// El test tests/static/rating-sql.test.js comprueba que el archivo está al día con los pesos.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { POSITION_WEIGHTS, ATTRIBUTE_KEYS } from '../src/domain/ratings.js'
import { POSITIONS } from '../src/domain/positions.js'

const weightedSum = (weights) =>
  Object.entries(weights).map(([key, w]) => `COALESCE(NEW.attr_${key}, 50) * ${w}`).join(' + ')

export const buildRatingSql = () => {
  const cases = POSITIONS.map(p => `    WHEN '${p.code}' THEN round(${weightedSum(POSITION_WEIGHTS[p.code])})`).join('\n')
  const attrColumns = ATTRIBUTE_KEYS.map(k => `attr_${k}`).join(', ')

  return `-- GENERADO por scripts/gen-rating-sql.mjs desde src/domain/ratings.js. No editar a mano: cambiar los pesos y regenerar.
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
${cases}
    ELSE 50
  END));
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_sync_player_overall ON public.players;
CREATE TRIGGER trg_sync_player_overall
  BEFORE INSERT OR UPDATE OF position, ${attrColumns} ON public.players
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
${ATTRIBUTE_KEYS.map(k => `    attr_${k} = LEAST(99, COALESCE(attr_${k}, 50) + 7)`).join(',\n')},
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
`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync('scripts/db/migration_position_ratings.sql', buildRatingSql())
  console.log('scripts/db/migration_position_ratings.sql actualizado')
}
