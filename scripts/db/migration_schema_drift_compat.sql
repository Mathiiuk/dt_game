-- Aplicada en Supabase como: schema_compat_fixtures_players_season_history, fixtures_sync_match_week, players_overall_generated
ALTER TABLE public.fixtures
  ADD COLUMN IF NOT EXISTS home_club_id uuid REFERENCES public.clubs(id),
  ADD COLUMN IF NOT EXISTS away_club_id uuid REFERENCES public.clubs(id),
  ADD COLUMN IF NOT EXISTS round int;
UPDATE public.fixtures SET home_club_id = home_team_id, away_club_id = away_team_id, round = COALESCE(round, match_week)
 WHERE home_club_id IS NULL OR away_club_id IS NULL OR round IS NULL;
CREATE OR REPLACE FUNCTION public.fixtures_sync_club_cols() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  NEW.home_team_id := COALESCE(NEW.home_team_id, NEW.home_club_id);
  NEW.away_team_id := COALESCE(NEW.away_team_id, NEW.away_club_id);
  NEW.home_club_id := NEW.home_team_id;
  NEW.away_club_id := NEW.away_team_id;
  NEW.match_week := COALESCE(NEW.match_week, NEW.round);
  NEW.round := COALESCE(NEW.round, NEW.match_week);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_fixtures_sync_club_cols ON public.fixtures;
CREATE TRIGGER trg_fixtures_sync_club_cols BEFORE INSERT OR UPDATE ON public.fixtures
  FOR EACH ROW EXECUTE FUNCTION public.fixtures_sync_club_cols();
CREATE INDEX IF NOT EXISTS idx_fixtures_home_club ON public.fixtures(home_club_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_away_club ON public.fixtures(away_club_id);
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS name text GENERATED ALWAYS AS (trim(coalesce(first_name,'') || ' ' || coalesce(last_name,''))) STORED;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS overall int GENERATED ALWAYS AS (
  round((coalesce(attr_pace,50)+coalesce(attr_acceleration,50)+coalesce(attr_strength,50)+coalesce(attr_stamina,50)+coalesce(attr_technique,50)+coalesce(attr_passing,50)+coalesce(attr_control,50)+coalesce(attr_dribbling,50)+coalesce(attr_finishing,50)+coalesce(attr_shooting,50)+coalesce(attr_heading,50)+coalesce(attr_marking,50)+coalesce(attr_tackling,50)+coalesce(attr_positioning,50)+coalesce(attr_vision,50)+coalesce(attr_decisions,50)+coalesce(attr_mentality,50)+coalesce(attr_concentration,50)) / 18.0)::numeric
) STORED;
ALTER TABLE public.season_history ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.managers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_season_history_manager ON public.season_history(manager_id);
