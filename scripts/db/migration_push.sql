-- Notificaciones push: suscripciones de cada dispositivo, preferencias por tipo de aviso, bandeja de lo ya enviado (para no repetir)
-- y la función que decide qué avisar ahora. Las claves VAPID y la clave interna del cron las genera y guarda el propio sistema
-- (tabla `push_config`, sin ninguna política: solo la lee la Edge Function `push-dispatch` con permisos de servicio).

create extension if not exists pg_net;
create extension if not exists pg_cron;

create table if not exists public.push_config (
  id integer primary key default 1 check (id = 1),
  internal_key text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  vapid_public text,
  vapid_private text,
  created_at timestamptz not null default now()
);
alter table public.push_config enable row level security;
insert into public.push_config (id) values (1) on conflict (id) do nothing;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_ok_at timestamptz
);
create index if not exists idx_push_subscriptions_user on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
create policy push_subscriptions_select on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy push_subscriptions_delete on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));

create table if not exists public.push_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  friends boolean not null default true,
  club boolean not null default true,
  news boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.push_prefs enable row level security;
create policy push_prefs_select on public.push_prefs for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.push_outbox (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  dedupe_key text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
alter table public.push_outbox enable row level security;

create table if not exists public.push_news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 50),
  body text not null check (char_length(body) <= 120),
  url text not null default '/dashboard' check (url like '/%'),
  created_at timestamptz not null default now()
);
alter table public.push_news enable row level security;

-- Clave pública para suscribirse (es pública por diseño); null hasta que la Edge Function genere el par
create or replace function public.push_public_key()
returns text language sql stable security definer set search_path = public as $$
  select vapid_public from public.push_config where id = 1
$$;

-- Guarda (o actualiza) la suscripción de este dispositivo para la persona que llama y le deja las preferencias por defecto
create or replace function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Tenés que iniciar sesión.'; end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or char_length(p_endpoint) > 1000 then raise exception 'Suscripción inválida.'; end if;
  if coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then raise exception 'Suscripción inválida.'; end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (uid, p_endpoint, p_p256dh, p_auth, left(p_user_agent, 200))
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent;
  insert into public.push_prefs (user_id) values (uid) on conflict (user_id) do nothing;
end $$;

create or replace function public.push_unsubscribe(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid()
$$;

create or replace function public.push_set_prefs(p_friends boolean, p_club boolean, p_news boolean)
returns void language sql security definer set search_path = public as $$
  insert into public.push_prefs (user_id, friends, club, news, updated_at) values (auth.uid(), coalesce(p_friends, true), coalesce(p_club, true), coalesce(p_news, true), now())
  on conflict (user_id) do update set friends = excluded.friends, club = excluded.club, news = excluded.news, updated_at = now()
$$;

-- Qué avisar ahora. Solo la usa la Edge Function (permisos de servicio). Cada aviso se "reclama" en la bandeja al calcularlo:
-- dos corridas a la vez no mandan lo mismo dos veces. De noche (hora de Argentina) no se manda nada: queda para la mañana.
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

revoke all on function public.push_public_key(), public.push_subscribe(text, text, text, text), public.push_unsubscribe(text), public.push_set_prefs(boolean, boolean, boolean), public.push_due() from public, anon;
grant execute on function public.push_public_key(), public.push_subscribe(text, text, text, text), public.push_unsubscribe(text), public.push_set_prefs(boolean, boolean, boolean) to authenticated;
-- push_due: solo permisos de servicio (la Edge Function)
grant execute on function public.push_due() to service_role;

-- Cada 15 minutos el cron llama a la Edge Function `push-dispatch` con la clave interna (leída de `push_config` dentro de la base; no sale de ahí)
select cron.schedule(
  'push-dispatch',
  '*/15 * * * *',
  $$ select net.http_post(
    url := 'https://qozozdaavjfxvssvxqbx.supabase.co/functions/v1/push-dispatch',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-key', (select internal_key from public.push_config where id = 1)),
    body := '{"action":"dispatch"}'::jsonb
  ) $$
);
