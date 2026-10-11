-- Fechas interactivas de la sala: cada fecha tiene un plazo; cada DT elige su planteo (PRESION, EQUILIBRADO o CONTRA) y una arenga,
-- y pronostica los partidos (prode). Cuando todos eligieron o vence el plazo, se juega la fecha con la fuerza real de cada plantel
-- más el efecto del planteo. Nada de esto toca el club, el plantel ni la caja de ninguna cuenta: solo puntos y mangos de la sala.

alter table public.friend_rooms add column if not exists round_deadline timestamptz;
alter table public.friend_members add column if not exists seen_round integer not null default 0;
alter table public.friend_members add column if not exists prode integer not null default 0;
alter table public.friend_league_fixtures add column if not exists minutes jsonb;
alter table public.friend_league_fixtures add column if not exists home_stance text;
alter table public.friend_league_fixtures add column if not exists away_stance text;

create table if not exists public.friend_round_plans (
  room_id uuid not null references public.friend_rooms(id) on delete cascade,
  round integer not null,
  user_id uuid not null,
  stance text not null check (stance in ('PRESION', 'EQUILIBRADO', 'CONTRA')),
  cheer text not null default 'GARRA' check (cheer in ('GARRA', 'CALMA', 'PICARDIA')),
  created_at timestamptz not null default now(),
  primary key (room_id, round, user_id)
);
create table if not exists public.friend_predictions (
  room_id uuid not null references public.friend_rooms(id) on delete cascade,
  round integer not null,
  user_id uuid not null,
  fixture_id uuid not null references public.friend_league_fixtures(id) on delete cascade,
  pick text not null check (pick in ('L', 'E', 'V')),
  hit boolean,
  primary key (room_id, round, user_id, fixture_id)
);
alter table public.friend_round_plans enable row level security;
alter table public.friend_predictions enable row level security;
-- Cada uno ve lo suyo; lo de los demás recién cuando la fecha ya se jugó
create policy friend_round_plans_select on public.friend_round_plans for select to authenticated
  using (public.friend_is_member(room_id) and (user_id = (select auth.uid()) or round <= (select r.current_round from public.friend_rooms r where r.id = room_id)));
create policy friend_predictions_select on public.friend_predictions for select to authenticated
  using (public.friend_is_member(room_id) and (user_id = (select auth.uid()) or round <= (select r.current_round from public.friend_rooms r where r.id = room_id)));

-- Presión le gana a Equilibrado, Equilibrado a Contra y Contra a Presión (+3 de fuerza al que acierta)
create or replace function public.friend_stance_beats(a text, b text)
returns boolean language sql immutable set search_path = public as $$
  select (a = 'PRESION' and b = 'EQUILIBRADO') or (a = 'EQUILIBRADO' and b = 'CONTRA') or (a = 'CONTRA' and b = 'PRESION')
$$;

-- Planteo de un equipo en una fecha: el elegido por su DT, o el de los bots (al azar pero siempre el mismo)
create or replace function public.friend_stance_of(p_room_id uuid, p_round integer, p_slot integer, p_fixture_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select p.stance from public.friend_round_plans p where p.room_id = p_room_id and p.round = p_round and p.user_id = t.user_id),
    case when t.user_id is null then (array['PRESION', 'EQUILIBRADO', 'CONTRA'])[1 + abs(hashtext(p_fixture_id::text || ':' || p_slot::text)) % 3] else 'EQUILIBRADO' end
  )
  from public.friend_league_teams t where t.room_id = p_room_id and t.slot = p_slot
$$;

create or replace function public.friend_goal_minutes(p_fixture_id uuid, p_home integer, p_away integer)
returns jsonb language sql immutable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('m', m, 's', s) order by m), '[]'::jsonb) from (
    select 1 + abs(hashtext(p_fixture_id::text || ':h' || g)) % 90 as m, 'H' as s from generate_series(1, greatest(p_home, 0)) g
    union all
    select 1 + abs(hashtext(p_fixture_id::text || ':a' || g)) % 90, 'A' from generate_series(1, greatest(p_away, 0)) g
  ) x
