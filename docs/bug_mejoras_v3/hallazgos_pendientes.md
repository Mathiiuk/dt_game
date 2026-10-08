# Hallazgos y mejoras pendientes (detectados al resolver bugs v3)

Cosas que se vieron mientras se arreglaba `bugs_mejoras_v3.md` y quedaron para una próxima tanda.

## Verificación pendiente
- [ ] Probar en iPhone (PWA instalada) el menú inferior nuevo, Entrenamiento, Táctica y el resumen del partido. No se pudo verificar en navegador: el entorno local no tiene sesión y `vite build` falla acá por el binario nativo de `@swc/core` (problema del entorno, no del código).

## Bugs / riesgos
- `src/components/ui/wizard.jsx`: la barra de pasos usa `fixed bottom-0`; puede descolocarse en iOS igual que el menú. Pasarla a `sticky`.
- `src/components/ReloadPrompt.jsx`: aviso `fixed bottom-0 right-0` queda arriba del menú inferior en móvil y lo tapa. Subirlo (`bottom-20` en móvil).
- `src/features/events/EventScreen.jsx` y la tarjeta de eventos de `Dashboard.jsx` duplican lógica (categorías, historias, opciones). Unificar en un componente compartido. Además `EventScreen` importa `AppShell` sin usarlo.
- `src/index.css`: el `body` aplica `padding` de zona segura y además `pt-safe` / `pb-safe` en barras: se duplica el margen. Sacar el padding del body cuando todas las pantallas usen AppShell.
- `src/GameApp.jsx`: el contenedor usa colores `zinc` sueltos en vez de los tokens del sistema (`bg-bg`, `text-fg`).
- El relato del partido muestra "Jugador Rival #1/#3": usar nombres reales del plantel rival.
- Textos del resumen como "¡VICTORIA VICTORIOSA!" suenan raros; revisar tono.
- Comentarios con caracteres rotos ("dA3vil", "decisiA3n") en `MatchScreen.jsx`: corregir codificación.
- `MatchHeader.jsx` recibe `homeClub` / `awayClub` pero `MatchScreen` no se los pasa (los escudos salen genéricos).
- Hay 13 advertencias de ESLint heredadas (`react-hooks/exhaustive-deps`), entre ellas `Dashboard.jsx` y `MatchScreen.jsx`.

## Mejoras de producto
- Historias: agregar un recap del capítulo anterior y una pequeña animación al elegir (hoy hay barra de capítulos y tarjeta de resultado).
- Táctica: botón "Banco" que muestre los suplentes ordenados por rendimiento aun sin elegir una ficha.
- Entrenamiento: mostrar el efecto esperado de la semana (qué atributos suben) antes de confirmar.
- Partido: el panel de decisiones del DT en desktop podría mostrar el cronómetro de enfriamiento de los gritos como barra.

## Minijuego de penales (idea siguiente)
- Hoy el penal en contra se juega tocando una zona del arco (misma mecánica de antes). El penal a favor sigue eligiendo quién patea: el motor no recibe la dirección del remate, así que un "apuntá y pateá" sería solo estético. Para hacerlo real hay que sumar la dirección/potencia al motor de partido (`matchEngine`) y que la chance de gol dependa de eso.

## Auditoría del día (segunda pasada)
Errores encontrados y corregidos:
- Penal: el texto del relato decía siempre "fallado" porque la dirección del arquero se borraba antes de armar el mensaje. Ahora dice "atajado" cuando el arquero adivina.
- `PenaltyGoal`: el temporizador del arquero no se limpiaba si la hoja se cerraba antes de tiempo.
- El botón de resumen en móvil esperaba el estado `'ended'` (nunca ocurre): ver tanda anterior.

