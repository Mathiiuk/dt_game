# Roadmap de bugs y mejoras v2 — 06/10/2026

Estado: **borrador para tu aprobación**. No se tocó código.
Fuente: `docs/bugs_mejoras_v2.md` (tu lista manual), tu segunda tanda del 06/10 (prensa, partido, finanzas, bitácora) y lo que encontré al leer el código.
Relación con `docs/roadmap.md`: aquel cubre tus pasos de seguridad, servidor y herramientas; este cubre lo que encontraste jugando. Donde se pisan lo aclaro en la sección 9.
Método: cada ítem se revisó en el código para confirmar la causa antes de estimarlo. Donde dice "a verificar" es porque hace falta verlo en el navegador o en la base.

Roles usados (`.agents/skills/`): director-tecnico (orden, ramas, criterios de cierre), product-designer (pantallas y móvil), frontend-engineer, backend-engineer (base y funciones SQL), qa-engineer (tests), spec-to-plan (los documentos de diseño aparte).

---

## 1. Resumen

- **Tus dos listas suman 33 ítems.** Quedaron en 19 bugs, 11 mejoras, 5 documentos de diseño y 5 preguntas respondidas (sección 8). Sumé 5 hallazgos propios.
- **Ya verifiqué qué estaba hecho** (sección 9): varias cosas que pediste existen en parte, y corregí 2 diagnósticos míos de la primera versión.
- **Lo más grave no es lo que más se ve.** El cierre anual tiene tres versiones distintas en el código y las dos que se usan están rotas: no generan los partidos del año siguiente, una te asciende de categoría siempre sin mirar la tabla, y el botón "Cierre anual" de la Tabla te deja saltear la temporada entera en cualquier momento.
- **Los eventos aleatorios pueden cobrarte dos veces.** Si apretás dos opciones seguidas, las dos se pueden aplicar.
- **La pirámide de ligas es decorativa.** Existe una sola liga (división 5). Ascender cambia un número en el club, pero seguís jugando contra los mismos rivales con el mismo nivel. Por eso "un potrero rinde como uno de primera".
- **La liga tiene 19 fechas, no 38.** El juego dice 38 en varios lados, pero se genera solo la ida. Quedan unas 30 semanas sin partidos por temporada, que es parte de por qué el año se siente lento.

- **La prensa después del partido es larga.** Cada pregunta tiene su pantalla de reacción, y al final vienen seguidos tres minijuegos y la transcripción completa.

Orden propuesto: 7 etapas. Las etapas 0 y 1 son arreglos; de la 2 en adelante hay decisiones tuyas (sección 7).

**Para que no se te mezclen las pruebas**: cada entrega va a llevar el id de este documento (B4, M2...) en el nombre de la rama y en el reporte, con una lista corta de "qué probar". Una etapa no arranca hasta que la anterior esté mergeada.

---

## 2. Cómo leer este plan

| Prioridad | Significa |
|---|---|
| **P0** | Rompe un flujo o toca plata o datos de forma incorrecta |
| **P1** | El juego se comporta mal o le miente al jugador |
| **P2** | Molesta o resta calidad |
| **P3** | Detalle |

Esfuerzo: **S** menos de 2 h · **M** medio día a 1 día · **L** 1 a 3 días · **XL** más de 3 días.

Flujo de trabajo, el de siempre: una tarea `agt` y una rama por ítem o grupo (`fix/...` o `feat/...`), tests, `executions/<id>.md`, push y merge automático por CI. Archivos agregados por nombre, nunca `git add -A`.

---

## 3. Bugs

### P0

#### B1. Los eventos aleatorios dejan elegir más de una opción
- **Tu ítem**: "seleccionás uno, se pone un spinner pero te deja seguir apretando los otros indefinidamente".
- **Causa**: en `src/features/dashboard/Dashboard.jsx:118` cada opción es un botón independiente. El spinner bloquea solo el que apretaste. Además `resolveEvent` (`src/api/events.js:294-309`) primero lee si el evento ya está resuelto y recién al final lo marca (línea 402): dos clics seguidos pasan los dos ese control y aplican los dos efectos (caja, moral, reputación).
- **Arreglo**: (1) la tarjeta entera se bloquea al elegir; (2) `resolveEvent` reclama el evento en un solo paso (`update ... where status = 'PENDING'`) antes de aplicar nada; si no lo pudo reclamar, no hace nada.
- **Aceptación**: apretar dos opciones seguidas aplica una sola. Test de regresión con dos llamadas en paralelo.
- **Esfuerzo**: S · **Rama**: `fix/event-single-choice`

