# Plan de bugs y mejoras — 05/10/2026

Estado: **borrador para aprobación**. No se implementó nada de este documento todavía.
Fuente: tu lista del 05/10 (al final, tal cual la dejaste) más lo que encontré al investigar el código y la base.

---

## Estado de avance (actualizado)

**Decisiones tomadas por vos (05/10):** orden aprobado; medias estilo FIFA regenerando los planteles; posiciones PO, DFC, LI, LD, MCD, MC, MCO, MI, MD, EI, ED, DC; copa como en la vida real; consecuencias con avisos antes de acciones riesgosas; química modelo propuesto; rueda de prensa omitible con evento aleatorio según se ganó o perdió (a investigar en la vida real).
**Visión del modo de juego:** arcade con mirada realista de lo que es sostener un club. Todo conectado: si vas bien, todo fluye; si vas mal, empiezan las apretadas de la barra, la corrupción y los eventos aleatorios.

| Etapa | Ítems | Estado |
|---|---|---|
| 1. Hotfix | B1 ojear, B2 otear, B6 inicio con partido viejo, H1 goles (y titulares y asistidor), B13 repo | Hecho y mergeado |
| 2. Interacción | B3 botones con spinner y bloqueo, B4 hitos duplicados (con migración), B5 desempleado | Hecho y mergeado |
| 3. Reglas | B8 copa por fechas, B9 charlas (moral unificada con migración), B11 fecha FIFA, B12 reclamar todo | Hecho y mergeado |
| 4. Textos | B10 textos y errores | Hecho y mergeado (nombres de logros y clubes guardados como datos quedan como están) |
| 5. Datos del juego | M3 posiciones y medias FIFA, B7 posición del once | Hecho y mergeado (datos convertidos in situ, no regenerados) |
| 6. Consecuencias | M1 | Pendiente (requiere diseño aprobado antes) |
| 7 a 10 | M4 pizarra, M5 partido, M2 rendimiento, M6 mercado | Pendiente |

---

## 0. Cómo leer este plan

**Prioridad**

| Nivel | Significa | Ejemplo |
|---|---|---|
| **P0 Crítico** | Rompe un flujo o corrompe datos. Se arregla primero. | Ojear falla siempre |
| **P1 Alto** | El juego se comporta mal o miente al jugador, pero se puede seguir. | El dashboard muestra un partido ya jugado |
| **P2 Medio** | Molesta o resta calidad, no bloquea. | Textos con símbolos |
| **P3 Liviano** | Limpieza, higiene, detalles. | Archivo pesado en el repo |

**Esfuerzo (estimado)**: **S** menos de 2 h · **M** medio día a 1 día · **L** 1 a 3 días · **XL** más de 3 días.

**Flujo de trabajo** (el de siempre): una tarea `agt` y una rama por ítem o grupo (`fix/...` o `feat/...`), tests, verificación en el navegador y merge automático por CI.

**Aviso sobre `git add -A`**: ya se colaron dos veces archivos locales. De acá en adelante agrego los archivos por nombre.

---

## 1. Resumen ejecutivo

- **7 bugs P0 / P1 que conviene cerrar primero** (secciones 2.1 y 2.2): ojear roto (2 errores distintos), botones que se pueden apretar infinitas veces, hitos duplicados, dashboard con datos viejos, "desempleado" falso, copa jugable fuera de fecha, nivel del once que ignora la posición.
- **La causa de varios bugs es una sola**: no existe un patrón común para acciones asíncronas (spinner, bloqueo del botón, error en castellano). Un componente y un hook resuelven 5 ítems de tu lista de una vez (B3).
- **La mejora más grande es el motor de consecuencias** (M1): hoy algunas acciones tienen efecto y otras no. Hay que definir una matriz acción → consecuencia y aplicarla de forma consistente.
- **Hay un grupo de mejoras que dependen unas de otras** y por eso van en orden: posiciones unificadas → medias estilo FIFA → pizarra con alineación libre → química.
- **Hallazgos míos que no estaban en tu lista**: 6 (sección 4), entre ellos goles de los jugadores que no se suman y un secreto de Google que debés rotar.

