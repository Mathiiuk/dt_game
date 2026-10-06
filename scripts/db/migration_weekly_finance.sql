-- Cierre semanal de finanzas resuelto por el servidor.
--
-- Antes el navegador calculaba los ingresos y gastos de la semana y escribía el libro mayor y la caja con esos montos, y un cierre
-- repetido cobraba dos veces. Ahora la base lee el club, el plantel y el cuerpo técnico, aplica la misma economía que
-- src/domain/finances.js (los tests comparan ambas con valores fijos), escribe un asiento por concepto y actualiza la caja en una
-- sola transacción. Es idempotente por club, temporada y semana.

create or replace function public.close_week_finances(p_club_id uuid, p_season_year integer, p_week integer, p_career_id uuid default null)
returns jsonb language plpgsql as $$
declare
  club public.clubs%rowtype;
  first_fixture date;
  player_wages numeric;
  staff_wages numeric;
  members numeric := round(350 * 0.8);
  sponsors numeric;
  tv numeric := 250;
  store numeric;
  stadium_maint numeric;
  academy_maint numeric;
  aid numeric := 0;
  balance numeric;
  total_income numeric;
  total_expenses numeric;
  line record;
begin
  select * into club from public.clubs where id = p_club_id and manager_id is not null for update;
  if not found then raise exception 'Club no encontrado.'; end if;

  -- Idempotente: si la semana ya tiene su cierre, no se cobra de nuevo
  if exists (select 1 from public.financial_transactions_ledger where club_id = p_club_id and season_year = p_season_year and week_number = p_week and category = 'SALARY') then
    return jsonb_build_object('closed', false, 'already_closed', true, 'income', 0, 'expenses', 0, 'board_aid', 0, 'new_budget', coalesce(club.budget, 0));
  end if;

  select round(coalesce(sum(coalesce(contract_salary, 500)), 0)) into player_wages from public.players where club_id = p_club_id;
  select round(coalesce(sum(coalesce(wage_weekly, salary, 120)), 0)) into staff_wages from public.staff where club_id = p_club_id;
  sponsors := 350 + coalesce(club.reputation, 15) * 8;
  store := coalesce(nullif(club.store_level, 0), 1) * 150;
  stadium_maint := 200 + coalesce(nullif(club.stadium_level, 0), 1) * 60;
  academy_maint := coalesce(nullif(club.academy_level, 0), 1) * 100;

  -- Pretemporada: antes del primer partido de liga la dirigencia cubre la mitad de los sueldos del plantel
  if p_week <= 8 then
    select min(match_date) into first_fixture from public.fixtures where home_team_id = p_club_id or away_team_id = p_club_id;
    if first_fixture is not null and club.game_date::date < first_fixture then aid := round(player_wages * 0.5); end if;
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
    insert into public.financial_transactions_ledger (career_id, club_id, season_year, week_number, category, amount, balance_after, description)
    values (p_career_id, p_club_id, p_season_year, p_week, line.category, line.amount, balance, line.description);
  end loop;

  update public.clubs set budget = balance where id = p_club_id;
  return jsonb_build_object('closed', true, 'already_closed', false, 'income', total_income - aid, 'expenses', total_expenses, 'board_aid', aid, 'new_budget', balance);
end $$;
