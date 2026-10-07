# Plan para terminar — estado al 7/10/2026 (noche)

Tamaños: **S** (una rama chica), **M** (una o dos ramas con migración y tests), **L** (varias ramas o un diseño previo). Cada punto sigue el flujo de siempre: tarea `agt`, rama `feat/` o `fix/`, tests primero, verificación en el navegador cuando toca pantalla.

Master hoy: **1.120 tests**, lint con 0 errores y 45 avisos (tope 46, no puede crecer), **12 escenarios BDD** ejecutables en el CI.

---

## HECHO en esta etapa del plan

| Punto | Qué quedó |
|-------|-----------|
| Hallazgos de la corrida completa | Calendario de liga parejo (local/visitante), gala de fin de temporada alcanzable, cierre que arma el año siguiente, consulta de la tabla sin `logo_url` |
| Cucumber y ESLint | Instalados; gate BDD y lint en el CI; los 148 `.feature` se leen bien |
| M4 pantallas | División real en inicio y tabla; la gala muestra el premio y el ascenso/descenso del puesto actual |
| A2 economía | Margen semanal en el rango de diseño (TV 330, patrocinio base 400) y **ingresos fijos por categoría** (+50% por escalón) |
| A1 ascensos y descensos | Los 2 primeros suben, los 3 últimos bajan; liga nueva con rivales de la fuerza de la división o rotación de los clubes que se mueven; presupuesto salarial +80% / −15% / +10% |
| A5 carrera | Bolsa de trabajo con clubes de **todas** las divisiones (los 195 rivales estaban en Primera); la gala avisa qué jugadores quedan libres antes de cerrar |
| Recuperación del avance | Si el avance de semana se interrumpe, el candado vence a los 90 s (antes la partida quedaba trabada para siempre) |
| A3 producción (mi parte) | `auth-gate` (sin JWT) y `send-email` (con JWT) **desplegadas**; probadas (CORS y validación OK); 33 avisos de seguridad de funciones SQL cerrados |
| Errores de lectura | Cinco lugares ignoraban el error de Supabase: ya no se duplican ligas, planteles ni calendarios, ni se saltea el chequeo de fondos de una decisión |
| **M2 dinero al servidor** | Primitiva `club_cash_move` (fondos + asiento + idempotencia). Decisiones, estadio, instalaciones, cantera, directiva, ojeo, personal, multas y taquilla pasan por ella. **Un disparador rechaza cualquier cambio de `budget` desde el navegador** y limita la caja inicial al crear un club |
| M5 parcial | Tope de avisos de lint bajado; documento de seguridad actualizado |

## Medido y descartado: M3 rendimiento de la semana
Avanzar una semana tarda ~5 s medidos desde el clic: la cascada son ~2,3 s (ya paralelizada: queda una cadena de ~13 pasos de ~180 ms de latencia cada uno) y el resto es recargar el contexto. Llegar a menos de 2,5 s exige **mover la semana entera a una función del servidor** (L). No es un ajuste; queda como proyecto propio, por debajo de la prioridad media.

---

## LO QUE FALTA

### Depende de vos
- **A3 — ajustes del panel de Supabase/Resend/Google** (no se pueden hacer desde el código): activar la **protección de contraseñas filtradas** (es el único aviso que sigue marcando el asesor de seguridad), "Confirm email", proveedor de Google con URLs, dominio en Resend y SMTP, **rotar la contraseña de la base** y borrar `D:\tmp_dummy`. Detalle en `docs/SEGURIDAD_Y_ACCESO.md`. Cuando termines me avisás y pruebo el alta con correo real.
- **M1 — pruebas de punta a punta con Playwright:** elegiste un usuario fijo de pruebas. Falta que crees ese usuario en `dt_database` y me pases solo el correo (la contraseña va como variable local y secreto del CI, nunca en el chat). Con eso paso mi conductor de temporada a pruebas automáticas en el CI.
- **A4 — limpieza de filas sin dueño:** la corro cuando lo digas (te muestro antes los conteos por tabla). Con las corridas de hoy hay más clubes huérfanos de lo que había.
- **A5 — celular real:** probar la app instalada en el teléfono (yo no puedo).

### Anotado para después (nuevo, encontrado hoy)
- **La taquilla la calcula el navegador** (asistencia y precio): el servidor garantiza que entra una sola vez y queda asentada, pero no recalcula la asistencia. Pasar esa fórmula al servidor cerraría el último agujero de plata (S/M).
- **Ascenso/descenso en la gala y la historia ya se muestran, pero la pirámide no se juega:** las otras divisiones se arman con rivales de la fuerza que corresponde (aceptado a propósito). Si algún día se quiere una pirámide con clubes persistentes, es L.
- **Los clubes que salen de la liga quedan en la base** (el snapshot los referencia): conviene limpiarlos junto con la limpieza de A4.
- **Contratos y plantel:** la cuenta de prueba terminó con 1 jugador por no renovar en tres temporadas. La gala ya avisa; falta un aviso más temprano (alerta de "contratos por vencer" con cuenta regresiva en el inicio desde la semana 40).
- **Dilemas con la dirigencia:** la opción "Plantarte" (50% te echan) y la serie de eventos críticos me destituyeron dos veces seguidas en la cuenta de prueba: revisar el balance de despidos con una corrida con plantel completo.
- **Rendimiento:** semana en una sola función del servidor (ver arriba).
- **Lint:** 45 avisos (dependencias de hooks, asignaciones pisadas). Se bajan de a poco bajando el tope en `package.json`.
- **BDD:** 12 de ~740 escenarios son ejecutables; se pasan a `@auto` cuando una tarea toque esa área.

### Contenido y profundidad (prioridad baja, continuo)

| Línea | Qué falta | Tamaño |
|-------|-----------|--------|
| Clima | Eventos propios de cada etapa de la barra y de cada nivel de presión; más combos | S |
| Temporadas | Resumen del año con las historias, fichajes y ranking de decisiones | S |
| Prensa | Preguntas por situación (racha, clásico, ex jugador, fichaje) y que recuerden respuestas anteriores | M |
| Historias | Capítulos con ramas que cambien el final según la barra o la dirigencia (hoy lineales de 4 capítulos) | M |
| Mercado | Ojeo con informes más ricos, préstamos, cláusulas de recompra, jugadores de otros clubes con plantel | L |
| Carrera del DT | Ofertas de otros clubes con negociación real; selección | L |

---

## Orden sugerido para lo que sigue
1. **Vos:** panel de Supabase (A3), usuario de pruebas (M1) y decisión de la limpieza (A4).
2. **Yo, apenas esté el usuario:** Playwright en el CI (M1), que además me deja correr una temporada completa y las pruebas del alta con correo sin intervención.
3. **Yo, sin depender de nadie:** aviso temprano de contratos, balance de despidos, fórmula de taquilla en el servidor, y de ahí el contenido (clima y resumen anual primero: son S).

## Riesgos
- **Balance:** cada cambio de rivales, categoría o localía mueve la caja y las probabilidades; la economía quedó recalibrada con **una** temporada medida y su corrección por categoría, pero conviene una corrida de 3 temporadas con plantel completo (la automatización de M1 lo permite).
- **Datos viejos:** cada corrida deja filas de cuentas de prueba sin dueño; limpiar (A4) antes de abrir a jugadores reales.
- **Compilador local:** hasta resolver SWC, verificar la interfaz exige el navegador de esta sesión (lo que hice con el conductor).

## Decisiones que quedan para vos
1. Crear el usuario fijo de pruebas (M1).
2. Cuándo correr la limpieza de filas sin dueño (A4).
3. Los ajustes del panel (A3).