---

## 2. BUGS

### 2.1 P0 — Críticos

#### B1. Ojear jugadores del Mercado falla con `last_scouted_at`
- **Tu ítem**: "enviar ojeador sale el cartel Could not find the 'last_scouted_at' column of 'scout_reports'".
- **Causa**: `src/api/scouting.js:222` escribe una columna que no existe en la tabla `scout_reports`. Es deriva entre código y esquema (la misma familia de errores que ya corregimos con migraciones).
- **Arreglo propuesto**: sacar el campo del `upsert` (la fecha ya la guarda `created_at`/`updated_at`). Alternativa: migración que agregue la columna. Recomiendo sacar el campo: menos superficie.
- **Aceptación**: ojear a un jugador del Mercado descuenta el costo, guarda el informe y revela atributos. Test que falla si `scoutPlayer` escribe una columna que no existe.
- **Esfuerzo**: S · **Rama**: `fix/scouting-column`

#### B2. "Otear" en la Academia falla por `nationality` nula
- **Tu ítem**: "Otear aparece null value in column "nationality" of relation "players" violates not-null constraint".
- **Causa**: `generateYouthProspect` (`src/api/clubFeatures.js:47-75`) arma el juvenil sin `nationality`. El generador del primer plantel (`src/api/player.js:162`) sí la pone. Además usa posiciones `GK/DF/MD/FW`, que no coinciden con las del resto del juego (ver B14).
- **Arreglo propuesto**: que el juvenil salga de **un único generador de jugadores** (el de `player.js`), con nacionalidad del club, posiciones válidas y todos los campos obligatorios.
- **Aceptación**: Otear crea un juvenil visible en Cantera con nacionalidad, posición válida y sin error. Test del generador con todos los campos requeridos.
- **Esfuerzo**: S · **Rama**: `fix/youth-prospect-generator`

#### B3. Los botones no muestran carga y se pueden apretar infinitas veces
- **Tus ítems**: 7, 21 y la parte de "no se sabe qué pasa" del 2.
- **Causa**: ningún `onClick` async está protegido (conté 0 handlers que bloqueen el botón mientras corre). `Button` ya tiene la propiedad `loading`, pero cada pantalla tendría que acordarse de usarla. Resultado: doble clic = doble acción (por eso los hitos repetidos, B4, y posibles pagos dobles).
- **Arreglo propuesto** (una sola solución para todo el juego):
  1. `Button` detecta que `onClick` devolvió una promesa, se **deshabilita** y muestra spinner hasta que termina, sin que la pantalla haga nada.
  2. Hook `useAsyncAction(fn)` para los casos con varios botones (devuelve `run`, `pending`, `error`).
  3. Revisar las pantallas con acciones largas y asegurar que muestren el estado.
  4. Test de regresión: un doble clic ejecuta la acción una sola vez.
- **Aceptación**: en cualquier botón que dispare una acción, apretar dos veces seguidas ejecuta una sola; mientras corre se ve un spinner y el botón queda inactivo; si falla, el botón vuelve a estar disponible y se muestra el error.
- **Esfuerzo**: M · **Rama**: `feat/async-button-feedback`
- **Dependencias**: lo usan B4, B13 y M2.

#### B4. Se crean hitos del club repetidos
- **Tu ítem**: "Crea cronologías de hitos del club repetidamente al apretar rápido".
- **Causa** (en dos partes):
  1. `getClubMilestones` (`src/api/clubHistory.js:~35-50`) **inserta el hito de fundación si la lista está vacía**. Esa función se llama desde `ClubScreen` y desde `ClubHistoryTab` casi a la vez: las dos ven la lista vacía y las dos insertan.
  2. Sin protección del botón (B3), apretar rápido repite `addMilestone`.
- **Arreglo propuesto**:
  - Que **leer no escriba**: el hito de fundación se crea al fundar el club (`createClub`), no al consultar.
  - Índice único en la base `(club_id, year, title)` para que la base misma rechace duplicados, y `upsert` con "ignorar si ya existe".
  - Migración que limpia los duplicados existentes (se aplica con tu autorización).