#### B2. El cierre anual está roto en varios puntos
- **Tus ítems**: "el cierre anual tarda mucho", "debería pasar de 2026 a 2027", "si cerrás anual empieza la temporada sin partidos", "reveer si dejamos o sacamos esta sección".
- **Causa**: hay tres implementaciones del cierre.

  | Función | Quién la usa | Problemas |
  |---|---|---|
  | `gameLoopApi.endSeason` (`src/api/gameLoop.js:66`) | Botón "Cierre anual" de la Tabla (`StandingsScreen.jsx:107`) y el paso automático de la semana 52 a la 53 (`calendar.js:466`) | No genera partidos nuevos. Te sube de categoría siempre, sin mirar la posición (líneas 106-109). El botón está disponible en cualquier semana. |
  | `seasonCloseApi.executeSeasonClose` (`src/api/seasonClose.js:30`) | Gala de fin de temporada del Inicio | No genera partidos nuevos. Escribe la tabla y los jugadores de a una fila por vez (líneas 194-223), por eso tarda. Guarda siempre "división 5" (línea 84). |
  | `seasonApi.closeSeason` (`src/api/season.js:33`) | Nadie (código viejo) | Es la única que regenera el fixture, pero con premios de la economía vieja ($250.000). |

- **Más causas de lo mismo**:
  - La Gala del Inicio se muestra con `club.current_week >= 52` (`Dashboard.jsx:206`), y esa columna no aparece en `clubs` ni en el contexto: es probable que la Gala nunca se muestre (a verificar en la base).
  - La Gala recibe `club.current_season_year || 2026` (`Dashboard.jsx:415`): siempre 2026. En la segunda temporada diría "ya está cerrada" y no haría nada.
  - Los partidos se crean con fechas fijas desde el 01/08/2026 (`competition.js:246`). Tras el cierre el reloj pasa a 2027 y el calendario busca partidos de 2027: no hay ninguno.
- **Arreglo**: una sola función de cierre, en el servidor (función SQL, como el resto de lo que mueve plata), que en un paso: archiva la tabla, paga el premio, aplica ascenso o descenso según la posición real, envejece el plantel, libera contratos vencidos, reinicia la tabla y **genera el fixture del año nuevo**. Se borran las otras dos.
- **Sobre "dejamos o sacamos"**: recomiendo **sacar el botón "Cierre anual" de la Tabla** y dejar solo la Gala, que aparece sola cuando se jugó la última fecha. Así no hay forma de saltear la temporada por error ni hace falta esperar.
- **Aceptación**: al jugar la última fecha aparece la Gala; cerrarla tarda menos de 5 s; el año pasa de 2026 a 2027; `/calendar` muestra los partidos de 2027; la categoría cambia solo si la posición lo indica; cerrar dos veces no duplica nada.
- **Esfuerzo**: L · **Rama**: `fix/season-close-unified` · requiere migración (la aplicás vos o la autorizás).

#### B3. La liga tiene 19 fechas y el juego dice 38 (hallazgo mío)
- **Causa**: `generateRoundRobinFixtures` (`competition.js:250`) recorre solo la ida. El comentario, la pirámide ("al terminar las 38 fechas") y el texto de la Gala hablan de 38.
- **Efecto**: de 52 semanas, 19 tienen partido. El resto es avanzar semanas vacías pagando sueldos (lo que ya habíamos anotado como "la pretemporada drena la caja").
- **Arreglo**: va junto con B2. Depende de una decisión tuya (sección 7, punto 2).
- **Esfuerzo**: incluido en B2.

### P1

#### B4. La posición en liga del Inicio no se actualiza
- **Causa**: el Inicio muestra `standingsSnippet.rank` (`Dashboard.jsx:373`) y la tabla `standings` no tiene esa columna (`supabase.sql:175-188`). El puesto se calcula en memoria solo en la pantalla Tabla (`competition.js:85`). Puntos y jugados sí se actualizan; el puesto queda en "—".
- **Arreglo**: el Inicio toma el puesto de la misma función que la Tabla (ya tiene caché).
- **Aceptación**: tras jugar un partido, el Inicio muestra el mismo puesto que la Tabla. Test.
- **Esfuerzo**: S · **Rama**: `fix/dashboard-league-position`

#### B5. La Tabla pinta descenso en una división sin descensos
- **Causa**: `zoneOf` (`src/domain/standings.js:13`) marca siempre a los últimos 3 y no mira la categoría. La leyenda también está fija (`StandingsScreen.jsx:116`). La pirámide sí sabe que la división 5 no desciende (`competitionTiers.js:61`).
- **También fijo**: "Torneo regional · División Tier 5" en la Tabla (`StandingsScreen.jsx:97`) y en el Inicio (`Dashboard.jsx:222`), aunque asciendas.
- **Arreglo**: zonas y leyenda salen de la configuración de la división del club. El título muestra la división real.
- **Esfuerzo**: S · **Rama**: `fix/standings-zones-by-tier`

#### B6. "Resolver" una baja médica lleva al Plantel y no hay cómo llegar a Enfermería
- **Causa**: la alerta apunta a `/squad` (`src/api/dashboard.js:86`). La pestaña de `/club` vive en estado local (`ClubScreen.jsx:45`), así que no existe un enlace directo a Enfermería.
- **Arreglo**: la pestaña del Club pasa a la dirección (`/club?tab=enfermeria`). La alerta apunta ahí. Mismo criterio para el resto: contratos por vencer abre Plantel filtrado; un lesionado en Plantel enlaza a Enfermería; déficit abre Finanzas.
- **Aceptación**: cada aviso del Inicio abre el lugar exacto donde se resuelve. Lista de enlaces cruzados en el test.
- **Esfuerzo**: M · **Rama**: `fix/cross-links`

