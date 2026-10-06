-- Mercado 2.0, etapa 3: el fichaje deja un contrato nuevo.
-- El jugador llega con el sueldo que pretende (según su media, edad, potencial y personalidad), el rol que espera y 2 o más temporadas,
-- en lugar de arrastrar el contrato del club anterior. Así la masa salarial del club sube de verdad con cada fichaje.

create or replace function public.negotiate_transfer(p_player_id uuid, p_buyer_club_id uuid, p_offer numeric, p_installments integer default 1)
returns jsonb language plpgsql as $$
declare
  buyer public.clubs%rowtype;
  seller public.clubs%rowtype;
  pl public.players%rowtype;
  neg public.transfer_negotiations%rowtype;
  game_d date;
  month_n integer;
  wk text;
  value numeric;
  ask numeric;
  floor_ numeric;
  counter numeric;
  price numeric;
  upfront numeric;
  rest numeric;
  attempt integer;
  mult numeric;
  offer0 numeric;
  accepted boolean := false;
  has_seller boolean := false;
  dem jsonb;
  wage numeric;
  new_end date;
  end_year integer;
begin
  select * into buyer from public.clubs where id = p_buyer_club_id and manager_id is not null for update;
  if not found then raise exception 'No se pudo encontrar al club comprador.'; end if;

  select * into pl from public.players where id = p_player_id for update;
  if not found or coalesce(pl.is_retired, false) then raise exception 'Ese jugador ya no está disponible.'; end if;
  if pl.club_id is not distinct from p_buyer_club_id then raise exception 'Ese jugador ya es de tu club.'; end if;
  if p_offer is null or p_offer <= 0 then raise exception 'Ingresá un monto válido para la oferta.'; end if;
  if p_installments not in (1, 3) then raise exception 'El pago es de contado o en 3 cuotas.'; end if;

  game_d := buyer.game_date::date;
  month_n := extract(month from game_d);
  if month_n not in (1, 2, 7, 8) then
    raise exception 'El libro de pases está cerrado. Solo podés inscribir fichajes durante las ventanas de Verano o Invierno.';
  end if;
  wk := extract(year from game_d)::text || case when month_n in (1, 2) then '-W' else '-S' end;

  value := coalesce(pl.market_value, public.player_value(pl.attr_overall, pl.attr_potential, pl.age));
  if pl.club_id is not null then
    select * into seller from public.clubs where id = pl.club_id for update;
    has_seller := true;
    ask := round(value * public.seller_factor(seller.reputation));
    floor_ := round(ask * 0.85 * case when seller.budget < 8000 then 0.95 else 1 end); -- un club con la caja flaca afloja un poco
  else
    ask := round(value * 0.6);
    floor_ := round(ask * 0.85);
  end if;
  -- Todo se compara en valores de contado; pagar en cuotas suma 8% al precio final
  mult := case when p_installments = 3 then 1.08 else 1 end;
  offer0 := p_offer / mult;

  insert into public.transfer_negotiations (buyer_club_id, player_id, window_key)
  values (p_buyer_club_id, p_player_id, wk) on conflict (buyer_club_id, player_id, window_key) do nothing;
  select * into neg from public.transfer_negotiations where buyer_club_id = p_buyer_club_id and player_id = p_player_id and window_key = wk for update;
  if neg.status = 'CLOSED' then raise exception 'La negociación por este jugador está cerrada hasta la próxima ventana de pases.'; end if;

  attempt := neg.round + 1;

  if p_offer >= round(ask * mult) then
    accepted := true; price := round(ask * mult);
  elsif neg.last_counter is not null and p_offer >= round(neg.last_counter * mult) then
    accepted := true; price := p_offer;
  end if;

  if not accepted then
    -- Tras la contraoferta final (2ª ronda) ya no hay más vueltas
    if attempt > 2 or offer0 < round(ask * 0.7) then
      update public.transfer_negotiations set status = 'CLOSED', round = attempt where id = neg.id;
      return jsonb_build_object('status', 'REJECTED', 'round', attempt,
        'message', case when offer0 < round(ask * 0.7) then 'La oferta fue una ofensa: se levantaron de la mesa.' else 'No hubo acuerdo: se cerró la negociación.' end);
    end if;
    if offer0 >= floor_ then
      counter := round(floor_ + (ask - floor_) * case when attempt = 1 then 0.5 else 0.25 end);
    else
      counter := round(ask * case when attempt = 1 then 0.97 else 0.94 end);
    end if;
    counter := least(ask, greatest(counter, round(offer0 * 1.02)));
    update public.transfer_negotiations set round = attempt, last_counter = counter where id = neg.id;
    return jsonb_build_object('status', 'COUNTER', 'round', attempt, 'counter', round(counter * mult), 'final', attempt >= 2, 'installments', p_installments);
  end if;

  -- Acuerdo: se ejecuta el fichaje
  upfront := case when p_installments = 3 then round(price * 0.4) else price end;
  rest := price - upfront;
  if buyer.budget < upfront then
    raise exception 'Presupuesto insuficiente: hoy tenés que pagar $% y tu club tiene $%.', upfront, buyer.budget;
  end if;

  update public.clubs set budget = budget - upfront where id = p_buyer_club_id;
  if has_seller then update public.clubs set budget = coalesce(budget, 0) + upfront where id = pl.club_id; end if;
  -- El jugador llega con contrato nuevo: sueldo según sus pretensiones, 3 temporadas o los años que pida, y el rol que espera
  dem := public.contract_demands(pl.attr_overall, pl.age, pl.attr_potential, pl.personality, value);
  wage := (dem->>'expected_wage')::numeric;
  end_year := extract(year from game_d)::integer + case when month_n > 6 then 1 else 0 end + (greatest((dem->>'desired_years')::integer, 2) - 1);
  new_end := make_date(end_year, 6, 30);
  update public.players set
    club_id = p_buyer_club_id,
    contract_salary = round(wage)::integer, contract_wage = wage, contract_years = greatest((dem->>'desired_years')::integer, 2), contract_end = new_end,
    contract_role = dem->>'desired_role', release_clause = (dem->>'release_clause')::numeric,
    is_transfer_listed = false, transfer_status = 'NOT_FOR_SALE', asking_price = null, morale_unhappy_transfer_blocked = false
  where id = p_player_id;
  insert into public.contracts (player_id, club_id, wage_weekly, contract_years_total, release_clause, squad_role, expires_at, status, updated_at)
  values (p_player_id, p_buyer_club_id, wage, greatest((dem->>'desired_years')::integer, 2), (dem->>'release_clause')::numeric, dem->>'desired_role', new_end, 'ACTIVE', now())
  on conflict (player_id) do update set club_id = excluded.club_id, wage_weekly = excluded.wage_weekly, contract_years_total = excluded.contract_years_total,
    release_clause = excluded.release_clause, squad_role = excluded.squad_role, expires_at = excluded.expires_at, status = 'ACTIVE', updated_at = now();
  update public.transfer_negotiations set status = 'DONE', round = attempt where id = neg.id;

  if p_installments = 3 then
    insert into public.transfer_installments (buyer_club_id, seller_club_id, player_id, amount, due_date)
    values (p_buyer_club_id, pl.club_id, p_player_id, round(rest / 2), to_char(game_d + 7, 'YYYY-MM-DD')),
           (p_buyer_club_id, pl.club_id, p_player_id, rest - round(rest / 2), to_char(game_d + 14, 'YYYY-MM-DD'));
  end if;

  insert into public.transfer_audit_log (player_id, from_club_id, to_club_id, transfer_fee, wage_weekly, season_year, "timestamp")
  values (p_player_id, pl.club_id, p_buyer_club_id, price, wage, extract(year from game_d)::integer, now());

  return jsonb_build_object(
    'status', 'ACCEPTED', 'round', attempt, 'price', price, 'upfront', upfront, 'installments', p_installments, 'asking', round(ask * mult),
    'market_value', value, 'wage', wage, 'contract_years', greatest((dem->>'desired_years')::integer, 2), 'contract_role', dem->>'desired_role', 'buyer_budget_before', buyer.budget, 'buyer_budget_after', buyer.budget - upfront, 'game_date', buyer.game_date
  );
end $$;
