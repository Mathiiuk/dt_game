-- Mercado 2.0, etapa 1: precios a escala de la caja y fichajes resueltos por el servidor.
--
-- Antes un jugador medio valía unos $200.000 con una caja de $25.000: no se podía comprar a nadie.
-- Ahora un titular de la media vale entre $5.000 y $10.000 y un crack, hasta $150.000 (el techo).
-- La misma fórmula está en src/domain/valuation.js (los tests comparan ambas).

create or replace function public.player_value(p_ovr integer, p_potential integer, p_age integer)
returns numeric language sql immutable as $$
  select least(150000, greatest(1500,
    round(
      6000 * exp(0.12 * (coalesce(p_ovr, 50) - 55))
      * (1 + greatest(0, coalesce(p_potential, coalesce(p_ovr, 50)) - coalesce(p_ovr, 50)) * 0.012)
      * case when coalesce(p_age, 25) <= 20 then 1.15
             when p_age <= 25 then 1.0
             when p_age <= 28 then 0.9
             when p_age <= 31 then 0.7
             else 0.45 end
      / 50
    ) * 50
  ))
$$;

-- Lo que pide un club por un jugador: su valor por el peso del club vendedor (de 0,90 a 1,30 según la reputación)
create or replace function public.seller_factor(p_reputation integer)
returns numeric language sql immutable as $$
  select 0.9 + 0.004 * greatest(0, least(100, coalesce(p_reputation, 50)))
$$;

-- Valor de todos los jugadores a la escala nueva
update public.players set
  market_value = public.player_value(attr_overall, attr_potential, age),
  release_clause = public.player_value(attr_overall, attr_potential, age) * 2;

-- Fichaje autoritativo: valida ventana de pases, caja y precio, mueve la plata de los dos clubes y el jugador en una transacción.
-- El precio mínimo lo calcula el servidor (el navegador solo propone un monto).
create or replace function public.execute_transfer(p_player_id uuid, p_buyer_club_id uuid, p_offer numeric)
returns jsonb language plpgsql as $$
declare
  buyer public.clubs%rowtype;
  seller public.clubs%rowtype;
  pl public.players%rowtype;
  month_n integer;
  value numeric;
  ask numeric;
  min_ok numeric;
begin
  select * into buyer from public.clubs where id = p_buyer_club_id and manager_id is not null for update;
  if not found then raise exception 'No se pudo encontrar al club comprador.'; end if;

  select * into pl from public.players where id = p_player_id for update;
  if not found then raise exception 'Ese jugador ya no está disponible.'; end if;
  if pl.club_id is not distinct from p_buyer_club_id then raise exception 'Ese jugador ya es de tu club.'; end if;
  if coalesce(pl.is_retired, false) then raise exception 'Ese jugador ya no está disponible.'; end if;
  if p_offer is null or p_offer <= 0 then raise exception 'Ingresá un monto válido para la oferta.'; end if;

  month_n := extract(month from buyer.game_date::date);
  if month_n not in (1, 2, 7, 8) then
    raise exception 'El libro de pases está cerrado. Solo podés inscribir fichajes durante las ventanas de Verano o Invierno.';
  end if;

  value := coalesce(pl.market_value, public.player_value(pl.attr_overall, pl.attr_potential, pl.age));
  if pl.club_id is not null then
    select * into seller from public.clubs where id = pl.club_id for update;
    ask := round(value * public.seller_factor(seller.reputation));
    min_ok := round(ask * 0.85);
    if p_offer < min_ok then
      raise exception 'El % rechazó la propuesta de $%. Piden al menos $%.', seller.name, p_offer, min_ok;
    end if;
  else
    -- Agente libre: sin club que cobre, pero pide una prima de firma
    ask := round(value * 0.6);
    min_ok := round(ask * 0.85);
    if p_offer < min_ok then
      raise exception 'El agente del jugador pide al menos $%.', min_ok;
    end if;
  end if;

  if buyer.budget < p_offer then
    raise exception 'Presupuesto insuficiente: la operación requiere $% y tu club tiene $%.', p_offer, buyer.budget;
  end if;

  update public.clubs set budget = budget - p_offer where id = p_buyer_club_id;
  if pl.club_id is not null then
    update public.clubs set budget = coalesce(budget, 0) + p_offer where id = pl.club_id;
  end if;
  update public.players set club_id = p_buyer_club_id where id = p_player_id;

  insert into public.transfer_audit_log (player_id, from_club_id, to_club_id, transfer_fee, wage_weekly, season_year, "timestamp")
  values (p_player_id, pl.club_id, p_buyer_club_id, p_offer, coalesce(pl.contract_salary, 0), extract(year from buyer.game_date::date)::integer, now());

  return jsonb_build_object(
    'player_id', p_player_id, 'fee', p_offer, 'market_value', value, 'asking', ask,
    'buyer_budget_before', buyer.budget, 'buyer_budget_after', buyer.budget - p_offer, 'game_date', buyer.game_date
  );
end $$;