#### B7. No hay botón de cerrar sesión
- **Causa**: `authApi.logout` existe (`src/api/auth.js:437`) y ninguna pantalla lo llama.
- **Arreglo**: en escritorio, al pie del menú lateral junto al nombre del DT; en móvil, al final de "Más". Con confirmación.
- **Esfuerzo**: S · **Rama**: `fix/logout-button`

#### B8. El resumen del Club muestra números inventados (hallazgo mío)
- **Causa**: `ClubScreen.jsx:37` usa un ingreso semanal fijo de $40.000 (la caja inicial es de unos $20.000). Los sueldos los divide por 52 (línea 71), pero el sueldo guardado ya es semanal (`src/api/player.js:89-90`): muestra una nómina 52 veces más chica. "Margen semanal" no coincide con Finanzas. Otear cuesta $5.000 fijos, un cuarto de la caja inicial.
- **Arreglo**: el resumen usa los mismos números que Finanzas. El costo de otear se revisa en el documento de `/club` (D2).
- **Esfuerzo**: S · **Rama**: `fix/club-summary-numbers`

### P2

#### B9. Los tres botones de dificultad no se entienden
- **Tu pregunta**: "¿por qué aparecen los 3 botones de dificultad, a qué se debe?"
- **Respuesta**: es el selector del motor de consecuencias (`ClimatePanel.jsx:100-109`). Escala cuánto pegan las consecuencias y cada cuánto aparecen eventos. Quedó en la tarjeta "Clima del club" sin explicación.
- **Arreglo propuesto**: sacarlo del Inicio. Se elige al crear la carrera, con una línea que explique cada nivel, y se puede cambiar desde un apartado de ajustes junto a "Cerrar sesión".
- **Esfuerzo**: S · **Rama**: `fix/difficulty-setting`

#### B10. Logros y Salón de la Fama sobran en el menú
- **Causa**: están en `navigation.js:45-46` y también como botones en Carrera del DT (`ManagerCareerScreen.jsx:187-188`).
- **Va en la misma rama**: el menú lateral dice "EL PIZARRÓN" (`AppShell.jsx:15`) y el juego se llama Vestuario. Es el único lugar visible; el resto de la app ya dice Vestuario.
- **Arreglo**: quitarlos del menú lateral y de "Más". El título de la barra superior móvil hoy sale del menú, así que hay que darles título propio para que no diga "Vestuario".
- **Esfuerzo**: S · **Rama**: `fix/nav-cleanup`

#### B11. Los títulos de sección generan scroll de más en escritorio
- **Causa**: `PageHeader` (`src/components/ui/page-header.jsx:14-29`) usa título de 36 px, rótulo arriba, descripción abajo y margen, dentro de páginas con `py-8`. En varias pantallas después viene una tarjeta de resumen y recién ahí el contenido. En móvil, además, el título se repite: está en la barra superior y otra vez en la página (solo el Inicio lo oculta).
- **Arreglo**: cabecera compacta de una línea (título más chico, rótulo y acciones en la misma fila, descripción solo donde aporta). En móvil se oculta el título de página cuando la barra superior ya lo muestra.
- **Aceptación**: en 1366×768 el contenido principal de cada pantalla empieza en el primer tercio. Revisión de las 15 pantallas.
- **Esfuerzo**: M · **Rama**: `fix/compact-headers`

#### B12. Botones Siguiente y Atrás fijos en la creación de carrera (móvil)
- **Estado**: **ya está hecho para pantallas de menos de 640 px**. Los dos asistentes (DT y club) usan el mismo marco, que fija la barra abajo (`src/components/ui/wizard.jsx:56`). Entre 640 y 1024 px (celular acostado, tablet) la barra deja de estar fija. Necesito que me digas en qué dispositivo y en qué paso lo viste; si fue en ese rango, el arreglo es extender la barra fija hasta 1024 px.
- **Esfuerzo**: S · **Rama**: `fix/wizard-mobile-nav`

#### B13. Pantalla de ingreso: más compacta y sin el logo de reCAPTCHA
- **Arreglo**: reducir espacios y textos para que entre sin scroll en 375×667. La insignia de reCAPTCHA se puede ocultar por estilos, pero Google exige a cambio dejar visible el texto "Protegido por reCAPTCHA" con los enlaces a Privacidad y Términos. Va como una línea chica al pie.
- **Esfuerzo**: S · **Rama**: `fix/auth-compact`

#### B14. La Tabla muestra datos inventados si falla la carga (hallazgo mío)
- **Causa**: ante cualquier error, `getStandings` devuelve una tabla falsa con "Tu Club" ganando 2-0 (`competition.js:104-136`).
- **Arreglo**: mostrar un estado de error con "Reintentar".
- **Esfuerzo**: S · va en la rama de B5.

