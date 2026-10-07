# Roadmap — estado al 7/10/2026 (cierre de la tanda del agente)

Master hoy: **1.230 tests**, ESLint con 0 errores y 13 avisos (tope 13, no puede crecer), **57 escenarios BDD** ejecutables en el CI.

---

## HECHO

### Calidad y herramientas
- Cucumber (gate BDD en el CI, escenarios `@auto`; los `@db` documentan reglas verificadas en la base real) y ESLint en el CI.
- Avisos de lint de 54 a 13 (solo dependencias de efectos de React). Errores de lectura de Supabase que se ignoraban: corregidos (ya no se duplican ligas ni planteles ni se saltea el chequeo de fondos).
- Funciones SQL con `search_path` fijo (los 33 avisos del asesor de seguridad cerrados).

### Seguridad y producción (mi parte)
- `auth-gate` (sin JWT) y `send-email` (con JWT) **desplegadas** y probadas (CORS y validación OK).
- Limpieza de filas sin dueño **ejecutada**: 1.132 filas, 0 huérfanas (el script del repositorio ahora borra en pasadas).
- Documento `docs/SEGURIDAD_Y_ACCESO.md` actualizado con lo ya hecho.

### Juego: ciclo de temporadas y economía
- Calendario con la localía pareja; gala de fin de temporada alcanzable; cierre que arma el año siguiente; candado del avance de semana con vencimiento.
- **Ascensos y descensos reales** (los 2 primeros suben, los 3 últimos bajan; liga nueva con rivales de la fuerza de la división o rotación de los clubes que se mueven).
- Economía recalibrada con una temporada medida y **ingresos fijos por categoría**.
- Bolsa de trabajo con clubes de todas las divisiones; la gala avisa qué jugadores quedan libres; alerta urgente de contratos en las últimas 12 semanas.
- Directiva calibrada por simulación (ultimátum a confianza 40; un equipo promedio casi no tiene problemas, uno flojo recibe ultimátum 2 de cada 3 temporadas).

### Plata al servidor (M2, cerrado)
- `club_cash_move` (fondos, asiento e idempotencia), `settle_gate` (taquilla), `close_week_finances`, `settle_season_prize`.
- Un disparador rechaza cualquier cambio de `clubs.budget` desde el navegador y limita la caja inicial al crear un club.

### Contenido y profundidad (las 6 líneas)
| Línea | Qué quedó |
|-------|-----------|
| Clima | 6 eventos de ambiente por etapa de la barra y nivel de presión; 3 combos nuevos |
| Temporadas | Resumen del año con fichajes (compras, ventas) y mejor y peor decisión; los traspasos registran la temporada |
| Prensa | Preguntas por situación (racha, ex jugador en el rival, refuerzo que fue la figura) y memoria de tus tres últimas respuestas; máximo 4 preguntas |
| Historias | Finales con ramas según el camino elegido y el estado del club (barra, dirigencia, favores); 24 finales alternativos en 5 historias |
| Mercado | Lectura del ojeador; **cesiones a préstamo** (máx. 3, plantel de 16 como mínimo, vuelven al cierre) y **cláusula de recompra** (10% ahora, recompra al 125% durante dos temporadas) |
| Carrera del DT | Negociación de ofertas de trabajo (pedís sueldo; el club acepta, contraoferta o retira la oferta; 2 rondas). La selección ya tenía pantalla propia |

---

## LO QUE FALTA

### Depende de vos
- **Panel de Supabase / Resend / Google:** activar la protección de contraseñas filtradas (es el único aviso que sigue marcando el asesor), "Confirm email" y el proveedor de Google con sus URLs; verificar el dominio en Resend y el SMTP; **rotar la contraseña de la base**; borrar `D:\tmp_dummy`. Cuando termines, pruebo el alta con correo real.
- **Pruebas de punta a punta (Playwright):** crear un usuario fijo de pruebas en `dt_database` y pasarme solo el correo (la contraseña va como variable local o secreto del CI, nunca en el chat). Con eso paso mi conductor de temporada a pruebas automáticas.
- **Celular real:** probar la app instalada como PWA.

### Mío, documentado y no hecho
- **Semana en una sola función del servidor (L):** avanzar una semana tarda ~5 s medidos (la cascada son ~2,3 s: una cadena de ~13 pasos de ~180 ms de latencia cada uno; el resto es recargar el contexto). Bajar de 2,5 s exige mover la semana entera al servidor, un proyecto aparte con su propia verificación (no un ajuste).
- **13 avisos de lint de dependencias de hooks:** cada uno cambia cuándo corre un efecto; hay que tocarlos de a uno y mirarlos en pantalla.
- **BDD:** 57 escenarios ejecutables sobre ~740 `.feature` (los demás documentan fases viejas con pasos vagos). Se pasan a `@auto` cuando una tarea toque esa área.
- **Pirámide con clubes persistentes (L):** decisión aceptada a propósito; las divisiones que no jugás se arman con rivales de la fuerza de su categoría. Los clubes que salen de la liga quedan en la base (conviene limpiarlos con el mismo script de huérfanos si se vuelven un problema).
- **Cesiones:** no se puede recuperar un cedido antes del cierre ni traer jugadores prestados de otros clubes.
- **Taquilla:** el servidor calcula el importe, pero las victorias recientes y el aviso de clásico los manda el navegador (efecto acotado: la racha cuenta como mucho 5).
- **Negociación del DT:** solo se negocia el sueldo (no los años ni el objetivo).

---

## Orden sugerido
1. **Vos:** panel de Supabase (A3), usuario de pruebas (M1) y celular real.
2. **Yo, con el usuario de pruebas:** Playwright en el CI con una temporada completa, una corrida de 3 temporadas con plantel completo para volver a medir economía y balance, y el alta con correo real.
3. **Después:** la semana en el servidor, si el tiempo de espera molesta en el celular.

## Riesgos
- **Balance:** la economía y la directiva quedaron calibradas con simulación y con **una** temporada medida; conviene una corrida larga con plantel completo cuando exista la automatización.
- **GitHub:** puede rechazar escrituras unos minutos con errores 500; los commits quedan locales y las ramas apiladas se mergean juntas.
- **Compilador local:** hasta resolver SWC, verificar la interfaz exige el navegador de esta sesión.