- **Aceptación**: abrir la pestaña de historia 10 veces seguidas no crea nada; apretar rápido un botón que registra hito crea uno solo. Test que simula dos llamadas simultáneas.
- **Esfuerzo**: M · **Rama**: `fix/milestones-duplicates`

### 2.2 P1 — Altos

#### B5. En `/manager` dice "Actualmente desempleado" aunque fundaste el club
- **Tu ítem 10**. **Estado: hipótesis, falta reproducir.**
- **Lo que sé**: la pantalla decide con `employmentStatus === 'EMPLOYED' && !!club`. En la base tu DT figura `EMPLOYED` y el club existe, así que lo más probable es que **`club` llegue vacío al contexto un instante** (o por una condición de carrera justo después de fundar) y la pantalla muestre el aviso mientras tanto o no se corrija.
- **Primer paso**: reproducir fundando un club nuevo y mirando `GameContext` (`src/context/GameContext.jsx:72-87`) y qué devuelve `getClubByManager` justo después de crear. Luego decidir: que `createClub` devuelva el club al contexto y marque `EMPLOYED` explícitamente, y que la pantalla espere a que el contexto termine de cargar antes de mostrar estados laborales.
- **Aceptación**: tras fundar un club, `/manager` nunca muestra "desempleado". Test de la pantalla con contexto en carga.
- **Esfuerzo**: S a M (según la causa real) · **Rama**: `fix/manager-employment-state`

#### B6. Al volver al Inicio sigue apareciendo el partido que ya jugué
- **Tu ítem 26.** **Estado: hipótesis.**
- **Lo que sé**: el dashboard guarda su respuesta en caché (`queryCache`). Al terminar el partido hay que invalidar esa clave; si no, el Inicio muestra "Próximo compromiso" viejo hasta que expira.
- **Arreglo propuesto**: al consolidar un partido (post-partido) invalidar `dashboard`, `standings` y `calendar` del club, y recargar el contexto antes de navegar. Test: después de `processResult`, el dashboard pide el próximo partido.
- **Esfuerzo**: S · **Rama**: `fix/dashboard-stale-fixture`

#### B7. El nivel del once no cambia si pongo un arquero de delantero
- **Tu ítem 24.**
- **Causa**: el nivel del once suma el `attr_overall` de cada jugador sin mirar **en qué puesto lo ubicaste** (`src/features/tactics/TacticsScreen.jsx:23`, `const ovr = ...`). El motor del partido tampoco castiga jugar fuera de posición.
- **Arreglo propuesto**: función pura `playerRatingAtSlot(player, slot)` en `src/domain/`: rendimiento completo en su posición natural, penalización por línea (por ejemplo −5 a −10 en una línea vecina, −25 a −35 en una línea opuesta, y el arquero es un caso especial: un jugador de campo en el arco o un arquero de campo rinde muy poco). El nivel del once y el motor del partido usan esa función.
- **Aceptación**: arquero de delantero baja visiblemente el nivel del once y el rendimiento en el partido. Tests de la tabla de penalizaciones.
- **Esfuerzo**: M · **Rama**: `fix/lineup-position-fit`
- **Dependencias**: conviene hacerlo **después de M3** (posiciones unificadas) o junto con él, para no escribir la tabla dos veces.

#### B8. La Copa Internacional se puede jugar apenas empieza el torneo
- **Tu ítem 22.**
- **Causa**: `InternationalCupScreen` ofrece "Jugar partido continental" para cualquier partido propio sin jugar; los partidos no tienen una **fecha de juego** que lo limite (en la vida real las llaves se disputan en fechas fijas del calendario).
- **Arreglo propuesto**: dar a cada llave una semana del calendario (por ejemplo cuartos, semis y final repartidos en la temporada). El botón solo se habilita cuando la fecha de juego del club alcanza esa semana, igual que la liga (`isFixtureDue`). Mientras tanto muestra "Se juega el 12 de noviembre". El avance de semana también debe exigir jugar la copa vencida.
- **Aceptación**: no se puede jugar una llave antes de su fecha; las llaves posteriores no se habilitan hasta jugar las anteriores. **Pregunta para vos** en la sección 6.
- **Esfuerzo**: M · **Rama**: `fix/cup-match-dates`

