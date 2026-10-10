-- Liga de amigos: salas con código (hasta 10 DT) donde cada uno juega su carrera y se comparan puntos y travesuras.
-- Cada cuenta es un mundo aislado: la sala solo comparte nombre del club, puntos de la liga y el muro. Todo se escribe por funciones del servidor.

create table if not exists public.friend_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create table if not exists public.friend_members (
  room_id uuid not null references public.friend_rooms(id) on delete cascade,
  user_id uuid not null,
  club_id uuid not null,
  bonus integer not null default 0, -- puntos que suman o restan las travesuras
  spent integer not null default 0, -- mangos gastados
  mote text,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create table if not exists public.friend_wall (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.friend_rooms(id) on delete cascade,
  actor uuid,
  kind text not null default 'NEWS',
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_friend_wall_room on public.friend_wall (room_id, created_at desc);
create index if not exists idx_friend_members_user on public.friend_members (user_id);

alter table public.friend_rooms enable row level security;
alter table public.friend_members enable row level security;
alter table public.friend_wall enable row level security;

-- ¿El usuario que consulta está en la sala? (security definer: evita que la política se llame a sí misma)
create or replace function public.friend_is_member(p_room_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.friend_members where room_id = p_room_id and user_id = (select auth.uid()))
$$;

drop policy if exists friend_rooms_select on public.friend_rooms;
create policy friend_rooms_select on public.friend_rooms for select to authenticated using (public.friend_is_member(id));
drop policy if exists friend_members_select on public.friend_members;
create policy friend_members_select on public.friend_members for select to authenticated using (public.friend_is_member(room_id));
drop policy if exists friend_wall_select on public.friend_wall;
create policy friend_wall_select on public.friend_wall for select to authenticated using (public.friend_is_member(room_id));

-- Mangos: 30 de arranque + 2 por partido jugado en la liga, menos lo gastado
create or replace function public.friend_mangos(p_played integer, p_spent integer)
returns integer language sql immutable as $$ select greatest(0, 30 + 2 * coalesce(p_played, 0) - coalesce(p_spent, 0)) $$;

create or replace function public.friend_post(p_room_id uuid, p_text text, p_kind text default 'NEWS', p_actor uuid default null)
returns void language sql security definer set search_path = public as $$
  insert into public.friend_wall (room_id, actor, kind, text) values (p_room_id, p_actor, p_kind, p_text)
$$;

create or replace function public.friend_create_room(p_name text, p_club_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); new_code text; rid uuid; cname text;
begin
  if uid is null then raise exception 'Tenés que iniciar sesión.'; end if;
  select name into cname from public.clubs where id = p_club_id and owner_user_id = uid;
  if cname is null then raise exception 'Ese club no es tuyo.'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Poné un nombre a la sala.'; end if;
  loop
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.friend_rooms where code = new_code);
  end loop;
  insert into public.friend_rooms (code, name, created_by) values (new_code, left(trim(p_name), 40), uid) returning id into rid;
  insert into public.friend_members (room_id, user_id, club_id) values (rid, uid, p_club_id);
  perform public.friend_post(rid, cname || ' abrió la sala. La AFA ya está mirando.', 'NEWS', uid);
  return jsonb_build_object('id', rid, 'code', new_code);
end $$;

create or replace function public.friend_join_room(p_code text, p_club_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); rid uuid; cname text; total integer;
begin
  if uid is null then raise exception 'Tenés que iniciar sesión.'; end if;
  select name into cname from public.clubs where id = p_club_id and owner_user_id = uid;
  if cname is null then raise exception 'Ese club no es tuyo.'; end if;
  select id into rid from public.friend_rooms where code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if rid is null then raise exception 'No existe ninguna sala con ese código.'; end if;
  if exists (select 1 from public.friend_members where room_id = rid and user_id = uid) then raise exception 'Ya estás en esa sala.'; end if;
  select count(*) into total from public.friend_members where room_id = rid;
  if total >= 10 then raise exception 'La sala está llena (máximo 10 DT).'; end if;
  insert into public.friend_members (room_id, user_id, club_id) values (rid, uid, p_club_id);
  perform public.friend_post(rid, cname || ' se sumó a la sala con un maletín sospechoso.', 'NEWS', uid);
  return jsonb_build_object('id', rid);
end $$;

create or replace function public.friend_leave_room(p_room_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  delete from public.friend_members where room_id = p_room_id and user_id = uid;
  if not exists (select 1 from public.friend_members where room_id = p_room_id) then
    delete from public.friend_rooms where id = p_room_id;
  end if;
end $$;

-- La tabla de la sala: puntos de la liga de cada club (en vivo) más lo que sumaron o restaron las travesuras
create or replace function public.friend_room_table(p_room_id uuid)
returns table (user_id uuid, is_me boolean, club_name text, mote text, league_points integer, bonus integer, points integer, played integer, mangos integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.friend_is_member(p_room_id) then raise exception 'No estás en esa sala.'; end if;
  return query
    select m.user_id, m.user_id = (select auth.uid()), c.name, m.mote,
      coalesce(s.points, 0)::integer, m.bonus, (coalesce(s.points, 0) + m.bonus)::integer, coalesce(s.played, 0)::integer,
      public.friend_mangos(s.played, m.spent)
    from public.friend_members m
    join public.clubs c on c.id = m.club_id
    left join lateral (
      select st.points, st.played from public.standings st
      join public.competitions co on co.id = st.competition_id
      where st.club_id = m.club_id order by co.season_year desc nulls last limit 1
    ) s on true
    where m.room_id = p_room_id
    order by (coalesce(s.points, 0) + m.bonus) desc, c.name;
end $$;

-- Travesuras: cuestan mangos, tienen azar y solo mueven puntos de la sala y el muro
create or replace function public.friend_prank(p_room_id uuid, p_kind text, p_target uuid default null, p_choice text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  me record; tgt record; leader uuid;
  cost integer; msg text; ok boolean := true; r double precision;
  motes text[] := array['El Cartonero','El Comprapibes','Don Sobre','El Hincha del Tapete','El Rey del Penal','El Árbitro de la Casa','El Manija','Mister Humo','El Pecho Frío','El Fantasma de la Fecha'];
  my_name text; tgt_name text;
begin
  if not public.friend_is_member(p_room_id) then raise exception 'No estás en esa sala.'; end if;
  cost := case p_kind when 'SOBRE' then 30 when 'ARBITRO' then 40 when 'MOTE' then 10 when 'DENUNCIA' then 25 else null end;
  if cost is null then raise exception 'Esa travesura no existe.'; end if;
  select * into me from public.friend_room_table(p_room_id) t where t.user_id = uid;
  if me.mangos < cost then raise exception 'Te faltan mangos: cuesta %.', cost; end if;
  if (select count(*) from public.friend_wall where room_id = p_room_id and actor = uid and kind = 'PRANK' and created_at >= date_trunc('day', now())) >= 3 then
    raise exception 'Hoy ya hiciste 3 travesuras: la AFA te está mirando.';
  end if;
  my_name := me.club_name;
  if p_kind in ('SOBRE', 'MOTE', 'DENUNCIA') then
    if p_target is null or p_target = uid then raise exception 'Elegí a un amigo.'; end if;
    select * into tgt from public.friend_room_table(p_room_id) t where t.user_id = p_target;
    if tgt.user_id is null then raise exception 'Ese amigo no está en la sala.'; end if;
    tgt_name := tgt.club_name;
  end if;

  if p_kind = 'SOBRE' then
    if random() < 0.7 then
      update public.friend_members set bonus = bonus - 3 where room_id = p_room_id and user_id = p_target;
      msg := my_name || ' le mandó un sobre a ' || tgt_name || ': pierde 3 puntos y nadie vio nada.';
    else
      ok := false;
      update public.friend_members set bonus = bonus - 5 where room_id = p_room_id and user_id = uid;
      msg := 'La AFA agarró a ' || my_name || ' mandando un sobre a ' || tgt_name || ': pierde 5 puntos.';
    end if;
  elsif p_kind = 'ARBITRO' then
    if random() < 0.5 then
      update public.friend_members set bonus = bonus + 6 where room_id = p_room_id and user_id = uid;
      msg := 'El árbitro amigo de ' || my_name || ' cumplió: suma 6 puntos.';
    else
      ok := false;
      update public.friend_members set bonus = bonus - 4 where room_id = p_room_id and user_id = uid;
      msg := 'El árbitro amigo de ' || my_name || ' se hizo el distraído: pierde 4 puntos.';
    end if;
  elsif p_kind = 'MOTE' then
    if p_choice is null or not (p_choice = any (motes)) then raise exception 'Elegí un mote de la lista.'; end if;
    update public.friend_members set mote = p_choice where room_id = p_room_id and user_id = p_target;
    msg := my_name || ' bautizó a ' || tgt_name || ' como "' || p_choice || '".';
  elsif p_kind = 'DENUNCIA' then
    select t.user_id into leader from public.friend_room_table(p_room_id) t order by t.points desc, t.club_name limit 1;
    if leader is distinct from p_target then raise exception 'Solo se denuncia al líder de la sala.'; end if;
    update public.friend_members set bonus = bonus - 2 where room_id = p_room_id and user_id = p_target;
    msg := my_name || ' denunció a ' || tgt_name || ' ante el Tribunal de Disciplina: le sacan 2 puntos.';
  end if;

  update public.friend_members set spent = spent + cost where room_id = p_room_id and user_id = uid;
  perform public.friend_post(p_room_id, msg, 'PRANK', uid);
  return jsonb_build_object('ok', ok, 'message', msg);
end $$;

revoke all on function public.friend_create_room(text, uuid), public.friend_join_room(text, uuid), public.friend_leave_room(uuid),
  public.friend_room_table(uuid), public.friend_prank(uuid, text, uuid, text), public.friend_post(uuid, text, text, uuid) from public, anon;
grant execute on function public.friend_create_room(text, uuid), public.friend_join_room(text, uuid), public.friend_leave_room(uuid),
  public.friend_room_table(uuid), public.friend_prank(uuid, text, uuid, text) to authenticated;
