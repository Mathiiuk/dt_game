-- Copa Continental con cuartos y semifinales de ida y vuelta (la final sigue a partido único).
-- `leg` es 1 (ida) o 2 (vuelta); `winner_club_id` lo escribe solo el servidor: en la vuelta decide el global y, si empatan,
-- los penales (determinista por partido); en la final, el ganador del partido.

alter table public.international_fixtures add column if not exists leg integer not null default 1;
alter table public.international_fixtures add column if not exists winner_club_id uuid;

-- Goles de un partido de copa, con empates posibles (ida y vuelta)
create or replace function public.cup_goals(p_fixture_id uuid, p_home_strength double precision, p_away_strength double precision)
returns table (home_goals integer, away_goals integer) language sql immutable as $$
  select
    public.poisson_goals(greatest(0.3, 1.3 + (p_home_strength - p_away_strength) * 0.04 + 0.2), 'cup:' || p_fixture_id::text || ':h'),
    public.poisson_goals(greatest(0.3, 1.3 + (p_away_strength - p_home_strength) * 0.04), 'cup:' || p_fixture_id::text || ':a')
$$;

-- Resuelve un partido de copa: goles y ganador cuando corresponde (final y vuelta)
create or replace function public.cup_resolve(p_fixture_id uuid)
returns table (home_score integer, away_score integer, winner uuid) language plpgsql as $$
declare
  f public.international_fixtures%rowtype;
  first_leg public.international_fixtures%rowtype;
  hs double precision;
  aws double precision;
  h integer;
  a integer;
  home_total integer;
  away_total integer;
  win uuid;
begin
  select * into f from public.international_fixtures where id = p_fixture_id;
  hs := public.club_strength(f.home_club_id);
  aws := public.club_strength(f.away_club_id);
  select g.home_goals, g.away_goals into h, a from public.cup_goals(p_fixture_id, hs, aws) g;

  if f.stage = 'final' then
    -- Partido único: sin empates (el desempate sale de la fuerza, como los penales)
    if h = a then
      if public.seeded_unit('cup:' || p_fixture_id::text || ':pen', 1) < 0.5 + (hs - aws) * 0.01 then h := h + 1; else a := a + 1; end if;
    end if;
    win := case when h > a then f.home_club_id else f.away_club_id end;
  elsif coalesce(f.leg, 1) = 2 then
    select * into first_leg from public.international_fixtures
      where tournament_id = f.tournament_id and stage = f.stage and match_number = f.match_number and leg = 1;
    if not found or not first_leg.played then raise exception 'Primero se juega el partido de ida.'; end if;
    -- Global: el local de la vuelta jugó de visitante en la ida
    home_total := h + first_leg.away_score;
    away_total := a + first_leg.home_score;
    if home_total <> away_total then
      win := case when home_total > away_total then f.home_club_id else f.away_club_id end;
    elsif public.seeded_unit('cup:' || p_fixture_id::text || ':pen', 1) < 0.5 + (hs - aws) * 0.01 then
      win := f.home_club_id;
    else
      win := f.away_club_id;
    end if;
  end if;

  return query select h, a, win;
end $$;

create or replace function public.play_cup_fixture(p_fixture_id uuid, p_user_club_id uuid)
returns jsonb language plpgsql as $$
declare
  f public.international_fixtures%rowtype;
  game_day text;
  r record;
begin
  select * into f from public.international_fixtures where id = p_fixture_id for update;
  if not found then raise exception 'Partido internacional no encontrado'; end if;
  if f.played then raise exception 'Este partido ya fue disputado.'; end if;
  if p_user_club_id is distinct from f.home_club_id and p_user_club_id is distinct from f.away_club_id then
    raise exception 'Este partido no es de tu club.';
  end if;

  select left(game_date::text, 10) into game_day from public.clubs where id = p_user_club_id and manager_id is not null;
  if game_day is null then raise exception 'Club no encontrado.'; end if;
  if left(f.match_date, 10) > game_day then
    raise exception 'Este partido se juega el %. Avanzá las semanas hasta esa fecha.', f.match_date;
  end if;

  select * into r from public.cup_resolve(p_fixture_id);

  perform set_config('app.server_result', '1', true);
  update public.international_fixtures set home_score = r.home_score, away_score = r.away_score, winner_club_id = r.winner, played = true where id = p_fixture_id;
  return jsonb_build_object('home_score', r.home_score, 'away_score', r.away_score, 'winner_club_id', r.winner, 'leg', f.leg, 'stage', f.stage);
end $$;

create or replace function public.play_cup_ai_fixtures(p_user_club_id uuid, p_fixture_ids uuid[])
returns integer language plpgsql as $$
declare
  game_day text;
  f public.international_fixtures%rowtype;
  r record;
  done integer := 0;
begin
  select left(game_date::text, 10) into game_day from public.clubs where id = p_user_club_id and manager_id is not null;
  if game_day is null then raise exception 'Club no encontrado.'; end if;

  perform set_config('app.server_result', '1', true);
  -- Por fecha y por ida/vuelta: la vuelta necesita la ida ya jugada
  for f in select * from public.international_fixtures where id = any(p_fixture_ids) and played = false order by match_date, leg, match_number for update loop
    continue when f.home_club_id = p_user_club_id or f.away_club_id = p_user_club_id;
    continue when left(f.match_date, 10) > game_day;
    select * into r from public.cup_resolve(f.id);
    update public.international_fixtures set home_score = r.home_score, away_score = r.away_score, winner_club_id = r.winner, played = true where id = f.id;
    done := done + 1;
  end loop;
  return done;
end $$;

-- El ganador también lo decide solo el servidor
create or replace function public.protect_server_results()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('app.server_result', true), '') = '1' then return new; end if;
  if tg_op = 'INSERT' then
    if coalesce(new.played, false) or new.home_score is not null or new.away_score is not null then
      raise exception 'Los resultados los decide el servidor.';
    end if;
    if (to_jsonb(new) ->> 'winner_club_id') is not null then
      raise exception 'Los resultados los decide el servidor.';
    end if;
  elsif new.played is distinct from old.played or new.home_score is distinct from old.home_score or new.away_score is distinct from old.away_score then
    raise exception 'Los resultados los decide el servidor.';
  elsif (to_jsonb(new) ->> 'winner_club_id') is distinct from (to_jsonb(old) ->> 'winner_club_id') then
    raise exception 'Los resultados los decide el servidor.';
  end if;
  return new;
end $$;
