-- Goleadores y asistentes de las ligas de la IA.
-- Los clubes rivales no tienen plantel propio (solo `strength`), así que sus goles se reparten entre "plantillas" derivadas: cada club
-- tiene 12 jugadores con nombre estable (sale del id del club y el puesto de la plantilla) y cada gol de un partido simulado se
-- atribuye de forma determinista (mismo partido => mismo goleador). Sirve para mostrar goleadores, asistencias y la figura de cada liga.
-- Un gol en un partido de IA suma 1 gol al goleador y, el 70% de las veces, 1 asistencia a otro compañero.

create table if not exists public.league_scorers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid default auth.uid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_name text not null,
  goals integer not null default 0,
  assists integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (competition_id, club_id, player_name)
);
alter table public.league_scorers enable row level security;
create policy owner_all on public.league_scorers for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create index if not exists idx_league_scorers_comp on public.league_scorers (competition_id, goals desc);

-- Nombre estable del jugador `p_slot` (0 a 11) de la plantilla derivada de un club
create or replace function public.league_scorer_name(p_club_id uuid, p_slot integer)
returns text language sql immutable as $$
  select (array['Lucas','Mateo','Thiago','Bruno','Facundo','Nicolás','Franco','Joaquín','Agustín','Gonzalo','Emiliano','Santiago','Ezequiel','Matías','Leandro','Maximiliano','Cristian','Julián','Ramiro','Tomás'])[1 + (abs(hashtextextended(p_club_id::text || ':n:' || p_slot, 11)) % 20)::int]
    || ' ' ||
    (array['Gómez','Rodríguez','Fernández','López','Martínez','Pérez','Sosa','Romero','Álvarez','Torres','Ruiz','Díaz','Acosta','Benítez','Medina','Herrera','Suárez','Aguirre','Giménez','Ortiz','Castro','Molina','Silva','Rojas','Ibarra'])[1 + (abs(hashtextextended(p_club_id::text || ':a:' || p_slot, 13)) % 25)::int]
$$;

-- Atribuye `p_goals` goles de un partido de un club (y sus asistencias) a la plantilla derivada
create or replace function public.record_league_goals(p_competition_id uuid, p_club_id uuid, p_fixture_id uuid, p_side text, p_goals integer)
returns void language plpgsql as $$
declare
  i integer;
  s integer;
  a integer;
  scorer text;
  assistant text;
begin
  if p_competition_id is null or coalesce(p_goals, 0) <= 0 then return; end if;
  for i in 1..p_goals loop
    -- Los delanteros marcan más: las plazas bajas (0 a 3) tienen más peso
    s := least(11, floor(power((abs(hashtextextended(p_fixture_id::text || p_side || ':g:' || i, 17)) % 1000) / 1000.0, 1.7) * 12)::int);
    scorer := public.league_scorer_name(p_club_id, s);
    insert into public.league_scorers (competition_id, club_id, player_name, goals)
    values (p_competition_id, p_club_id, scorer, 1)
    on conflict (competition_id, club_id, player_name) do update set goals = public.league_scorers.goals + 1, updated_at = now();
    if (abs(hashtextextended(p_fixture_id::text || p_side || ':s:' || i, 19)) % 100) < 70 then
      a := (s + 1 + (abs(hashtextextended(p_fixture_id::text || p_side || ':p:' || i, 23)) % 11)::int) % 12
      ;
      assistant := public.league_scorer_name(p_club_id, a);
      insert into public.league_scorers (competition_id, club_id, player_name, assists)
      values (p_competition_id, p_club_id, assistant, 1)
      on conflict (competition_id, club_id, player_name) do update set assists = public.league_scorers.assists + 1, updated_at = now();
    end if;
  end loop;
end $$;

-- Los partidos de liga simulados y el cierre del partido del usuario anotan a los goleadores. Se parchean las funciones desplegadas
-- (play_league_ai_fixtures y finish_user_fixture, de migration_league_server.sql) agregando solo estas llamadas después de apply_league_result.
do $do$
declare d text; n text;
begin
  d := pg_get_functiondef('public.play_league_ai_fixtures(uuid,text)'::regprocedure);
  n := replace(d, E'      perform public.apply_league_result(f.competition_id, f.away_team_id, a, h);\n',
    E'      perform public.apply_league_result(f.competition_id, f.away_team_id, a, h);\n      -- Goleadores y asistentes de cada lado (plantillas derivadas de los clubes de la IA)\n      perform public.record_league_goals(f.competition_id, f.home_team_id, f.id, \'h\', h);\n      perform public.record_league_goals(f.competition_id, f.away_team_id, f.id, \'a\', a);\n');
  if n = d then raise exception 'play_league_ai_fixtures: no cambió'; end if;
  execute n;
  d := pg_get_functiondef('public.finish_user_fixture(uuid,uuid,integer,integer)'::regprocedure);
  n := replace(d, E'    perform public.apply_league_result(f.competition_id, f.away_team_id, p_away, p_home);\n',
    E'    perform public.apply_league_result(f.competition_id, f.away_team_id, p_away, p_home);\n    -- Los goles del rival (la IA) también tienen goleador; los de tu club salen de tus jugadores\n    if f.home_team_id = p_user_club_id then\n      perform public.record_league_goals(f.competition_id, f.away_team_id, f.id, \'a\', p_away);\n    else\n      perform public.record_league_goals(f.competition_id, f.home_team_id, f.id, \'h\', p_home);\n    end if;\n');
  if n = d then raise exception 'finish_user_fixture: no cambió'; end if;
  execute n;
end $do$;
