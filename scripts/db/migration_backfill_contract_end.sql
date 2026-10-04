-- Aplicada en Supabase como: backfill_players_contract_end (tarea f3-b3-contract-expiry-alert)
UPDATE public.players p
SET contract_end = make_date(
      (extract(year from c.gd)::int + CASE WHEN extract(month from c.gd) > 6 THEN 1 ELSE 0 END) + greatest(1, coalesce(p.contract_years, 1)) - 1,
      6, 30)
FROM (SELECT id, coalesce(nullif(game_date, '')::date, date '2026-07-01') AS gd FROM public.clubs) c
WHERE p.club_id = c.id AND p.contract_end IS NULL;
UPDATE public.players
SET contract_end = make_date(2026 + 1 + greatest(1, coalesce(contract_years, 1)) - 1, 6, 30)
WHERE club_id IS NULL AND contract_end IS NULL;
CREATE INDEX IF NOT EXISTS idx_players_contract_end ON public.players(contract_end);
