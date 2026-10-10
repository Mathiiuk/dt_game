# Todas las ligas: del Potrero a la Primera

## Qué hace
"Todas las ligas" (Tabla) muestra las cinco divisiones con tabla, resultados, goleadores, asistencias y figura. El club juega una; el mundo arma las otras cuatro (20 clubes de su categoría, tabla y 380 partidos) una vez por temporada y las juega solo junto con la liga del club.

## Cambios
- SQL (`scripts/db/migration_league_scorers.sql`, aplicado en producción): tabla `league_scorers` (RLS por dueño), `league_scorer_name` (plantilla derivada de 12 jugadores con nombre estable por club), `record_league_goals` (atribuye cada gol, y el 70 % de las veces una asistencia, de forma determinista por partido) y parche a `play_league_ai_fixtures` y `finish_user_fixture` para anotar a los goleadores de la IA (incluido el rival del partido del usuario).
- `src/domain/worldLeagues.js`: `worldTiers`, `worldClubRow`, `isCurrentSeasonLeague`, `leagueBoards`, `withUserLeaders` (suma a los jugadores reales de tu club en tu liga).
- `competitionApi`: `ensureWorldLeagues` (idempotente, en vuelo único, determinista, borra la competición a medias si falla y pone al día los partidos vencidos), `getAllLeagues(clubId, gameDate)` (de la Primera al Potrero primero, la tuya marcada, temporadas anteriores al final), `getLeagueLeaders`, `getLeagueResults`.
- `LeagueDataModal.jsx`: selector de liga y pestañas Tabla, Resultados, Goleadores, Asistencias y Figura; aviso "Armando el mundo del fútbol…" la primera vez; si no se pueden armar las demás divisiones muestra las que hay.
- Tests: `tests/domain/worldLeagues.test.js`, `tests/api/worldLeagues.test.js`, `tests/api/leagueOverview.test.js`, `tests/ui/leagueDataModal.test.jsx`.
- Los jugadores de las otras divisiones son plantillas derivadas (nombres inventados y estables): los clubes de la IA no tienen plantel real.