$$;

-- Plazo de la fecha: si falta, empieza a correr ahora
create or replace function public.friend_ensure_deadline(p_room_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.friend_rooms set round_deadline = now() + make_interval(hours => coalesce(nullif((settings->>'deadlineHours')::int, 0), 24))
  where id = p_room_id and status = 'PLAYING' and round_deadline is null
$$;

create or replace function public.friend_set_deadline(p_room_id uuid, p_hours integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.friend_rooms where id = p_room_id and created_by = auth.uid()) then raise exception 'Solo quien armó la sala puede cambiar el plazo.'; end if;
  if p_hours not in (12, 24, 48) then raise exception 'El plazo puede ser de 12, 24 o 48 horas.'; end if;
  update public.friend_rooms set settings = coalesce(settings, '{}'::jsonb) || jsonb_build_object('deadlineHours', p_hours) where id = p_room_id;
end $$;

-- ¿Se puede cerrar la fecha? Venció el plazo o todos los DT ya eligieron su planteo
create or replace function public.friend_round_ready(p_room_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select r.status = 'PLAYING' and (
    coalesce(r.round_deadline < now(), false)
    or not exists (
      select 1 from public.friend_members m
      where m.room_id = r.id and not exists (select 1 from public.friend_round_plans p where p.room_id = r.id and p.round = r.current_round + 1 and p.user_id = m.user_id)
    )
  )
  from public.friend_rooms r where r.id = p_room_id
$$;

create or replace function public.friend_set_plan(p_room_id uuid, p_stance text, p_cheer text default 'GARRA')
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); rm public.friend_rooms%rowtype;
begin
  select * into rm from public.friend_rooms where id = p_room_id;
  if not found or not public.friend_is_member(p_room_id) then raise exception 'No estás en esa sala.'; end if;
  if rm.status <> 'PLAYING' then raise exception 'La liga no está en juego.'; end if;
  if p_stance not in ('PRESION', 'EQUILIBRADO', 'CONTRA') then raise exception 'Planteo desconocido.'; end if;
  if p_cheer not in ('GARRA', 'CALMA', 'PICARDIA') then raise exception 'Arenga desconocida.'; end if;
  perform public.friend_ensure_deadline(p_room_id);
  select * into rm from public.friend_rooms where id = p_room_id;
  if rm.round_deadline < now() then raise exception 'El plazo de la fecha ya venció.'; end if;
  insert into public.friend_round_plans (room_id, round, user_id, stance, cheer) values (p_room_id, rm.current_round + 1, uid, p_stance, p_cheer)
  on conflict (room_id, round, user_id) do update set stance = excluded.stance, cheer = excluded.cheer, created_at = now();
  return jsonb_build_object('round', rm.current_round + 1, 'stance', p_stance, 'cheer', p_cheer);
end $$;

create or replace function public.friend_predict(p_room_id uuid, p_fixture_id uuid, p_pick text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); rm public.friend_rooms%rowtype; fx public.friend_league_fixtures%rowtype;
begin
  select * into rm from public.friend_rooms where id = p_room_id;
  if not found or not public.friend_is_member(p_room_id) then raise exception 'No estás en esa sala.'; end if;
  if rm.status <> 'PLAYING' then raise exception 'La liga no está en juego.'; end if;
  if p_pick not in ('L', 'E', 'V') then raise exception 'Pronóstico desconocido.'; end if;
  select * into fx from public.friend_league_fixtures where id = p_fixture_id and room_id = p_room_id;
  if not found or fx.round <> rm.current_round + 1 then raise exception 'Solo se pronostica la próxima fecha.'; end if;
  if fx.stage = 'LLAVE' and p_pick = 'E' then raise exception 'En las llaves siempre hay ganador: elegí local o visitante.'; end if;
  perform public.friend_ensure_deadline(p_room_id);
  if (select round_deadline from public.friend_rooms where id = p_room_id) < now() then raise exception 'El plazo de la fecha ya venció.'; end if;
  insert into public.friend_predictions (room_id, round, user_id, fixture_id, pick) values (p_room_id, fx.round, uid, p_fixture_id, p_pick)
  on conflict (room_id, round, user_id, fixture_id) do update set pick = excluded.pick;
end $$;

-- Después de jugar una fecha: corrige el prode (1 punto y 5 mangos por acierto), reinicia el plazo y deja las notas del muro
create or replace function public.friend_after_round(p_room_id uuid, p_round integer)
returns void language plpgsql security definer set search_path = public as $$
declare rm public.friend_rooms%rowtype; best record; msg text;
begin
  select * into rm from public.friend_rooms where id = p_room_id;
  update public.friend_predictions p set hit = (
    p.pick = case
      when f.winner_slot is not null then case when f.winner_slot = f.home_slot then 'L' else 'V' end
      when f.home_goals > f.away_goals then 'L' when f.home_goals < f.away_goals then 'V' else 'E' end)
  from public.friend_league_fixtures f where f.id = p.fixture_id and p.room_id = p_room_id and p.round = p_round;
  update public.friend_members m set prode = m.prode + h.n, spent = m.spent - 5 * h.n
  from (select user_id, count(*)::int n from public.friend_predictions where room_id = p_room_id and round = p_round and hit group by user_id) h
  where m.room_id = p_room_id and m.user_id = h.user_id;
  select p.user_id, count(*) n into best from public.friend_predictions p where p.room_id = p_room_id and p.round = p_round and p.hit group by p.user_id order by count(*) desc, min(p.user_id::text) limit 1;
  if best.user_id is not null then
    select 'Prode de la fecha ' || p_round || ': ' || c.name || ' acertó ' || best.n || ' y se lleva ' || (best.n * 5) || ' mangos.' into msg
    from public.friend_members m join public.clubs c on c.id = m.club_id where m.room_id = p_room_id and m.user_id = best.user_id;
    if msg is not null then perform public.friend_post(p_room_id, msg, 'NEWS', null); end if;
  end if;
  update public.friend_rooms set round_deadline = case when status = 'PLAYING' then now() + make_interval(hours => coalesce(nullif((settings->>'deadlineHours')::int, 0), 24)) else null end where id = p_room_id;
end $$;

-- Liga de la sala: ahora cualquier DT puede cerrarla cuando está lista; el creador, cuando quiera. Los planteos cambian la fuerza.
create or replace function public.friend_play_round(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); rm public.friend_rooms%rowtype; nxt integer; f record; hs double precision; aws double precision; h integer; a integer;
  big_text text; big_margin integer := -1; champion text; hn text; an text; hst text; ast text;
begin
  select * into rm from public.friend_rooms where id = p_room_id for update;
  if not found or not public.friend_is_member(p_room_id) then raise exception 'No estás en esa sala.'; end if;
  if rm.created_by is distinct from uid and not public.friend_round_ready(p_room_id) then raise exception 'La fecha todavía no se puede cerrar: faltan planteos y no venció el plazo.'; end if;
  if rm.status <> 'PLAYING' then raise exception 'La liga no está en juego.'; end if;
  if rm.settings->>'format' = 'COPA' then raise exception 'Esta sala es una Copa Mundial.'; end if;
  nxt := rm.current_round + 1;
  for f in select * from public.friend_league_fixtures where room_id = p_room_id and round = nxt order by home_slot loop
    select coalesce(case when t.club_id is not null then public.club_strength(t.club_id) else t.strength end, 50), t.name into hs, hn from public.friend_league_teams t where t.room_id = p_room_id and t.slot = f.home_slot;
    select coalesce(case when t.club_id is not null then public.club_strength(t.club_id) else t.strength end, 50), t.name into aws, an from public.friend_league_teams t where t.room_id = p_room_id and t.slot = f.away_slot;
    hst := public.friend_stance_of(p_room_id, nxt, f.home_slot, f.id);
    ast := public.friend_stance_of(p_room_id, nxt, f.away_slot, f.id);
    if public.friend_stance_beats(hst, ast) then hs := hs + 3; elsif public.friend_stance_beats(ast, hst) then aws := aws + 3; end if;
    select g.home_goals, g.away_goals into h, a from public.cup_goals(f.id, hs, aws) g;
    update public.friend_league_fixtures set home_goals = h, away_goals = a, home_stance = hst, away_stance = ast, minutes = public.friend_goal_minutes(f.id, h, a) where id = f.id;
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
  perform public.friend_after_round(p_room_id, nxt);
  return jsonb_build_object('round', nxt, 'done', nxt >= rm.total_rounds, 'highlight', big_text);
end $$;

create or replace function public.friend_play_cup_round(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); rm public.friend_rooms%rowtype; nxt integer; f record; hs double precision; aws double precision; h integer; a integer;
  hn text; an text; big_text text; big_margin integer := -1; champion text; label text; hst text; ast text;
  pw double precision; ph integer; pa integer; win integer; groups integer; g integer; k integer; mn integer; wins integer[];
begin
  select * into rm from public.friend_rooms where id = p_room_id for update;
  if not found or not public.friend_is_member(p_room_id) then raise exception 'No estás en esa sala.'; end if;
  if rm.created_by is distinct from uid and not public.friend_round_ready(p_room_id) then raise exception 'La fecha todavía no se puede cerrar: faltan planteos y no venció el plazo.'; end if;
  if rm.status <> 'PLAYING' then raise exception 'La copa no está en juego.'; end if;
  if rm.settings->>'format' is distinct from 'COPA' then raise exception 'La sala no es una Copa Mundial.'; end if;
  nxt := rm.current_round + 1;
  for f in select * from public.friend_league_fixtures where room_id = p_room_id and round = nxt order by coalesce(match_no, 0), group_no, home_slot loop
    select coalesce(case when t.club_id is not null then public.club_strength(t.club_id) else t.strength end, 50), t.name into hs, hn from public.friend_league_teams t where t.room_id = p_room_id and t.slot = f.home_slot;
    select coalesce(case when t.club_id is not null then public.club_strength(t.club_id) else t.strength end, 50), t.name into aws, an from public.friend_league_teams t where t.room_id = p_room_id and t.slot = f.away_slot;
    hst := public.friend_stance_of(p_room_id, nxt, f.home_slot, f.id);
    ast := public.friend_stance_of(p_room_id, nxt, f.away_slot, f.id);
    if public.friend_stance_beats(hst, ast) then hs := hs + 3; elsif public.friend_stance_beats(ast, hst) then aws := aws + 3; end if;
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
    update public.friend_league_fixtures set home_goals = h, away_goals = a, winner_slot = win, pens_home = ph, pens_away = pa,
      home_stance = hst, away_stance = ast, minutes = public.friend_goal_minutes(f.id, h, a) where id = f.id;
    if abs(h - a) > big_margin or (abs(h - a) = big_margin and h + a > 0) then
      big_margin := abs(h - a);
      big_text := hn || ' ' || h || ' - ' || a || ' ' || an || case when ph is not null then ' (penales ' || ph || '-' || pa || ')' else '' end;
    end if;
  end loop;

  groups := (select max(group_no) from public.friend_league_teams where room_id = p_room_id);
  if nxt = 3 then
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
  perform public.friend_after_round(p_room_id, nxt);
  return jsonb_build_object('round', nxt, 'done', nxt >= rm.total_rounds, 'highlight', big_text);
end $$;

-- Al abrir la sala: si la fecha está lista (plazo vencido o todos eligieron), la juega cualquier miembro
create or replace function public.friend_try_close(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare fmt text; res jsonb;
begin
  if not public.friend_is_member(p_room_id) then raise exception 'No estás en esa sala.'; end if;
  perform public.friend_ensure_deadline(p_room_id);
  if not coalesce(public.friend_round_ready(p_room_id), false) then return jsonb_build_object('closed', false); end if;
  select settings->>'format' into fmt from public.friend_rooms where id = p_room_id;
  res := case when fmt = 'COPA' then public.friend_play_cup_round(p_room_id) else public.friend_play_round(p_room_id) end;
  return res || jsonb_build_object('closed', true);
end $$;

-- Quién falta: los DT de la sala con su planteo de la próxima fecha (sin decir cuál)
create or replace function public.friend_round_status(p_room_id uuid)
returns table (user_id uuid, club_name text, is_me boolean, ready boolean)
language sql stable security definer set search_path = public as $$
  select m.user_id, c.name, m.user_id = (select auth.uid()),
    exists (select 1 from public.friend_round_plans p where p.room_id = m.room_id and p.round = r.current_round + 1 and p.user_id = m.user_id)
  from public.friend_members m join public.clubs c on c.id = m.club_id join public.friend_rooms r on r.id = m.room_id
  where m.room_id = p_room_id and public.friend_is_member(p_room_id)
  order by c.name
$$;

-- Mis planteos y pronósticos de la próxima fecha, y el ranking del prode
create or replace function public.friend_prode_table(p_room_id uuid)
returns table (user_id uuid, club_name text, is_me boolean, prode integer)
language sql stable security definer set search_path = public as $$
  select m.user_id, c.name, m.user_id = (select auth.uid()), m.prode
  from public.friend_members m join public.clubs c on c.id = m.club_id
  where m.room_id = p_room_id and public.friend_is_member(p_room_id)
  order by m.prode desc, c.name
$$;

-- Avisos: salas donde me falta elegir el planteo o hay una fecha jugada que no vi
create or replace function public.friend_pending()
returns table (room_id uuid, room_name text, kind text, round integer)
language sql stable security definer set search_path = public as $$
  select r.id, r.name, case when r.status = 'PLAYING' and not exists (select 1 from public.friend_round_plans p where p.room_id = r.id and p.round = r.current_round + 1 and p.user_id = m.user_id) then 'PLAN' else 'PLAYED' end,
    case when r.status = 'PLAYING' and not exists (select 1 from public.friend_round_plans p where p.room_id = r.id and p.round = r.current_round + 1 and p.user_id = m.user_id) then r.current_round + 1 else r.current_round end
  from public.friend_members m join public.friend_rooms r on r.id = m.room_id
  where m.user_id = (select auth.uid()) and (
    (r.status = 'PLAYING' and not exists (select 1 from public.friend_round_plans p where p.room_id = r.id and p.round = r.current_round + 1 and p.user_id = m.user_id))
    or (r.current_round > m.seen_round)
  )
$$;

create or replace function public.friend_mark_seen(p_room_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.friend_members set seen_round = (select current_round from public.friend_rooms where id = p_room_id) where room_id = p_room_id and user_id = auth.uid()
$$;

revoke all on function public.friend_stance_beats(text, text), public.friend_stance_of(uuid, integer, integer, uuid), public.friend_goal_minutes(uuid, integer, integer),
  public.friend_ensure_deadline(uuid), public.friend_set_deadline(uuid, integer), public.friend_round_ready(uuid), public.friend_set_plan(uuid, text, text),
  public.friend_predict(uuid, uuid, text), public.friend_after_round(uuid, integer), public.friend_play_round(uuid), public.friend_play_cup_round(uuid),
  public.friend_try_close(uuid), public.friend_round_status(uuid), public.friend_prode_table(uuid), public.friend_pending(), public.friend_mark_seen(uuid) from public, anon;
grant execute on function public.friend_set_deadline(uuid, integer), public.friend_set_plan(uuid, text, text), public.friend_predict(uuid, uuid, text),
  public.friend_play_round(uuid), public.friend_play_cup_round(uuid), public.friend_try_close(uuid), public.friend_round_status(uuid),
  public.friend_prode_table(uuid), public.friend_pending(), public.friend_mark_seen(uuid) to authenticated;
