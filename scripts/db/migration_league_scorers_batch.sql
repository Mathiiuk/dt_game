-- Goleadores de la IA en una sola sentencia por partido y lado.
-- Antes `record_league_goals` hacía un INSERT ... ON CONFLICT por cada gol y otro por cada asistencia: era el 79% del tiempo de
-- `play_league_ai_fixtures` (~217 ms de ~275 ms por fecha con las cinco divisiones). Ahora arma todos los eventos del partido,
-- los suma por jugador y hace un único upsert. Mismo reparto determinista (mismas semillas de hash): se verificó contra la versión
-- anterior con 60 partidos y 151 goles, con el mismo resultado jugador por jugador y 2,5 veces más rápido.
-- Misma firma y mismo search_path: no cambian los que la llaman (liga, copa, partido del usuario y salas de amigos).

create or replace function public.record_league_goals(p_competition_id uuid, p_club_id uuid, p_fixture_id uuid, p_side text, p_goals integer)
returns void language plpgsql
set search_path = public
as $$
begin
  if p_competition_id is null or coalesce(p_goals, 0) <= 0 then return; end if;
  with g as (
    -- Cada gol tiene su goleador: los delanteros marcan más, las plazas bajas (0 a 3) tienen más peso
    select i, least(11, floor(power((abs(hashtextextended(p_fixture_id::text || p_side || ':g:' || i, 17)) % 1000) / 1000.0, 1.7) * 12)::int) as s
    from generate_series(1, p_goals) i
  ), ev as (
    select s as slot, 1 as goals, 0 as assists from g
    union all
    -- El 70% de los goles tiene asistencia de otro compañero
    select (s + 1 + (abs(hashtextextended(p_fixture_id::text || p_side || ':p:' || i, 23)) % 11)::int) % 12, 0, 1 from g
    where (abs(hashtextextended(p_fixture_id::text || p_side || ':s:' || i, 19)) % 100) < 70
  ), named as (
    -- Agrupado por nombre: un upsert no puede tocar dos veces la misma fila
    select public.league_scorer_name(p_club_id, slot) as player_name, sum(goals)::int as goals, sum(assists)::int as assists
    from ev group by 1
  )
  insert into public.league_scorers (competition_id, club_id, player_name, goals, assists)
  select p_competition_id, p_club_id, player_name, goals, assists from named
  on conflict (competition_id, club_id, player_name) do update
    set goals = public.league_scorers.goals + excluded.goals,
        assists = public.league_scorers.assists + excluded.assists,
        updated_at = now();
end $$;