Riesgos que quedan (no se tocaron):
- Al recargar la página a mitad de partido se restaura el resultado, pero no qué momentos ya se decidieron (`firedRef` no se guarda): un momento podría volver a aparecer.
- Saltear el partido ("Saltear") se salta también las jugadas clave y penales: juegan en piloto automático. Es lo esperado, pero conviene avisarlo en el cartel de confirmación.
- `EventScreen` (`/events`) no usa la lectura de historias de a poco: quedó con el diseño viejo.
- Los chistes del relato (`QUIPS` en `matchEngine.js`) son pocos por tipo; en partidos largos se repiten. Ampliar el pool o sumar chistes según el marcador/minuto.
- Las historias ya traen buen humor en `arcCatalog.js`; lo que cambió es cómo se muestran. Falta revisar los eventos "sueltos" (no ARC_) que son más secos.

## Hecho en esta tanda
- Penal a favor: apuntar al arco + frenar la barra (afecta la chance de gol: bien pegado sube, mal pegado baja, malísimo se va a la tribuna).
- Mano a mano ("jugada clave"): nuevo momento, a favor (definir / gambetear / ceder) y en contra (achicar / quedarse / tirarse a los pies). Tiene efecto real en el motor.
- Relato con humor: remates del relator en goles, atajadas, errados, córners, tarjetas y lesiones (azar propio: no cambia el resultado del partido).
- Historias contadas de a poco: momentos, diálogos en globo, opciones al terminar de leer, y al elegir una cargada del narrador con chips de lo que cambió.

## Auditoría del partido (tercera pasada)
Corregido en esta tanda:
- Barra del penal que se trababa: iba con `requestAnimationFrame` + `setState` en cada cuadro. Ahora es una animación de CSS (suave) y se lee dónde quedó el marcador al patear. Con "reducir movimiento" activo en el sistema la barra seguía la regla global (animaciones casi instantáneas): se la exceptuó, va más lenta pero se mueve.
- Lesión → "Elegí quién entra" no abría el banco en pantallas chicas (solo dejaba el jugador preseleccionado). Ahora abre la hoja de cambios.
- Pizarra de cambios: las fichas se ubicaban por índice de la lista, así que con una expulsión (o con alineación libre) quedaban en lugares equivocados o amontonadas. Ahora van en el puesto que ocupa cada jugador y respetan la alineación libre.
- Pizarra de cambios: se ven amarillas, lesionados y la leyenda; en la pizarra táctica las bajas llevan una etiqueta visible ("Lesionado" / "Suspendido").
- Once rival con nombres propios (antes "Jugador Rival #n").
- Prensa: periodista con carácter y frase de entrada, pregunta que se "escribe" en vivo, humor de la sala, cara de la sala tras cada respuesta, emoji por tono y una tercera ronda posible: relámpago de sí o no. El marcador se achica en la prensa para que entren las preguntas, y "Volver al inicio" ya no aparece mientras se responde.

Pendiente (match):
- Recargar a mitad de partido salta directo al final ("completado automáticamente") en vez de retomar el minuto.
- El rival nunca hace cambios ni tiene decisiones: es el mismo equipo de relleno todo el partido.
- Las amarillas del partido no se acumulan entre fechas (no hay suspensión por amarillas): la tabla de jugadores solo marca `is_suspended` en falso.
- La prensa sigue en 2 preguntas por decisión previa ("prensa corta"); si se quiere más variedad, rotar cuál se hace en vez de alargar.

Ideas para un partido más arcade (para elegir):
1. Atajadas interactivas: cuando el rival patea al arco, un toque rápido en la zona correcta para que el arquero la saque (efecto real sobre la chance).
2. Medidor de impulso ("momentum"): sube con jugadas buenas y, lleno, se activa un "arrebato" de 5 minutos (+ataque).
3. Una carta por partido ("pizarrazo"): repetir un grito sin esperar la espera de 15 minutos, o forzar un córner.
4. Tiros libres y córners como momentos: elegir quién la cuelga y a quién apunta.
5. Repetición de la jugada del partido en el resumen y titular generado con el gol.
6. Festejos: animación y frase del relator al gol propio, y "silbidos" al gol en contra.

