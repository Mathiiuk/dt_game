# league-server

Liga con fuerza real de rivales y resultados en el servidor.

- **Problema:** los clubes rivales se creaban sin jugadores ni fuerza (todos con reputación 15): los partidos entre ellos eran azar parejo (`simulateAiScore`), el rival del usuario salía de una reputación igual para todos, y el navegador escribía los resultados y la tabla.
- **Fuerza por club:** `clubs.strength` (46 a 66, media 56); los clubes existentes se completaron con un valor repartido por su id y los nuevos lo sortean con semilla de la carrera. `club_strength` usa el plantel si el club tiene al menos 11 jugadores y `strength` si no (la copa también gana sentido).
- **Liga de IA en la base:** `play_league_ai_fixtures` juega los partidos vencidos con la misma fórmula y semilla que la copa y actualiza la tabla en la misma transacción. Probada en la base real con retroceso: 29 partidos jugados, tabla coherente.
- **Partido del usuario:** la simulación en vivo sigue en el navegador, pero `finish_user_fixture` valida que el partido sea del club, esté abierto, ya haya llegado su fecha y el marcador sea razonable (0 a 9) y actualiza la tabla.
- **Protección:** dos disparadores impiden escribir resultados o sumar puntos desde el navegador (reiniciar la tabla al cerrar la temporada sigue permitido); se eliminaron `batch_finish_fixtures` y `apply_standings_deltas`.
- Cliente: `simulateMatchDay` llama a la base; `finalizeMatch` cierra con la función; `MatchScreen` ya no escribe la tabla y el rival juega con su nivel real (`buildRivalLineup(reputación, fuerza)`).
- No cubierto todavía: la simulación del partido del usuario es del navegador (se puede inventar un 9-0); mover eso al servidor exigiría rehacer el motor en SQL.