#### B15. En la prensa se puede delegar o no presentarse después de haber contestado
- **Tu pregunta**: "si hablás en la primera pregunta te deja seguir eligiendo pasarle al segundo entrenador, ¿eso está bien?" **No, es un error.**
- **Causa**: los botones "No presentarme" y "Delegar en 2º entrenador" se muestran en todas las preguntas (`PressRoom.jsx:124`, no mira en cuál vas). Y al delegar, `delegateToAssistant` (`src/api/press.js:426-441`) pisa también las respuestas que ya diste y suma +1 de moral, además de los efectos que ya se habían aplicado por tu respuesta.
- **Arreglo**: los dos botones solo antes de contestar la primera pregunta. Después, un "Terminar acá" que cierra la conferencia conservando lo ya respondido.
- **Prioridad**: P1 · **Esfuerzo**: S · **Rama**: `fix/press-delegate-first-only`

#### B16. La sala de prensa muestra "PRAISING" y otros códigos internos
- **Qué es**: el nombre interno del tono de la respuesta (elogioso). Se muestra crudo en el resumen de la conferencia (`PressRoom.jsx:251`) y en el archivo de `/club` (`PressRoomModal.jsx:66`). Los otros tres tonos tienen el mismo problema.
- **Arreglo**: una sola tabla de nombres (Elogioso, Combativo, Autocrítico, Cauteloso) usada en los dos lugares, y un caso más en el test de textos que impide códigos en mayúsculas en pantalla.
- **Prioridad**: P2 · **Esfuerzo**: S · **Rama**: `fix/ui-copy-round2` (junto con B17)

#### B17. Finanzas usa símbolos y palabras de contador
- **Causa**: "Superavitario (> 52 semanas)" (`src/api/finances.js:61`), "Respaldo de liquidez", "Autonomía sin ingresos extra", "Libro mayor", "Flujo neto semanal".
- **Arreglo**: textos como "Te alcanza para más de un año", "Te quedan 6 semanas de caja", "Movimientos", "Lo que entra y sale por semana". El test de textos suma la regla: sin `>` ni `<` en textos visibles. En la misma pasada se reescriben los textos médicos de Enfermería (sección 8).
- **Prioridad**: P2 · **Esfuerzo**: S · va con B16. El fondo del problema (que el cartel sea verdad) está en M11.

#### B18. En el partido, cuando se lesiona un jugador no queda claro qué hacer
- **Hoy**: el partido se pausa con "Un lesionado en tu equipo" (`src/domain/quickDecisions.js:84-89`) y el panel de cambios lo deja marcado para salir (`SubstitutionsPanel.jsx:14`). Pero el panel no dice que está lesionado, no explica qué pasa si lo dejás, no ordena el banco por puesto y usa letra de 11 px con botones de unos 26 px de alto.
- **Arreglo rápido** (antes del rediseño M6): cartel "Se lesionó X (puesto). Elegí quién entra", banco ordenado con los que juegan en ese puesto primero y la media que tendrían ahí, y la opción explícita "Que siga" con su riesgo.
- **Prioridad**: P1 · **Esfuerzo**: M · **Rama**: `fix/match-injury-sub`

#### B19. No se encuentra dónde elegir capitán y subcapitán
- **Hoy existe**: `/club` → Vestuario → enlace "Cambiar brazaletes" (`LockerRoomTab.jsx:265`). Es un texto de 11 px dentro de una tarjeta. Al crear el club se asignan solos (`src/api/lockerRoom.js:53`).
- **Arreglo**: botón visible en Vestuario, acción "Hacer capitán" en la ficha del jugador en Plantel, y la cinta marcada en Plantel y en la pizarra.
- **Prioridad**: P2 · **Esfuerzo**: S · **Rama**: `fix/captain-discoverable`

---

## 4. Mejoras

#### M1. Inicio reordenado, con los eventos en pantalla aparte
- **Tu ítem**: "mostrar lo más importante primero: próximos partidos, estado del plantel, finanzas, posición de liga; los sucesos random en una sección aparte que ocupe toda la pantalla".
- **Hoy**: el orden es avisos, eventos, clima, bitácora y recién después el próximo partido (`Dashboard.jsx:235-407`).
- **Propuesta**:
  1. Próximo partido con la acción principal.
  2. Fila de cuatro datos: plantel, finanzas, posición, carrera.
  3. Avisos, cada uno con su enlace directo (B6).
  4. Clima y bitácora, plegados en móvil.
  5. Los eventos salen del Inicio: aparece un aviso "Tenés una decisión pendiente" que abre la pantalla de decisión (M2). Los urgentes se abren solos y frenan el avance de semana.
- **Esfuerzo**: M · **Rama**: `feat/dashboard-priorities` · depende de B4 y B6.

#### M2. Eventos más arcade
- **Propuesta**: pantalla completa por evento (página en móvil, diálogo grande en escritorio). Una sola elección. Antes de confirmar se ve qué arriesgás (plata, hinchada, dirigencia). Después de elegir, una pantalla de resultado con el titular del diario y los medidores moviéndose. Sin animaciones si el sistema pide reducir movimiento.
- **Esfuerzo**: L · **Rama**: `feat/event-screen` · depende de B1.

