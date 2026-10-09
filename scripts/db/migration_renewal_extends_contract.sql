-- Renovar un contrato suma los años pedidos al vencimiento que ya tiene.
-- Bug corregido: negotiate_renewal calculaba el nuevo vencimiento desde el cierre de la temporada en curso, así que renovar por 1 año
-- dejaba el contrato con el mismo vencimiento (el jugador seguía en "contratos por vencer" después de renovar).
-- Ejemplo: en enero de 2027, un contrato que vence el 30/06/2027 renovado por 1 año pasa a vencer el 30/06/2028.
-- El resto de la función es idéntica a la que está desplegada (la de migration_market_agents.sql más `set search_path` y `app.server_result`).

create or replace function public.negotiate_renewal(
  p_player_id uuid, p_club_id uuid, p_wage numeric, p_years integer, p_role text,
  p_release_clause numeric default null, p_bonus numeric default 0, p_week integer default 1)
returns jsonb language plpgsql
set search_path = public, pg_temp
as $$
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
  season_end date;
  base_end date;
  end_year integer;
  clause numeric;
  lockout integer;
  rate numeric;
  commission numeric;
begin
  -- Las protecciones de resultados del servidor dejan pasar esta operación
  perform set_config('app.server_result', '1', true);
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
    -- Renovar es SUMAR años al contrato que ya tiene (o al cierre de esta temporada si ya estaba vencido o sin fecha).
    -- Antes se contaban desde el cierre de la temporada en curso: con 1 año el vencimiento quedaba igual y el contrato "renovado" seguía por vencer.
    season_end := make_date(extract(year from game_d)::integer + case when extract(month from game_d) > 6 then 1 else 0 end, 6, 30);
    base_end := greatest(coalesce(pl.contract_end, season_end), season_end);
    end_year := extract(year from base_end)::integer + p_years;
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
