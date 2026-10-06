-- Mercado 2.0, etapa 2b: las ofertas por tus jugadores se resuelven en el servidor.
--
-- Antes el navegador mandaba el monto, el comprador y el vendedor: se podía cobrar un traspaso a cualquier precio.
-- Ahora el monto sale de la oferta guardada, se valida que la oferta sea del club de la persona y que el jugador siga siendo suyo,
-- y la plata (80% del precio entra a la caja del club) y el jugador se mueven en una sola transacción.

create or replace function public.resolve_sale_offer(p_offer_id uuid, p_action text, p_counter numeric default null)
returns jsonb language plpgsql as $$
declare
  o public.offers%rowtype;
  mine public.clubs%rowtype;
  buyer public.clubs%rowtype;
  pl public.players%rowtype;
  final_amount numeric;
  reinvestment numeric;
  counter numeric;
  penalty integer;
  game_d date;
begin
  select * into o from public.offers where id = p_offer_id for update;
  if not found then raise exception 'Oferta no encontrada.'; end if;
  if o.status in ('ACCEPTED', 'REJECTED') then raise exception 'La oferta ya fue resuelta anteriormente.'; end if;
  if p_action not in ('ACCEPTED', 'REJECTED', 'COUNTER') then raise exception 'Acción no válida.'; end if;

  select * into mine from public.clubs where id = o.to_club_id and manager_id is not null for update;
  if not found then raise exception 'Esa oferta no es de tu club.'; end if;
  select * into pl from public.players where id = o.player_id for update;
  if not found or pl.club_id is distinct from mine.id then raise exception 'Ese jugador ya no es de tu club.'; end if;

  if p_action = 'REJECTED' then
    update public.offers set status = 'REJECTED', updated_at = now() where id = o.id;
    -- Rechazar una oferta muy buena (20% sobre el valor) enoja al jugador
    penalty := 0;
    if o.amount >= coalesce(pl.market_value, 0) * 1.2 then
      penalty := case when pl.personality in ('Ambicioso', 'Estrella') then 25 else 15 end;
      update public.players set morale = greatest(10, coalesce(morale, 70) - penalty), morale_unhappy_transfer_blocked = true where id = pl.id;
    end if;
    return jsonb_build_object('status', 'REJECTED', 'morale_penalty', penalty);
  end if;

  final_amount := o.amount;
  if p_action = 'COUNTER' then
    counter := coalesce(p_counter, round(o.amount * 1.15));
    if counter < o.amount then raise exception 'La contraoferta no puede ser menor a la oferta.'; end if;
    if counter > o.amount * 1.25 then
      update public.offers set status = 'REJECTED', counter_amount = counter, updated_at = now() where id = o.id;
      return jsonb_build_object('status', 'REJECTED', 'message', 'El club comprador rechazó la contraoferta por considerarla fuera de su presupuesto y se retiró de las negociaciones.');
    end if;
    final_amount := counter;
    update public.offers set amount = counter::integer, counter_amount = counter, status = 'ACCEPTED', updated_at = now() where id = o.id;
  else
    update public.offers set status = 'ACCEPTED', updated_at = now() where id = o.id;
  end if;

  select * into buyer from public.clubs where id = o.from_club_id for update;
  reinvestment := round(final_amount * 0.80);

  update public.clubs set budget = coalesce(budget, 0) + reinvestment where id = mine.id;
  if buyer.id is not null then
    update public.clubs set budget = greatest(0, coalesce(budget, 0) - final_amount) where id = buyer.id;
  end if;
  update public.players set
    club_id = o.from_club_id,
    is_transfer_listed = false,
    transfer_status = 'NOT_FOR_SALE',
    asking_price = null,
    morale_unhappy_transfer_blocked = false
  where id = pl.id;

  game_d := mine.game_date::date;
  insert into public.transfer_audit_log (player_id, from_club_id, to_club_id, transfer_fee, wage_weekly, season_year, "timestamp")
  values (pl.id, mine.id, o.from_club_id, final_amount, 0, extract(year from game_d)::integer, now());

  return jsonb_build_object(
    'status', 'ACCEPTED', 'amount', final_amount, 'reinvestment', reinvestment, 'player_id', pl.id,
    'new_budget', coalesce(mine.budget, 0) + reinvestment, 'game_date', mine.game_date
  );
end $$;