#### M3. Más eventos, inspirados en el fútbol argentino
- **Hoy**: 22 plantillas de eventos y 19 historias.
- **Propuesta**: 12 eventos nuevos en tono de parodia, con nombres ficticios (ver decisión 4). Cada uno con 2 o 3 opciones y consecuencias por el motor de clima que ya existe.

  | Evento | Inspirado en | El dilema |
  |---|---|---|
  | El empate imposible | La elección de la AFA que terminó 38 a 38 con 75 votantes | Votás en la liga regional y sobra un voto: denunciar, callar o pedir algo a cambio |
  | Dos pelotas | El gol con dos pelotas en la cancha | El árbitro te cobra un gol con dos pelotas en juego: protestar o festejar |
  | Uno de más | El equipo que jugó con 12 | Te das cuenta de que tenés 12 en cancha: avisar o hacerte el distraído |
  | Tres metros afuera | El penal cobrado fuera del área en una final | Te regalan un penal que no fue: patearlo en serio o tirarlo afuera |
  | Se cortó la luz | El partido suspendido por un apagón cuando el local perdía | Vas perdiendo de local y el utilero te ofrece "un problema eléctrico" |
  | La manga | El gas pimienta en el túnel | La barra quiere "recibir" al rival en la manga: frenarla, mirar para otro lado o avisar |
  | El audio | Los audios pidiendo cambiar árbitros y horarios | Se filtra un audio del presidente de tu club pidiendo un árbitro amigo |
  | La escucha | Las escuchas sobre designación de árbitros | El dirigente de la liga te ofrece "elegir" al árbitro del clásico |
  | El perro | Clásico del ascenso | Un perro entra, frena un contraataque y la hinchada lo quiere de mascota |
  | El aspersor | Clásico del ascenso | Se prenden los aspersores en el minuto 88 ganando 1 a 0 |
  | El micro | Clásico del ascenso | El micro no llega y hay que ir en autos de los hinchas |
  | La camiseta | Clásico del ascenso | La alternativa es igual a la del rival y hay que jugar con pecheras |

- La investigación de fuentes (crónicas de TyC Sports, Infobae y demás) es parte de la tarea: los textos finales se escriben propios, sin copiar.
- **Esfuerzo**: M · **Rama**: `feat/events-argentine-pack`

#### M4. Calendario que no sea una lista de 52 filas
- **Hoy**: una fila por semana, con partido o sin él, y del partido solo dice "Local" o "Visitante": **no muestra contra quién jugás** (`CalendarScreen.jsx:163-169`). Los filtros ya existen (Todas, Apertura, Clausura, Fichajes, Partidos) y la pantalla ya se posiciona en la semana en curso; lo que falta es la vista compacta y el rival.
- **Propuesta**: vista por defecto "Próximos partidos" (los 5 que vienen, con rival y fecha) y "Resultados" (los jugados). Vista "Temporada" en grilla por mes, compacta, donde las semanas vacías ocupan una línea. Filtros que ya existen, más "De local" y "De visitante".
- **Esfuerzo**: M · **Rama**: `feat/calendar-views` · conviene después de B2 y B3.

#### M5. Nivel de los jugadores según la categoría
- **Tu ítem**: "un potrero es imposible que sea mejor que un equipo de primera o de la B".
- **Causa**: solo existen franjas de media para la división 5 (`src/domain/ratings.js:104`). El rival rinde siempre `50 + reputación / 2` (`src/domain/matchSquad.js:157`). Los partidos entre rivales son al azar (`competition.js:343`). Y hay una sola liga: ascender no cambia de rivales.
- **Propuesta**:
  1. Franjas de media por división (decisión 5).
  2. Al ascender o descender, el club entra a una liga nueva con rivales del nivel de esa división.
  3. El mercado ofrece jugadores acordes a la división.
  4. El resultado entre rivales pesa su nivel en vez de ser azar puro.
- **Esfuerzo**: XL · **Rama**: `feat/tiered-leagues` · depende de B2.

#### M6. Rediseño completo de `/match`, escritorio y móvil
- **Hoy**: `MatchScreen.jsx` (665 líneas) usa letra de 10 y 11 px en estadísticas, gritos y cambios, y botones muy por debajo de los 48 px que pide el criterio táctil del proyecto.
- **Propuesta**: primero el documento D5 con la pantalla dibujada. Líneas generales: marcador y reloj siempre visibles; en móvil una barra inferior fija con las acciones (pausa, velocidad, cambios, gritos) en botones de 48 px; relato en el centro; cambios y decisiones como hoja que sube desde abajo; en escritorio tres columnas (tu equipo, relato, rival y estadísticas). Para lectores de pantalla, los goles y las decisiones se anuncian.
- **Esfuerzo**: XL · **Rama**: `feat/match-redesign` · absorbe lo de B18.

#### M7. Bitácora rediseñada
- **Hoy**: "Esto pasó por tu decisión" es una lista plana de 8 textos con el número de semana (`ClimatePanel.jsx:116-154`). No dice qué subió o bajó ni de dónde vino.
- **Propuesta**: agrupada por semana, con el origen (partido, prensa, mercado, evento, barra) y el efecto en etiquetas ("Hinchada sube", "Caja −$500"). En el Inicio quedan las 3 últimas; "Ver todo" abre la bitácora completa con filtro por origen.
- **Esfuerzo**: M · **Rama**: `feat/logbook` · va junto con M1.

