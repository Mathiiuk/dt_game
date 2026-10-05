-- Hitos del club: un (club, año, título) existe una sola vez.
-- 1) Borra duplicados existentes conservando el más antiguo de cada grupo.
-- 2) Crea el índice único que usan los upsert con ignoreDuplicates del código.
DELETE FROM public.club_milestones m
USING (
  SELECT id,
         row_number() OVER (PARTITION BY club_id, year, title ORDER BY created_at, id) AS rn
  FROM public.club_milestones
) d
WHERE m.id = d.id AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS club_milestones_club_year_title_key
  ON public.club_milestones (club_id, year, title);
