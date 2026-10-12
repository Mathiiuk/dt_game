-- Tabla pública "Los mejores DT" (aditivo): los DT con más puntos de legado en toda su carrera.
-- Es la MISMA cuenta que hace el juego en la proyección al Salón de la Fama (`hallOfFameApi.getLiveManagerProjection`):
--   puntos = títulos de liga x 400 + títulos continentales x 800 + partidos ganados x 15 + efectividad (%) x 20 + reputación x 10
-- Solo expone nombre del DT, puntos, títulos y victorias (nada de ids, correos ni club). Entran DT con al menos 10 partidos jugados (con pocos partidos la efectividad infla el puntaje).
-- Se puede consultar sin sesión (es lo que muestra la portada) y devuelve a lo sumo 20 filas.
create or replace function public.public_top_managers(p_limit integer default 5)
returns table (rank bigint, manager_name text, points integer, titles integer, matches_won integer)
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
    where coalesce(trim(m.first_name || ' ' || m.last_name), '') <> ''
  ), scored as (
    select nm, won, nat + intl as titles,
      greatest(0, round(nat * 400 + intl * 800 + won * 15 + (case when played > 0 then round(won::numeric / played * 100, 1) else 0 end) * 20 + rep * 10))::integer as pts
    from base where played >= 10
  )
  select (rank() over (order by pts desc))::bigint, nm, pts, titles::integer, won::integer
  from scored
  order by pts desc, nm
  limit least(greatest(coalesce(p_limit, 5), 1), 20)
$$;

revoke all on function public.public_top_managers(integer) from public;
grant execute on function public.public_top_managers(integer) to anon, authenticated;
