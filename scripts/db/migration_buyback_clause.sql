-- Cláusula de recompra (línea "Mercado" del roadmap).
--
-- Al vender a un jugador podés dejar una cláusula: pagás el 10% del precio de venta y durante dos temporadas podés recomprarlo
-- por el 125% de lo que cobraste. `grant_buyback` crea el derecho (sobre la venta más reciente de ese jugador, de esta temporada) y
-- `exercise_buyback` lo ejerce: cobra, trae al jugador de vuelta y consume el derecho. Los importes pasan por `club_cash_move`.
create table if not exists public.buyback_rights (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  price numeric not null,
  expires_season integer not null,
  created_at timestamptz not null default now(),
  owner_user_id uuid default auth.uid(),
  unique (club_id, player_id)
);
alter table public.buyback_rights enable row level security;
drop policy if exists owner_all on public.buyback_rights;
create policy owner_all on public.buyback_rights for all to authenticated
  using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));

create or replace function public.grant_buyback(p_club_id uuid, p_player_id uuid)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare
  club public.clubs%rowtype;
  sale record;
  season integer;
  fee numeric;
  cost numeric;
  price numeric;
begin
  select * into club from public.clubs where id = p_club_id and manager_id is not null;
  if not found then raise exception 'Club no encontrado.'; end if;
  season := extract(year from club.game_date::date)::int - case when extract(month from club.game_date::date) < 7 then 1 else 0 end;

  select * into sale from public.transfer_audit_log
  where from_club_id = p_club_id and player_id = p_player_id and season_year = season
  order by "timestamp" desc limit 1;
  if not found then raise exception 'No hay una venta de este jugador en la temporada para dejar la cláusula.'; end if;
  if exists (select 1 from public.buyback_rights where club_id = p_club_id and player_id = p_player_id) then
    raise exception 'Ese jugador ya tiene una cláusula de recompra.';
  end if;

  fee := coalesce(sale.transfer_fee, 0);
  cost := round(fee * 0.10);
  price := round(fee * 1.25);
  if cost > 0 then
    perform public.club_cash_move(p_club_id, -cost, 'BUYBACK_CLAUSE', 'Cláusula de recompra (10% de la venta)', null, false, 'buyback:' || p_player_id || ':' || season);
  end if;
  insert into public.buyback_rights (club_id, player_id, price, expires_season) values (p_club_id, p_player_id, price, season + 2);
  return jsonb_build_object('cost', cost, 'price', price, 'expires_season', season + 2);
end $$;

create or replace function public.exercise_buyback(p_club_id uuid, p_right_id uuid)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare
  club public.clubs%rowtype;
  r public.buyback_rights%rowtype;
  season integer;
  holder uuid;
begin
  select * into club from public.clubs where id = p_club_id and manager_id is not null;
  if not found then raise exception 'Club no encontrado.'; end if;
  select * into r from public.buyback_rights where id = p_right_id and club_id = p_club_id for update;
  if not found then raise exception 'Ese derecho de recompra no existe.'; end if;
  season := extract(year from club.game_date::date)::int - case when extract(month from club.game_date::date) < 7 then 1 else 0 end;
  if season > r.expires_season then
    delete from public.buyback_rights where id = r.id;
    raise exception 'La cláusula de recompra venció.';
  end if;
  select club_id into holder from public.players where id = r.player_id;
  if holder is null or holder = p_club_id then raise exception 'El jugador ya no está disponible para recomprar.'; end if;

  perform public.club_cash_move(p_club_id, -r.price, 'BUYBACK', 'Recompra de un jugador', null, false, 'buyback-exercise:' || r.id);
  update public.players set club_id = p_club_id, loan_from_club_id = null, is_transfer_listed = false, asking_price = null where id = r.player_id;
  insert into public.transfer_audit_log (player_id, from_club_id, to_club_id, transfer_fee, wage_weekly, season_year, "timestamp")
  values (r.player_id, holder, p_club_id, r.price, 0, season, now());
  delete from public.buyback_rights where id = r.id;
  return jsonb_build_object('price', r.price, 'player_id', r.player_id);
end $$;
