-- Reto del día (aditivo): tres dilemas iguales para todos, un objetivo del día y una tabla de puntajes.
-- Todo se decide en el servidor: el navegador solo manda las opciones elegidas; el puntaje lo calcula `daily_submit`,
-- así nadie puede inventarse un puntaje. Un intento por persona y por día (hora de Buenos Aires).
-- Las tablas tienen RLS sin políticas (nadie las lee directo); se accede solo con las funciones de abajo.

create table if not exists public.daily_decisions (
  id text primary key,
  title text not null,
  body text not null,
  options jsonb not null
);
alter table public.daily_decisions enable row level security;

create table if not exists public.daily_scores (
  day date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  club_name text not null,
  score integer not null,
  goal_met boolean not null,
  choices jsonb not null,
  results jsonb not null default '[]',
  created_at timestamptz not null default now(),
  primary key (day, user_id)
);
alter table public.daily_scores enable row level security;
create index if not exists daily_scores_board on public.daily_scores (day, score desc, created_at);

-- Día de juego actual (hora de Buenos Aires)
create or replace function public.daily_today() returns date language sql stable set search_path = public as $$
  select (now() at time zone 'America/Argentina/Buenos_Aires')::date
$$;

-- Objetivo del día: rota entre seis
create or replace function public.daily_goal(p_day date) returns jsonb language sql immutable set search_path = public as $$
  select (array[
    '{"meter":"barra","min":65,"text":"Terminá con la Barra en 65 o más"}',
    '{"meter":"caja","min":60,"text":"Terminá con la Caja en 60 o más"}',
    '{"meter":"dirigencia","min":60,"text":"Terminá con la Dirigencia en 60 o más"}',
    '{"meter":"vestuario","min":65,"text":"Terminá con el Vestuario en 65 o más"}',
    '{"meter":"barra","min":55,"text":"Terminá con la Barra en 55 o más"}',
    '{"meter":"vestuario","min":55,"text":"Terminá con el Vestuario en 55 o más"}'
  ]::jsonb[])[1 + ((p_day - date '2026-01-01') % 6)]
$$;

-- Los tres dilemas del día (siempre los mismos para un día dado)
create or replace function public.daily_pick(p_day date) returns setof public.daily_decisions language sql stable set search_path = public as $$
  select * from public.daily_decisions order by md5(p_day::text || id) limit 3
$$;

-- Lo que ve la persona: dilemas sin efectos, objetivo y, si ya jugó, su resultado
create or replace function public.daily_get() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d date := public.daily_today(); mine jsonb; res jsonb;
begin
  if auth.uid() is null then raise exception 'Necesitás iniciar sesión.'; end if;
  select jsonb_build_object('score', s.score, 'goal_met', s.goal_met, 'choices', s.choices, 'results', s.results,
    'rank', (select count(*) + 1 from public.daily_scores o where o.day = d and o.score > s.score), 'players', (select count(*) from public.daily_scores o where o.day = d)) into mine
  from public.daily_scores s where s.day = d and s.user_id = auth.uid();
  select jsonb_build_object(
    'day', d,
    'goal', public.daily_goal(d),
    'decisions', coalesce((select jsonb_agg(jsonb_build_object(
        'id', x.id, 'title', x.title, 'body', x.body,
        'options', (select jsonb_agg(jsonb_build_object('id', o->>'id', 'label', o->>'label')) from jsonb_array_elements(x.options) o)
      ) order by md5(d::text || x.id)) from public.daily_pick(d) x), '[]'::jsonb),
    'mine', mine
  ) into res;
  return res;
end $$;

-- Jugar: valida las opciones, calcula el puntaje y lo guarda (una vez por día)
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
  select c.name into cname from public.clubs c where c.owner_user_id = uid and c.is_user_club order by c.updated_at desc nulls last limit 1;

  begin
    insert into public.daily_scores (day, user_id, club_name, score, goal_met, choices, results) values (d, uid, coalesce(cname, 'DT sin club'), total, met, to_jsonb(p_choices), results);
  exception when unique_violation then
    raise exception 'Ya jugaste el reto de hoy.';
  end;

  select count(*) + 1 into rnk from public.daily_scores where day = d and (score > total);
  select count(*) into cnt from public.daily_scores where day = d;
  return jsonb_build_object('score', total, 'goal_met', met, 'meters', meters, 'luck', luck, 'results', results, 'rank', rnk, 'players', cnt);
end $$;