#### M8. Prensa posterior al partido más corta y más chica
- **Tu ítem**: "es muy lento y gigante el sistema de prensa".
- **Hoy**: cada pregunta son dos pantallas (pregunta y reacción de la sala, con un botón para seguir). Al terminar aparecen seguidos "Completá la frase", "Titular o fake", la cartilla del Bingo y la transcripción completa (`PressRoom.jsx:175-258`). Delegar escribe pregunta por pregunta (`press.js:432`).
- **Propuesta**: 2 preguntas por conferencia; la reacción se muestra en la misma pantalla y avanza sola; **un** minijuego por conferencia, rotando; el Bingo como una línea de avance que se abre si querés verlo; transcripción plegada. Objetivo: terminar la prensa en menos de 40 segundos y sin scroll en 375×667.
- **Esfuerzo**: M · **Rama**: `feat/press-compact` · depende de B15.

#### M9. Preguntas de prensa según lo que pasó
- **Hoy**: las preguntas dependen solo de si ganaste, empataste o perdiste, del marcador y del nombre del rival (`press.js:79-260`).
- **Propuesta**: un armador de preguntas que mira el partido (expulsión, goleada, gol sobre la hora, lesionado, capitán al banco, debut de un juvenil), la semana (racha, clima, la barra, un fichaje, una venta) y la historia en curso (capítulo activo). Cada conferencia toma una pregunta del partido y una de la semana.
- **Esfuerzo**: L · **Rama**: `feat/press-context` · ya estaba anotado como pendiente en `docs/roadmap.md` sección 3.

#### M10. Más minijuegos en la rueda de prensa
- **Hoy hay tres**: Completá la frase, Titular o fake y Bingo del DT.
- **Propuesta de cuatro nuevos**, uno por conferencia en rotación (encaja con M8):
  - **¿Quién lo dijo?**: una frase y tres personajes del club; acertar suma con la dirigencia.
  - **Esquivá la pregunta**: una barra que se mueve; frenarla en la zona verde es una gambeta elegante, en la roja quedás como que escondés algo.
  - **Off the record**: le contás algo al periodista o no; puede volver como titular a favor o en contra semanas después.
  - **Armá el titular**: ordenás tres palabras; según cómo quede, cambia el tono del diario.
- **Esfuerzo**: M · **Rama**: `feat/press-minigames-2`

#### M11. Finanzas a prueba de principiantes
- **Tu ítem**: "que el usuario no pierda en los primeros partidos por mal uso financiero".
- **Hoy** (medido en la prueba con cuenta real, anotado en `docs/roadmap.md` 1.2): hasta la fecha 1 hay cuatro semanas sin partidos y el club pierde unos $1.800 por semana. El cartel de Finanzas dice "Superavitario" porque cuenta la taquilla de partidos que todavía no se jugaron (`src/api/finances.js:51`). Otear cuesta un cuarto de la caja inicial y no avisa.
- **Propuesta**:
  1. La dirigencia cubre los sueldos de la pretemporada (o amistosos: decisión 6).
  2. Red de contención en las primeras 8 semanas: ningún gasto único puede dejarte con menos de 4 semanas de caja sin una confirmación que lo diga claro (el motor de avisos ya existe en `src/domain/warnings.js`).
  3. Sin despido ni sanción por déficit durante las primeras 6 fechas.
  4. El indicador de caja usa lo que de verdad entra y sale esa semana.
  5. Costos de otear, obras y staff revisados contra la caja inicial.
- **Esfuerzo**: M para 1 a 4 · el punto 5 se define en D4 · **Rama**: `feat/finance-safety-net`

---

## 5. Documentos de diseño que pediste aparte

Cada uno es un `.md` en `docs/` con: qué hay hoy, qué se usa y qué no, propuesta de pantalla, qué se saca, y tareas estimadas. Se escribe, lo aprobás, y recién ahí se arma su etapa de implementación.

| Id | Documento | Qué tiene que resolver | Esfuerzo del doc |
|---|---|---|---|
| D1 | `docs/national_team_v2.md` | Mejoras para `/national-team` | S |
| D2 | `docs/club_v2.md` | `/club` tiene 8 pestañas y 3 paneles (unas 3.300 líneas). Cuáles se fusionan, cuáles pasan a otra sección y cuáles se sacan. Incluye el costo de otear (B8) y dónde queda Enfermería | M |
| D3 | `docs/market_v3.md` | Rediseño completo de `/market`. Parte de `docs/mercado_2_0.md` y de lo ya hecho en el servidor (negociación, cuotas, representantes), que se conserva: lo que cambia es la pantalla | M |
| D5 | `docs/match_v2.md` | Pantalla de partido nueva para escritorio y móvil (M6), con las medidas táctiles y el recorrido de un cambio por lesión | M |
| D4 | `docs/finances_v2.md` | Qué hace "Instalaciones" (hoy son tres tarjetas de mejora: estadio, tienda y centro médico, que se pisan con "Estadio y obras" del Club), y rediseño de `/finances`. Incluye la revisión de costos de M11 | M |

