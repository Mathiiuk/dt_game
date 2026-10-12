-- Reto del día, retención (aditivo): racha de días, contrarreloj con bonus por rapidez y más dilemas.
-- Todo lo decide el servidor: la racha sale de `daily_scores`, el reloj arranca la primera vez que se abre el reto (`daily_starts`) y
-- `daily_submit` mide los segundos; el navegador solo muestra una cuenta regresiva. Mismas firmas: las versiones anteriores de la app siguen andando.

alter table public.daily_scores add column if not exists bonus integer not null default 0;

create table if not exists public.daily_starts (
  day date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  primary key (day, user_id)
);
alter table public.daily_starts enable row level security;

-- Días seguidos jugando: cuenta hacia atrás desde hoy (si hoy todavía no jugó, desde ayer). Interna: no se le da a nadie.
create or replace function public.daily_streak(p_uid uuid, p_day date) returns integer language sql stable set search_path = public as $$
  select count(*)::integer from (
    select s.day, row_number() over (order by s.day desc) as rn
    from public.daily_scores s where s.user_id = p_uid and s.day <= p_day
  ) x
  where x.day = (case when exists (select 1 from public.daily_scores o where o.user_id = p_uid and o.day = p_day) then p_day else p_day - 1 end) - (x.rn - 1)::integer
$$;

create or replace function public.daily_get() returns jsonb language plpgsql security definer set search_path = public as $$
declare d date := public.daily_today(); uid uuid := auth.uid(); mine jsonb; res jsonb; secs integer;
begin
  if uid is null then raise exception 'Necesitás iniciar sesión.'; end if;
  select jsonb_build_object('score', s.score, 'goal_met', s.goal_met, 'choices', s.choices, 'results', s.results, 'bonus', s.bonus,
    'rank', (select count(*) + 1 from public.daily_scores o where o.day = d and o.score > s.score), 'players', (select count(*) from public.daily_scores o where o.day = d)) into mine
  from public.daily_scores s where s.day = d and s.user_id = uid;
  -- Si todavía no jugó, arranca (una sola vez) el reloj del contrarreloj y se devuelve cuánto lleva corriendo
  if mine is null then
    insert into public.daily_starts (day, user_id) values (d, uid) on conflict do nothing;
    select floor(extract(epoch from (now() - st.started_at)))::integer into secs from public.daily_starts st where st.day = d and st.user_id = uid;
  end if;
  select jsonb_build_object(
    'day', d,
    'goal', public.daily_goal(d),
    'streak', public.daily_streak(uid, d),
    'seconds_since_start', secs,
    'decisions', coalesce((select jsonb_agg(jsonb_build_object(
        'id', x.id, 'title', x.title, 'body', x.body,
        'options', (select jsonb_agg(jsonb_build_object('id', o->>'id', 'label', o->>'label')) from jsonb_array_elements(x.options) o)
      ) order by md5(d::text || x.id)) from public.daily_pick(d) x), '[]'::jsonb),
    'mine', mine
  ) into res;
  return res;
end $$;

create or replace function public.daily_submit(p_choices text[]) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  d date := public.daily_today();
  uid uuid := auth.uid();
  goal jsonb := public.daily_goal(d);
  meters jsonb := '{"caja":50,"barra":50,"dirigencia":50,"vestuario":50}';
  luck integer := 0;
  i integer := 0;
  dx record; opt jsonb; eff record;
  results jsonb := '[]';
  cname text; total integer; met boolean; rnk integer; cnt integer;
  secs integer; bonus integer := 0;