-- Tabla del día (o de los últimos 6 días): global o solo mis compañeros de sala
create or replace function public.daily_board(p_friends boolean default false, p_day date default null) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d date := coalesce(p_day, public.daily_today()); res jsonb;
begin
  if auth.uid() is null then raise exception 'Necesitás iniciar sesión.'; end if;
  if d > public.daily_today() or d < public.daily_today() - 6 then raise exception 'Solo hay tabla de los últimos días.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('rank', r.rnk, 'club', r.club_name, 'score', r.score, 'goal_met', r.goal_met, 'is_me', r.user_id = auth.uid()) order by r.rnk, r.created_at), '[]'::jsonb) into res
  from (
    select s.*, rank() over (order by s.score desc) as rnk
    from public.daily_scores s
    where s.day = d
      and (not p_friends or s.user_id = auth.uid() or s.user_id in (
        select m2.user_id from public.friend_members m1 join public.friend_members m2 on m2.room_id = m1.room_id where m1.user_id = auth.uid()))
  ) r
  where r.rnk <= 50 or r.user_id = auth.uid();
  return res;
end $$;

revoke all on function public.daily_today(), public.daily_goal(date), public.daily_pick(date), public.daily_get(), public.daily_submit(text[]), public.daily_board(boolean, date) from public, anon, authenticated;
grant execute on function public.daily_get(), public.daily_submit(text[]), public.daily_board(boolean, date) to authenticated;

-- Dilemas (efectos sobre caja, barra, dirigencia, vestuario y suerte del árbitro; el servidor los suma)
insert into public.daily_decisions (id, title, body, options) values
('barra-puerta', 'La barra te espera en la puerta', 'Faltan dos horas para el partido. Tres muchachos con bombo y un cartel de "Aguante el DT (si gana)" te frenan en la entrada del club.', '[
  {"id":"entradas","label":"Les das 20 entradas","effects":{"barra":20,"caja":-10,"dirigencia":-5},"reaction":"Aplausos, cánticos y una factura de la secretaría que nadie quiere firmar."},
  {"id":"no-cedes","label":"Los saludás y no cedés","effects":{"barra":-10,"vestuario":5,"dirigencia":5},"reaction":"Uno de ellos anotó tu patente. \"Es por si hace falta mandarte una postal\"."},
  {"id":"asado","label":"Los invitás a un asado","effects":{"barra":10,"caja":-5,"vestuario":5},"reaction":"Se comieron hasta el chorizo del utilero. Prometieron cantar toda la tarde."}]'),
('sobre', 'El dirigente y el sobre', 'El vicepresidente te lleva a un costado y te muestra un sobre abultado. "Es para los viáticos", dice, mirando para otro lado.', '[
  {"id":"aceptas","label":"Aceptás el sobre","effects":{"caja":25,"dirigencia":-15,"vestuario":-10},"reaction":"La caja respira. Tu conciencia, un poquito menos."},
  {"id":"devolves","label":"Lo devolvés con una sonrisa","effects":{"dirigencia":10,"caja":-5},"reaction":"El vice se lo guardó rápido. Te miraba como si le hubieras robado el postre."},
  {"id":"conferencia","label":"Lo mostrás en la conferencia","effects":{"barra":15,"dirigencia":-25,"vestuario":5},"reaction":"La hinchada ovacionó. En el palco se atragantaron con un sándwich de miga."}]'),
('arbitro', 'El árbitro te saluda de más', 'El árbitro del partido te abraza en el túnel y te susurra: "Cualquier cosa, yo estoy para ayudar". Todavía lleva puesta la camiseta del rival.', '[
  {"id":"camiseta","label":"Le regalás una camiseta firmada","effects":{"suerte":2,"dirigencia":-5,"caja":-5},"reaction":"Se la puso debajo del uniforme. Dice que te va a tener presente."},
  {"id":"ignoras","label":"Lo ignorás","effects":{"vestuario":5},"reaction":"Se quedó con la mano en el aire. Los jugadores vieron la escena y se rieron."},
  {"id":"denuncias","label":"Lo denunciás ante el delegado","effects":{"suerte":-2,"barra":5,"dirigencia":5},"reaction":"Te anotaron en un cuaderno. El árbitro ahora te mira con mucha atención."}]'),
