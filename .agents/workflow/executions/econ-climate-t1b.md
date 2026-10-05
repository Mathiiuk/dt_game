# Reporte de Ejecución: econ-climate-t1b
- **Rama**: `feat/econ-climate-t1b` (parte de `feat/econ-climate-t1`) | **Estado**: `DONE`
- **Problema**: hinchada y dirigencia vivían duplicadas (`clubs.fans_confidence`/`board_confidence` y `club_fanbase.fan_support_score`/`club_board_confidence.confidence_score`) y divergían (100 vs 60 en un club); la moral del plantel solo decaía (-2 por semana sin rachas) y quedaba en 18-24; la racha de la taquilla era un valor inventado.
- **Cambios**: triggers bidireccionales en la base (`scripts/db/migration_sync_club_meters.sql`, aplicada y verificada en vivo) con reconciliación inicial (manda la tabla de detalle); `src/domain/streaks.js` (rachas, resultado desde la vista del club, moral semanal con vuelta hacia 60); `moraleApi.getStreaks` lee los últimos partidos jugados; `processWeeklyMorale` usa rachas reales; la asistencia usa las victorias reales de las últimas 5; la fanbase nueva nace con el humor actual del club.
- **Pendiente de T1**: la tabla `club_climate` (barra, favores, presión) se crea en T4, cuando se necesita.
- **Tests**: `tests/domain/streaks.test.js`; suite completa verde.