begin
  if uid is null then raise exception 'Necesitás iniciar sesión.'; end if;
  if exists (select 1 from public.daily_scores where day = d and user_id = uid) then raise exception 'Ya jugaste el reto de hoy.'; end if;
  if p_choices is null or coalesce(array_length(p_choices, 1), 0) <> 3 then raise exception 'Elegí una opción en cada dilema.'; end if;

  for dx in select * from public.daily_pick(d) order by md5(d::text || id) loop
    i := i + 1;
    select o into opt from jsonb_array_elements(dx.options) o where o->>'id' = p_choices[i] limit 1;
    if opt is null then raise exception 'Opción inválida.'; end if;
    for eff in select key, value::int as v from jsonb_each_text(coalesce(opt->'effects', '{}')) loop
      if eff.key = 'suerte' then luck := greatest(-2, least(2, luck + eff.v));
      elsif meters ? eff.key then meters := jsonb_set(meters, array[eff.key], to_jsonb(greatest(0, least(100, (meters->>eff.key)::int + eff.v))));
      end if;
    end loop;
    results := results || jsonb_build_array(jsonb_build_object('title', dx.title, 'choice', opt->>'label', 'reaction', opt->>'reaction', 'effects', coalesce(opt->'effects', '{}'::jsonb)));
  end loop;

  met := (meters->>(goal->>'meter'))::int >= (goal->>'min')::int;
  total := (meters->>'caja')::int + (meters->>'barra')::int + (meters->>'dirigencia')::int + (meters->>'vestuario')::int + luck * 5 + case when met then 40 else 0 end;
  -- Contrarreloj: el reloj arranca la primera vez que se abre el reto del día (lo registra `daily_get`); el servidor mide, no el navegador
  select floor(extract(epoch from (now() - st.started_at)))::integer into secs from public.daily_starts st where st.day = d and st.user_id = uid;
  bonus := case when secs is null then 0 when secs <= 30 then 10 when secs <= 60 then 5 else 0 end;
  total := total + bonus;
  select c.name into cname from public.clubs c where c.owner_user_id = uid and c.is_user_club order by c.updated_at desc nulls last limit 1;

  begin
    insert into public.daily_scores (day, user_id, club_name, score, goal_met, choices, results, bonus) values (d, uid, coalesce(cname, 'DT sin club'), total, met, to_jsonb(p_choices), results, bonus);
  exception when unique_violation then
    raise exception 'Ya jugaste el reto de hoy.';
  end;

  select count(*) + 1 into rnk from public.daily_scores where day = d and (score > total);
  select count(*) into cnt from public.daily_scores where day = d;
  return jsonb_build_object('score', total, 'goal_met', met, 'meters', meters, 'luck', luck, 'results', results, 'rank', rnk, 'players', cnt, 'bonus', bonus, 'seconds', secs, 'streak', public.daily_streak(uid, d));
end $$;


revoke all on function public.daily_streak(uuid, date) from public, anon, authenticated;
revoke all on function public.daily_get(), public.daily_submit(text[]) from public, anon;
grant execute on function public.daily_get(), public.daily_submit(text[]) to authenticated;

-- Dilemas nuevos (mismo formato; el servidor suma los efectos)
insert into public.daily_decisions (id, title, body, options) values
('termo-perdido', 'Desapareció el termo del cuerpo técnico', 'Sin agua caliente no hay mate, y sin mate el ayudante de campo no piensa. Faltan veinte minutos para el partido.', '[
  {"id":"comprar","label":"Mandás a comprar uno nuevo","effects":{"caja":-5,"vestuario":10},"reaction":"Volvieron con un termo enorme y tres paquetes de facturas. El ayudante recuperó la lucidez."},
  {"id":"buscar","label":"Revolvés todo el vestuario","effects":{"vestuario":-10,"dirigencia":5},"reaction":"Lo encontraron en el bolso del arquero suplente. Nadie quiere hablar del tema."},
  {"id":"sin-mate","label":"Dirigís sin mate","effects":{"vestuario":5,"suerte":-1},"reaction":"El ayudante dibujó la pizarra con la mano temblando. Salió una táctica muy creativa."}]'),
('cumple-figura', 'Tu figura se va de cumpleaños', 'El diez te avisa que mañana festeja los treinta con un asado para ochenta personas. El partido es pasado mañana.', '[
  {"id":"permitir","label":"Lo dejás ir, con toque de queda","effects":{"vestuario":10,"barra":5,"suerte":-1},"reaction":"Llegó al entrenamiento con anteojos oscuros. Igual metió dos goles de memoria."},
  {"id":"prohibir","label":"Se lo prohibís","effects":{"vestuario":-15,"dirigencia":5},"reaction":"Fue igual y mandó una foto sin camiseta. El plantel te mira distinto."},
  {"id":"invitarte","label":"Pedís que te inviten","effects":{"vestuario":5,"barra":5,"caja":-5},"reaction":"Aceptaron. Terminaste dirigiendo el asado y repartiendo chorizos."}]'),
('rifa-club', 'El presidente organiza una rifa', 'El premio es un lechón y una heladera usada. Te piden que vendas números en la conferencia de prensa.', '[
  {"id":"vender","label":"Vendés números con entusiasmo","effects":{"caja":15,"dirigencia":10,"barra":-5},"reaction":"Recaudaron lo justo para pintar los vestuarios. Ganó el cuñado del presidente."},
  {"id":"negarte","label":"Decís que no es tu trabajo","effects":{"dirigencia":-10,"vestuario":5},"reaction":"El presidente anotó tu nombre en una libreta. Tiene muchas libretas."},
  {"id":"comprar","label":"Comprás cinco números vos","effects":{"caja":-5,"dirigencia":10,"suerte":1},"reaction":"Ganaste la heladera. Ahora la tenés que cargar en el micro."}]'),
('hincha-nene', 'Un nene pide una camiseta firmada', 'Te espera en la puerta desde las siete de la mañana con un cuaderno y una sonrisa a la que le faltan dos dientes.', '[
  {"id":"firmar","label":"Le firmás todo y le regalás tu gorra","effects":{"barra":15,"vestuario":5},"reaction":"La foto salió en el diario del barrio: \"El profe y su nuevo ayudante\"."},
  {"id":"apurado","label":"Firmás rápido y seguís de largo","effects":{"barra":-5,"dirigencia":5},"reaction":"El nene dijo que su papá era hincha rival. Te lo tomaron muy en serio."},
  {"id":"entrenamiento","label":"Lo invitás a mirar el entrenamiento","effects":{"barra":10,"vestuario":10,"dirigencia":-5},"reaction":"Corrigió la táctica del arquero. Desde entonces los jugadores le piden permiso."}]'),
