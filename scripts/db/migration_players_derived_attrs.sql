-- Aplicada en Supabase como: players_attr_defending_overall_synced (tarea f3-b5-schema-drift-round2)
-- El código (entrenamiento, mercado, motor de partidos, evolución) usa attr_defending y attr_overall; el esquema
-- vigente tiene atributos granulares. Se agregan como columnas escribibles, con trigger que las deriva de los granulares.
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS attr_defending int, ADD COLUMN IF NOT EXISTS attr_overall int;

CREATE OR REPLACE FUNCTION public.players_sync_derived_attrs() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  def int;
  ovr int;
BEGIN
  def := round((coalesce(NEW.attr_marking,50) + coalesce(NEW.attr_tackling,50) + coalesce(NEW.attr_positioning,50)) / 3.0);
  ovr := round((coalesce(NEW.attr_pace,50)+coalesce(NEW.attr_acceleration,50)+coalesce(NEW.attr_strength,50)+coalesce(NEW.attr_stamina,50)+coalesce(NEW.attr_technique,50)+coalesce(NEW.attr_passing,50)+coalesce(NEW.attr_control,50)+coalesce(NEW.attr_dribbling,50)+coalesce(NEW.attr_finishing,50)+coalesce(NEW.attr_shooting,50)+coalesce(NEW.attr_heading,50)+coalesce(NEW.attr_marking,50)+coalesce(NEW.attr_tackling,50)+coalesce(NEW.attr_positioning,50)+coalesce(NEW.attr_vision,50)+coalesce(NEW.attr_decisions,50)+coalesce(NEW.attr_mentality,50)+coalesce(NEW.attr_concentration,50)) / 18.0);

  IF TG_OP = 'UPDATE' THEN
    -- Si cambiaron los atributos granulares y el derivado no se escribió explícitamente, se recalcula
    IF ROW(NEW.attr_marking, NEW.attr_tackling, NEW.attr_positioning) IS DISTINCT FROM ROW(OLD.attr_marking, OLD.attr_tackling, OLD.attr_positioning)
       AND NEW.attr_defending IS NOT DISTINCT FROM OLD.attr_defending THEN
      NEW.attr_defending := def;
    END IF;
    IF ROW(NEW.attr_pace,NEW.attr_acceleration,NEW.attr_strength,NEW.attr_stamina,NEW.attr_technique,NEW.attr_passing,NEW.attr_control,NEW.attr_dribbling,NEW.attr_finishing,NEW.attr_shooting,NEW.attr_heading,NEW.attr_marking,NEW.attr_tackling,NEW.attr_positioning,NEW.attr_vision,NEW.attr_decisions,NEW.attr_mentality,NEW.attr_concentration)
       IS DISTINCT FROM ROW(OLD.attr_pace,OLD.attr_acceleration,OLD.attr_strength,OLD.attr_stamina,OLD.attr_technique,OLD.attr_passing,OLD.attr_control,OLD.attr_dribbling,OLD.attr_finishing,OLD.attr_shooting,OLD.attr_heading,OLD.attr_marking,OLD.attr_tackling,OLD.attr_positioning,OLD.attr_vision,OLD.attr_decisions,OLD.attr_mentality,OLD.attr_concentration)
       AND NEW.attr_overall IS NOT DISTINCT FROM OLD.attr_overall THEN
      NEW.attr_overall := ovr;
    END IF;
  END IF;

  NEW.attr_defending := coalesce(NEW.attr_defending, def);
  NEW.attr_overall := coalesce(NEW.attr_overall, ovr);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_players_sync_derived_attrs ON public.players;
CREATE TRIGGER trg_players_sync_derived_attrs BEFORE INSERT OR UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.players_sync_derived_attrs();

UPDATE public.players SET attr_defending = NULL, attr_overall = NULL;