#### B9. Charlas técnicas y reuniones de equipo: lentas y sin señal de qué pasa
- **Tu ítem 2.**
- **Causa**: `holdTeamMeeting` (`src/api/lockerRoom.js:228`) y las charlas hacen muchas consultas en serie y la pantalla no muestra nada mientras tanto. La mitad se arregla con B3 (spinner y bloqueo); la otra mitad es rendimiento.
- **Arreglo propuesto**: B3 + medir y paralelizar las consultas independientes (misma técnica que usamos en el avance semanal: 20 s a 10 s). Meta: menos de 3 s.
- **Aceptación**: apretar "Reunión de equipo" muestra spinner y bloquea; termina en menos de 3 s en tu cuenta.
- **Esfuerzo**: M · **Rama**: `fix/locker-room-performance`

### 2.3 P2 — Medios

#### B10. Textos de toda la app (símbolos, mayúsculas, inglés, errores crudos)
- **Tu ítem 5.**
- **Qué encontré**:
  - 15 lugares con `&` en títulos y botones (por ejemplo "Epílogo & Dinastía", "Comisión Directiva & Presidencia", "Cancionero Popular & Cánticos").
  - 31 usos de la clase `uppercase`, que fuerza todo en mayúsculas.
  - **56 mensajes de error que muestran el texto crudo de la base** (`toast.error(e.message)`): por eso aparecen cosas como *Could not find the 'last_scouted_at' column…* o *null value in column "nationality"…* en inglés.
- **Arreglo propuesto**:
  1. **Guía de redacción** breve (castellano rioplatense, voseo, sin `&`, sin `<` ni `>` en el texto, mayúscula solo en la primera palabra del título, sin MAYÚSCULAS corridas).
  2. `friendlyError(error)`: traduce los errores de base de datos y de red a mensajes humanos en castellano ("No pudimos guardar los cambios. Probá de nuevo."), con el detalle técnico solo en consola. Se usa en todos los `toast.error`.
  3. Barrido de las pantallas con la guía.
  4. **Test estático** que falla si aparece ` & ` en textos de interfaz o un `toast.error(e.message)` crudo, para que no vuelva.
- **Aceptación**: ningún mensaje de error en inglés ni técnico llega al jugador; el test estático pasa.
- **Esfuerzo**: L · **Rama**: `fix/ui-copy-and-errors` (partir en 2: infraestructura de errores y barrido de textos)

#### B11. Jugar una fecha FIFA tarda unos 30 segundos
- **Tu ítem 11.**
- **Causa**: `nationalTeamApi.playMatch` (`src/api/nationalTeam.js:317`) hace un guardado tras otro (resultado, récord, XP, reputación, logros) y después la pantalla vuelve a cargar todo. Además el resultado sale de `Math.random` en el cliente (ver H3).
- **Arreglo propuesto**: paralelizar lo independiente, devolver el resultado antes de los efectos secundarios no críticos, no recargar toda la pantalla (actualizar solo la fila). Meta: menos de 5 s.
- **Esfuerzo**: M · **Rama**: `fix/national-match-performance`

#### B12. "Reclamar todo" en `/achievements` queda fuera de pantalla en móvil
- **Tu ítem 12.** **Estado: probablemente resuelto por el rediseño, falta confirmar contigo.**
- **Lo que verifiqué**: a 375 px el botón se ve completo en su propia fila. Si todavía te pasa, decime el ancho del dispositivo; puede aparecer en pantallas más angostas (320 px) o con el aviso de instalación de la app superpuesto.
- **Acción**: probar 320, 360 y 390 px; si se corta, pasar el botón a ancho completo en móvil.
- **Esfuerzo**: S · **Rama**: `fix/achievements-claim-mobile`

### 2.4 P3 — Livianos