('cancha-mojada', 'El campo de entrenamiento amaneció inundado', 'Una canilla rota del vestuario inundó medio campo. El presidente dice que "es un pantano motivacional".', '[
  {"id":"gimnasio","label":"Entrenan en el gimnasio","effects":{"vestuario":5,"caja":-5,"suerte":-1},"reaction":"Tres jugadores se pelearon por la única bicicleta fija. El gimnasio huele a humedad."},
  {"id":"barro","label":"Entrenan en el barro igual","effects":{"vestuario":-5,"barra":10,"suerte":1},"reaction":"Salieron irreconocibles y felices. El utilero lloró con la lavandería."},
  {"id":"arreglar","label":"Arreglás la canilla con el plantel","effects":{"vestuario":10,"dirigencia":5,"caja":-5},"reaction":"El lateral resultó ser plomero. Ahora lo quieren de utilero también."}]'),
('streaming-dt', 'Te proponen transmitir el entrenamiento', 'Un joven con trípode y mucho entusiasmo te ofrece transmitir las prácticas por internet. "Va a ser un éxito", jura.', '[
  {"id":"aceptar","label":"Aceptás, con cámara en el vestuario","effects":{"barra":15,"caja":10,"vestuario":-15},"reaction":"Tres mil personas vieron a tu arquero cantar en la ducha. Ahora es famoso."},
  {"id":"solo-cancha","label":"Aceptás, pero solo la cancha","effects":{"barra":10,"caja":5,"dirigencia":5},"reaction":"Los rivales miraron todas tus jugadas ensayadas. Algún día lo aprenderás."},
  {"id":"rechazar","label":"Rechazás amablemente","effects":{"vestuario":10,"barra":-5},"reaction":"El joven te dedicó un video llorando. Tiene doce vistas, once de su madre."}]'),
('micro-gps', 'El micro eligió la ruta turística', 'El chofer sigue el GPS, que lleva al plantel por un camino de tierra rodeado de vacas. Faltan dos horas para el partido.', '[
  {"id":"seguir","label":"Seguís el GPS","effects":{"vestuario":5,"suerte":-1,"barra":5},"reaction":"Una vaca bloqueó el camino diez minutos. Le sacaron una foto con la camiseta."},
  {"id":"desvio","label":"Mandás al ayudante a guiar al chofer","effects":{"vestuario":-5,"dirigencia":5},"reaction":"Se perdieron igual, pero con más energía. El ayudante insiste en que fue un atajo."},
  {"id":"avion","label":"Pedís dos autos de apoyo","effects":{"caja":-10,"vestuario":10,"dirigencia":5},"reaction":"El presidente pagó con cara de cirujano. Los jugadores llegaron frescos y con música."}]'),
('apuesta-vestuario', 'Una apuesta en el vestuario', 'Tres jugadores apostaron un asado a quién mete el primer gol. Ahora discuten reglas y te piden que seas árbitro.', '[
  {"id":"arbitrar","label":"Sos el árbitro y cobrás comisión","effects":{"vestuario":10,"caja":5,"dirigencia":-5},"reaction":"Te quedaste con una porción de asado. Tu autoridad creció (y tu colesterol también)."},
  {"id":"prohibir","label":"Prohibís las apuestas","effects":{"vestuario":-10,"dirigencia":10},"reaction":"Siguieron apostando en secreto, con códigos. Ahora hablan raro."},
  {"id":"sumarte","label":"Te sumás con otra apuesta","effects":{"vestuario":15,"barra":5,"suerte":-1},"reaction":"Perdiste, pero ganaste el respeto del plantel. Pagaste el asado."}]'),
('entrevista-tv', 'Una entrevista de televisión a último momento', 'El canal local te pide cinco minutos antes del partido. El periodista arranca preguntando por tu "futuro incierto".', '[
  {"id":"sinceridad","label":"Contestás con total sinceridad","effects":{"barra":10,"dirigencia":-10,"vestuario":5},"reaction":"Dijiste lo que pensabas. El presidente miraba desde el palco con la boca abierta."},
  {"id":"evitar","label":"Respondés con frases hechas","effects":{"dirigencia":10,"barra":-5},"reaction":"Dijiste ''partido a partido'' siete veces. El periodista se rindió en la cuarta."},
  {"id":"chiste","label":"Contestás con humor","effects":{"barra":15,"vestuario":5,"dirigencia":-5},"reaction":"El clip dio la vuelta por los grupos de WhatsApp. Te llaman ''el comediante del banco''."}]')
on conflict (id) do nothing;
