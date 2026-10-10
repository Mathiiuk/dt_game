-- Asamblea de la AFA: cada año los DT votan el reglamento del torneo (puntos, calendario, ascensos y descensos).
-- El reglamento ganador se guarda en `competitions.rules` (jsonb; vacío = el torneo de siempre: 3/1/0, suben 2 y bajan 3).

alter table public.competitions add column if not exists rules jsonb;

-- Boleta, votos de los otros DT y resultado de cada año (una fila por club y temporada)
create table if not exists public.season_rule_votes (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  season_year integer not null,
  ballot jsonb not null,
  bot_votes jsonb not null default '[]'::jsonb,
  user_vote text,
  winner text,
  rules jsonb,
  created_at timestamptz not null default now(),
  owner_user_id uuid default auth.uid(),
  unique (club_id, season_year)
);
alter table public.season_rule_votes enable row level security;
drop policy if exists owner_all on public.season_rule_votes;
create policy owner_all on public.season_rule_votes for all to authenticated
  using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));

-- Suma un partido a la tabla de un club según el reglamento de su competición (`apply_league_result` queda como la versión clásica).
-- `p_away` = el club jugó de visitante; `p_round` = fecha del partido (para las fechas finales dobles).
create or replace function public.apply_league_match(p_competition_id uuid, p_club_id uuid, p_for integer, p_against integer, p_away boolean, p_round integer)
returns void language plpgsql as $$
declare
  r jsonb;
  pts integer;
  last_x2 integer;
  total_rounds integer;
begin
  select coalesce(rules, '{}'::jsonb) into r from public.competitions where id = p_competition_id;
  r := coalesce(r, '{}'::jsonb);
  if p_for > p_against then
    pts := case when p_away then coalesce((r->>'awayWinPts')::int, (r->>'winPts')::int, 3) else coalesce((r->>'winPts')::int, 3) end;
    if p_for - p_against >= 3 then pts := pts + coalesce((r->>'bigWinBonus')::int, 0); end if;
  elsif p_for = p_against then
    pts := case when p_for = 0 then coalesce((r->>'nilNilPts')::int, 1) else coalesce((r->>'drawPts')::int, 1) end;
  else
    pts := 0;
  end if;
  -- Valla invicta: arco en cero suma extra (salvo que el 0-0 esté prohibido)
  if p_against = 0 and p_for >= p_against and not (p_for = 0 and coalesce((r->>'nilNilPts')::int, 1) = 0) then
    pts := pts + coalesce((r->>'cleanSheetBonus')::int, 0);
  end if;
  last_x2 := coalesce((r->>'lastRoundsX2')::int, 0);
  if last_x2 > 0 and p_round > 0 then
    select max(round) into total_rounds from public.fixtures where competition_id = p_competition_id;
    if p_round > coalesce(total_rounds, 0) - last_x2 then pts := pts * 2; end if;
  end if;

  update public.standings set
    played = played + 1,
    won = won + (case when p_for > p_against then 1 else 0 end),
    drawn = drawn + (case when p_for = p_against then 1 else 0 end),
    lost = lost + (case when p_for < p_against then 1 else 0 end),
    goals_for = goals_for + p_for,
    goals_against = goals_against + p_against,
    goal_difference = (goals_for + p_for) - (goals_against + p_against),
    points = points + pts,
    form = left((case when p_for > p_against then 'V' when p_for = p_against then 'E' else 'D' end) || ',' || coalesce(form, ''), 9),
    updated_at = now()
  where competition_id = p_competition_id and club_id = p_club_id;
end $$;

-- Los partidos de IA y el del usuario pasan si juega de visitante y en qué fecha (parche sobre las funciones desplegadas)
do $do$
declare d text; n text;
begin
  d := pg_get_functiondef('public.play_league_ai_fixtures(uuid,text)'::regprocedure);
  n := replace(d, 'apply_league_result(f.competition_id, f.home_team_id, h, a)', 'apply_league_match(f.competition_id, f.home_team_id, h, a, false, f.round)');
  n := replace(n, 'apply_league_result(f.competition_id, f.away_team_id, a, h)', 'apply_league_match(f.competition_id, f.away_team_id, a, h, true, f.round)');
  if n = d then raise exception 'play_league_ai_fixtures: no cambió'; end if;
  execute n;
  d := pg_get_functiondef('public.finish_user_fixture(uuid,uuid,integer,integer)'::regprocedure);
  n := replace(d, 'apply_league_result(f.competition_id, f.home_team_id, p_home, p_away)', 'apply_league_match(f.competition_id, f.home_team_id, p_home, p_away, false, f.round)');
  n := replace(n, 'apply_league_result(f.competition_id, f.away_team_id, p_away, p_home)', 'apply_league_match(f.competition_id, f.away_team_id, p_away, p_home, true, f.round)');
  if n = d then raise exception 'finish_user_fixture: no cambió'; end if;
  execute n;
end $do$;

-- Ascensos y descensos del reglamento: premio (settle_season_prize) y cierre (close_season_atomic)
do $do$
declare d text; n text;
begin
  d := pg_get_functiondef('public.settle_season_prize(uuid,integer,uuid)'::regprocedure);
  n := replace(d, E'when pos <= 2 and tier_now > 1 then \'PROMOTED\' when pos > 17 and tier_now < 5 then \'RELEGATED\'',
    E'when pos <= coalesce((select (rules->>\'promoted\')::int from public.competitions where id = comp), 2) and tier_now > 1 then \'PROMOTED\' when pos > 20 - coalesce((select (rules->>\'relegated\')::int from public.competitions where id = comp), 3) and tier_now < 5 then \'RELEGATED\'');
  if n = d then raise exception 'settle_season_prize: no cambió'; end if;
  execute n;
  d := pg_get_functiondef('public.close_season_atomic(uuid,integer,uuid)'::regprocedure);
  n := replace(d, 'WITH ORDINALITY WHERE ORDINALITY <= 2;', E'WITH ORDINALITY WHERE ORDINALITY <= coalesce((SELECT (rules->>\'promoted\')::int FROM public.competitions WHERE id = v_competition_id), 2);');
  n := replace(n, 'ORDER BY ORDINALITY DESC LIMIT 3)', E'ORDER BY ORDINALITY DESC LIMIT coalesce((SELECT (rules->>\'relegated\')::int FROM public.competitions WHERE id = v_competition_id), 3))');
  if n = d then raise exception 'close_season_atomic: no cambió'; end if;
  execute n;
end $do$;