#### B13. Archivo de 18 MB dentro del repositorio
- `docs/localhost.har` está versionado y pesa 18 MB. Lo revisé: no contiene credenciales ni tokens, pero **no debería estar en el repo**. Hoy aparece borrado en tu copia local.
- **Arreglo**: confirmar el borrado con un commit, agregar `*.har` al `.gitignore`, y agregar también patrones para `client_secret*.json`, `recaptcha*.md` y `resend.md`.
- **Esfuerzo**: S · **Rama**: `fix/repo-hygiene`

#### B14. Nombres de posición inconsistentes entre módulos
- Hoy conviven `GK/DF/MD/FW`, `DEF/MED/DEL` y `CB/CM/ST` (Academia, Mercado, Plantel y motor usan sets distintos). Es la causa escondida de B2 y de B7, y es la base de tu pedido de renombrar posiciones.
- Se resuelve dentro de **M3**; no hace falta una rama aparte.

---

## 3. MEJORAS

Ordenadas de la más importante a la más liviana. Las que tienen dependencias van marcadas.

### M1. Motor de consecuencias (P1)
- **Tu ítem 8**: "todas las acciones deben tener consecuencias… como si fuera la vida real".
- **Qué existe hoy** (lo revisé): algunas consecuencias ya están (la intensidad de entrenamiento tiene probabilidad de lesión; la taquilla estima asistencia con el precio; la directiva tiene confianza que se mueve con resultados y eventos). Muchas otras **no existen o no se ven**.
- **Propuesta**: en vez de agregar efectos sueltos, un **módulo único** `src/domain/consequences.js` con la matriz acción → efecto, probada con tests, y una **forma estándar de mostrarlo** (un resumen "Esto pasó por tu decisión" después de cada acción relevante, para que el jugador entienda causa y efecto).
- **Matriz inicial (a discutir)**:

| Acción | Consecuencias reales |
|---|---|
| Subir el precio de la entrada | Menos asistencia, más descontento de la hinchada, más ingreso por entrada si el club viene bien; un precio abusivo con malos resultados genera protesta |
| Bajar mucho la entrada | Estadio lleno, hinchada contenta, menos ingreso |
| Entrenamiento de intensidad alta | Más desarrollo pero más probabilidad de lesión y de fatiga acumulada; con plantel cansado el riesgo se multiplica |
| Cobrar de más o cobrar por fuera / ceder a la barra | Dinero o paz momentánea, pero la directiva y la prensa lo ven mal; riesgo de escándalo y sanción |
| Gastar por encima del tope salarial o del presupuesto | Baja la confianza de la directiva; con déficit sostenido, advertencia y luego destitución |
| Perder partidos / racha negativa | Baja moral, baja confianza de la directiva, hinchada impaciente, presión en conferencias |
| Jugar con lesionados | Más probabilidad de agravar la lesión (ya existe en parte) |
| Faltar a la rueda de prensa | Ver M5 |
| Pagar de más a un jugador / renovar sin criterio | Vestuario: reclamos de los demás por inequidad salarial |
| Dejar al capitán en el banco, vender al ídolo | Costo en el vestuario y en la hinchada |

- **Entrega**: primero el módulo y la matriz con 4 a 5 consecuencias de alto impacto, después ir sumando. Cada una con su test y su mensaje en pantalla.
- **Esfuerzo**: XL, en tandas · **Ramas**: `feat/consequences-engine` y luego `feat/consequence-<area>`
- **Pregunta**: nivel de dureza (sección 6).

### M2. Rendimiento del procesamiento (P1)
- **Tu ítem 27** (y relacionado con B9 y B11).
- **Qué medimos antes**: avanzar semana pasó de 20 s a 10 s; el post-partido de 25 s a 8 s. Falta bajar más.
- **Propuesta**: (1) paralelizar los pasos independientes del avance semanal (explicado antes, sin aprobar); (2) mover cálculos pesados a **RPC en la base** (una ida y vuelta en vez de decenas); (3) cargar datos de pantallas con las consultas en paralelo; (4) arreglar `syncSquadPersonalities`, que tarda ~3 s cada vez que se entra a Plantel; (5) métricas: tiempo por acción visible en consola de desarrollo.
- **Meta**: avanzar semana menos de 5 s, post-partido menos de 4 s, entrar a Plantel menos de 1 s.
- **Esfuerzo**: L a XL · **Rama**: `feat/performance-pass-2`

