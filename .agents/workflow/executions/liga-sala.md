# Liga de la sala (el creador arma su propio torneo)

- Roles: director-tecnico (plan), backend-engineer (SQL), frontend-engineer + product-designer (ajustes y vista de la liga), qa-engineer (TDD), security-guardian (solo el creador configura, empieza y juega).
- Ajustes del creador: equipos (4 a 20), completar con bots (sí/no), ida y vuelta o solo ida, nivel de los bots (flojos/parejos/cracks) y reglamento de puntos (los de la Asamblea que cambian puntos, o sorpresa).
- Base (`scripts/db/migration_friend_league.sql`, aplicada en prod): `friend_configure_room` (sanea y acota), `friend_start_league` (equipos + bots + calendario por método del círculo), `friend_play_round` (fuerza real del plantel con `club_strength` + `cup_goals`), `friend_league_table`, `friend_league_points`; `friend_join_room` rechaza la entrada cuando la liga ya empezó; `friend_room_table` usa los puntos de la liga de la sala cuando está en juego.
- Probado en prod con transacción revertida (3 usuarios, 7 equipos, ida y vuelta): 42 partidos todos distintos, 14 fechas, estado DONE; no creador rechazado al configurar, empezar y jugar; un solo DT no puede empezar; sin nombres de bots suficientes falla; ingreso tardío rechazado; ajustes fuera de rango acotados (99 equipos → 20, victoria 9 → 5).
- App: `src/domain/friendLeague.js`, `friendsApi` (configure/start/play/tabla/fixtures), `LeagueSetupCard`, `LeagueView` y lobby con "Empezar la liga" en `/friends`.
- Gates: eslint, tests y BDD en verde.
- Pendiente: copa y Mundial por grupos, puntos acumulados entre temporadas.
