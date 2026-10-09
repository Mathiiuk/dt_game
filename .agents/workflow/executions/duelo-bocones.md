# duelo-bocones

Duelo de declaraciones con el DT rival antes de un clásico.

- **Antes:** el juego no tenía una noción de clásico en el partido (el indicador `isDerby` existía en prensa, hinchada y taquilla, pero ninguna pantalla lo calculaba, y la tabla `club_fanbase.derby_rival_club_id` está vacía en todos los clubes).
- **Ahora:** un partido es clásico según el par de clubes (estable, igual de ida y de vuelta; 1 de cada 7 rivales, unos 2 o 3 por liga de 19). Antes del pitazo aparece "¡Es clásico!" con el botón "Cruce de declaraciones": 3 rondas, cada una con una provocación distinta del DT rival (directa, juego mental, elogio falso) y tres maneras de contestar (plantarse, con calma, con respeto). Cada tipo tiene una respuesta que gana (+1), una que empata (0) y una que cae en la trampa (-1).
- **Resultado:** 2 o más gana el duelo (+3 de moral al plantel), -2 o menos lo pierde (-2) y lo demás es parejo. Queda una línea en el relato al arrancar el partido. El motor del partido no se toca. Se juega una sola vez por partido (se recuerda en la sesión) y es opcional: se puede comenzar sin jugarlo.
- **Decisión pendiente:** no se activó el indicador `isDerby` de la economía (taquilla x1.45, hinchada +8/-10) ni de la prensa, porque cambiaría el balance del juego. Queda a criterio del usuario.
- **Dónde:** `src/domain/derbyDuel.js` (reglas puras), `src/features/match/DerbyDuel.jsx`, `MatchScreen.jsx` (pre-partido y relato) y `pressApi.applyDuelResult`.
- **TDD:** `tests/domain/derbyDuel.test.js`, `tests/ui/derbyDuel.test.jsx`, `tests/api/derbyDuelMorale.test.js`.
- **Quality gates:** pruebas unitarias y BDD en verde, ESLint sin avisos.
