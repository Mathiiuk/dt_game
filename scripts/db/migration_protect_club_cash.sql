-- La caja del club solo la mueve el servidor (M2 del roadmap, cierre).
--
-- 1) Las funciones del servidor que actualizan clubs.budget llevan la marca `app.server_result = '1'` como configuración propia
--    (mientras corren, y solo mientras corren). `club_cash_move` y `play_cup_fixture` ya la fijan en su cuerpo.
-- 2) El disparador rechaza cualquier cambio de `budget` que no venga de una de ellas, y al CREAR un club desde el navegador limita
--    la caja inicial a 25.000 (la caja que usa el juego para clubes nuevos y rivales).
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('close_week_finances', 'negotiate_renewal', 'negotiate_transfer', 'resolve_sale_offer', 'settle_installments', 'settle_season_prize', 'terminate_contract')
  loop
    execute format('alter function %s set app.server_result = ''1''', f.sig);
  end loop;
end $$;

create or replace function public.protect_club_cash() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if coalesce(current_setting('app.server_result', true), '') = '1' then return new; end if;
  if tg_op = 'INSERT' then
    new.budget := least(coalesce(new.budget, 0), 25000);
    return new;
  end if;
  if new.budget is distinct from old.budget then
    raise exception 'La caja del club la mueve el servidor.';
  end if;
  return new;
end $$;

drop trigger if exists trg_protect_club_cash on public.clubs;
create trigger trg_protect_club_cash before insert or update on public.clubs
  for each row execute function public.protect_club_cash();
