-- Liga con fuerza real y resultados en el servidor.
--
-- Antes los clubes rivales no tenían jugadores ni fuerza: sus partidos eran azar parejo, el rival del usuario salía solo de la
-- reputación (igual para todos) y el navegador escribía los resultados y la tabla. Ahora:
--   * cada club rival tiene `strength` (46 a 66, media 56: un plantel como el tuyo, ~58, pelea arriba pero no gana siempre),
--   * `club_strength` usa el plantel si el club lo tiene y `strength` si no (la copa también gana sentido),
--   * `play_league_ai_fixtures` juega los partidos de IA vencidos (misma fórmula y semilla que la copa) y actualiza la tabla,
--   * `finish_user_fixture` cierra el partido del usuario (la simulación en vivo sigue en el navegador, pero el servidor valida
--     que el partido sea tuyo, esté abierto, ya haya llegado su fecha y el marcador sea razonable) y actualiza la tabla,
--   * dos disparadores impiden escribir resultados o sumar puntos desde el navegador.

alter table public.clubs add column if not exists strength numeric;
update public.clubs set strength = 46 + (abs(hashtextextended(id::text, 7)) % 21) where manager_id is null and strength is null;

create or replace function public.club_strength(p_club_id uuid)
returns double precision language sql stable as $$
  select case
    when (select count(*) from public.players where club_id = p_club_id and coalesce(is_retired, false) = false) >= 11 then
      (select coalesce(avg(v), 50) from (
        select coalesce(attr_overall, overall, 50) as v
        from public.players
        where club_id = p_club_id and coalesce(is_retired, false) = false
        order by coalesce(attr_overall, overall, 50) desc
        limit 11
      ) top)
    else coalesce((select strength from public.clubs where id = p_club_id), 50)
  end::double precision
$$;

-- Suma un partido a la tabla de un club (puntos, goles y forma)
create or replace function public.apply_league_result(p_competition_id uuid, p_club_id uuid, p_for integer, p_against integer)
returns void language plpgsql as $$
begin
  update public.standings set
    played = played + 1,
    won = won + (case when p_for > p_against then 1 else 0 end),
    drawn = drawn + (case when p_for = p_against then 1 else 0 end),
    lost = lost + (case when p_for < p_against then 1 else 0 end),
    goals_for = goals_for + p_for,
    goals_against = goals_against + p_against,
    goal_difference = (goals_for + p_for) - (goals_against + p_against),
    points = points + (case when p_for > p_against then 3 when p_for = p_against then 1 else 0 end),
    form = left((case when p_for > p_against then 'V' when p_for = p_against then 'E' else 'D' end) || ',' || coalesce(form, ''), 9),
    updated_at = now()
  where competition_id = p_competition_id and club_id = p_club_id;
end $$;

-- Partidos de liga entre clubes de IA que ya llegaron a su fecha. Los del club del usuario se juegan con finish_user_fixture.
create or replace function public.play_league_ai_fixtures(p_user_club_id uuid, p_date text)
returns integer language plpgsql as $$
declare
  game_day date;
  f record;
  h integer;
  a integer;
  done integer := 0;
begin
  select game_date::date into game_day from public.clubs where id = p_user_club_id and manager_id is not null;
  if game_day is null then raise exception 'Club no encontrado.'; end if;

  perform set_config('app.server_result', '1', true);
  -- La fecha que pide el navegador no puede pasar de la siguiente semana del juego
  for f in
    select * from public.fixtures
    where status in ('SCHEDULED', 'PENDING')
      and match_date <= least(p_date::date, game_day + 7)
      and home_team_id <> p_user_club_id and away_team_id <> p_user_club_id
    order by match_date, id
    for update
  loop
    select g.home_goals, g.away_goals into h, a from public.cup_goals(f.id, public.club_strength(f.home_team_id), public.club_strength(f.away_team_id)) g;
    update public.fixtures set home_score = h, away_score = a, status = 'PLAYED', current_minute = 90, finished_at = now() where id = f.id;
    if f.competition_id is not null then
      perform public.apply_league_result(f.competition_id, f.home_team_id, h, a);
      perform public.apply_league_result(f.competition_id, f.away_team_id, a, h);
    end if;
    done := done + 1;
  end loop;
  return done;
end $$;

-- Partido del club del usuario: valida y cierra (resultado y tabla en una transacción)
create or replace function public.finish_user_fixture(p_fixture_id uuid, p_user_club_id uuid, p_home integer, p_away integer)
returns jsonb language plpgsql as $$
declare
  f public.fixtures%rowtype;
  club_day date;
begin
  select game_date::date into club_day from public.clubs where id = p_user_club_id and manager_id is not null;
  if club_day is null then raise exception 'Club no encontrado.'; end if;
  select * into f from public.fixtures where id = p_fixture_id for update;
  if not found then raise exception 'Partido no encontrado.'; end if;
  if f.home_team_id <> p_user_club_id and f.away_team_id <> p_user_club_id then raise exception 'Este partido no es de tu club.'; end if;
  if f.status not in ('SCHEDULED', 'PENDING', 'IN_PROGRESS') then raise exception 'Este partido ya fue disputado.'; end if;
  if f.match_date > club_day then raise exception 'Este partido se juega el %.', f.match_date; end if;
  if p_home is null or p_away is null or p_home < 0 or p_away < 0 or p_home > 9 or p_away > 9 then raise exception 'Marcador no válido.'; end if;

  perform set_config('app.server_result', '1', true);
  update public.fixtures set home_score = p_home, away_score = p_away, status = 'PLAYED', current_minute = 90, finished_at = now() where id = p_fixture_id;
  if f.competition_id is not null then
    perform public.apply_league_result(f.competition_id, f.home_team_id, p_home, p_away);
    perform public.apply_league_result(f.competition_id, f.away_team_id, p_away, p_home);
  end if;
  return jsonb_build_object('fixture_id', p_fixture_id, 'home_score', p_home, 'away_score', p_away);
end $$;

-- El navegador ya no escribe resultados ni suma puntos
create or replace function public.protect_league_results()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('app.server_result', true), '') = '1' then return new; end if;
  if (new.status = 'PLAYED' and old.status is distinct from 'PLAYED')
     or (new.home_score is not null and new.home_score is distinct from old.home_score)
     or (new.away_score is not null and new.away_score is distinct from old.away_score) then
    raise exception 'Los resultados los decide el servidor.';
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_league_results on public.fixtures;
create trigger trg_protect_league_results before update on public.fixtures for each row execute function public.protect_league_results();

create or replace function public.protect_standings()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('app.server_result', true), '') = '1' then return new; end if;
  -- Reiniciar la tabla (cierre de temporada) sigue permitido; sumar partidos o puntos, no
  if new.played > old.played or new.points > old.points or new.won > old.won or new.goals_for > old.goals_for then
    raise exception 'La tabla la actualiza el servidor.';
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_standings on public.standings;
create trigger trg_protect_standings before update on public.standings for each row execute function public.protect_standings();

-- Funciones que usaba el navegador para escribir resultados: ya no existen
drop function if exists public.batch_finish_fixtures(jsonb);
drop function if exists public.apply_standings_deltas(jsonb);
