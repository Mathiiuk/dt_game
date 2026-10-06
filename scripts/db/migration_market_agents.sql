-- Mercado 2.0, etapa 4: representantes y pedidos de salida.
--
-- La comisión del representante la cobra el servidor en cada fichaje (del precio) y en cada renovación (4 semanas de sueldo):
-- porcentaje base de su carácter (codicioso 12%, hostil 10%, razonable 8%, protector 5%) ajustado por la relación con el DT
-- (más afinidad la abarata, menos la encarece), entre 4% y 15%. Antes se descontaba desde el navegador solo en las renovaciones.
-- apply_player_drama: lo que pasa con un jugador cuando su representante hace ruido por una oferta (aumento o malestar).

create or replace function public.agent_commission_rate(p_player_id uuid, p_manager_id uuid)
returns numeric language plpgsql stable as $$
declare
  ag_id uuid;
  base numeric;
  rel numeric;
begin
  select a.id, a.base_commission_rate into ag_id, base from public.agents a join public.players p on p.agent_id = a.id where p.id = p_player_id;
  if ag_id is null then return 0.08; end if;
  select relationship_score into rel from public.manager_agent_relations where manager_id = p_manager_id and agent_id = ag_id;
  return greatest(0.04, least(0.15, round(coalesce(base, 0.08) * (1.2 - 0.4 * coalesce(rel, 50) / 100.0), 3)));
end $$;

create or replace function public.apply_player_drama(p_club_id uuid, p_player_id uuid, p_action text)
returns jsonb language plpgsql as $$
declare
  club public.clubs%rowtype;
  pl public.players%rowtype;
  new_wage numeric;
begin
  select * into club from public.clubs where id = p_club_id and manager_id is not null for update;
  if not found then raise exception 'Club no encontrado.'; end if;
  select * into pl from public.players where id = p_player_id and club_id = p_club_id for update;
  if not found then return jsonb_build_object('status', 'GONE'); end if;

  if p_action = 'RAISE_WAGE' then
    new_wage := round(coalesce(pl.contract_salary, 100) * 1.15);
    update public.players set contract_salary = new_wage::integer, contract_wage = new_wage, morale = least(100, coalesce(morale, 70) + 10), morale_unhappy_transfer_blocked = false where id = pl.id;
    update public.contracts set wage_weekly = new_wage, updated_at = now() where player_id = pl.id;
    return jsonb_build_object('status', 'RAISED', 'wage', new_wage, 'previous_wage', pl.contract_salary);
  elsif p_action = 'UNHAPPY' then
    update public.players set morale = greatest(15, coalesce(morale, 70) - 12), morale_unhappy_transfer_blocked = true where id = pl.id;
    return jsonb_build_object('status', 'UNHAPPY');
  end if;
  raise exception 'Acción no válida.';
end $$;

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
  rate numeric;
  commission numeric;
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
  -- El representante del jugador cobra su comisión (de 4% a 15% del precio según su carácter y la relación con el DT)
  rate := public.agent_commission_rate(p_player_id, buyer.manager_id);
  commission := round(price * rate);
  if buyer.budget < upfront + commission then
    raise exception 'Presupuesto insuficiente: hoy tenés que pagar $% más $% de comisión del representante y tu club tiene $%.', upfront, commission, buyer.budget;
  end if;

  update public.clubs set budget = budget - upfront - commission where id = p_buyer_club_id;
  insert into public.agent_action_log (agent_id, player_id, action_type, financial_impact) values (pl.agent_id, p_player_id, 'COMMISSION_PAID', commission);
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
    'market_value', value, 'wage', wage, 'contract_years', greatest((dem->>'desired_years')::integer, 2), 'contract_role', dem->>'desired_role', 'buyer_budget_before', buyer.budget, 'commission', commission, 'commission_rate', rate, 'buyer_budget_after', buyer.budget - upfront - commission, 'game_date', buyer.game_date
  );
end $$;

create or replace function public.negotiate_renewal(
  p_player_id uuid, p_club_id uuid, p_wage numeric, p_years integer, p_role text,
  p_release_clause numeric default null, p_bonus numeric default 0, p_week integer default 1)
returns jsonb language plpgsql as $$
declare
  club public.clubs%rowtype;
  pl public.players%rowtype;
  dem jsonb;
  neg public.contract_negotiations%rowtype;
  round_n integer;
  score numeric;
  role_vals jsonb := '{"KEY_PLAYER": 4, "FIRST_TEAM": 3, "ROTATION": 2, "PROSPECT": 2, "BACKUP": 1}';
  desired_vals numeric;
  offered_vals numeric;
  desired_years integer;
  new_end date;
  game_d date;
  end_year integer;
  clause numeric;
  lockout integer;
  rate numeric;
  commission numeric;
