-- Liga de la sala: el creador configura su propio torneo (equipos, fechas, bots, nivel de los bots y reglamento) entre los clubes de los amigos.
-- El servidor simula cada fecha con la fuerza real de cada plantel; cada cuenta sigue aislada (solo se lee nombre y fuerza del club).

alter table public.friend_rooms add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.friend_rooms add column if not exists rules jsonb;
alter table public.friend_rooms add column if not exists status text not null default 'LOBBY';
alter table public.friend_rooms add column if not exists current_round integer not null default 0;
alter table public.friend_rooms add column if not exists total_rounds integer not null default 0;

create table if not exists public.friend_league_teams (
  room_id uuid not null references public.friend_rooms(id) on delete cascade,
  slot integer not null,
  user_id uuid, -- null = bot
  club_id uuid,
  name text not null,
  strength double precision, -- solo los bots; los clubes de los DT usan la fuerza de su plantel al jugar
  primary key (room_id, slot)
);
create table if not exists public.friend_league_fixtures (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.friend_rooms(id) on delete cascade,
  round integer not null,
  home_slot integer not null,
  away_slot integer not null,
  home_goals integer,
  away_goals integer,
  unique (room_id, round, home_slot)
);
create index if not exists idx_friend_league_fixtures_room on public.friend_league_fixtures (room_id, round);
alter table public.friend_league_teams enable row level security;
alter table public.friend_league_fixtures enable row level security;
create policy friend_league_teams_select on public.friend_league_teams for select to authenticated using (public.friend_is_member(room_id));
create policy friend_league_fixtures_select on public.friend_league_fixtures for select to authenticated using (public.friend_is_member(room_id));

-- Puntos de un partido según el reglamento (misma cuenta que apply_league_match)
create or replace function public.friend_league_points(r jsonb, gf integer, ga integer, away boolean, round integer, total integer)
returns integer language plpgsql immutable as $$
declare pts integer; x2 integer; rr jsonb := coalesce(r, '{}'::jsonb);
begin
  if gf > ga then
    pts := case when away then coalesce((rr->>'awayWinPts')::int, (rr->>'winPts')::int, 3) else coalesce((rr->>'winPts')::int, 3) end;
    if gf - ga >= 3 then pts := pts + coalesce((rr->>'bigWinBonus')::int, 0); end if;
  elsif gf = ga then
    pts := case when gf = 0 then coalesce((rr->>'nilNilPts')::int, 1) else coalesce((rr->>'drawPts')::int, 1) end;
  else
    pts := 0;
  end if;
  if ga = 0 and gf >= ga and not (gf = 0 and coalesce((rr->>'nilNilPts')::int, 1) = 0) then pts := pts + coalesce((rr->>'cleanSheetBonus')::int, 0); end if;
  x2 := coalesce((rr->>'lastRoundsX2')::int, 0);
  if x2 > 0 and total > 0 and round > total - x2 then pts := pts * 2; end if;
  return pts;
end $$;

-- Ajustes del creador (solo en el lobby). Todo se sanea y se acota acá, no se confía en el navegador.
create or replace function public.friend_configure_room(p_room_id uuid, p_settings jsonb, p_rules jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); rm public.friend_rooms%rowtype; s jsonb := coalesce(p_settings, '{}'::jsonb); r jsonb := coalesce(p_rules, '{}'::jsonb);
  teams integer; legs integer; diff text; fill boolean; rid text; clean_rules jsonb;
  num integer;
