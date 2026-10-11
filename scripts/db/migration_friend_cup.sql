-- Copa Mundial de la sala: 8 o 16 selecciones en grupos de 4 (todos contra todos, tres fechas) y llaves de eliminación directa.
-- Reutiliza las tablas de la liga de la sala (equipos y partidos). El servidor arma y juega todo con la fuerza real de cada club.
-- Los empates de las llaves se definen por penales, de forma determinista por partido.

alter table public.friend_league_teams add column if not exists group_no integer;
alter table public.friend_league_fixtures add column if not exists stage text not null default 'LIGA';
alter table public.friend_league_fixtures add column if not exists group_no integer;
alter table public.friend_league_fixtures add column if not exists match_no integer;
alter table public.friend_league_fixtures add column if not exists winner_slot integer;
alter table public.friend_league_fixtures add column if not exists pens_home integer;
alter table public.friend_league_fixtures add column if not exists pens_away integer;

-- Ajustes del creador: ahora también el formato (LIGA o COPA). La copa se acota a 8 o 16 equipos, siempre con bots y solo ida.
create or replace function public.friend_configure_room(p_room_id uuid, p_settings jsonb, p_rules jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); rm public.friend_rooms%rowtype; s jsonb := coalesce(p_settings, '{}'::jsonb); r jsonb := coalesce(p_rules, '{}'::jsonb);
  teams integer; legs integer; diff text; fill boolean; rid text; fmt text; clean_rules jsonb;
begin
  select * into rm from public.friend_rooms where id = p_room_id;
  if not found or rm.created_by is distinct from uid then raise exception 'Solo quien armó la sala puede cambiar los ajustes.'; end if;
  if rm.status <> 'LOBBY' then raise exception 'La liga ya empezó: no se pueden cambiar los ajustes.'; end if;
  fmt := case when s->>'format' = 'COPA' then 'COPA' else 'LIGA' end;
  diff := case when s->>'difficulty' in ('FLOJOS', 'PAREJOS', 'CRACKS') then s->>'difficulty' else 'PAREJOS' end;
  if fmt = 'COPA' then
    teams := case when (s->>'teams') ~ '^[0-9]{1,3}$' and (s->>'teams')::int <= 8 then 8 else 16 end;
    legs := 1; fill := true; rid := 'CLASICO';
  else
    teams := case when (s->>'teams') ~ '^[0-9]{1,3}$' then least(20, greatest(4, (s->>'teams')::int)) else 10 end;
    legs := case when s->>'legs' = '1' then 1 else 2 end;
    fill := coalesce(s->>'fillBots', 'true') <> 'false';
    rid := left(coalesce(s->>'rulesId', 'CLASICO'), 30);
  end if;
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
  if fmt = 'COPA' then clean_rules := jsonb_build_object('legs', 2, 'promoted', 2, 'relegated', 3, 'winPts', 3, 'drawPts', 1, 'awayWinPts', 3, 'nilNilPts', 1, 'bigWinBonus', 0, 'cleanSheetBonus', 0, 'lastRoundsX2', 0); end if;
  update public.friend_rooms set rules = clean_rules,
    settings = jsonb_build_object('format', fmt, 'teams', teams, 'fillBots', fill, 'legs', legs, 'difficulty', diff, 'rulesId', rid)
  where id = p_room_id;
  return jsonb_build_object('format', fmt, 'teams', teams, 'fillBots', fill, 'legs', legs, 'difficulty', diff, 'rulesId', rid, 'rules', clean_rules);
end $$;

