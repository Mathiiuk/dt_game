# Asamblea de la AFA: el reglamento del torneo se vota cada año

- Roles: director-tecnico (plan), backend-engineer (SQL), frontend-engineer + product-designer (tarjeta de la gala y chip de la tabla), qa-engineer (TDD).
- Dominio (`src/domain/leagueRules.js`): 10 reglamentos bizarros (0-0 prohibido, visitante dorado, goleada con moño, valla invicta, recta final doble, solo ida, suben 4, la guillotina, empate festivo, clásico), boleta de 3 por año, votos de los otros 19 DT con personalidad y comentario, escrutinio (empate lo define el usuario) y `pointsFor`.
- `roundRobinSchedule(ids, { legs })` (ida sola = 19 fechas), `movementOf(pos, tier, rules)` y zonas de la tabla según el reglamento.
- Base (migración `scripts/db/migration_league_rules.sql`, aplicada en prod): `competitions.rules`, tabla `season_rule_votes` (RLS por dueño), `apply_league_match` (puntos por reglamento; probada en prod con transacción revertida), parches de `play_league_ai_fixtures`, `finish_user_fixture`, `settle_season_prize` y `close_season_atomic` (ascensos y descensos del reglamento). `apply_league_result` queda como la versión clásica.
- API: `leagueVoteApi` (boleta, voto, reglamento del año); `generateRoundRobinFixtures(..., rules)`; las ligas del mundo nacen con el reglamento votado; el cierre guarda el reglamento en la liga nueva antes de generar los partidos; `getLeagueRules`.
- UI: `AssemblyCard` en la gala de fin de temporada (hay que votar para cerrar; si la boleta no carga no estorba) y aviso del reglamento vigente en la tabla.
- Alcance: el voto rige desde el próximo cierre; las ligas ya generadas siguen con el reglamento clásico.
- Gates: eslint, 1801 tests y 70 escenarios BDD en verde.
