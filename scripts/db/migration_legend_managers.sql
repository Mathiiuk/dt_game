-- Cinco leyendas para la tabla pública de los mejores DT (aditivo): los DT argentinos más ganadores de la historia, por cantidad de títulos.
-- Se guarda solo el nombre, la cantidad de títulos y la época; sin clubes. Las cifras varían según la fuente (se usa la más citada).
-- Dan a quién competirle: aparecen siempre en "Los mejores DT" y los DT del juego (los que aceptaron aparecer) las pasan en el puesto.
-- Puntaje de leyenda: títulos x 600 (el promedio entre un título de liga, 400, y uno continental, 800, de la fórmula del juego).
-- La tabla tiene RLS sin políticas: solo se lee a través de `public_top_managers_v2`.
create table if not exists public.legend_managers (
  manager_name text primary key,
  era text not null,
  titles integer not null
);
alter table public.legend_managers enable row level security;

insert into public.legend_managers (manager_name, era, titles) values
('Ramón Díaz', 'Década del 90 - hoy', 17),
('Helenio Herrera', '1940 - 1981', 16),
('Carlos Bianchi', 'Década del 80 - 2014', 15),
('Marcelo Gallardo', '2014 - hoy', 15),
('Guillermo Stábile', '1930 - 1960', 13)
on conflict (manager_name) do nothing;

-- Función nueva (v2) en vez de reemplazar la anterior: cambia el tipo de resultado y `drop function` quedaba colgado en producción.
create or replace function public.public_top_managers_v2(p_limit integer default 3)
returns table (rank bigint, manager_name text, points integer, titles integer, matches_won integer, is_legend boolean)
language sql stable security definer set search_path = public as $$
  with base as (
    select m.id, left(trim(m.first_name || ' ' || m.last_name), 40) as nm, coalesce(m.reputation, 0) as rep,
      (select count(*) from public.match_history h where h.club_id = c.id) as played,
      (select count(*) from public.match_history h where h.club_id = c.id
         and ((h.is_home and h.home_score > h.away_score) or (not h.is_home and h.away_score > h.home_score))) as won,
      (select count(*) from public.manager_achievements a where a.manager_id = m.id and a.achievement_type = 'league_champion') as nat,
      (select count(*) from public.manager_achievements a where a.manager_id = m.id and a.achievement_type = 'continental_champion') as intl
    from public.managers m
    join public.clubs c on c.manager_id = m.id
    where m.public_ranking
      and coalesce(trim(m.first_name || ' ' || m.last_name), '') <> ''
  ), humans as (
    select nm, won::integer as won, (nat + intl)::integer as titles,
      greatest(0, round(nat * 400 + intl * 800 + won * 15 + (case when played > 0 then round(won::numeric / played * 100, 1) else 0 end) * 20 + rep * 10))::integer as pts
    from base where played >= 10
    order by 4 desc, nm
    limit least(greatest(coalesce(p_limit, 3), 1), 10)
  ), legends as (
    select l.manager_name as nm, 0 as won, l.titles, l.titles * 600 as pts
    from public.legend_managers l
  ), everyone as (
    select nm, pts, titles, won, false as lg from humans
    union all
    select nm, pts, titles, won, true from legends
  )
  select (rank() over (order by pts desc))::bigint, nm, pts, titles, won, lg
  from everyone
  order by pts desc, nm
$$;

revoke all on function public.public_top_managers_v2(integer) from public;
grant execute on function public.public_top_managers_v2(integer) to anon, authenticated;