-- Tabla de cada grupo de la copa (solo fase de grupos): 3 puntos por victoria, 1 por empate
create or replace function public.friend_cup_group_table(p_room_id uuid)
returns table (group_no integer, slot integer, user_id uuid, name text, is_bot boolean, is_me boolean, played integer, won integer, drawn integer, lost integer, gf integer, ga integer, gd integer, points integer, pos integer)
language sql stable security definer set search_path = public as $$
  with sides as (
    select f.home_slot as s, f.home_goals as gfor, f.away_goals as gag from public.friend_league_fixtures f where f.room_id = p_room_id and f.stage = 'GRUPO' and f.home_goals is not null
    union all
    select f.away_slot, f.away_goals, f.home_goals from public.friend_league_fixtures f where f.room_id = p_room_id and f.stage = 'GRUPO' and f.home_goals is not null
  ),
  agg as (
    select s, count(*)::int pj, (count(*) filter (where gfor > gag))::int pg, (count(*) filter (where gfor = gag))::int pe, (count(*) filter (where gfor < gag))::int pp,
      sum(gfor)::int gfs, sum(gag)::int gas
    from sides group by s
  ),
  rows as (
    select t.group_no g, t.slot, t.user_id, t.name, coalesce(a.pj, 0) pj, coalesce(a.pg, 0) pg, coalesce(a.pe, 0) pe, coalesce(a.pp, 0) pp,
      coalesce(a.gfs, 0) gfs, coalesce(a.gas, 0) gas, coalesce(a.pg, 0) * 3 + coalesce(a.pe, 0) pts
    from public.friend_league_teams t left join agg a on a.s = t.slot
    where t.room_id = p_room_id and t.group_no is not null and public.friend_is_member(p_room_id)
  )
  select g, slot, user_id, name, user_id is null, user_id = (select auth.uid()), pj, pg, pe, pp, gfs, gas, gfs - gas, pts,
    (row_number() over (partition by g order by pts desc, gfs - gas desc, gfs desc, name))::int
  from rows
  order by g, 15
$$;

-- Empieza la copa: arma los grupos (los DT repartidos) y los partidos de la fase de grupos
create or replace function public.friend_start_cup(p_room_id uuid, p_bot_names text[] default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); rm public.friend_rooms%rowtype;
  humans integer; n_teams integer; bots integer; groups integer; diff text;
  avg_s double precision; lo double precision; hi double precision;
  g integer; j integer; arr integer[]; total integer;
begin
  select * into rm from public.friend_rooms where id = p_room_id;
  if not found or rm.created_by is distinct from uid then raise exception 'Solo quien armó la sala puede empezar la copa.'; end if;
  if rm.status <> 'LOBBY' then raise exception 'La copa ya empezó.'; end if;
  if rm.settings->>'format' is distinct from 'COPA' then raise exception 'La sala no está configurada como Copa Mundial.'; end if;
  select count(*) into humans from public.friend_members where room_id = p_room_id;
  if humans < 2 then raise exception 'Hacen falta al menos 2 DT para empezar.'; end if;
  n_teams := case when coalesce((rm.settings->>'teams')::int, 16) <= 8 and humans <= 8 then 8 else 16 end;
  groups := n_teams / 4;
  bots := n_teams - humans;
  if coalesce(array_length(p_bot_names, 1), 0) < bots then raise exception 'Faltan nombres para las selecciones.'; end if;
  diff := coalesce(rm.settings->>'difficulty', 'PAREJOS');
  select coalesce(avg(public.club_strength(club_id)), 55) into avg_s from public.friend_members where room_id = p_room_id;
  lo := case diff when 'FLOJOS' then -8 when 'CRACKS' then 3 else -3 end;
  hi := case diff when 'FLOJOS' then -1 when 'CRACKS' then 10 else 3 end;

  insert into public.friend_league_teams (room_id, slot, user_id, club_id, name, strength, group_no)
  select p_room_id, (row_number() over (order by m2.joined_at))::int, m2.user_id, m2.club_id, c.name, null,
    (((row_number() over (order by m2.joined_at))::int - 1) % groups) + 1
  from public.friend_members m2 join public.clubs c on c.id = m2.club_id where m2.room_id = p_room_id;
  for j in 1..bots loop
    insert into public.friend_league_teams (room_id, slot, user_id, club_id, name, strength, group_no)
    values (p_room_id, humans + j, null, null, left(p_bot_names[j], 60), greatest(35, least(95, avg_s + lo + random() * (hi - lo))), ((humans + j - 1) % groups) + 1);
  end loop;

  -- Cada grupo de cuatro: 1v4 y 2v3, después 4v3 y 1v2, y 2v4 y 3v1
  for g in 1..groups loop
    arr := array(select t.slot from public.friend_league_teams t where t.room_id = p_room_id and t.group_no = g order by t.slot);
    insert into public.friend_league_fixtures (room_id, round, home_slot, away_slot, stage, group_no) values
      (p_room_id, 1, arr[1], arr[4], 'GRUPO', g), (p_room_id, 1, arr[2], arr[3], 'GRUPO', g),
      (p_room_id, 2, arr[4], arr[3], 'GRUPO', g), (p_room_id, 2, arr[1], arr[2], 'GRUPO', g),
      (p_room_id, 3, arr[2], arr[4], 'GRUPO', g), (p_room_id, 3, arr[3], arr[1], 'GRUPO', g);
  end loop;
  total := 3 + case n_teams when 8 then 2 else 3 end;
  update public.friend_rooms set status = 'PLAYING', current_round = 0, total_rounds = total where id = p_room_id;
  perform public.friend_post(p_room_id, 'Arrancó la Copa Mundial "' || rm.name || '": ' || n_teams || ' selecciones, ' || groups || ' grupos. El sorteo estuvo limpio (dicen).', 'NEWS', uid);
  return jsonb_build_object('teams', n_teams, 'groups', groups, 'rounds', total);
