# Cierre de temporada reanudable

## Problema
El cierre fallaba (`ord`, jsonb leído como fila, tabla de hemeroteca inexistente) y, aunque la base cerraba la temporada, la segunda parte (evolución, liga nueva, partidos) podía quedar a medias y dejar la partida trabada o con datos duplicados al reintentar.

## Solución
- Tabla `season_close_progress` (RLS por dueño): etapas DB_DONE → EVOLUTION_DONE → LEAGUE_READY → COMPLETE, con el resultado original, intentos y último error. `close_season_atomic` deja la marca DB_DONE en la misma transacción.
- `seasonCloseApi._finish` corre solo las etapas que faltan con los mismos resultados (no se repite premio, envejecimiento ni sorteos).
- `processAnnualEvolution` saltea jugadores ya evolucionados; `prepareNextLeague` y `generateRoundRobinFixtures` son idempotentes y no ignoran errores.
- Inicio: aviso "Cierre de temporada pendiente" + botón "Terminar el cierre"; `advanceWeek` se bloquea hasta completarlo. No se puede saltear ni forzar: el único camino es completar las etapas guardadas.
- Gala: corregido el campeón y mensaje de cierre parcial.

## Verificación
- Tests nuevos: seasonCloseStages, seasonCloseResume, seasonCloseGuards, seasonCloseSql, competitionResume, dashboardPendingClose.
- Prueba en prod con rollback de la función; huella md5 repo==prod.
- eslint limpio, 1618 tests, 70 escenarios BDD.
