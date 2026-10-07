-- Movimiento de caja en el servidor (M2 del roadmap, etapa 1).
--
-- Hasta ahora el navegador leía la caja, restaba o sumaba y la escribía, sin que nadie comprobara los fondos ni el asiento contable.
-- `club_cash_move` hace todo junto y en una transacción: bloquea el club, verifica los fondos (un gasto no deja la caja en negativo
-- salvo que se pida expresamente, p. ej. multas o sueldos), actualiza la caja y escribe el asiento en el libro mayor con la temporada y
-- la semana calculadas desde la fecha de juego del club. Importe positivo = ingreso, negativo = gasto.
-- Es idempotente por `p_ref` cuando se manda: la misma referencia no se cobra dos veces.

create or replace function public.club_cash_move(
  p_club_id uuid, p_amount numeric, p_category text, p_description text,
  p_career_id uuid default null, p_allow_negative boolean default false, p_ref text default null
) returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare
  club public.clubs%rowtype;
  new_balance numeric;
  gd date;
  season integer;
  wk integer;
begin
  if p_amount is null or p_amount = 0 then raise exception 'Importe inválido.'; end if;
  if coalesce(p_category, '') = '' then raise exception 'Falta la categoría del movimiento.'; end if;

  select * into club from public.clubs where id = p_club_id and manager_id is not null for update;
  if not found then raise exception 'Club no encontrado.'; end if;

  if p_ref is not null and exists (select 1 from public.financial_transactions_ledger where club_id = p_club_id and category = p_category and description = p_description || ' [' || p_ref || ']') then
    return jsonb_build_object('moved', false, 'already_done', true, 'new_budget', coalesce(club.budget, 0));
  end if;

  if p_amount < 0 and not p_allow_negative and coalesce(club.budget, 0) + p_amount < 0 then
    raise exception 'Fondos insuficientes en la tesorería.';
  end if;

  gd := coalesce(club.game_date::date, date '2026-07-01');
  season := extract(year from gd)::int - case when extract(month from gd) < 7 then 1 else 0 end;
  wk := least(52, greatest(1, floor((gd - make_date(season, 7, 1)) / 7.0)::int + 1));
  new_balance := coalesce(club.budget, 0) + p_amount;

  perform set_config('app.server_result', '1', true);
  update public.clubs set budget = new_balance where id = p_club_id;
  insert into public.financial_transactions_ledger (career_id, club_id, season_year, week_number, category, amount, balance_after, description)
  values (p_career_id, p_club_id, season, wk, p_category, p_amount, new_balance,
          p_description || case when p_ref is not null then ' [' || p_ref || ']' else '' end);

  return jsonb_build_object('moved', true, 'already_done', false, 'new_budget', new_balance, 'season_year', season, 'week', wk);
end $$;
