# Tabla: sin botón de recargar y con "Todas las ligas"

- `StandingsScreen.jsx`: se quitó el botón de recargar (la tabla se actualiza sola; "Reintentar" del error sigue usando la recarga). Nuevo botón "Todas las ligas" junto a Calendario y Pirámide.
- `LeagueDataModal.jsx`: panel con pestañas Ligas (todas las competiciones de la carrera con su tabla, la actual marcada y tu club resaltado), Goleadores, Asistencias y Mejor jugador (nota media). Los rivales de la IA no tienen plantel ni estadísticas por jugador (`play_league_ai_fixtures` solo guarda marcador), así que los líderes son solo de tu club en la temporada y el panel lo dice.
- `competitionApi.getAllLeagues` y `getClubLeaders` (solo lectura, sin tocar SQL); `src/domain/leaders.js` (`clubLeaders`, funciones puras).
- Tests: `tests/domain/leaders.test.js`, `tests/api/leagueOverview.test.js`, `tests/ui/leagueDataModal.test.jsx` y `standingsScreen.test.jsx` actualizado.
- Pendiente a futuro: goleadores de la IA (requiere plantillas de jugadores rivales y cambios en el SQL de la liga).
