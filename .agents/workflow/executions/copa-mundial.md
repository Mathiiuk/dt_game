# Ejecución: Copa Mundial en la liga de amigos

- Rama: `feat/copa-mundial`
- Formato nuevo de sala (`settings.format = 'COPA'`): 8 o 16 selecciones en grupos de 4 (tres fechas, 3 puntos por victoria), pasan dos por grupo, llaves (cuartos, semis, final) con penales deterministas si hay empate. Los lugares libres los completan selecciones bot (nombres de países); con más de 8 DT la copa pasa a 16.
- SQL: `scripts/db/migration_friend_cup.sql` (columnas nuevas, `friend_configure_room` con formato, `friend_cup_group_table`, `friend_start_cup`, `friend_play_cup_round`). Aplicada en producción y probada con rollback: copas de 8 (5 fechas) y de 16 (6 fechas) llegan a campeón, sin llaves sin resolver.
- App: `src/domain/friendCup.js`, `friendLeague.js` (formato), `src/api/friends.js`, `LeagueSetupCard.jsx` (selector de formato), `CupView.jsx`, `FriendsScreen.jsx`.
- Pruebas: `tests/domain/friendCup.test.js`, `tests/static/friend-cup-sql.test.js`, ampliados `tests/api/friends.test.js` y `tests/ui/friendsScreen.test.jsx`.
- La liga clásica no cambia (formato por defecto `LIGA`).
