-- Premio de fin de temporada liquidado por el servidor.
--
-- Antes el navegador leía la tabla, elegía el premio y escribía la caja, el presupuesto salarial y la categoría del club.
-- Ahora la base calcula el puesto desde la tabla de la liga del club, el premio por puesto (+ el bono del goleador), el
-- presupuesto salarial (+80% con ascenso, +10% sin él) y la categoría, y lo registra en el libro mayor. Es idempotente por temporada.
-- Escala (igual que getPrizeForPosition en src/api/seasonClose.js): campeón 12.000, subcampeón 8.000, 3.º a 6.º 5.000,
-- 7.º a 17.º 2.500, el resto 1.000; si tu goleador llega a 8 goles en la temporada, +1.500.
-- (La columna `players.goals_season` que usaba el navegador no existe: los goles se cuentan del relato de los partidos.)

create or replace function public.settle_season_prize(p_club_id uuid, p_season_year integer, p_career_id uuid default null)
returns jsonb language plpgsql as $$
declare
  club public.clubs%rowtype;
  comp uuid;
  pos integer;
  base numeric;
  bonus numeric := 0;
  total numeric;
  scorer_id uuid;
  scorer_goals integer;
  promoted boolean;
  new_tier integer;
  new_wage numeric;
  new_budget numeric;
  prior numeric;
begin
  select * into club from public.clubs where id = p_club_id and manager_id is not null for update;
  if not found then raise exception 'Club no encontrado.'; end if;

  -- Idempotente: si el premio de esa temporada ya se liquidó, se informa lo cobrado y no se paga de nuevo
  select amount into prior from public.financial_transactions_ledger where club_id = p_club_id and season_year = p_season_year and category = 'SEASON_PRIZE' limit 1;
  if prior is not null then
    return jsonb_build_object('already_settled', true, 'position', null, 'prize', prior, 'top_scorer_bonus', 0, 'total', prior,
      'promoted', false, 'new_tier', club.league_tier, 'new_wage_budget', club.wage_budget, 'new_budget', club.budget,
      'top_scorer_player_id', null, 'top_scorer_goals', 0);
  end if;

  select competition_id into comp from public.standings where club_id = p_club_id limit 1;
  if comp is not null then
    select rn into pos from (
      select club_id, row_number() over (order by points desc, goal_difference desc, goals_for desc) as rn
      from public.standings where competition_id = comp
    ) t where club_id = p_club_id;
  end if;
  pos := coalesce(pos, 10); -- sin tabla no se inventa un puesto de premio: se toma mitad de tabla

  base := case when pos = 1 then 12000 when pos = 2 then 8000 when pos between 3 and 6 then 5000 when pos between 7 and 17 then 2500 else 1000 end;
  -- Goleador del club en la temporada (relato de los partidos): con 8 goles o más hay bono
  select p.id, count(*)::integer into scorer_id, scorer_goals
  from public.match_events e
  join public.players p on p.id = e.player_id
  join public.fixtures f on f.id = e.fixture_id
  where e.event_type = 'GOAL' and p.club_id = p_club_id and f.match_date between make_date(p_season_year, 7, 1) and make_date(p_season_year + 1, 6, 30)
  group by p.id order by count(*) desc limit 1;
  if coalesce(scorer_goals, 0) >= 8 then bonus := 1500; end if;
  total := base + bonus;

  promoted := pos <= 2;
  new_tier := case when promoted then greatest(1, coalesce(club.league_tier, 5) - 1) else coalesce(club.league_tier, 5) end;
  new_wage := round(coalesce(club.wage_budget, 20000) * case when promoted then 1.8 else 1.1 end);
  new_budget := coalesce(club.budget, 0) + total;

  update public.clubs set budget = new_budget, wage_budget = new_wage, league_tier = new_tier where id = p_club_id;
  insert into public.financial_transactions_ledger (career_id, club_id, season_year, week_number, category, amount, balance_after, description)
  values (p_career_id, p_club_id, p_season_year, 52, 'SEASON_PRIZE', total, new_budget, 'Premio de la temporada: puesto ' || pos || case when bonus > 0 then ' y goleador del torneo' else '' end);

  return jsonb_build_object('already_settled', false, 'position', pos, 'prize', base, 'top_scorer_bonus', bonus, 'total', total,
    'promoted', promoted, 'new_tier', new_tier, 'new_wage_budget', new_wage, 'new_budget', new_budget,
    'top_scorer_player_id', scorer_id, 'top_scorer_goals', coalesce(scorer_goals, 0));
end $$;