---

## 6. Orden propuesto

| Etapa | Qué entra | Por qué en este lugar | Esfuerzo |
|---|---|---|---|
| **0. Arreglos rápidos** | B1, B4, B5 + B14, B6, B7, B8, B10, B15, B16 + B17, B19 | Riesgo bajo, se notan enseguida. B1 y B15 tocan plata y moral | 2 a 3 días |
| **1. Temporada** | B2 + B3 | Sin esto no se puede jugar un segundo año. Lleva migración | 2 a 3 días |
| **2. Primeros partidos** | M11 (puntos 1 a 4), B18 | Es lo que decide si un jugador nuevo se queda: no fundirse y entender una lesión | 2 días |
| **3. Pantallas compactas** | B9, B11, B12, B13, M4, M8 | Todo interfaz, sin riesgo de datos. En paralelo escribo D1 a D5 para que los vayas leyendo | 3 a 4 días |
| **4. Inicio, eventos y prensa** | M1 + M7, M2, M3, M9, M10 | Depende de B1, B4, B6 y M8 | 5 a 7 días |
| **5. Partido y categorías** | M6 (tras aprobar D5), M5 | Lo más grande. M5 depende de la etapa 1 | 8 a 11 días |
| **6. Rediseños** | Lo que salga de D1 a D4 | Se estima cuando apruebes cada documento | a definir |

Cierre de cada tarea: tests unitarios y de comportamiento en verde, `agt task:verify`, verificación en el navegador en 375 y 320 px con tu cuenta, y reporte en `.agents/workflow/executions/` con la lista de "qué probar".

---

## 7. Decisiones que necesito de vos

1. **Cierre anual**: ¿saco el botón de la Tabla y dejo solo la Gala automática al terminar la liga? Recomiendo que sí.
2. **Largo de la temporada**: hoy son 19 fechas en 52 semanas. Opciones:
   - **A (recomendada)**: 38 fechas ida y vuelta, y la temporada termina cuando termina la liga. Un año de juego son unas 42 semanas, casi todas con partido.
   - B: dejar 19 fechas y acortar el año a unas 24 semanas. Temporadas más rápidas, menos realista.
3. **Dificultad**: ¿la paso a la creación de carrera y a ajustes, fuera del Inicio? Recomiendo que sí.
4. **Eventos basados en hechos reales**: recomiendo parodia con nombres inventados, sin nombrar personas ni clubes reales. Es más seguro y deja más libertad para el humor.
5. **Medias por división**: propuesta inicial, para ajustar en el documento de M5.

   | División | Media típica del plantel |
   |---|---|
   | 5 Regional | 50 a 60 |
   | 4 Primera C | 56 a 66 |
   | 3 Primera B | 62 a 72 |
   | 2 Nacional | 68 a 79 |
   | 1 Primera | 75 a 90 |

6. **Pretemporada**: ¿la dirigencia cubre los sueldos hasta la fecha 1, o se juegan amistosos con taquilla? Recomiendo la cobertura: es más simple y se puede cobrar después como exigencia de la dirigencia. Es la misma decisión que quedó abierta en `docs/roadmap.md` 1.2.
7. **Prensa**: ¿te parece bien bajar a 2 preguntas y un minijuego por conferencia (M8)? Recomiendo que sí.
8. **Botones fijos del asistente (B12)**: ¿en qué dispositivo y en qué paso lo viste?

La etapa 0 y la parte de interfaz de la 3 no dependen de ninguna de estas decisiones.

---

## 8. Preguntas tuyas, respondidas

**¿Qué es "infiltrar" en Enfermería?**
Es inyectarle un calmante a un lesionado para que juegue igual el próximo partido. Solo se puede con lesiones leves o moderadas a las que les quedan 2 semanas o menos. Sale bien la mitad de las veces: juega, pero al 60% de su físico. La otra mitad sale mal: suma 10 semanas de baja y pierde 2 puntos de ritmo y 2 de resistencia para siempre (`src/api/injuries.js:308-402`). La pantalla lo explica con palabras médicas ("analgesia infiltrativa", "fase inflamatoria aguda"); se reescribe en criollo junto con B17.

**¿Cómo decido el capitán y el subcapitán?**
Hoy: `/club` → pestaña Vestuario → tarjeta "Capitanía oficial" → "Cambiar brazaletes". Sacarle la cinta a un líder baja la moral. Como está escondido, queda como B19.

**¿Qué es "PRAISING"?**
El código interno del tono "elogioso" de una respuesta de prensa. No debería verse: B16.

**¿Por qué hay tres botones de dificultad?**
Es el selector del motor de consecuencias: B9.

**¿Está bien poder delegar la prensa después de contestar?**
No: B15.

---

## 9. Verificación: qué de este roadmap ya estaba hecho

Revisé cada propuesta contra el código y las migraciones (master, commit `c3c9f76`). Esto es para que no pruebes como pendiente algo que ya anda, ni des por hecho algo que falta.

### Ya existe, total o en parte

