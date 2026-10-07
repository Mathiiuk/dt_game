-- Fix para close_week_finances: autorizar actualización de clubs.budget con app.server_result = '1' y fijar search_path
-- Corrige el error en producción: "la caja del club la mueve el servidor" / HTTP 400 en /rpc/close_week_finances

CREATE OR REPLACE FUNCTION public.close_week_finances(
  p_club_id uuid,
  p_season_year integer,
  p_week integer,
  p_career_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  club public.clubs%rowtype;
  first_fixture date;
  player_wages numeric;
  staff_wages numeric;
  members numeric;
  tier_factor numeric;
  sponsors numeric;
  tv numeric;
  store numeric;
  stadium_maint numeric;
  academy_maint numeric;
  aid numeric := 0;
  balance numeric;
  total_income numeric;
  total_expenses numeric;
  line record;
begin
  -- Habilitar modificación de clubs.budget bajo el trigger trg_protect_club_cash
  perform set_config('app.server_result', '1', true);

  select * into club from public.clubs where id = p_club_id and manager_id is not null for update;
  if not found then raise exception 'Club no encontrado.'; end if;

  -- Idempotente: si la semana ya tiene su cierre, no se cobra de nuevo
  if exists (
    select 1 from public.financial_transactions_ledger
    where club_id = p_club_id and season_year = p_season_year and week_number = p_week and category = 'SALARY'
  ) then
    return jsonb_build_object(
      'closed', false,
      'already_closed', true,
      'income', 0,
      'expenses', 0,
      'board_aid', 0,
      'new_budget', coalesce(club.budget, 0)
    );
  end if;

  select round(coalesce(sum(coalesce(contract_salary, 500)), 0)) into player_wages from public.players where club_id = p_club_id;
  select round(coalesce(sum(coalesce(wage_weekly, salary, 120)), 0)) into staff_wages from public.staff where club_id = p_club_id;
  tier_factor := 1 + 0.5 * (5 - coalesce(club.league_tier, 5));
  members := round(round(350 * 0.8) * tier_factor);
  tv := round(330 * tier_factor);
  sponsors := round((400 + coalesce(club.reputation, 15) * 8) * tier_factor);
  store := coalesce(nullif(club.store_level, 0), 1) * 150;
  stadium_maint := 200 + coalesce(nullif(club.stadium_level, 0), 1) * 60;
  academy_maint := coalesce(nullif(club.academy_level, 0), 1) * 100;

  -- Pretemporada: antes del primer partido de liga la dirigencia cubre el 100% de los sueldos del plantel (M11)
  if p_week <= 8 then
    select min(match_date) into first_fixture from public.fixtures where home_team_id = p_club_id or away_team_id = p_club_id;
    if first_fixture is not null and club.game_date::date < first_fixture then
      aid := round(player_wages);
    end if;
  end if;

  balance := coalesce(club.budget, 0);
  total_income := members + sponsors + tv + store + aid;
  total_expenses := player_wages + staff_wages + stadium_maint + academy_maint;

  for line in
    select * from (values
      (1, 'MEMBERS', members, 'Cuotas de socios'),
      (2, 'SPONSOR', sponsors, 'Patrocinio semanal'),
      (3, 'TV', tv, 'Derechos de televisión'),
      (4, 'STORE', store, 'Tienda del club'),
      (5, 'SALARY', -player_wages, 'Sueldos del plantel'),
      (6, 'STAFF', -staff_wages, 'Sueldos del cuerpo técnico'),
      (7, 'MAINTENANCE', -(stadium_maint + academy_maint), 'Mantenimiento del estadio y las inferiores'),
      (8, 'BOARD_AID', aid, 'Aporte de la dirigencia por la pretemporada')
    ) as t(ord, category, amount, description) order by ord
  loop
    -- El asiento de sueldos se registra siempre (es la marca de cierre); los demás solo si tienen importe
    continue when line.amount = 0 and line.category <> 'SALARY';
    balance := balance + line.amount;
    insert into public.financial_transactions_ledger (
      career_id, club_id, season_year, week_number, category, amount, balance_after, description
    )
    values (
      p_career_id, p_club_id, p_season_year, p_week, line.category, line.amount, balance, line.description
    );
  end loop;

  update public.clubs set budget = balance where id = p_club_id;

  return jsonb_build_object(
    'closed', true,
    'already_closed', false,
    'income', total_income - aid,
    'expenses', total_expenses,
    'board_aid', aid,
    'new_budget', balance
  );
end $function$;
