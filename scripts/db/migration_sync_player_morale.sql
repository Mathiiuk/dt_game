-- La moral del jugador existía en DOS columnas independientes (morale, default 70 y state_morale, default 100):
-- las charlas del vestuario escribían una y el Inicio/partidos leían la otra, así que las charlas "no se notaban".
-- state_morale es la fuente de verdad; este trigger mantiene morale como espejo para el código que aún la usa.

CREATE OR REPLACE FUNCTION public.sync_player_morale() RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Si sólo se informó morale (state_morale quedó en su valor por defecto), se respeta morale
    IF NEW.state_morale = 100 AND NEW.morale <> 70 THEN
      NEW.state_morale := NEW.morale;
    ELSE
      NEW.morale := NEW.state_morale;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.morale IS DISTINCT FROM OLD.morale AND NEW.state_morale IS NOT DISTINCT FROM OLD.state_morale THEN
    NEW.state_morale := NEW.morale;
  ELSIF NEW.state_morale IS DISTINCT FROM OLD.state_morale THEN
    NEW.morale := NEW.state_morale;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_player_morale ON public.players;
CREATE TRIGGER trg_sync_player_morale
  BEFORE INSERT OR UPDATE OF morale, state_morale ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.sync_player_morale();

-- Sincronización única de los datos existentes
UPDATE public.players SET morale = state_morale WHERE morale IS DISTINCT FROM state_morale;