## Quinta tanda (partido sin scroll, sin emojis, historias a pantalla completa)
Hecho:
- /match: pantalla de alto fijo sin scroll de página. Relato en vivo con la jugada de ahora en grande, íconos por tipo y las anteriores que se desvanecen hacia abajo. Estadísticas pegadas abajo: cerradas muestran solo la posesión; al tocar se abren hacia arriba y el relato se achica; al cerrar vuelve todo.
- Pausa automática al abrir la pizarra de cambios o las órdenes y se retoma sola al salir (si ya estaba en pausa, queda como estaba).
- Sin emojis: íconos vectoriales (`NamedIcon` con los de lucide) en prensa, jugadas clave, mercado, club y pizarras. Quedan solo las banderas de la Selección (`nationalRadar.js`): hacen falta banderas en SVG.
- /post-match sin scroll: las listas (incidencias, puntajes, estadísticas, respuestas de prensa) se paginan solas según el alto de la pantalla (`Pager`). Excepción: el cierre de la prensa (minijuegos, bingo, transcripción) puede scrollear sin barra visible si no entra en teléfonos muy chicos.
- Historias a pantalla completa (`StoryStage`): se leen de a un momento tocando, y cada capítulo se decide con una mecánica distinta (mantener apretado, moneda o reloj). Al terminar, pantalla de resultado con cargada y efectos. "Decidir más tarde" las deja en el inicio.

Pendiente:
- Más minijuegos para las historias (hoy son tres formas de decidir, no minijuegos con puntaje). Ideas: reflejos para "atajar" una noticia, arrastrar billetes en las crisis de caja, unir cables en las obras.
- Banderas en SVG para reemplazar las últimas.
- En pantallas muy bajas (iPhone SE) las listas muestran 1 o 2 elementos por página.

## Sexta tanda (más minijuegos en las historias)
- Cuatro formas de decidir: mantener apretado, moneda, reloj y **puntería** (una barra recorre las opciones y se la frena sobre la elegida).
- Tres desafíos de pista antes de decidir (o ninguno, según el capítulo): **memoria** (repetir una secuencia de símbolos), **insistencia** (tocar 18 veces en 5 segundos) y **verdadero o falso** de reglas de fútbol (dos de tres). Si se gana, se ven los efectos de cada opción; si se pierde, se decide a ciegas, sin costo. Se puede saltear.
- La combinación de decisión y desafío se reparte pareja entre los capítulos.
Pendiente: reflejos (atajar una noticia), arrastrar billetes en crisis de caja, y que los desafíos puedan dar premios más allá de la pista.

## Séptima tanda (atajadas interactivas)
- Algunos remates rivales (1 de cada 5 ocasiones) quedan "en el aire" un minuto: aparece un momento con un arco y la pelota viaja hacia una de tres zonas; hay que tirar al arquero ahí lo más rápido posible. La calidad de la reacción (0 a 1) cambia la chance de gol: reacción perfecta la deja en 0,4 veces, reacción nula en 1,4 veces; si no se interviene, queda igual que antes.
- Tirarse antes de que patee o para el otro lado reacciona mal; no tocar a tiempo cuenta como llegar tarde.
- Los remates propios también quedan "en el aire" un minuto (para que el relato tenga suspenso), pero se resuelven solos.
Pendiente: que el rival reaccione igual de bien o mal según su arquero; tiros libres y córners como momentos.

## Octava tanda (tiros libres y córners)
- Córner a favor: aparece un momento con la zona de la defensa rival que el banco marca como floja (la pista acierta 7 de cada 10) y tres zonas para el centro (primer palo, punto penal, segundo palo). Centrar por la zona floja multiplica por 2,1 la chance de gol; por otra zona la baja a 0,8. Si no se interviene, queda a la suerte (9 %).
- Tiro libre a favor (30 % de las faltas): se elige quién lo patea, se apunta al arco y se frena la barra, igual que el penal. Un buen golpe sube la chance (hasta cerca de 12 %), uno flojo la baja; el arquero rival adivina por azar la zona y, si acierta, la saca.
- Las pelotas paradas del rival se resuelven solas. Nuevos tipos de jugada en el relato: córner a favor, tiro libre y despeje.
Pendiente: defender los córners y tiros libres del rival (marca al hombre o en zona, barrera) y que cada equipo tenga especialistas con nombre.

