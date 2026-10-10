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

## Revisión completa posterior (con el cierre real del DT)
- El primer cierre real en producción dejó el cierre en DB_DONE: la evolución fallaba con `column "overall" can only be updated to DEFAULT` (`players.overall` es una columna calculada). Antes el error se ignoraba en silencio (nadie envejecía); la marca de avance lo dejó a la vista y el cierre quedó retomable sin repetir el premio.
- Corregido: `processAnnualEvolution` ya no escribe `overall` (solo `attr_overall`). Probado el UPDATE exacto en producción con rollback.
- `close_season_atomic`: sin carrera no había chequeo de "ya cerrada" (el snapshot solo se consulta con carrera); ahora la marca `season_close_progress` también corta un segundo cierre. Se fijó `search_path` (aviso del linter). Aplicado en producción; huella del repo == producción (79bda275…).
- Verificadas en producción con rollback las escrituras de la liga nueva (competición, clubes rivales, tabla, partidos, reset, registro de transición).
