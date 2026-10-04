-- Aplicada en Supabase como: reputation_ledger_allow_club_tribute (tarea f3-b4-weekly-events-call)
ALTER TABLE public.manager_reputation_ledger DROP CONSTRAINT IF EXISTS manager_reputation_ledger_event_type_check;
ALTER TABLE public.manager_reputation_ledger ADD CONSTRAINT manager_reputation_ledger_event_type_check CHECK (event_type IN ('MATCH_RESULT','DERBY_VICTORY','TITLE_WON','PROMOTION','RELEGATION','DISMISSAL','INTERNATIONAL_TRIUMPH','RESIGNATION','CLUB_TRIBUTE'));