## Novena tanda (defender pelotas paradas)
- Córner en contra: el banco avisa a qué zona va a cargar el rival (acierta 7 de cada 10) y elegís dónde poner el refuerzo (primer palo, punto penal, segundo palo) o dejar dos arriba para la contra. Reforzar la zona correcta baja la chance de gol del rival a 0,45 veces; otra zona la sube a 1,1. Con dos arriba, si despejan hay 4 de cada 10 de que salga un contragolpe propio (relato "Contragolpe").
- Tiro libre en contra: el banco avisa hacia dónde mira el pateador (7 de cada 10) y elegís: arquero al palo izquierdo, al medio o al palo derecho (si adivina la zona la saca casi siempre) o barrera de cinco (baja la chance a 0,7 veces sin depender de adivinar).
- Cantidad de decisiones por partido: entre córners y tiros libres propios y ajenos, remates, manos a mano y penales, se pueden juntar varias pausas; si molesta, bajar la frecuencia en `matchEngine.js` (`kpRng() < 0.6` de córners, `< 0.3` de tiros libres, `< 0.2` de remates).
Pendiente: que cada equipo tenga especialistas con nombre para las pelotas paradas.

## Décima tanda (especialistas con nombre)
- `domain/specialists.js`: el mejor de cada rol entre los disponibles (sin arqueros ni lesionados): penales, tiros libres, córners y cabezazos, según los atributos de cada jugador.
- Motor: el penal y el tiro libre por defecto los patea el especialista; el córner lo saca el especialista y define de cabeza el especialista en 6 de cada 10 (el resto, un delantero al azar). Rige igual para el rival, con los nombres en el relato ("Se prepara el córner: lo cobra X", "se perfila Y").
- Momentos: el córner a favor nombra a quien lo cobra y a quien mejor define; en penales y tiros libres el especialista va primero y marcado; al defender, el banco nombra al cobrador y al rematador del rival.
- Pizarra táctica: tarjeta "Especialistas" con los cuatro roles, el nombre y su puntaje.
- Test que se corrigió: "atacar con todo mete más goles y recibe más". Con 2000 partidos el rival recibe *menos* goles incluso en la versión anterior del motor (el atacante le deja menos ocasiones al rival): la afirmación solo pasaba por azar con 600 partidos. Ahora solo se afirma que mete más goles.
Pendiente: poder fijar a mano quién cobra cada pelota parada (hoy se elige solo por atributos; requiere guardar la elección en la base).

## Undécima tanda (especialistas elegidos a mano)
- Base de datos: columna nueva `tactics.set_piece_takers` (jsonb, nullable), migración aditiva aplicada en dt_database el 2026-10-14 (`tactics_set_piece_takers`; archivo en `scripts/db/migration_tactics_set_piece_takers.sql`). Antes: 11 filas, ninguna con valor; después: igual, la columna vacía.
- Pizarra táctica: cada rol (penales, tiros libres, córners, cabezazos) tiene un selector con el plantel ordenado por puntaje; "Automático" deja al mejor por atributos. Se guarda con "Guardar cambios".
- Partido: lo elegido viaja al motor y a los momentos (primero y marcado en penales y tiros libres, nombrado en el córner). Si el elegido se lesiona, es expulsado o sale en un cambio, lo reemplaza el mejor disponible.
Pendiente: elegir distinto cobrador de corners del lado izquierdo y derecho; "especialista de cabeza" con un atributo de juego aéreo propio (hoy se estima con nivel general y defensa).

## Duodécima tanda (cabeceador con juego aéreo)
- Aclaración importante: el atributo ya existía. `players.attr_heading` está en la base para los 433 jugadores (promedio 55 en defensores y delanteros centro, 40 en el resto) y entra en las calificaciones por puesto del servidor. Por eso no hizo falta ninguna migración, aunque se había aprobado una columna nueva. No se tocó la base en esta tanda.
- El especialista de cabezazos ahora se elige por `attr_heading` (60 %), fuerza (20 %), ubicación (10 %) y definición (10 %). Los once de relleno del rival no traen el atributo y siguen con la estimación anterior.
- En el motor, quien remata el córner modifica la chance de gol: un cabeceador de 99 de juego aéreo la multiplica por 1,2 y uno de 20 por 0,88.
- En el momento del córner se muestra el juego aéreo del mejor rematador.
Pendiente: que el rival tenga atributos reales (hoy el once de relleno solo tiene nivel general).