begin
  select * into club from public.clubs where id = p_club_id and manager_id is not null for update;
  if not found then raise exception 'Club no encontrado.'; end if;
  select * into pl from public.players where id = p_player_id and club_id = p_club_id for update;
  if not found then raise exception 'El futbolista no pertenece a tu plantilla.'; end if;

  if p_wage is null or p_wage <= 0 then raise exception 'Ingresá un salario semanal válido.'; end if;
  if p_years is null or p_years < 1 or p_years > 5 then raise exception 'El contrato es de 1 a 5 años.'; end if;
  if p_role not in ('KEY_PLAYER', 'FIRST_TEAM', 'ROTATION', 'PROSPECT', 'BACKUP') then raise exception 'Rol no válido.'; end if;
  if coalesce(p_bonus, 0) < 0 then raise exception 'La prima de firma no puede ser negativa.'; end if;

  if pl.negotiation_lockout_week is not null and pl.negotiation_lockout_week > p_week then
    raise exception 'ERR_NEGOTIATION_LOCKED: El jugador y su representante aún rechazan negociar. Debes esperar % semana(s) para reabrir conversaciones.', pl.negotiation_lockout_week - p_week;
  end if;
  if coalesce(p_bonus, 0) > 0 and coalesce(club.budget, 0) < p_bonus then
    raise exception 'ERR_INSUFFICIENT_FUNDS_FOR_BONUS: No dispones de fondos suficientes ($%) para cubrir la prima de firma solicitada ($%).', club.budget, p_bonus;
  end if;

  dem := public.contract_demands(pl.attr_overall, pl.age, pl.attr_potential, pl.personality, pl.market_value);

  select * into neg from public.contract_negotiations where club_id = p_club_id and player_id = p_player_id and negotiation_status = 'OPEN' for update;
  round_n := coalesce(neg.rounds_completed, 0) + 1;

  -- Satisfacción del jugador: salario (hasta 75), años (15), rol (10, o -15 si es menor al que pretende) y prima de firma (10)
  score := least(75, (p_wage / (dem->>'min_wage')::numeric) * 65);
  desired_years := (dem->>'desired_years')::integer;
  if p_years = desired_years then score := score + 15; elsif abs(p_years - desired_years) = 1 then score := score + 8; end if;
  offered_vals := coalesce((role_vals->>p_role)::numeric, 2);
  desired_vals := coalesce((role_vals->>(dem->>'desired_role'))::numeric, 2);
  if offered_vals >= desired_vals then score := score + 10; else score := score - 15; end if;
  if coalesce(p_bonus, 0) >= p_wage * 4 then score := score + 10; elsif coalesce(p_bonus, 0) > 0 then score := score + 5; end if;

  if score >= 75 then
    -- El representante cobra el equivalente a 4 semanas de sueldo por su porcentaje de comisión
    rate := public.agent_commission_rate(p_player_id, club.manager_id);
    commission := round(p_wage * 4 * rate);
    if coalesce(club.budget, 0) < coalesce(p_bonus, 0) + commission then
      raise exception 'ERR_INSUFFICIENT_FUNDS_FOR_BONUS: Entre la prima de firma ($%) y la comisión del representante ($%) no te alcanza la caja ($%).', coalesce(p_bonus, 0), commission, club.budget;
    end if;
    game_d := club.game_date::date;
    end_year := extract(year from game_d)::integer + case when extract(month from game_d) > 6 then 1 else 0 end + (p_years - 1);
    new_end := make_date(end_year, 6, 30);
    clause := coalesce(p_release_clause, (dem->>'release_clause')::numeric);

    insert into public.contracts (player_id, club_id, wage_weekly, contract_years_total, release_clause, squad_role, expires_at, status, updated_at)
    values (p_player_id, p_club_id, p_wage, p_years, clause, p_role, new_end, 'ACTIVE', now())
    on conflict (player_id) do update set club_id = excluded.club_id, wage_weekly = excluded.wage_weekly, contract_years_total = excluded.contract_years_total,
      release_clause = excluded.release_clause, squad_role = excluded.squad_role, expires_at = excluded.expires_at, status = 'ACTIVE', updated_at = now();

    update public.players set
      contract_salary = round(p_wage)::integer, contract_wage = p_wage, contract_years = p_years, contract_end = new_end,
      contract_role = p_role, release_clause = clause, morale = least(100, coalesce(morale, 70) + 15),
      morale_unhappy_transfer_blocked = false, negotiation_lockout_week = null
    where id = p_player_id;

    update public.clubs set budget = greatest(0, budget - coalesce(p_bonus, 0) - commission) where id = p_club_id;
    insert into public.agent_action_log (agent_id, player_id, action_type, financial_impact) values (pl.agent_id, p_player_id, 'COMMISSION_PAID', commission);
    if neg.id is not null then update public.contract_negotiations set negotiation_status = 'ACCEPTED', rounds_completed = round_n where id = neg.id; end if;
    insert into public.contracts_audit_log (player_id, club_id, action, previous_wage, new_wage, new_expiry)
    values (p_player_id, p_club_id, 'CONTRACT_RENEWED', pl.contract_salary, p_wage, new_end::text);

    return jsonb_build_object('status', 'ACCEPTED', 'round', round_n, 'wage', p_wage, 'years', p_years, 'contract_end', new_end, 'bonus', coalesce(p_bonus, 0), 'commission', commission, 'commission_rate', rate, 'previous_wage', pl.contract_salary);
  end if;

  if round_n >= 3 then
    lockout := p_week + 4;
    update public.players set negotiation_lockout_week = lockout, morale = greatest(15, coalesce(morale, 70) - 12) where id = p_player_id;
    if neg.id is not null then
      update public.contract_negotiations set negotiation_status = 'COLLAPSED', rounds_completed = round_n, lockout_until_week = lockout where id = neg.id;
    else
      insert into public.contract_negotiations (club_id, player_id, wage_offered, years_offered, squad_role_offered, rounds_completed, negotiation_status, lockout_until_week)
      values (p_club_id, p_player_id, p_wage, p_years, p_role, round_n, 'COLLAPSED', lockout);
    end if;
    return jsonb_build_object('status', 'COLLAPSED', 'round', round_n, 'lockout_week', lockout);
  end if;

  if neg.id is not null then
    update public.contract_negotiations set wage_offered = p_wage, rounds_completed = round_n where id = neg.id;
  else
    insert into public.contract_negotiations (club_id, player_id, wage_offered, years_offered, squad_role_offered, rounds_completed, negotiation_status)
    values (p_club_id, p_player_id, p_wage, p_years, p_role, round_n, 'OPEN');
  end if;
  return jsonb_build_object('status', 'REJECTED', 'round', round_n, 'demands', dem);
end $$;
