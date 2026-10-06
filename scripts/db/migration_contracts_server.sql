-- Un jugador sin contrato queda libre (club_id nulo): el mercado ya busca agentes libres con `club_id is null`.
alter table public.players alter column club_id drop not null;

-- Contratos resueltos por el servidor: renovaciones (con prima de firma) y rescisiones (finiquito).
--
-- Antes el navegador decidía si el jugador aceptaba, descontaba la prima y el finiquito de la caja y escribía el contrato.
-- Ahora la base calcula las pretensiones, puntúa la propuesta (misma fórmula que src/domain/contractDemands.js), registra las rondas
-- (hasta 3; si se rompe, el representante se retira 4 semanas) y mueve la plata y el contrato en una sola transacción.
-- La escala salarial es la de los planteles (un 56 de media cobra ~$115 por semana); antes se pedía 5 veces más y se leía el ritmo como media.

create or replace function public.contract_demands(p_ovr integer, p_age integer, p_potential integer, p_personality text, p_market_value numeric)
returns jsonb language plpgsql immutable as $$
declare
  ovr integer := greatest(40, least(99, coalesce(p_ovr, 50)));
  age integer := coalesce(p_age, 25);
  pot integer := coalesce(p_potential, ovr);
  ambitious boolean := coalesce(p_personality in ('Ambicioso', 'Estrella'), false);
  expected numeric;
  role text;
  years integer;
begin
  expected := round(120 * power((ovr - 7) / 50.0, 1.85) * case when ambitious then 1.2 else 1 end * (1 + greatest(0, pot - ovr) * 0.01));
  role := case
    when ovr >= 75 then 'KEY_PLAYER'
    when ovr >= 65 then 'FIRST_TEAM'
    when age <= 21 and pot >= 75 then 'PROSPECT'
    when ovr < 55 then 'BACKUP'
    else 'ROTATION' end;
  years := case when age <= 23 then 3 when age >= 31 then 1 else 2 end;
  return jsonb_build_object(
    'expected_wage', expected,
    'min_wage', round(expected * 0.85),
    'desired_role', role,
    'desired_years', years,
    'release_clause', round(coalesce(p_market_value, ovr * 100) * 3),
    'ambitious', ambitious
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

    if coalesce(p_bonus, 0) > 0 then update public.clubs set budget = greatest(0, budget - p_bonus) where id = p_club_id; end if;
    if neg.id is not null then update public.contract_negotiations set negotiation_status = 'ACCEPTED', rounds_completed = round_n where id = neg.id; end if;
    insert into public.contracts_audit_log (player_id, club_id, action, previous_wage, new_wage, new_expiry)
    values (p_player_id, p_club_id, 'CONTRACT_RENEWED', pl.contract_salary, p_wage, new_end::text);

    return jsonb_build_object('status', 'ACCEPTED', 'round', round_n, 'wage', p_wage, 'years', p_years, 'contract_end', new_end, 'bonus', coalesce(p_bonus, 0), 'previous_wage', pl.contract_salary);
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

-- Rescisión unilateral: el finiquito es el 65% de los sueldos que faltan hasta el vencimiento del contrato (26 semanas si no tiene fecha)
create or replace function public.terminate_contract(p_club_id uuid, p_player_id uuid)
returns jsonb language plpgsql as $$
declare
  club public.clubs%rowtype;
  pl public.players%rowtype;
  weeks integer;
  severance numeric;
begin
  select * into club from public.clubs where id = p_club_id and manager_id is not null for update;
  if not found then raise exception 'Club no encontrado.'; end if;
  select * into pl from public.players where id = p_player_id and club_id = p_club_id for update;
  if not found then raise exception 'El futbolista no pertenece a este club o ya fue dado de baja.'; end if;

  weeks := case when pl.contract_end is null then 26 else greatest(1, ceil((pl.contract_end - club.game_date::date) / 7.0))::integer end;
  severance := round(weeks * coalesce(pl.contract_salary, 500) * 0.65);
  if coalesce(club.budget, 0) < severance then
    raise exception 'ERR_INSUFFICIENT_FUNDS_FOR_SEVERANCE: Saldo insuficiente en caja ($%) para abonar la indemnización de finiquito ($%).', club.budget, severance;
  end if;

  update public.clubs set budget = budget - severance where id = p_club_id;
  update public.players set club_id = null, is_transfer_listed = false, transfer_status = 'NOT_FOR_SALE', asking_price = null where id = p_player_id;
  insert into public.contract_terminations_log (club_id, player_id, termination_type, severance_paid)
  values (p_club_id, p_player_id, 'UNILATERAL_BUYOUT', severance);

  return jsonb_build_object('severance', severance, 'weeks', weeks, 'new_budget', club.budget - severance);
end $$;
