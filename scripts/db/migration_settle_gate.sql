-- Taquilla liquidada por el servidor (M2: último agujero de plata).
--
-- Antes el navegador calculaba la asistencia y el importe y los acreditaba. Ahora `settle_gate` lee la capacidad del estadio, el precio de
-- la entrada y la afición del club en la base, calcula la asistencia con la misma fórmula que src/domain/attendance.js (los tests comparan
-- ambas con valores fijos), descuenta el 40% de seguridad y logística y acredita el neto con `club_cash_move`, una sola vez por partido
-- (referencia gate:<partido>). Del navegador solo se aceptan dos datos: si fue clásico y las victorias recientes (acotadas a 0..5).
create or replace function public.settle_gate(p_club_id uuid, p_fixture_id uuid, p_is_derby boolean default false, p_recent_wins integer default 2, p_career_id uuid default null)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare
  club public.clubs%rowtype;
  fb public.club_fanbase%rowtype;
  capacity integer;
  price numeric;
  loyal integer;
  casual integer;
  support integer;
  wins integer;
  ratio double precision;
  elasticity double precision;
  form double precision;
  derby double precision;
  demand double precision;
  attendance integer;
  gross numeric;
  operating numeric;
  net numeric;
  moved jsonb;
  fx public.fixtures%rowtype;
begin
  select * into club from public.clubs where id = p_club_id and manager_id is not null;
  if not found then raise exception 'Club no encontrado.'; end if;
  -- La taquilla se cobra por un partido real: de local del club y ya jugado (sin esto se podrían inventar partidos y cobrar de más)
  select * into fx from public.fixtures where id = p_fixture_id and (home_club_id = p_club_id or home_team_id = p_club_id) and status = 'PLAYED';
  if not found then raise exception 'Partido no válido para liquidar la taquilla.'; end if;
  select * into fb from public.club_fanbase where club_id = p_club_id limit 1;

  capacity := coalesce(club.stadium_capacity, 1500);
  price := coalesce(nullif(club.ticket_price, 0), 10);
  loyal := coalesce(fb.loyal_members_count, 350);
  casual := coalesce(fb.casual_fanbase_potential, 2500);
  support := coalesce(fb.fan_support_score, 65);
  wins := least(5, greatest(0, coalesce(p_recent_wins, 0)));

  ratio := greatest(0.1, 10.0 / greatest(1, price));
  elasticity := least(1.2, power(ratio, 1.6));
  form := greatest(0.7, 0.9 + wins * 0.08);
  derby := case when p_is_derby then 1.45 else 1.0 end;
  demand := loyal + casual * (support / 100.0) * form * derby * elasticity;
  attendance := least(capacity, greatest(loyal, round(demand::numeric)::integer));

  gross := round(attendance * price);
  operating := round(gross * 0.4);
  net := gross - operating;

  if net > 0 then
    moved := public.club_cash_move(p_club_id, net, 'MATCH_DAY',
      'Taquilla: ' || attendance || ' espectadores a $' || trim_scale(price)::text || ' (neto de seguridad y logística)', p_career_id, true, 'gate:' || p_fixture_id);
  else
    moved := jsonb_build_object('moved', false);
  end if;

  return jsonb_build_object('attendance', attendance, 'gross', gross, 'operating', operating, 'net', net,
    'fill_pct', round((attendance::numeric / greatest(1, capacity)) * 100, 1), 'moved', coalesce((moved->>'moved')::boolean, false),
    'already_done', coalesce((moved->>'already_done')::boolean, false));
end $$;