('utilero-redes', 'El utilero pide plata para redes nuevas', '"Las que tenemos tienen más agujeros que defensa nuestra, profe." El utilero te muestra una red que parece un colador.', '[
  {"id":"comprar","label":"Comprás redes nuevas","effects":{"caja":-15,"vestuario":10,"barra":5},"reaction":"El utilero lloró de emoción. Los arqueros ya no se quejan de las filtraciones."},
  {"id":"remendar","label":"Le decís que las remiende","effects":{"caja":5,"vestuario":-5},"reaction":"Quedaron como una colcha de retazos. Igual el primer gol rival entró por el parche."},
  {"id":"sponsor","label":"Conseguís un sponsor de pescadería","effects":{"caja":15,"dirigencia":-5,"barra":-5},"reaction":"Las redes tienen un cartel de \"Pescados Don Aldo\". La hinchada cree que es una indirecta."}]'),
('bus-ponchado', 'El micro se quedó sin nafta', 'A diez cuadras del estadio, el micro del plantel hace un ruido raro y se apaga. El chofer dice que "ya viene el cuñado con un bidón".', '[
  {"id":"caminar","label":"Caminan todos hasta el estadio","effects":{"vestuario":10,"barra":10,"suerte":-1},"reaction":"Llegaron cansados pero cantando. Los vecinos les sacaron fotos con el celular."},
  {"id":"esperar","label":"Esperás al cuñado","effects":{"vestuario":-10,"dirigencia":-5},"reaction":"El cuñado llegó con un bidón de agua. Siguen esperando."},
  {"id":"remis","label":"Pedís remises para todos","effects":{"caja":-15,"vestuario":5,"dirigencia":5},"reaction":"Entraron al estadio de a cuatro, en cuatro autos distintos. Parecía una caravana de casamiento."}]'),
('pelota-nueva', 'Llegó la pelota oficial', 'El delegado trae una pelota nueva y brillante. "Es oficial, pero rebota raro". El plantel entrenó con la vieja toda la semana.', '[
  {"id":"usar","label":"La usás en el partido","effects":{"dirigencia":10,"vestuario":-5,"suerte":-1},"reaction":"Rebotó en el palo, en el poste y en la cabeza de un alcanzapelotas."},
  {"id":"vieja","label":"Pedís jugar con la vieja","effects":{"vestuario":10,"dirigencia":-5},"reaction":"El delegado accedió con cara de funeral. Los muchachos la besaron."},
  {"id":"vender","label":"La vendés por internet","effects":{"caja":20,"dirigencia":-15,"barra":-5},"reaction":"Salió más cara que el pase de un volante. Nadie sabe quién la compró."}]'),
('hincha-ilustre', 'Un hincha ilustre pide entrar al vestuario', 'Un señor de bigote, muy conocido en el barrio, quiere "dar unas palabras de aliento" antes del partido. Trae un megáfono.', '[
  {"id":"dejar","label":"Lo dejás hablar","effects":{"barra":15,"vestuario":-10},"reaction":"Habló veinte minutos. Dos jugadores se durmieron y uno aplaudió."},
  {"id":"negar","label":"Le decís que no","effects":{"barra":-10,"vestuario":5,"dirigencia":5},"reaction":"Se fue ofendido. Dicen que va a escribir una carta al diario."},
  {"id":"tribuna","label":"Lo mandás a la tribuna con el megáfono","effects":{"barra":10,"dirigencia":-5,"caja":5},"reaction":"Cantó el himno desafinado. El estadio entero lo acompañó."}]'),
('lluvia', 'Llueve a cántaros', 'La cancha parece una pileta. El árbitro duda en suspender y el presidente te pide que "ponga buena cara en la conferencia".', '[
  {"id":"jugar","label":"Pedís jugar igual","effects":{"vestuario":5,"suerte":-1,"barra":10},"reaction":"Fue un chapoteo digno de un documental. La hinchada se divirtió."},
  {"id":"suspender","label":"Pedís suspender","effects":{"dirigencia":-10,"vestuario":5,"caja":-10},"reaction":"Reprogramaron. El presidente suspiró y sacó su calculadora."},
  {"id":"botines","label":"Comprás tapones largos para todos","effects":{"caja":-10,"vestuario":15},"reaction":"Los jugadores entraron como caminando sobre la luna, pero con firmeza."}]'),
('prensa-rival', 'El DT rival te provoca por la radio', '"Con ese equipo, mejor que se dediquen al vóley", dijo por la radio. Todos esperan tu respuesta en la conferencia.', '[
  {"id":"responder","label":"Le respondés con ironía","effects":{"barra":15,"vestuario":5,"dirigencia":-10},"reaction":"La conferencia se hizo viral en el barrio. El presidente quedó pálido."},
  {"id":"silencio","label":"No decís nada","effects":{"dirigencia":10,"barra":-5},"reaction":"Silencio total. Un periodista bostezó."},
  {"id":"invitar","label":"Lo invitás a un café","effects":{"barra":5,"dirigencia":5,"vestuario":-5},"reaction":"Aceptó y pidió la cuenta separada. La foto circula en todos los grupos."}]'),
