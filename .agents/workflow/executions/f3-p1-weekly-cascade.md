# Reporte de Ejecución: f3-p1-weekly-cascade
- **Rama**: `fix/f3-p1-weekly-cascade` (apilada sobre `fix/f3-p1-postmatch-idempotency`) | **Estado**: `DONE`

## Hallazgos y correcciones
1. **La liga de IA nunca avanzaba (bug de lógica)**: `simulateMatchDay` buscaba fixtures con `match_date == fecha`, pero la fecha del juego avanza de a 7 días (miércoles) y los fixtures caen en sábado, así que jamás coincidían; además habría simulado el partido del propio usuario. Ahora simula todo lo vencido (`<= fecha`) excluyendo el club del usuario.
2. **N+1**: cientos de `UPDATE` secuenciales. Se agregaron RPC en lote (`batch_update_players`, `increment_players_minutes`, `batch_finish_fixtures` —idempotente, devuelve los ids cerrados—, `apply_standings_deltas`, `batch_update_injuries`) y se usan en: avance semanal (recuperación), entrenamiento, post-partido (estado, minutos, estadísticas de club/ídolos), recuperación médica y simulación de IA.
3. **Métodos duplicados**: `injuries.js` definía dos veces `processWeeklyInjuriesRecovery`, `getClubInfirmary` y `getPlayerMedicalHistory` (la última sobrescribía en silencio, por eso la optimización no tenía efecto). Se eliminaron las copias y se agregó una guardia (`tests/static/duplicate-methods.test.js`).
4. **Deadlock de plantel lesionado**: el avance de semana se bloqueaba con menos de 11 aptos, pero la recuperación ocurre al avanzar. Ya no se bloquea (el mínimo condiciona jugar el partido).
5. **Despido sin efecto**: `executeManagerDismissal` escribía una columna inexistente (`status`) y el DT seguía en el cargo con el despido sólo registrado. Ahora cierra el stint (`SACKED`), libera el club, deja al DT `UNEMPLOYED` y aplica la penalización de reputación (`DISMISSAL`).
6. **Conferencia de prensa duplicada**: promesa compartida por fixture + índice único parcial `uq_press_conferences_fixture`.

## Medición en el navegador (misma carrera de prueba)
| Operación | Antes | Después |
|---|---|---|
| Avanzar semana | ~20 s / 106 requests | ~10 s / 49 requests |
| Resumen post-partido | ~25 s / 73 requests | ~8 s / 44 requests |
- Liga: tras 5 fechas, los 20 clubes tienen 4–5 partidos, 49 fixtures jugados, `played` total = 2 × fixtures y diferencia de goles total = 0 (coherente).

## Calidad
- Tests nuevos: simulación de IA (marcadores, deltas de tabla, exclusión del club del usuario y fecha `lte`), guardia de métodos duplicados. Total 28 tests (`agt task:verify` → `unit_tests -> npm test`).

## Pendiente / decisiones para el usuario
- Con <11 aptos y partido vencido el usuario sigue sin poder avanzar ni jugar con garantías: falta definir la regla (¿jugar con lesionados con riesgo?, ¿completar con juveniles?).
- `goals_scored` de jugadores no se incrementa: `postMatch` no pasa `scorers` a `processPostMatchPlayerStats` (afecta ídolos).
- Avanzar semana aún tarda ~10 s: quedan pasos secuenciales independientes (finanzas, mercado, moral, estadio) paralelizables.
