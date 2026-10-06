-- Bingo del DT: la cartilla de clichés de la temporada.
-- Forma: { season: 2026, marks: ['W1', 'L3'], lines: 1, full: false }. Se reinicia al empezar otra temporada.
alter table public.club_climate add column if not exists press_bingo jsonb not null default '{}'::jsonb;
