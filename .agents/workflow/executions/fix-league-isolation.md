# Ejecución: fix-league-isolation

Causa de los "datos raros": `createClub` y `getStandings` llamaban a `initializeLeague` a la vez y ambos pasaban el chequeo de idempotencia, creando los 19 rivales dos o tres veces (80 clubes en la base). Además el Mercado listaba jugadores de TODOS los clubes, incluidos los de otras carreras (por eso aparecía otro "Club Atlético Potrero").

- `initializeLeague`: una sola creación en vuelo por club (Map de promesas).
- `marketApi.getLeagueClubIds` + `getMarketPlayers`: sólo clubes de la propia competición (vía `standings`) y agentes libres. No hizo falta migración: `standings` ya acota la liga.
- Copa: el resultado ya no sale de `Math.random` en el componente. `internationalCupApi.playUserMatch` lo calcula con la fuerza de ambos planteles (`src/domain/cupMatch.js`), determinista por partido y sin empates; `processUserMatchResult` ahora es idempotente (un partido jugado no vuelve a pagar premios).
- Sigue pendiente para la Fase 5: mover el cálculo a una RPC en la base para que el cliente no sea la autoridad.
- 180 tests en verde.