### M3. Posiciones unificadas y medias estilo FIFA (P1) — prerrequisito de M4
- **Tus ítems 13 y 14.**
- **Nombres** (propuesta, estándar en castellano): **PO** arquero, **DFC** central, **LI** lateral izquierdo, **LD** lateral derecho, **MCD** mediocentro defensivo, **MC** mediocentro, **MCO** mediocentro ofensivo, **MI/MD** volantes por banda, **EI/ED** extremos, **DC** delantero centro.
- **Medias 50 a 99**: hoy las medias andan en 50-60 para casi todos. Propuesta: reescalar la generación y la progresión para que un plantel de Tier 5 vaya de **50 a 68**, un jugador de élite llegue a 90+ y el tope sea 99. Se hace con una función única de **cálculo de media por posición** (como en FIFA: cada posición pondera sus atributos distinto).
- **Partes**:
  1. Fuente única de posiciones en `src/domain/positions.js` (código, nombre, línea, compatibilidades).
  2. Migración de datos: convertir los códigos viejos. Como todo es de prueba, la opción más simple es regenerar los planteles.
  3. Un solo generador de jugadores (también arregla B2).
  4. Función `calculateOverall(player, position)`.
  5. Pantallas: mostrar las siglas nuevas en todos lados.
- **Esfuerzo**: L a XL · **Rama**: `feat/positions-and-ratings`
- **Pregunta**: regenerar o convertir (sección 6).

### M4. Pizarra 2.0: alineación libre, nivel por puesto y química (P2) — depende de M3
- **Tus ítems 15 y 25** (y B7).
- **Alineación libre**: arrastrar jugadores sobre la cancha a cualquier posición (hoy hay 7 formaciones fijas). Con `dnd-kit` (accesible por teclado) o un arrastre propio sobre la cancha de 11 que ya tenemos. En móvil: tocar jugador, tocar posición.
- **Nivel por puesto**: lo de B7.
- **Química al estilo FIFA**: enlaces entre jugadores vecinos en la cancha, con color según la compatibilidad. Como el juego tiene una sola liga, la química saldría de: misma nacionalidad, mismo club hace tiempo, mentoría, personalidades compatibles (ya existen) y jugar en su posición natural. Se muestra en la cancha (líneas verdes, amarillas, rojas) y aporta un bonus o castigo al rendimiento.
- **Esfuerzo**: XL, en 3 tandas (alineación libre, nivel por puesto, química) · **Ramas**: `feat/free-lineup`, `feat/lineup-chemistry`

### M5. Experiencia del partido (P2)
- **Tus ítems 18, 19, 20, 21.**
- **Pausa**: botón de pausa y reanudar (hoy el reloj es un intervalo continuo en `MatchScreen`); con pausa se pueden hacer cambios y ajustar la táctica.
- **Velocidades**: x1 más lento y legible (hoy el tiempo entre minutos es muy corto), x2 la actual, y "saltear partido" como acción aparte.
- **Rueda de prensa obligatoria**: después del partido se pasa por la prensa. Se puede **omitir**, pero tiene costo: prensa hostil, algo de moral y confianza de la directiva; y se puede ganar si se responde bien. Se integra con M1.
- **Esfuerzo**: L · **Rama**: `feat/match-experience`

### M6. Mercado 2.0 (P2)
- **Tu ítem 23.** El rediseño visual ya está hecho; falta la **mejora de fondo**.
- **Propuesta**: lista de seguimiento (favoritos); comparar dos jugadores lado a lado; filtros por edad, precio, potencial y contrato; **negociación real** (oferta, contraoferta del club vendedor, cláusulas, pedido del jugador); ventanas de pase y plazos visibles; fichar agentes libres con salario; transferencias de préstamo; ojeadores con alcance y costo propios; historial de ofertas.
- **Esfuerzo**: XL, en tandas · **Rama**: `feat/market-v2`

