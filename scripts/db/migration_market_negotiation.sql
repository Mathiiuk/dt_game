-- Mercado 2.0, etapa 2: negociación con contraofertas (hasta 2 rondas) y pago en cuotas, todo resuelto por el servidor.
--
-- negotiate_transfer: el club vendedor responde a cada oferta con ACEPTA, CONTRAOFERTA o RECHAZA. Si acepta, el fichaje se ejecuta
-- en la misma transacción. Tras la 2ª ronda la contraoferta es final: se acepta o se cierra la negociación hasta la próxima ventana.
-- Cuotas: 40% hoy y dos cuotas semanales (+8% al precio). Una cuota que la caja no cubre se paga con 10% de recargo y deja un aviso.

create table if not exists public.transfer_negotiations (
  id uuid primary key default gen_random_uuid(),
  buyer_club_id uuid not null,
  player_id uuid not null,
  window_key text not null,
  round integer not null default 0,
  status text not null default 'OPEN',
  last_counter numeric,
  created_at timestamptz not null default now(),
  owner_user_id uuid default auth.uid(),
  unique (buyer_club_id, player_id, window_key)
);

create table if not exists public.transfer_installments (
  id uuid primary key default gen_random_uuid(),
  buyer_club_id uuid not null,
  seller_club_id uuid,
  player_id uuid not null,
  amount numeric not null,
  due_date text not null,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  owner_user_id uuid default auth.uid()
);
create index if not exists idx_transfer_installments_buyer on public.transfer_installments (buyer_club_id, status);

alter table public.transfer_negotiations enable row level security;
alter table public.transfer_installments enable row level security;
drop policy if exists owner_all on public.transfer_negotiations;
drop policy if exists owner_all on public.transfer_installments;
create policy owner_all on public.transfer_negotiations for all to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
create policy owner_all on public.transfer_installments for all to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));

-- El fichaje solo se ejecuta desde la negociación: así no se puede saltear las rondas pagando el mínimo directo.
create or replace function public.execute_transfer(p_player_id uuid, p_buyer_club_id uuid, p_offer numeric)
returns jsonb language plpgsql as $$
begin
  raise exception 'Los fichajes se negocian con el club vendedor.';
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
  update public.players set club_id = p_buyer_club_id where id = p_player_id;
  update public.transfer_negotiations set status = 'DONE', round = attempt where id = neg.id;

  if p_installments = 3 then
    insert into public.transfer_installments (buyer_club_id, seller_club_id, player_id, amount, due_date)
    values (p_buyer_club_id, pl.club_id, p_player_id, round(rest / 2), to_char(game_d + 7, 'YYYY-MM-DD')),
           (p_buyer_club_id, pl.club_id, p_player_id, rest - round(rest / 2), to_char(game_d + 14, 'YYYY-MM-DD'));
  end if;

  insert into public.transfer_audit_log (player_id, from_club_id, to_club_id, transfer_fee, wage_weekly, season_year, "timestamp")
  values (p_player_id, pl.club_id, p_buyer_club_id, price, coalesce(pl.contract_salary, 0), extract(year from game_d)::integer, now());

  return jsonb_build_object(
    'status', 'ACCEPTED', 'round', attempt, 'price', price, 'upfront', upfront, 'installments', p_installments, 'asking', round(ask * mult),
    'market_value', value, 'buyer_budget_before', buyer.budget, 'buyer_budget_after', buyer.budget - upfront, 'game_date', buyer.game_date
  );
end $$;

-- Cuotas vencidas: se descuentan de la caja del comprador y se acreditan al vendedor.
-- Si la caja no alcanza, la cuota se vuelve atrasada: +10% de recargo (una sola vez) y queda pendiente para la semana siguiente.
create or replace function public.settle_installments(p_club_id uuid, p_game_date text)
returns jsonb language plpgsql as $$
declare
  inst public.transfer_installments%rowtype;
  buyer_budget numeric;
  paid_n integer := 0;
  late_n integer := 0;
  paid_total numeric := 0;
begin
  select budget into buyer_budget from public.clubs where id = p_club_id and manager_id is not null for update;
  if not found then return jsonb_build_object('paid', 0, 'late', 0, 'paid_total', 0); end if;

  for inst in select * from public.transfer_installments
    where buyer_club_id = p_club_id and status in ('PENDING', 'LATE') and due_date <= left(p_game_date, 10)
    order by due_date, created_at for update loop
    if buyer_budget >= inst.amount then
      buyer_budget := buyer_budget - inst.amount;
      update public.clubs set budget = buyer_budget where id = p_club_id;
      if inst.seller_club_id is not null then update public.clubs set budget = coalesce(budget, 0) + inst.amount where id = inst.seller_club_id; end if;
      update public.transfer_installments set status = 'PAID' where id = inst.id;
      paid_n := paid_n + 1;
      paid_total := paid_total + inst.amount;
    else
      if inst.status = 'PENDING' then
        update public.transfer_installments set status = 'LATE', amount = round(amount * 1.1) where id = inst.id;
      end if;
      late_n := late_n + 1;
    end if;
  end loop;
  return jsonb_build_object('paid', paid_n, 'late', late_n, 'paid_total', paid_total);
end $$;
