# La semana pasa (animación al avanzar la semana)

**Problema:** al tocar "Avanzar semana" solo giraba un spinner mientras el motor procesa ~15 tareas.

**Solución:** pantalla "La semana pasa" (`src/features/week/WeekProgress.jsx`): línea de tiempo lun→dom, frases que rotan en el orden real del avance y, al terminar, resumen (semana nueva, caja ±, altas médicas) con botón "Seguir".
- `src/domain/weekFlavor.js`: frases, días y `weekSummary` (puro).
- `src/features/week/useAdvanceWeek.js`: no muestra nada si la espera es < 600 ms; mínimo visible 1100 ms; nunca alarga la espera; `markBusy('advance-week')` para no aplicar actualizaciones a mitad; errores se propagan al toast de siempre.
- Integrado en Inicio y Calendario (si se muestra la pantalla no sale el toast duplicado; si despiden al DT se cierra y se navega como antes).
- "Menos movimiento": lo resuelve el CSS global (sin transiciones).
- Sin cambios de base de datos ni librerías.

**Tests:** `tests/domain/weekFlavor.test.js`, `tests/ui/useAdvanceWeek.test.jsx`, `tests/ui/weekProgress.test.jsx`. Capturas a 360 px revisadas.