begin
  select * into rm from public.friend_rooms where id = p_room_id;
  if not found or rm.created_by is distinct from uid then raise exception 'Solo quien armó la sala puede cambiar los ajustes.'; end if;
  if rm.status <> 'LOBBY' then raise exception 'La liga ya empezó: no se pueden cambiar los ajustes.'; end if;
  teams := case when (s->>'teams') ~ '^[0-9]{1,3}$' then least(20, greatest(4, (s->>'teams')::int)) else 10 end;
  legs := case when s->>'legs' = '1' then 1 else 2 end;
  diff := case when s->>'difficulty' in ('FLOJOS', 'PAREJOS', 'CRACKS') then s->>'difficulty' else 'PAREJOS' end;
  fill := coalesce(s->>'fillBots', 'true') <> 'false';
  rid := left(coalesce(s->>'rulesId', 'CLASICO'), 30);
  clean_rules := jsonb_build_object(
    'legs', 2, 'promoted', 2, 'relegated', 3,
    'winPts', case when (r->>'winPts') ~ '^[0-9]$' then least(5, greatest(1, (r->>'winPts')::int)) else 3 end,
    'drawPts', case when (r->>'drawPts') ~ '^[0-9]$' then least(3, (r->>'drawPts')::int) else 1 end,
    'awayWinPts', case when (r->>'awayWinPts') ~ '^[0-9]$' then least(6, greatest(1, (r->>'awayWinPts')::int)) else 3 end,
    'nilNilPts', case when (r->>'nilNilPts') ~ '^[0-9]$' then least(3, (r->>'nilNilPts')::int) else 1 end,
    'bigWinBonus', case when (r->>'bigWinBonus') ~ '^[0-9]$' then least(2, (r->>'bigWinBonus')::int) else 0 end,
    'cleanSheetBonus', case when (r->>'cleanSheetBonus') ~ '^[0-9]$' then least(2, (r->>'cleanSheetBonus')::int) else 0 end,
    'lastRoundsX2', case when (r->>'lastRoundsX2') ~ '^[0-9]$' then least(8, (r->>'lastRoundsX2')::int) else 0 end
  );
  update public.friend_rooms set rules = clean_rules,
    settings = jsonb_build_object('teams', teams, 'fillBots', fill, 'legs', legs, 'difficulty', diff, 'rulesId', rid)
  where id = p_room_id;
  return jsonb_build_object('teams', teams, 'fillBots', fill, 'legs', legs, 'difficulty', diff, 'rulesId', rid, 'rules', clean_rules);
end $$;

-- Empieza la liga: arma los equipos (DT + bots), el calendario (método del círculo) y pasa a PLAYING
create or replace function public.friend_start_league(p_room_id uuid, p_bot_names text[] default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); rm public.friend_rooms%rowtype;
  humans integer; n_teams integer; bots integer; legs integer; fill boolean; diff text;
  avg_s double precision; lo double precision; hi double precision;
  arr integer[]; m integer; fixed integer; ring integer[]; k integer; r integer; j integer; a integer; b integer; total integer;
begin
  select * into rm from public.friend_rooms where id = p_room_id;
  if not found or rm.created_by is distinct from uid then raise exception 'Solo quien armó la sala puede empezar la liga.'; end if;
  if rm.status <> 'LOBBY' then raise exception 'La liga ya empezó.'; end if;
  select count(*) into humans from public.friend_members where room_id = p_room_id;
  if humans < 2 then raise exception 'Hacen falta al menos 2 DT para empezar.'; end if;
  fill := coalesce(rm.settings->>'fillBots', 'true') <> 'false';
  legs := case when rm.settings->>'legs' = '1' then 1 else 2 end;
  diff := coalesce(rm.settings->>'difficulty', 'PAREJOS');
  n_teams := case when fill then greatest(coalesce((rm.settings->>'teams')::int, 10), humans) else humans end;
  bots := n_teams - humans;
  if coalesce(array_length(p_bot_names, 1), 0) < bots then raise exception 'Faltan nombres para los bots.'; end if;

  select coalesce(avg(public.club_strength(club_id)), 55) into avg_s from public.friend_members where room_id = p_room_id;
  lo := case diff when 'FLOJOS' then -8 when 'CRACKS' then 3 else -3 end;
  hi := case diff when 'FLOJOS' then -1 when 'CRACKS' then 10 else 3 end;

  insert into public.friend_league_teams (room_id, slot, user_id, club_id, name, strength)
  select p_room_id, row_number() over (order by m2.joined_at), m2.user_id, m2.club_id, c.name, null
  from public.friend_members m2 join public.clubs c on c.id = m2.club_id where m2.room_id = p_room_id;
  for j in 1..bots loop
    insert into public.friend_league_teams (room_id, slot, user_id, club_id, name, strength)
    values (p_room_id, humans + j, null, null, left(p_bot_names[j], 60), greatest(35, least(95, avg_s + lo + random() * (hi - lo))));
  end loop;

  -- Calendario: método del círculo; con equipos impares se agrega un descanso (0)
  arr := array(select generate_series(1, n_teams));
  if n_teams % 2 = 1 then arr := arr || 0; end if;
  m := array_length(arr, 1);
  fixed := arr[m];
  for r in 0..(m - 2) loop
    ring := array[]::integer[];
    for j in 1..(m - 1) loop ring := ring || arr[((j - 1 + r) % (m - 1)) + 1]; end loop;
    for k in 0..(m / 2 - 1) loop
      if k = 0 then a := fixed; b := ring[m - 1]; else a := ring[k]; b := ring[m - 1 - k]; end if;
      continue when a = 0 or b = 0;
      if (r + k) % 2 = 1 then j := a; a := b; b := j; end if;
      insert into public.friend_league_fixtures (room_id, round, home_slot, away_slot) values (p_room_id, r + 1, a, b);
      if legs = 2 then
        insert into public.friend_league_fixtures (room_id, round, home_slot, away_slot) values (p_room_id, r + 1 + (m - 1), b, a);
      end if;
    end loop;
  end loop;
  total := (m - 1) * legs;
  update public.friend_rooms set status = 'PLAYING', current_round = 0, total_rounds = total where id = p_room_id;
  perform public.friend_post(p_room_id, 'Arrancó la liga "' || rm.name || '": ' || n_teams || ' equipos y ' || total || ' fechas. Que la AFA reparta suerte.', 'NEWS', uid);
  return jsonb_build_object('teams', n_teams, 'rounds', total);