('capitan-lesion', 'El capitán dice que está bien (no lo está)', 'Tu capitán se agarra la pierna pero jura que está "al cien por cien". Cojea disimuladamente hacia la cancha.', '[
  {"id":"jugar","label":"Lo ponés de titular","effects":{"vestuario":10,"barra":5,"suerte":-1},"reaction":"Marcó un gol y se lesionó festejando. Un clásico."},
  {"id":"banco","label":"Lo dejás en el banco","effects":{"vestuario":-5,"dirigencia":5},"reaction":"Refunfuñó toda la semana. El médico te dio la razón."},
  {"id":"medico","label":"Lo mandás al médico del club","effects":{"caja":-5,"vestuario":5,"dirigencia":5},"reaction":"El médico lo revisó diez minutos y dijo \"eso no es una lesión, es una mala actitud\"."}]'),
('mate-sponsor', 'Una yerbatera quiere ser tu sponsor', 'Una marca de yerba te ofrece plata a cambio de que todos tomen mate en el banco durante el partido, con la caja a la vista.', '[
  {"id":"aceptar","label":"Aceptás con entusiasmo","effects":{"caja":20,"dirigencia":5,"barra":-5},"reaction":"El banco parece un campamento. Un suplente se quemó con el termo."},
  {"id":"regatear","label":"Pedís el doble","effects":{"caja":10,"dirigencia":-5},"reaction":"Aceptaron a medias. Te dieron dos paquetes de yerba de regalo."},
  {"id":"rechazar","label":"Rechazás por principios","effects":{"vestuario":10,"dirigencia":-10,"barra":5},"reaction":"Los jugadores aplaudieron. El tesorero lloró en silencio."}]'),
('clase-tactica', 'Tu ayudante propone una charla técnica de tres horas', 'Trae un pizarrón gigante con flechas de colores. "Es para que entiendan el sistema", dice. Hay medialunas, pero poco tiempo.', '[
  {"id":"larga","label":"Hacés la charla completa","effects":{"vestuario":-10,"dirigencia":10,"suerte":1},"reaction":"Dos jugadores creyeron que era una clase de geometría."},
  {"id":"corta","label":"La resumís en diez minutos","effects":{"vestuario":10,"dirigencia":-5},"reaction":"Entendieron lo básico. Las medialunas desaparecieron en segundos."},
  {"id":"video","label":"Pasás un video de los rivales","effects":{"caja":-5,"vestuario":5,"suerte":1},"reaction":"El video era de otro rival. Igual se sacaron ideas."}]'),
('cumple-presidente', 'Es el cumpleaños del presidente', 'La secretaría organizó una torta con el escudo del club. Todos esperan que digas unas palabras antes del partido.', '[
  {"id":"discurso","label":"Hacés un discurso emotivo","effects":{"dirigencia":15,"vestuario":-5},"reaction":"El presidente se emocionó. El plantel miraba el reloj."},
  {"id":"torta","label":"Te comés una porción y te vas","effects":{"dirigencia":-5,"vestuario":5},"reaction":"Dicen que te vieron con crema en la camisa durante toda la conferencia."},
  {"id":"cancion","label":"Hacés cantar el Feliz Cumpleaños al plantel","effects":{"dirigencia":10,"vestuario":10,"caja":-5},"reaction":"Desafinaron como nunca. El presidente pidió que lo repitan."}]'),
('quiniela', 'Descubrís una quiniela en el vestuario', 'El utilero organiza una apuesta con resultados del partido. Hay billetes arriba de un banco y una libretita que dice "Lo que diga el DT".', '[
  {"id":"prohibir","label":"La prohibís","effects":{"dirigencia":10,"vestuario":-10},"reaction":"El utilero guardó todo en un cajón con candado. Hubo malestar general."},
  {"id":"participar","label":"Apostás a ganar","effects":{"caja":10,"vestuario":10,"dirigencia":-15},"reaction":"Acertaste el resultado, y el presidente lo supo por el diario."},
  {"id":"donar","label":"Destinás lo recaudado a la cantera","effects":{"caja":-5,"barra":10,"dirigencia":5,"vestuario":5},"reaction":"Los pibes de la cantera te mandaron una carta con muchos dibujos."}]')
on conflict (id) do nothing;
