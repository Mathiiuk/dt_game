# match-sin-x4

Se quita la velocidad x4 del partido en vivo.

- **Antes:** el partido ofrecía tres velocidades (x1, x2 y x4) más "Saltear partido".
- **Ahora:** solo x1 (lento, para leer cada jugada) y x2 (la que antes era la normal). "Saltear partido" sigue como acción aparte. Una velocidad guardada de antes (x4) cae en la lenta.
- **Dónde:** `MATCH_SPEEDS` en `src/domain/matchClock.js`, que alimenta los controles del celular (`MatchControls`) y de escritorio (`MatchActions`).
- **Pruebas:** actualizadas las de `matchClock` y `matchControls` (dos velocidades, sin x4, x2 avanza más rápido que x1).
- **Quality gates:** unitarias y BDD en verde, ESLint sin avisos.