end $$;

-- Juega la próxima fecha con la fuerza real del plantel de cada club
create or replace function public.friend_play_round(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); rm public.friend_rooms%rowtype; nxt integer; f record; hs double precision; aws double precision; h integer; a integer;
  big_text text; big_margin integer := -1; champion text; hn text; an text;
begin
  select * into rm from public.friend_rooms where id = p_room_id for update;
  if not found or rm.created_by is distinct from uid then raise exception 'Solo quien armó la sala puede jugar la fecha.'; end if;
  if rm.status <> 'PLAYING' then raise exception 'La liga no está en juego.'; end if;
  nxt := rm.current_round + 1;
  for f in select * from public.friend_league_fixtures where room_id = p_room_id and round = nxt order by home_slot loop
    select coalesce(case when t.club_id is not null then public.club_strength(t.club_id) else t.strength end, 50), t.name into hs, hn from public.friend_league_teams t where t.room_id = p_room_id and t.slot = f.home_slot;
    select coalesce(case when t.club_id is not null then public.club_strength(t.club_id) else t.strength end, 50), t.name into aws, an from public.friend_league_teams t where t.room_id = p_room_id and t.slot = f.away_slot;
    select g.home_goals, g.away_goals into h, a from public.cup_goals(f.id, hs, aws) g;
    update public.friend_league_fixtures set home_goals = h, away_goals = a where id = f.id;
    if abs(h - a) > big_margin or (abs(h - a) = big_margin and h + a > 0) then
      big_margin := abs(h - a);
      big_text := hn || ' ' || h || ' - ' || a || ' ' || an;
    end if;
  end loop;
  update public.friend_rooms set current_round = nxt, status = case when nxt >= total_rounds then 'DONE' else 'PLAYING' end where id = p_room_id;
  perform public.friend_post(p_room_id, 'Fecha ' || nxt || ' de ' || rm.total_rounds || ' jugada. Resultado destacado: ' || coalesce(big_text, 'sin partidos') || '.', 'NEWS', uid);
  if nxt >= rm.total_rounds then
    select t.name into champion from public.friend_league_table(p_room_id) t order by t.points desc, t.gd desc, t.gf desc, t.name limit 1;
    perform public.friend_post(p_room_id, '¡' || champion || ' es el campeón de "' || rm.name || '"! Dicen que ganó en los escritorios.', 'NEWS', uid);
  end if;
  return jsonb_build_object('round', nxt, 'done', nxt >= rm.total_rounds, 'highlight', big_text);
end $$;

