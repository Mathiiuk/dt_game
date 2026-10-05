-- Resultados autoritativos en el servidor: Copa Continental y fechas FIFA.
-- Antes el navegador calculaba el resultado y lo escribía (se podía manipular). Ahora lo decide la base y un disparador
-- impide escribir `played` o los goles de esos partidos por fuera de estas funciones.
--
-- Las funciones son SECURITY INVOKER: respetan las políticas de acceso (cada cuenta solo toca lo suyo).
-- El azar es determinista por partido (md5 del partido): mismo partido, mismo resultado; no se puede "volver a tirar".

create or replace function public.seeded_unit(seed text, n integer)
returns double precision language sql immutable as $$
  select (('x' || substr(md5(seed || ':' || n::text), 1, 8))::bit(32)::bigint)::double precision / 4294967296.0
$$;

-- Goles de Poisson por inversión (tope de 7), igual criterio que el cálculo anterior del navegador
create or replace function public.poisson_goals(lambda double precision, seed text)
returns integer language plpgsql immutable as $$
declare
  threshold double precision := exp(-lambda);
  k integer := 0;
  p double precision := 1;
begin
  loop
    k := k + 1;
    p := p * public.seeded_unit(seed, k);
    exit when p <= threshold or k >= 8;
  end loop;
  return k - 1;
end $$;

-- Fuerza de un club: media de los 11 mejores atributos generales
create or replace function public.club_strength(p_club_id uuid)
returns double precision language sql stable as $$
  select coalesce(avg(v), 50)::double precision
  from (
    select coalesce(attr_overall, overall, 50) as v
    from public.players
    where club_id = p_club_id and coalesce(is_retired, false) = false
    order by coalesce(attr_overall, overall, 50) desc
    limit 11
  ) top
$$;

-- Resultado de un partido de copa (sin empates: el desempate se decide con la fuerza)
create or replace function public.cup_score(p_fixture_id uuid, p_home_strength double precision, p_away_strength double precision)
returns table (home_score integer, away_score integer) language plpgsql immutable as $$
declare
  h integer;
  a integer;
begin
  h := public.poisson_goals(greatest(0.3, 1.3 + (p_home_strength - p_away_strength) * 0.04 + 0.2), 'cup:' || p_fixture_id::text || ':h');
  a := public.poisson_goals(greatest(0.3, 1.3 + (p_away_strength - p_home_strength) * 0.04), 'cup:' || p_fixture_id::text || ':a');
  if h = a then
    if public.seeded_unit('cup:' || p_fixture_id::text || ':pen', 1) < 0.5 + (p_home_strength - p_away_strength) * 0.01 then
      h := h + 1;
    else
      a := a + 1;
    end if;
  end if;
  return query select h, a;
end $$;

-- Disputa el partido de copa de la persona: valida que sea suyo, que no se haya jugado y que ya llegó su fecha
create or replace function public.play_cup_fixture(p_fixture_id uuid, p_user_club_id uuid)
returns jsonb language plpgsql as $$
declare
  f public.international_fixtures%rowtype;
  game_day text;
  hs double precision;
  aws double precision;
  sc record;
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

  hs := public.club_strength(f.home_club_id);
  aws := public.club_strength(f.away_club_id);
  select * into sc from public.cup_score(p_fixture_id, hs, aws);

  perform set_config('app.server_result', '1', true);
  update public.international_fixtures set home_score = sc.home_score, away_score = sc.away_score, played = true where id = p_fixture_id;
  return jsonb_build_object('home_score', sc.home_score, 'away_score', sc.away_score);
end $$;

-- Partidos de copa entre clubes de IA que ya llegaron a su fecha. Los del club de la persona se saltean: van por play_cup_fixture.
create or replace function public.play_cup_ai_fixtures(p_user_club_id uuid, p_fixture_ids uuid[])
returns integer language plpgsql as $$
declare
  game_day text;
  f public.international_fixtures%rowtype;
  sc record;
  done integer := 0;
begin
  select left(game_date::text, 10) into game_day from public.clubs where id = p_user_club_id and manager_id is not null;
  if game_day is null then raise exception 'Club no encontrado.'; end if;

  perform set_config('app.server_result', '1', true);
  for f in select * from public.international_fixtures where id = any(p_fixture_ids) and played = false order by match_number for update loop
    continue when f.home_club_id = p_user_club_id or f.away_club_id = p_user_club_id;
    continue when left(f.match_date, 10) > game_day;
    select * into sc from public.cup_score(f.id, public.club_strength(f.home_club_id), public.club_strength(f.away_club_id));
    update public.international_fixtures set home_score = sc.home_score, away_score = sc.away_score, played = true where id = f.id;
    done := done + 1;
  end loop;
  return done;
end $$;

-- Fecha FIFA: el resultado lo decide el servidor (antes era Math.random en el navegador)
create or replace function public.play_national_fixture(p_fixture_id uuid)
returns jsonb language plpgsql as $$
declare
  f public.national_fixtures%rowtype;
  team_goals integer;
  opp_goals integer;
begin
  select * into f from public.national_fixtures where id = p_fixture_id for update;
  if not found then raise exception 'Partido no encontrado'; end if;
  if f.played then raise exception 'Esta fecha FIFA ya fue disputada.'; end if;

  team_goals := 1 + floor(public.seeded_unit('fifa:' || p_fixture_id::text, 1) * 4)::integer;
  opp_goals := floor(public.seeded_unit('fifa:' || p_fixture_id::text, 2) * 3)::integer;

  perform set_config('app.server_result', '1', true);
  update public.national_fixtures
    set home_score = case when f.is_home then team_goals else opp_goals end,
        away_score = case when f.is_home then opp_goals else team_goals end,
        played = true,
        status = 'FINISHED'
    where id = p_fixture_id;
  return jsonb_build_object('team_goals', team_goals, 'opp_goals', opp_goals);
end $$;

-- Nadie puede escribir resultados por fuera de las funciones de arriba
create or replace function public.protect_server_results()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('app.server_result', true), '') = '1' then return new; end if;
  if tg_op = 'INSERT' then
    if coalesce(new.played, false) or new.home_score is not null or new.away_score is not null then
      raise exception 'Los resultados los decide el servidor.';
    end if;
  elsif new.played is distinct from old.played or new.home_score is distinct from old.home_score or new.away_score is distinct from old.away_score then
    raise exception 'Los resultados los decide el servidor.';
  end if;
  return new;
end $$;

drop trigger if exists trg_protect_international_results on public.international_fixtures;
create trigger trg_protect_international_results before insert or update on public.international_fixtures
  for each row execute function public.protect_server_results();

drop trigger if exists trg_protect_national_results on public.national_fixtures;
create trigger trg_protect_national_results before insert or update on public.national_fixtures
  for each row execute function public.protect_server_results();
