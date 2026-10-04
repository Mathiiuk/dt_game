# Reporte de Ejecución: f3-p1-postmatch-idempotency
- **Rama**: `fix/f3-p1-postmatch-idempotency` | **Estado**: `DONE`
- **Hallazgo (prueba E2E)**: la carrera de prueba terminó con 15 de 20 jugadores lesionados ("Solo tienes 5 jugadores aptos", avance bloqueado). Había 33 lesiones registradas y **0 filas en `match_reports`/`player_match_stats`**.
- **Causa**: `PostMatchScreen` llamaba a `processResult(..., results.fixtureId || null)` pero `simResults` no trae `fixtureId`, así que el informe formal nunca se guardaba y la idempotencia (que se apoya en `match_reports`) jamás se activaba. Cada montaje de la pantalla (StrictMode, recarga) reaplicaba lesiones, XP, taquilla y reputación.
- **Fix**:
  - `MatchScreen` envía `fixtureId` explícito al post-partido; `PostMatchScreen` lo usa (`officialFixtureId`).
  - `postMatchApi.processResult`: promesa compartida por fixture (deduplica montajes simultáneos) + **reclamo atómico** en `match_reports` (clave única `fixture_id`) antes de aplicar efectos; `_loadProcessedReport` devuelve el resultado consolidado con la misma forma (incluye `mvp`). El informe final pasa de `insert` a `upsert`.
  - Tests nuevos (`tests/api/postMatch.test.js`): reutiliza resultado existente sin insertar, comparte una sola ejecución entre llamadas simultáneas, reprocesa para otro fixture.
- **Gate `agt`**: `unit_tests -> npm test` (24 tests).
- **Dato de la cuenta de prueba**: las lesiones ya generadas siguen en la BD (no se alteraron); se curan con el avance de semanas o por decisión del usuario.
