-- Limpieza única: divisiones del mundo que quedaron a medias antes del arreglo de la limpieza (tabla sin ningún partido).
-- El borrado de la app fallaba porque la base no borra en cascada tabla ni partidos (ver competition.js, _dropWorldLeague).
-- Solo toca competiciones de temporada (season_year), sin partidos, de más de un día y con todos sus clubes de la IA sin DT.
-- Los clubes que figuran en una oferta de trabajo se dejan (la FK borraría la oferta del historial); quedan sueltos sin liga.
do $$
declare
  comp record;
  ids uuid[];
begin
  for comp in
    select c.id from public.competitions c
    where c.season_year is not null
      and c.created_at < now() - interval '1 day'
      and not exists (select 1 from public.fixtures f where f.competition_id = c.id)
  loop
    select array_agg(s.club_id) into ids from public.standings s where s.competition_id = comp.id;
    if exists (select 1 from public.clubs cl where cl.id = any(coalesce(ids, '{}')) and (cl.history_type <> 'bot' or cl.manager_id is not null)) then
      continue;
    end if;
    delete from public.standings where competition_id = comp.id;
    delete from public.competitions where id = comp.id;
    delete from public.clubs cl
    where cl.id = any(coalesce(ids, '{}'))
      and not exists (select 1 from public.manager_job_offers o where o.offering_club_id = cl.id)
      and not exists (select 1 from public.standings s where s.club_id = cl.id)
      and not exists (select 1 from public.fixtures f where f.home_team_id = cl.id or f.away_team_id = cl.id);
  end loop;
end $$;
