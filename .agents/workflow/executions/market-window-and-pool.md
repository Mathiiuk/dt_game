# market-window-and-pool

Hallazgos de la primera prueba con una cuenta real (navegador, "cluade prueba", 1/jul/2026):

- **Mercado "Cerrado" el 1 de julio:** `new Date('2026-07-01')` es medianoche UTC y en Argentina cae el 30 de junio, así que el mes daba junio. Ahora el mes sale del texto de la fecha (`getMarketStatus`). Mismo error de zona horaria corregido en `season.js` (año del historial de temporada) y en `gameLoop.js`, que además calculaba mal el inicio de la temporada siguiente (sumaba un año al año del calendario y no al de la temporada).
- **Mercado vacío (0 candidatos):** los clubes rivales se crean sin jugadores, y el mercado solo mostraba jugadores de la liga y agentes libres. Ahora `ensureFreeAgentPool` repone un pozo de agentes libres (mínimo 24, objetivo 32; medias de 44 a 68, edades de 18 a 35, potencial en los jóvenes) cada vez que se abre el mercado; los jugadores rescindidos también entran.
- Se permite `players.club_id` nulo (ya aplicado en la etapa de contratos).
