-- Personajes con nombre y memoria de cada club: líder de la barra, presidente y periodista.
-- Forma: { barra: { name, times }, president: { name }, journalist: { name, outlet, grudge } }
alter table public.club_climate add column if not exists characters jsonb not null default '{}'::jsonb;