-- Tabla de la liga de la sala (con el bono de las travesuras de los DT)
create or replace function public.friend_league_table(p_room_id uuid)
returns table (slot integer, user_id uuid, name text, is_bot boolean, is_me boolean, played integer, won integer, drawn integer, lost integer, gf integer, ga integer, gd integer, league_points integer, bonus integer, points integer)
language sql stable security definer set search_path = public as $$
  with rm as (select rules, total_rounds from public.friend_rooms where id = p_room_id),
  sides as (
    select f.home_slot as s, f.home_goals as gfor, f.away_goals as gag, false as away, f.round as rnd from public.friend_league_fixtures f where f.room_id = p_room_id and f.home_goals is not null
    union all
    select f.away_slot, f.away_goals, f.home_goals, true, f.round from public.friend_league_fixtures f where f.room_id = p_room_id and f.home_goals is not null
  ),
  agg as (
    select s, count(*)::int pj, (count(*) filter (where gfor > gag))::int pg, (count(*) filter (where gfor = gag))::int pe, (count(*) filter (where gfor < gag))::int pp,
      sum(gfor)::int gfs, sum(gag)::int gas,
      sum(public.friend_league_points(rm.rules, gfor, gag, away, rnd, rm.total_rounds))::int pts
    from sides, rm group by s
  )
  select t.slot, t.user_id, t.name, t.user_id is null, t.user_id = (select auth.uid()),
    coalesce(a.pj, 0), coalesce(a.pg, 0), coalesce(a.pe, 0), coalesce(a.pp, 0), coalesce(a.gfs, 0), coalesce(a.gas, 0), coalesce(a.gfs, 0) - coalesce(a.gas, 0),
    coalesce(a.pts, 0), coalesce(mm.bonus, 0), coalesce(a.pts, 0) + coalesce(mm.bonus, 0)
  from public.friend_league_teams t
  left join agg a on a.s = t.slot
  left join public.friend_members mm on mm.room_id = t.room_id and mm.user_id = t.user_id
  where t.room_id = p_room_id and public.friend_is_member(p_room_id)
  order by coalesce(a.pts, 0) + coalesce(mm.bonus, 0) desc, coalesce(a.gfs, 0) - coalesce(a.gas, 0) desc, coalesce(a.gfs, 0) desc, t.name
$$;

-- Nadie entra a una sala cuando la liga ya empezó
create or replace function public.friend_join_room(p_code text, p_club_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); rid uuid; cname text; total integer; st text;
begin
  if uid is null then raise exception 'Tenés que iniciar sesión.'; end if;
  select name into cname from public.clubs where id = p_club_id and owner_user_id = uid;
  if cname is null then raise exception 'Ese club no es tuyo.'; end if;
  select id, status into rid, st from public.friend_rooms where code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if rid is null then raise exception 'No existe ninguna sala con ese código.'; end if;
  if st <> 'LOBBY' then raise exception 'La liga de esa sala ya empezó.'; end if;
  if exists (select 1 from public.friend_members where room_id = rid and user_id = uid) then raise exception 'Ya estás en esa sala.'; end if;
  select count(*) into total from public.friend_members where room_id = rid;
  if total >= 10 then raise exception 'La sala está llena (máximo 10 DT).'; end if;
  insert into public.friend_members (room_id, user_id, club_id) values (rid, uid, p_club_id);
  perform public.friend_post(rid, cname || ' se sumó a la sala con un maletín sospechoso.', 'NEWS', uid);
  return jsonb_build_object('id', rid);
end $$;

-- La tabla de los puntos de la sala: en el lobby, los de la liga de cada carrera; con la liga en juego, los de la liga de la sala
create or replace function public.friend_room_table(p_room_id uuid)
returns table (user_id uuid, is_me boolean, club_name text, mote text, league_points integer, bonus integer, points integer, played integer, mangos integer)
language plpgsql stable security definer set search_path = public as $$
declare st text;
begin
  if not public.friend_is_member(p_room_id) then raise exception 'No estás en esa sala.'; end if;
  select r.status into st from public.friend_rooms r where r.id = p_room_id;
  return query
    select m.user_id, m.user_id = (select auth.uid()), c.name, m.mote,
      (case when st = 'LOBBY' then coalesce(s.points, 0) else coalesce(lt.league_points, 0) end)::integer, m.bonus,
      ((case when st = 'LOBBY' then coalesce(s.points, 0) else coalesce(lt.league_points, 0) end) + m.bonus)::integer, coalesce(s.played, 0)::integer,
      public.friend_mangos(s.played, m.spent)
    from public.friend_members m
    join public.clubs c on c.id = m.club_id
    left join lateral (
      select st2.points, st2.played from public.standings st2
      join public.competitions co on co.id = st2.competition_id
      where st2.club_id = m.club_id order by co.season_year desc nulls last limit 1
    ) s on true
    left join public.friend_league_table(p_room_id) lt on lt.user_id = m.user_id
    where m.room_id = p_room_id
    order by ((case when st = 'LOBBY' then coalesce(s.points, 0) else coalesce(lt.league_points, 0) end) + m.bonus) desc, c.name;
end $$;

revoke all on function public.friend_configure_room(uuid, jsonb, jsonb), public.friend_start_league(uuid, text[]), public.friend_play_round(uuid), public.friend_league_table(uuid) from public, anon;
grant execute on function public.friend_configure_room(uuid, jsonb, jsonb), public.friend_start_league(uuid, text[]), public.friend_play_round(uuid), public.friend_league_table(uuid) to authenticated;