| Ítem | Qué hay hoy | Qué falta de verdad |
|---|---|---|
| B12 botones fijos del asistente | Fijos abajo en pantallas de menos de 640 px, en los dos asistentes | Solo el rango de 640 a 1024 px, si es ahí donde lo viste |
| M4 calendario | Filtros Todas, Apertura, Clausura, Fichajes y Partidos; se posiciona en la semana en curso | Nombre del rival, vista compacta, próximos y resultados |
| B1 eventos | El botón apretado ya muestra carga y se bloquea; hay un control de "ya resuelto" | Bloquear las otras opciones y que el control aguante dos clics |
| B6 Enfermería | La pestaña existe y funciona | Solo el enlace directo desde el aviso |
| B9 dificultad | Funciona y se guarda por club | Solo moverla y explicarla |
| B19 capitán | Se puede elegir en Vestuario | Que se encuentre |
| M10 minijuegos | Hay tres (frase, titular, bingo) | Los nuevos |
| M8 prensa | Ya se puede sacar la cuenta regresiva, no presentarse y delegar | Acortarla |
| M11 avisos | Ya hay avisos antes de comprar caro, vender a un ídolo o subir la entrada | Red de contención al inicio y cartel de caja real |
| D3 mercado | Negociación, cuotas, contratos, comisiones y ventas ya resueltos en el servidor | El rediseño es de la pantalla, no de las reglas |

### Corregí dos diagnósticos míos de la primera versión

| Ítem | Qué decía | Qué es en realidad |
|---|---|---|
| B4 | Que "Fecha N" del Inicio mostraba siempre "Fecha 1" | No: un disparador de la base mantiene iguales `round` y `match_week` (`scripts/db/migration_schema_drift_compat.sql:15-16`). Lo saqué. Lo del puesto sí está confirmado |
| B8 | Que el Club leía una columna de sueldo distinta | La columna es correcta y el sueldo ya es semanal; el error es que lo divide por 52 |

### Se pisa con `docs/roadmap.md` (no está hecho en ninguno de los dos)

| Acá | Allá | Cómo queda |
|---|---|---|
| M5 nivel por categoría | 1.1 rivales sin fuerza propia | Es el mismo trabajo. Se hace una vez, como M5, e incluye resolver los partidos de liga en el servidor |
| M11 punto 1 | 1.2 economía de la pretemporada | La misma decisión (6) |
| M9 preguntas según lo ocurrido | Sección 3, línea Prensa | Lo mismo |
| B2 cierre en el servidor | 2.1 etapa C, premios de fin de temporada | B2 lo cubre |

### Confirmado que no está hecho

B2, B3, B5, B7, B10, B11, B13, B14, B15, B16, B17, B18, M1, M2, M3, M5, M6, M7, M9. De los 12 eventos de M3 ninguno existe entre los 22 actuales.

### Sigue "a verificar" en la base o en el navegador

- Que la Gala de fin de temporada no aparece (B2). Las migraciones no crean `current_week` en `clubs`, lo que apunta a que no aparece, pero no lo vi en la base.
- El caso exacto de B12.

---

## 10. Trazabilidad con tus listas

| Tu ítem | Dónde quedó |
|---|---|
| Posición en liga no se actualiza | B4 |
| Eventos aleatorios: elegir uno solo, más arcade | B1, M2 |
| Mejorar calendario | M4 |
| Títulos que generan scroll en escritorio | B11 |
| Cierre anual lento y cambio de año | B2 |
| Tras el cierre no hay partidos | B2 |
| Última liga pero últimos 3 en rojo | B5 |
| Rendimiento según la categoría | M5 |
| Propuesta para national-team | D1 |
| Propuesta para /club | D2 |
| Rediseño de /market | D3 |
| Instalaciones y rediseño de /finances | D4 |
| Quitar Logros y Salón del menú | B10 |
| Baja médica lleva a /squad, conectar secciones | B6 |
| Botón de cerrar sesión | B7 |
| Los 3 botones de dificultad | B9 |
| Más eventos aleatorios | M3 |
| Botones fijos en la creación de carrera (móvil) | B12 |
| Auth compacto y sin logo de reCAPTCHA | B13 |
| Inicio con lo importante primero y eventos aparte | M1 |
| **Segunda tanda** | |
| Delegar al segundo entrenador después de contestar | B15 |
| Más minijuegos en la rueda de prensa | M10 |
| Cambio cuando se lesiona un jugador | B18, M6 |
| Mejorar /match en escritorio y móvil, botones accesibles | M6, D5 |
| Mejorar o rediseñar la bitácora | M7 |
| "El Pizarrón" en el menú: el juego se llama Vestuario | B10 |
| Símbolos > y < en /finances | B17 |
| Cómo decido capitán y subcapitán | B19, sección 8 |
| Qué es infiltrar en Enfermería | Sección 8, B17 |
| Texto "PRAISING" en sala de prensa | B16 |
| Preguntas de prensa según el partido, la semana y la historia | M9 |
| Sistema financiero: no fundirse al principio | M11, D4 |
| Prensa de /post-match lenta y gigante | M8 |
