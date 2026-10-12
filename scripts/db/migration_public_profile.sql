-- Perfil público del DT (aditivo): una dirección propia (/dt/<slug>) para quien aceptó aparecer en la tabla pública.
-- Solo se publica lo mismo que la tabla (nombre del DT, puntos, títulos, victorias, puesto) y los colores de su camiseta; nunca correo, club ni ids.
alter table public.managers add column if not exists public_slug text;
create unique index if not exists managers_public_slug_key on public.managers (public_slug) where public_slug is not null;

-- Genera (una sola vez) y devuelve la dirección del perfil del DT de la persona que está conectada; solo si aceptó aparecer.
create or replace function public.claim_public_slug()
returns text
language plpgsql security definer set search_path = public as $$
declare
  m record;
  base text;
  cand text;
  tries integer := 0;
begin
  select id, public_slug, public_ranking, first_name, last_name into m
  from public.managers where user_id = auth.uid() and coalesce(is_retired, false) = false
  order by created_at desc limit 1;
  if m.id is null or not m.public_ranking then return null; end if;
  if m.public_slug is not null then return m.public_slug; end if;
  base := regexp_replace(lower(translate(trim(coalesce(m.first_name, '') || ' ' || coalesce(m.last_name, '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')), '[^a-z0-9]+', '-', 'g');
  base := left(trim(both '-' from base), 30);
  if base = '' then base := 'dt'; end if;
  loop
    cand := base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 4);
    begin
      update public.managers set public_slug = cand where id = m.id;
      return cand;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 5 then raise; end if;
    end;
  end loop;
end
$$;

revoke all on function public.claim_public_slug() from public, anon;
grant execute on function public.claim_public_slug() to authenticated;

-- Perfil público por dirección: solo si la persona aceptó (public_ranking). El puesto aparece desde los 10 partidos, igual que la tabla.
create or replace function public.public_manager_profile(p_slug text)
returns table (manager_name text, points integer, titles_national integer, titles_continental integer, matches_played integer, matches_won integer, rank bigint, primary_color text, secondary_color text, jersey_pattern text)
language sql stable security definer set search_path = public as $$
  with base as (
    select m.id, m.public_slug, left(trim(m.first_name || ' ' || m.last_name), 40) as nm, coalesce(m.reputation, 0) as rep,
      c.primary_color, c.secondary_color, c.jersey_pattern,
      (select count(*) from public.match_history h where h.club_id = c.id) as played,
      (select count(*) from public.match_history h where h.club_id = c.id
         and ((h.is_home and h.home_score > h.away_score) or (not h.is_home and h.away_score > h.home_score))) as won,
      (select count(*) from public.manager_achievements a where a.manager_id = m.id and a.achievement_type = 'league_champion') as nat,
      (select count(*) from public.manager_achievements a where a.manager_id = m.id and a.achievement_type = 'continental_champion') as intl
    from public.managers m
    join public.clubs c on c.manager_id = m.id
    where m.public_ranking
      and coalesce(trim(m.first_name || ' ' || m.last_name), '') <> ''
  ), scored as (
    select *, greatest(0, round(nat * 400 + intl * 800 + won * 15 + (case when played > 0 then round(won::numeric / played * 100, 1) else 0 end) * 20 + rep * 10))::integer as pts
    from base
  )
  select s.nm, s.pts, s.nat::integer, s.intl::integer, s.played::integer, s.won::integer,
    case when s.played >= 10
      then 1 + (select count(*) from scored o where o.played >= 10 and o.pts > s.pts) + (select count(*) from public.legend_managers l where l.titles * 600 > s.pts)
    end::bigint,
    s.primary_color, s.secondary_color, s.jersey_pattern
  from scored s
  where p_slug is not null and s.public_slug = lower(trim(p_slug))
  limit 1
$$;

revoke all on function public.public_manager_profile(text) from public;
grant execute on function public.public_manager_profile(text) to anon, authenticated;

-- La tabla de los mejores DT, ahora con la dirección del perfil de cada DT (nula en las leyendas).
create or replace function public.public_top_managers_v3(p_limit integer default 3)
returns table (rank bigint, manager_name text, points integer, titles integer, matches_won integer, is_legend boolean, public_slug text)
language sql stable security definer set search_path = public as $$
  with base as (
    select m.id, m.public_slug as slug, left(trim(m.first_name || ' ' || m.last_name), 40) as nm, coalesce(m.reputation, 0) as rep,
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
    select nm, slug, won::integer as won, (nat + intl)::integer as titles,
      greatest(0, round(nat * 400 + intl * 800 + won * 15 + (case when played > 0 then round(won::numeric / played * 100, 1) else 0 end) * 20 + rep * 10))::integer as pts
    from base where played >= 10
    order by 4 desc, nm
    limit least(greatest(coalesce(p_limit, 3), 1), 10)
  ), legends as (
    select l.manager_name as nm, null::text as slug, 0 as won, l.titles, l.titles * 600 as pts
    from public.legend_managers l
  ), everyone as (
    select nm, slug, pts, titles, won, false as lg from humans
    union all
    select nm, slug, pts, titles, won, true from legends
  )
  select (rank() over (order by pts desc))::bigint, nm, pts, titles, won, lg, slug
  from everyone
  order by pts desc, nm
$$;

revoke all on function public.public_top_managers_v3(integer) from public;
grant execute on function public.public_top_managers_v3(integer) to anon, authenticated;
