# season-prize-server

Premio de fin de temporada liquidado por el servidor.

- **Antes:** el navegador leía la tabla, elegía el premio y escribía la caja, el presupuesto salarial y la categoría. Además buscaba al goleador en `players.goals_season`, una columna que no existe: el bono nunca se pagaba y el snapshot de cada temporada guardaba goleador vacío.
- **Ahora:** `settle_season_prize` (base, `SECURITY INVOKER`) calcula el puesto desde la tabla de la liga del club, el premio (12.000 / 8.000 / 5.000 / 2.500 / 1.000), el bono de 1.500 si su goleador llegó a 8 goles (contados del relato de los partidos), el ascenso (categoría y presupuesto salarial x1,8; sin ascenso x1,1) y registra un asiento `SEASON_PRIZE`. Idempotente por temporada.
- **Probado en la base real con retroceso:** puesto 11 → 2.500; repetir → ya liquidado con un solo asiento; club inexistente → rechazado; primero → 12.000, ascenso a la categoría 4 y presupuesto salarial 6.930.
- **Cliente:** `executeSeasonClose` pide la liquidación antes de reiniciar la tabla y arma el snapshot con el goleador real; se quitó la tabla de premios vieja (100.000) que quedaba sin usar.
- **TDD:** tests escritos antes (5 en rojo) y luego migración y cliente (verde, 1.055 tests).
- **Un hallazgo más:** el disparador `protect_standings` (liga en el servidor) bloqueó mi propio intento de alterar la tabla en la prueba: funciona.
- **Quality gates:** `agt task:verify` (unit_tests); `bdd_tests` desactivado (Cucumber no instalado).