### M7. Calidad y confianza (P3)
- **Resultados autoritativos en el servidor**: la Copa y las fechas FIFA hoy calculan el resultado en el navegador; deben pasar a una función en la base (parte de la Fase 5).
- **Goles de los jugadores** (H1, abajo).
- **Cobertura**: smoke test de navegador por pantalla clave.

---

## 4. Hallazgos míos (no estaban en tu lista)

| # | Hallazgo | Prioridad | Qué hacer |
|---|---|---|---|
| H1 | **`goals_scored` no se incrementa**: el post-partido no recibe los goleadores. Las estadísticas de goleadores y los logros por goles no avanzan | P1 | Pasar los goleadores al consolidar el partido (`fix/goals-scored`, S a M) |
| H2 | **Seguridad**: las tablas siguen abiertas a cualquiera con la clave pública (RLS abierto); ya hay otras personas jugando en la misma base | P1 | Fase 5, cerrar el RLS y mover cálculos a RPC |
| H3 | **Fechas FIFA y Copa**: el resultado lo decide el navegador (`Math.random`, `src/api/nationalTeam.js:327`). Se puede manipular | P2 | Misma solución que M7 |
| H4 | **Secreto de Google**: hay un `client_secret_….json` en `docs/` (no está versionado) y el secreto ya se pegó en el chat | P1 | **Reseteá el secreto en Google Cloud** antes de configurar el login (Fase 3) |
| H5 | La contraseña histórica de la base sigue sin rotar y la protección de contraseñas filtradas de Supabase sigue sin activar | P1 | Acción tuya (2 minutos en el panel de Supabase) |
| H6 | `initializeLeague` ya es seguro contra carreras (lo arreglamos), pero los rivales de cada carrera siguen con nombres repetidos entre ligas | P3 | Variar nombres de rivales por carrera si querés más variedad |

---

## 5. Plan de ejecución propuesto

Orden pensado para que **lo que rompe el juego salga primero** y para respetar las dependencias.

| Etapa | Contenido | Resultado | Esfuerzo total |
|---|---|---|---|
| **1. Hotfix** | B1, B2, B6, H1, B13 | Ojear y Otear funcionan, el dashboard no miente, se suman los goles, repo limpio | 1 día |
| **2. Fundación de interacción** | B3 (botón con spinner y bloqueo), B4 (hitos), B5 (desempleado) | Se terminan los duplicados y las dudas de "¿pasó algo?" | 1 a 2 días |
| **3. Reglas del juego** | B8 (copa por fechas), B9 (charlas y reuniones), B11 (fecha FIFA), B12 (verificar) | Reglas más reales y sin esperas largas | 1 a 2 días |
| **4. Textos y errores** | B10 | Todo en castellano coloquial, sin errores técnicos | 2 días |
| **5. Datos del juego** | M3 (posiciones y medias FIFA) + B7 | Base para la pizarra nueva | 3 a 4 días |
| **6. Consecuencias** | M1 en tandas | El juego responde a tus decisiones | 4 a 6 días |
| **7. Pizarra 2.0** | M4 | Alineación libre, nivel por puesto, química | 4 a 5 días |
| **8. Partido** | M5 | Pausa, velocidades, prensa obligatoria | 2 a 3 días |
| **9. Rendimiento** | M2 | Procesos 2 a 3 veces más rápidos | 3 a 4 días |
| **10. Mercado 2.0** | M6 | Mercado con negociación real | 5+ días |
| **11. Seguridad y Google** | H2, H3, H4, H5, Fase 3 y Fase 5 | Cuentas con Google, base cerrada | según plan de fases |

**Dependencias clave**: B3 antes que B4 y B9 · M3 antes que B7, M4 y M1 (parte de química) · M1 antes que la prensa obligatoria de M5 · H4 antes de la Fase 3.

**Qué verifico en cada etapa**: tests automáticos de lo nuevo, recorrido en el navegador (móvil y escritorio) con tu cuenta, revisión de la base para ver datos consistentes, y un resumen en `executions/` de cada tarea.

