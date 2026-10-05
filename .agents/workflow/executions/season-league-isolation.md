# Reporte de Ejecución: season-league-isolation
- **Rama**: `fix/season-league-isolation` | **Estado**: `DONE`
- **Bugs encontrados al revisar el cierre de temporada**:
  1. `seasonCloseApi.executeSeasonClose` leía la tabla de posiciones de **todas las ligas** (el campeón y los ascensos salían de cualquiera) y después reiniciaba esas tablas.
  2. `gameLoopApi.endSeason` reiniciaba las tablas de **todas las ligas** sin filtrar (con varios jugadores en la misma base, cada cierre borraba los puntos de los demás).
  3. `endSeason` guardaba en `season_history` el año del reloj real del navegador y siempre el 1.º puesto.
  4. El reinicio no ponía `goal_difference` en cero y actualizaba fila por fila en serie.
- **Arreglo**: ambos caminos toman la competición del club y trabajan solo con esa; sin liga no tocan nada; el historial usa la temporada del club y su puesto real; el reinicio es en paralelo y completo.
- **Tests**: `seasonIsolation.test.js` (5); suite completa verde.