end $$;

-- Juega la próxima fecha de la copa; al terminar los grupos arma los cruces y al terminar cada llave arma la siguiente
create or replace function public.friend_play_cup_round(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); rm public.friend_rooms%rowtype; nxt integer; f record; hs double precision; aws double precision; h integer; a integer;
  hn text; an text; big_text text; big_margin integer := -1; champion text; label text;
  pw double precision; ph integer; pa integer; win integer; groups integer; g integer; k integer; mn integer; wins integer[];
begin
  select * into rm from public.friend_rooms where id = p_room_id for update;
  if not found or rm.created_by is distinct from uid then raise exception 'Solo quien armó la sala puede jugar la fecha.'; end if;
  if rm.status <> 'PLAYING' then raise exception 'La copa no está en juego.'; end if;
  if rm.settings->>'format' is distinct from 'COPA' then raise exception 'La sala no es una Copa Mundial.'; end if;
  nxt := rm.current_round + 1;
  for f in select * from public.friend_league_fixtures where room_id = p_room_id and round = nxt order by coalesce(match_no, 0), group_no, home_slot loop
    select coalesce(case when t.club_id is not null then public.club_strength(t.club_id) else t.strength end, 50), t.name into hs, hn from public.friend_league_teams t where t.room_id = p_room_id and t.slot = f.home_slot;
    select coalesce(case when t.club_id is not null then public.club_strength(t.club_id) else t.strength end, 50), t.name into aws, an from public.friend_league_teams t where t.room_id = p_room_id and t.slot = f.away_slot;
    select g2.home_goals, g2.away_goals into h, a from public.cup_goals(f.id, hs, aws) g2;
    ph := null; pa := null; win := null;
    if f.stage = 'LLAVE' then
      if h > a then win := f.home_slot;
      elsif a > h then win := f.away_slot;
      else
        pw := least(0.7, greatest(0.3, 0.5 + (hs - aws) * 0.01));
        if (abs(hashtext(f.id::text || ':pens')) % 1000) / 1000.0 < pw then win := f.home_slot; else win := f.away_slot; end if;
        k := 4 + (abs(hashtext(f.id::text || ':a')) % 2);
        mn := k - 1 - (abs(hashtext(f.id::text || ':b')) % 2);
        if win = f.home_slot then ph := k; pa := mn; else ph := mn; pa := k; end if;
      end if;
    end if;
    update public.friend_league_fixtures set home_goals = h, away_goals = a, winner_slot = win, pens_home = ph, pens_away = pa where id = f.id;
    if abs(h - a) > big_margin or (abs(h - a) = big_margin and h + a > 0) then
      big_margin := abs(h - a);
      big_text := hn || ' ' || h || ' - ' || a || ' ' || an || case when ph is not null then ' (penales ' || ph || '-' || pa || ')' else '' end;
    end if;
  end loop;

  groups := (select max(group_no) from public.friend_league_teams where room_id = p_room_id);
  if nxt = 3 then
    -- Terminaron los grupos: el primero de un grupo contra el segundo del vecino
    mn := 0;
    for g in 1..groups by 2 loop
      mn := mn + 1;
      insert into public.friend_league_fixtures (room_id, round, home_slot, away_slot, stage, match_no)
      select p_room_id, 4, (select slot from public.friend_cup_group_table(p_room_id) where group_no = g and pos = 1), (select slot from public.friend_cup_group_table(p_room_id) where group_no = g + 1 and pos = 2), 'LLAVE', mn;
    end loop;
    for g in 1..groups by 2 loop
      mn := mn + 1;
      insert into public.friend_league_fixtures (room_id, round, home_slot, away_slot, stage, match_no)
      select p_room_id, 4, (select slot from public.friend_cup_group_table(p_room_id) where group_no = g + 1 and pos = 1), (select slot from public.friend_cup_group_table(p_room_id) where group_no = g and pos = 2), 'LLAVE', mn;
    end loop;
  elsif nxt > 3 and nxt < rm.total_rounds then
    -- El ganador del partido 1 juega contra el del 2, el del 3 contra el del 4, etc.
    wins := array(select winner_slot from public.friend_league_fixtures where room_id = p_room_id and round = nxt order by match_no);
    for k in 1..(array_length(wins, 1) / 2) loop
      insert into public.friend_league_fixtures (room_id, round, home_slot, away_slot, stage, match_no) values (p_room_id, nxt + 1, wins[2 * k - 1], wins[2 * k], 'LLAVE', k);
    end loop;
  end if;

  update public.friend_rooms set current_round = nxt, status = case when nxt >= total_rounds then 'DONE' else 'PLAYING' end where id = p_room_id;
  label := case when nxt <= 3 then 'Fecha ' || nxt || ' de grupos' when nxt = rm.total_rounds then 'La final' else 'Se jugó la ronda de llaves' end;
  perform public.friend_post(p_room_id, label || ' de "' || rm.name || '". Resultado destacado: ' || coalesce(big_text, 'sin partidos') || '.', 'NEWS', uid);
  if nxt >= rm.total_rounds then
    select t.name into champion from public.friend_league_fixtures x join public.friend_league_teams t on t.room_id = x.room_id and t.slot = x.winner_slot where x.room_id = p_room_id and x.round = nxt limit 1;
    perform public.friend_post(p_room_id, '¡' || champion || ' es campeón del mundo en "' || rm.name || '"! La AFA ya pidió revisar el VAR.', 'NEWS', uid);
  end if;
  return jsonb_build_object('round', nxt, 'done', nxt >= rm.total_rounds, 'highlight', big_text);
end $$;

revoke all on function public.friend_configure_room(uuid, jsonb, jsonb), public.friend_cup_group_table(uuid), public.friend_start_cup(uuid, text[]), public.friend_play_cup_round(uuid) from public, anon;
grant execute on function public.friend_configure_room(uuid, jsonb, jsonb), public.friend_cup_group_table(uuid), public.friend_start_cup(uuid, text[]), public.friend_play_cup_round(uuid) to authenticated;
