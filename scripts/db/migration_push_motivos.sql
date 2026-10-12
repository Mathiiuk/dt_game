-- Avisos push con motivo (aditivo): amplía `push_due` con dos avisos del club, calculados con el estado real de la partida.
--   injury        un titular lesionado 7 días o más (aviso solo si hace más de un día que no entrás)
--   contract_end  contratos que vencen en los próximos 90 días del juego
-- Se respetan las preferencias ("club"), el horario de 9 a 22 (Buenos Aires) y el reclamo en `push_outbox` para no repetir.
-- ORDEN: primero se despliega la Edge Function `push-dispatch` con los textos nuevos y recién después se aplica este archivo
-- (si no, el aviso se reclamaría y la función no sabría escribirlo).
create or replace function public.push_due()
returns table (user_id uuid, kind text, dedupe_key text, data jsonb)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare local_hour integer := extract(hour from (now() at time zone 'America/Argentina/Buenos_Aires'))::integer;
begin
  if local_hour < 9 or local_hour >= 22 then return; end if;
  return query
  with cand as (
    -- Sala de amigos: se jugó una fecha (y toca elegir la próxima, o terminó)
    select m.user_id as uid, 'friends'::text as pref, 'round_played'::text as k, ('played:' || r.id || ':' || r.current_round)::text as dk,
      jsonb_build_object('room', r.name, 'room_id', r.id, 'round', r.current_round + 1, 'done', r.status = 'DONE') as d
    from public.friend_rooms r join public.friend_members m on m.room_id = r.id
    where r.current_round > 0 and r.status in ('PLAYING', 'DONE')
    union all
    -- Sala de amigos: falta tu planteo y la fecha cierra en menos de 2 horas
    select m.user_id, 'friends', 'plan_missing', 'plan:' || r.id || ':' || (r.current_round + 1),
      jsonb_build_object('room', r.name, 'room_id', r.id, 'round', r.current_round + 1, 'hours', ceil(extract(epoch from (r.round_deadline - now())) / 3600))
    from public.friend_rooms r join public.friend_members m on m.room_id = r.id
    where r.status = 'PLAYING' and r.round_deadline between now() and now() + interval '2 hours'
      and not exists (select 1 from public.friend_round_plans p where p.room_id = r.id and p.round = r.current_round + 1 and p.user_id = m.user_id)
    union all
    -- Tu club te espera: entre 3 y 30 días sin entrar, a lo sumo un aviso cada 3 días
    select a.user_id, 'club', 'club_idle', 'idle:' || floor(extract(epoch from now()) / (3 * 86400))::bigint, jsonb_build_object('seed', floor(extract(epoch from now()) / 86400)::int)
    from (
      select c.user_id, greatest(max(c.last_accessed_at), max(c.created_at)) as last_seen from public.careers c group by c.user_id
    ) a
    where a.last_seen < now() - interval '3 days' and a.last_seen > now() - interval '30 days'
    union all
    -- Se lesionó alguien de tu plantel (7 días o más) y hace más de un día que no entrás; a lo sumo uno por semana y club
    select i.uid, 'club', 'injury', 'injury:' || i.club_id || ':' || floor(extract(epoch from now()) / (7 * 86400))::bigint,
      jsonb_build_object('player', i.pname, 'days', i.days, 'count', i.n)
    from (
      select distinct on (c.id) c.owner_user_id as uid, c.id as club_id, p.first_name || ' ' || p.last_name as pname, p.injury_days as days,
        count(*) over (partition by c.id) as n
      from public.clubs c join public.players p on p.club_id = c.id
      where c.is_user_club and c.owner_user_id is not null and p.is_injured and coalesce(p.injury_days, 0) >= 7
        and not coalesce(p.is_retired, false) and p.loan_from_club_id is null
      order by c.id, p.attr_overall desc nulls last
    ) i
    join (select c2.user_id, greatest(max(c2.last_accessed_at), max(c2.created_at)) as last_seen from public.careers c2 group by c2.user_id) a on a.user_id = i.uid
    where a.last_seen < now() - interval '1 day' and a.last_seen > now() - interval '30 days'
    union all
    -- Contratos que vencen en los próximos 90 días del juego; a lo sumo uno cada 14 días por club
    select k.uid, 'club', 'contract_end', 'contract:' || k.club_id || ':' || floor(extract(epoch from now()) / (14 * 86400))::bigint,
      jsonb_build_object('player', k.pname, 'days', k.days, 'count', k.n)
    from (
      select distinct on (c.id) c.owner_user_id as uid, c.id as club_id, p.first_name || ' ' || p.last_name as pname,
        (p.contract_end - c.game_date::date) as days, count(*) over (partition by c.id) as n
      from public.clubs c join public.players p on p.club_id = c.id
      where c.is_user_club and c.owner_user_id is not null and c.game_date ~ '^\d{4}-\d{2}-\d{2}$'
        and not coalesce(p.is_retired, false) and p.loan_from_club_id is null
        and p.contract_end between c.game_date::date and c.game_date::date + 90
      order by c.id, p.contract_end
    ) k
    join (select c2.user_id, greatest(max(c2.last_accessed_at), max(c2.created_at)) as last_seen from public.careers c2 group by c2.user_id) a on a.user_id = k.uid
    where a.last_seen < now() - interval '1 day' and a.last_seen > now() - interval '30 days'
    union all
    -- Novedades: lo cargado en los últimos 3 días, a lo sumo una por semana por persona
    select s.user_id, 'news', 'news', 'news:' || n.id, jsonb_build_object('title', n.title, 'body', n.body, 'url', n.url)
    from public.push_news n cross join (select distinct ps.user_id from public.push_subscriptions ps) s
    where n.created_at > now() - interval '3 days'
      and not exists (select 1 from public.push_outbox o where o.user_id = s.user_id and o.kind = 'news' and o.sent_at > now() - interval '7 days')
  ),
  allowed as (
    select c.* from cand c
    join public.push_prefs pr on pr.user_id = c.uid
    where exists (select 1 from public.push_subscriptions s where s.user_id = c.uid)
      and case c.pref when 'friends' then pr.friends when 'club' then pr.club else pr.news end
  ),
  claimed as (
    insert into public.push_outbox as ob (user_id, kind, dedupe_key)
    select a.uid, a.k, a.dk from allowed a
    on conflict (user_id, dedupe_key) do nothing
    returning ob.user_id as cu, ob.kind as ck, ob.dedupe_key as cd
  )
  select cl.cu, cl.ck, cl.cd, a.d from claimed cl join allowed a on a.uid = cl.cu and a.dk = cl.cd;
end $$;

-- Endurecimiento: Supabase da EXECUTE a `authenticated` por defecto; push_due devuelve datos de otras personas y reclama avisos, así que queda solo para el servicio
revoke all on function public.push_due() from public, anon, authenticated;
grant execute on function public.push_due() to service_role;
