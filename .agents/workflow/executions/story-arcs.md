# story-arcs

Historias de varias fechas (4 capítulos, unas 8 a 10 fechas) con humor del fútbol argentino.

- `domain/arcCatalog.js`: 7 historias (el pibe del potrero, el arquero atrevido, la mano que lo cambió todo, el asado de los jueves, el último hincha del ascenso, la camiseta de la suerte, el sponsor ocurrente). Cada capítulo es un evento con opciones y efectos; lo que elegís queda como marca y los capítulos siguientes lo recuerdan; el último trae el desenlace.
- `domain/arcs.js`: una historia a la vez, descanso de 4 semanas, capítulo siguiente 3 semanas después de resolver, no empiezan antes de la fecha 3 ni con 3 eventos pendientes; se reentrega el capítulo si el evento desapareció.
- `climateApi.advanceWeek` entrega los capítulos; `eventsApi.resolveEvent` avisa a `climateApi.onArcChapterResolved`; el desenlace va a la bitácora y al resumen de la temporada.
- Migración `migration_club_arcs.sql` (columna `arcs` en `club_climate`, aplicada). Insignia "Historia" en el dashboard.
- Tests: catálogo, motor de avance y cierre semanal.