## Decimotercera tanda (atributos reales del rival)
- 231 de los 245 clubs de la base no tienen plantel, así que el rival siempre sale con un once armado al empezar (`buildRivalLineup`). Ahora cada jugador rival trae atributos: ritmo, fuerza, pase, visión, definición, remate, cabeceo, defensa y ubicación, según el perfil de su línea (arquero, defensor, mediocampista, delantero) más un carácter propio fijo por club (±9). Lo que rinde el equipo no cambió (sigue mandando `slot_rating`).
- Resultado: cada rival tiene sus propios especialistas de penales, tiros libres, córners y cabezazos, y el juego aéreo del córner rival ya es real.
- Antes del pitazo aparece una ficha de scouting con los cuatro especialistas del rival (mismos nombres y atributos que en el partido).
Pendiente: que el rival también tenga personalidad de juego (por ejemplo, equipos que centran más o patean de afuera) y que los clubs con plantel real usen sus jugadores en vez del once armado.

## Decimocuarta tanda (personalidad de juego del rival)
- Cinco estilos (`domain/rivalStyle.js`), uno fijo por club: Centradores (1,8 veces más córners), Pegadores de media distancia (12 % más ocasiones, 12 % menos certeras), Contragolpeadores (10 % menos ocasiones, 22 % más certeras), Toque y posesión (más mediocampo, menos faltas) y Duros (1,7 veces más faltas y 1,5 de amarillas).
- Se aplican en el motor solo al lado rival (`options.styles`); sin estilo el partido es idéntico al de antes (hay un test que lo comprueba).
- La ficha de scouting previa al partido muestra el estilo con su descripción y un consejo para jugarle.
Pendiente: que los estilos también cambien el relato (por ejemplo, "otro centro más al área") y que los rivales con plantel real tengan estilo según sus jugadores.

## Decimoquinta tanda (el relato refleja el estilo del rival)
- `domain/rivalNarrative.js`: frases propias de cada estilo para goles, atajadas, errados y córners del rival (y amarillas/roja de los Duros). Se suman en la mitad de las jugadas, así que no se repiten todo el tiempo.
- A los 20 y a los 65 minutos aparece una nota táctica del estilo ("El rival insiste con los centros...", "El rival se queda con la pelota y te hace correr...").
- Todo el texto sale de un azar aparte: el resultado, las estadísticas y el orden de las jugadas son idénticos con o sin estilo (hay un test que lo comprueba con 200 partidos).
Pendiente: frases de estilo para las pelotas paradas y los penales del rival, y variar las notas tácticas según el marcador.

## Decimosexta tanda (frases de estilo para pelotas paradas y penales)
- Cada estilo del rival suma frases propias al anunciar y resolver córners, tiros libres y penales (anuncio, gol, atajada y errado), en la mitad de las jugadas. El resultado del partido no cambia (azar aparte para el texto), y los tests lo comprueban con 1500 partidos.

## Decimoséptima tanda (notas tácticas según el marcador)
- `domain/rivalNotes.js`: la nota del rival ahora depende de si su equipo va ganando, perdiendo o empatando, con una línea distinta a los 20, 65 y 80 minutos (5 estilos × 3 situaciones × 3 momentos).
- Ejemplos: un rival de contragolpe que gana "se encierra y espera el error para liquidarlo", y si pierde "se juega el todo por el todo y deja espacios atrás".
- Se agregó la nota de los 80 minutos (el resto del relato y el resultado no cambian; los tests lo comprueban).
Pendiente: que los clubes con plantel real usen a sus jugadores en vez del once armado.

