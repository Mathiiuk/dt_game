-- Historias de varias fechas del club: una activa a la vez, las ya vividas y el descanso entre historias.
-- Forma: { active: { id, chapter, delivered, wait, flags }, cooldown, done: [{ id, title, ending, season }] }
alter table public.club_climate add column if not exists arcs jsonb not null default '{}'::jsonb;
