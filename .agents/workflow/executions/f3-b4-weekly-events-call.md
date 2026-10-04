# Reporte de Ejecución: f3-b4-weekly-events-call
- **Rama**: `fix/f3-b4-weekly-events-call` | **Estado**: `DONE`
- **Bug**: al avanzar semana, `calendar.js` (paso 11) llamaba a `eventsApi.generateRandomEvents`, inexistente; lanzaba TypeError y abortaba toda la cascada semanal posterior (entrenamiento ya corría antes; pero obras, mentorías, lesiones, carrera del DT, eventos y sincronización de fecha nunca se ejecutaban).
- **Fix**: se elimina la llamada (los eventos ya se generan en el paso 11f con `generateWeeklyEvents`).
- **Hallazgos del mismo tipo (barrido estático de métodos inexistentes)**, corregidos:
  - `financesApi.recordLedgerTransaction` (board.js, stadium.js): nuevo método en `finances.js` que sólo asienta en el libro mayor sin tocar `clubs.budget` (los llamadores ya lo actualizan; usar `recordTransaction` habría duplicado el cobro).
  - `staffApi.getClubStaff` (injuries.js) → `getStaff`; rol real `PHYSIO` y `skill_rating >= 14` (70% en escala 1-20).
  - `reputationApi.addReputationChange` (legends.js) → `applyReputationDelta` con evento `CLUB_TRIBUTE`; migración `reputation_ledger_allow_club_tribute` amplía el CHECK del ledger.
- **Guardia de regresión**: `node scripts/check_api_calls.cjs` (falla si aparece una llamada `xxxApi.fn()` sin definición). Resultado actual: OK.
- Verificación en navegador del avance de semana: pendiente (muta la carrera de prueba; se hará tras B2 con confirmación).