## Decimoctava tanda (nombres propios por club y por jugador)
- Hallazgo sobre "planteles reales": de los 245 clubes, 231 no tienen jugadores guardados. Los 10 clubes con plantel son de otras cuentas (la base solo deja ver los jugadores propios, `owner_all`) y 3 clubes más tienen 1 jugador. Los rivales de la liga se arman siempre al empezar el partido; no hay planteles reales que usar sin crear datos nuevos.
- Respuesta a la pregunta del DT: sí, cada club y cada jugador rival tiene nombre propio. `domain/rivalNames.js` tiene unos 80 nombres y 150 apellidos (más de diez mil combinaciones), siempre los mismos para el mismo club y sin repetir nombre ni apellido dentro de un once. Antes eran 15 nombres y 20 apellidos (300 combinaciones).
Decisión del DT: se queda con el once generado (estable por club en nombres y atributos); no se guardan planteles de rivales en la base. Queda descartado agregar filas en `players` para los rivales. Si más adelante se quieren lesiones o tarjetas del rival que se arrastren entre partidos, hay que reabrir este punto.

## Bug del iPhone: la página se movía en /match
- Causa: aunque la pantalla era de alto fijo, el documento seguía pudiendo "tirarse" (rebote de iOS) y se movía todo. Ahora el partido y el menú del celular son un marco fijo (`fixed inset-0`) y `usePageLock` bloquea el scroll y el rebote del documento mientras están montados; solo scrollean los contenedores internos. En escritorio no cambia nada.

## Rediseño de la rueda de prensa
- Se quitó el encabezado con el micrófono y el texto "Rueda de prensa", y también las flechas para pasar de respuesta (el `Pager`): ahora las cuatro posturas están siempre a la vista, como fichas de tono en una grilla de 2×2 (ícono, nombre del tono, impacto en la moral y las primeras líneas de lo que dirías). Un toque responde.
- Barra superior nueva: avance de la conferencia (barritas), humor de la sala y, a la derecha, tres botones de ícono: no presentarme, delegar en el 2º entrenador y apagar la cuenta regresiva. Después de la primera respuesta quedan "Terminar acá" y el cronómetro.
- La reacción muestra lo que dijiste (globo "Vos dijiste"), la cara de la sala y el efecto en hinchada y dirigencia, y pasa sola a la siguiente.
- Los minijuegos de cierre (frase del DT, titular o fake, relámpago) suman íconos en cada opción.
Pendiente: que las fichas de tono sean arrastrables hacia el micrófono, y sonidos o vibración al responder.

## Fichas de la prensa arrastrables al micrófono, y sonido y vibración
- Las fichas de tono se pueden tocar (como antes) o arrastrar hasta el micrófono de abajo; al llegar, el micrófono se agranda y dice "Soltá la ficha para decirlo". Si se suelta lejos, la ficha vuelve a su lugar sin responder. Una respuesta se cuenta una sola vez aunque se toque y se arrastre.
- `lib/feedback.js`: vibración (Android; el iPhone no vibra desde el navegador) y tonos cortos con WebAudio. El sonido arranca apagado y se enciende con el botón de la barra superior de la prensa; la vibración suena en: responder en la prensa, goles del partido (festejo si es tuyo, golpe si es del rival), el remate y la atajada, y los desafíos de las historias.
Pendiente: nada de esta línea. Posibles ideas: sonido de multitud en el partido y vibración al fallar un desafío por poco.

## Arreglos de iOS: asistentes y aviso de actualización
- `Wizard` (creación de DT y de club): en el celular es un marco fijo (`fixed inset-0`) con el contenido que scrollea adentro y la barra "Atrás / Siguiente" en el flujo, abajo, sin `position: fixed` propio; la página no se mueve (`usePageLock`). En escritorio sigue siendo una página normal con la barra debajo del formulario. Verificado en el navegador: barra a 743-812 px de 812 y la página bloqueada.
- `ReloadPrompt` (aviso de actualización): en el celular se despega del borde (`bottom: 4,75 rem + zona segura`) para no tapar el menú inferior y ocupa el ancho; en escritorio queda abajo a la derecha. Ahora es `role="status"` y tiene tests (con un sustituto del módulo virtual de la PWA para las pruebas).