---

## 6. Decisiones que necesito de vos antes de empezar

1. **Orden**: ¿vas con el orden de la sección 5 o preferís subir/bajar alguna etapa? (por ejemplo M3 y M4 antes que M1).
2. **Medias estilo FIFA (M3)**: ¿regenero todos los planteles con la escala nueva (más simple, perdés los jugadores actuales) o convierto los existentes?
3. **Nombres de posiciones**: ¿te sirven PO, DFC, LI, LD, MCD, MC, MCO, MI, MD, EI, ED, DC?
4. **Copa (B8)**: ¿cuartos, semifinal y final en semanas fijas de la temporada (por ejemplo semanas 10, 18 y 26) o preferís otra distribución?
5. **Dureza de las consecuencias (M1)**: ¿modo **realista** (las malas decisiones se pagan caro) o más **permisivo** al principio con avisos antes de confirmar acciones riesgosas ("Esto puede molestar a la hinchada. ¿Seguir?")? Recomiendo avisos antes de las acciones con riesgo alto.
6. **Rueda de prensa obligatoria (M5)**: si la omitís, ¿qué costo preferís: baja en la moral y en la directiva, prensa hostil la semana siguiente, o las dos?
7. **B5 y B12**: ¿me confirmás cómo reproducir el "desempleado" (¿fue justo después de fundar el club?) y en qué ancho de pantalla se corta "Reclamar todo"?
8. **Química (M4)**: ¿te alcanza con el modelo propuesto (nacionalidad, tiempo en el club, mentoría, personalidad, posición natural)?

---

## Anexo: tu lista original (05/10/2026)

Bugs y mejoras encontradas al 05/10/2026

- Crea cronologias de hitos del club repetidamente al apretar rapido
- Charlas tecnicas y reuniones de equipo es lento y al apretar uno boton no se sabe que pasa, deberia poner un spinner o algo
- verificar textos de toda la app ya que hay simbolos como & o mayusculas en cada texto al comenzar la primera palabra o hay textos en ingles o con simbolos como < o > cambiar a un lenguaje coloquial en toda la app
- Otear aparece null vallue in column "nationality" of relation "players" violate not-null constrains
- los botones se pueden presionar pero al no aparecer spinner o algo se pueden presionar infinitamente
- todas las acciones deben tener consecuencias, por ejemplo, subir el precio de entradas no deberia caber bien a la hinchada, entrenamientos fuertes deben tener porcentaje de lesiones, apretamientos de la barra o gastar plata de mas no deberia tener buena vista en la adminstracion del club, perder partidos, etc y para esto verifica todas las secciones y busca acciones con posibles consecuencias como si fuera la vida real
- enviar ojeador sale el cartel Could not find the 'last_scouted_at' column of 'scout_reports' in the schema cache
- Funde un club pero en /manager dice "Actualmente desempleado"
- Jugar fecha fifa tarda unos 30 seg en terminar
- reclamar todo en /achievements sale fuera de la pantalla en modo mobile
- cambia el nombre de las posiciones a mc dfc dc
- las medias que sean como en el fifa entre 50 a 99
- que se pueda crear personalizadamente una alineación moviendo los jugadores

Al jugar los partidos
- poder pausar el partido
- el x1 debe se un poco mas lento, a diferencia del x2 o saltear partido
- La rueda de prensa debe ser obligatoria, luego del post-match se debe pasar por la prensa, si se quiere se omite pero eso puede traer beneficios o perjudicarlo
- Al presionar un boton hay un lag y los botones al quedar igual activados no se puede corroborar que esta pasando, deberia haber un spinner en los botones presionados
- /international-cup te permite jugar cuando empieza un torneo y eso no ocurre en la vida real
- mejorar toda la seccion de /market
- el nivel del once no cambia si por ejemplo pongo un arquero como delantero
- agreguemos quimica entre los jugadores como en el FIFA
- al volver al inicio luego de un partido, me sigue figurando el partido que jugue
- buscar una mejora en el procesamiento de los partidos ya que es lento el sistema
