# prensa-combo

Racha de reflejos en la rueda de prensa.

- **Antes:** la cuenta regresiva solo apuraba; contestar rápido o lento daba lo mismo.
- **Ahora:** contestar con el 60% del tiempo o más disponible es una respuesta "al toque": arma un combo (cartel "¡Al toque!" y luego "Combo xN") y suma humor a la sala (+6 por nivel, tope +18). Quedarse con lo justo no suma ni corta; agotar el tiempo corta el combo. Sin cuenta regresiva no hay combo.
- **Alcance:** es un premio de ambiente. No toca moral, hinchada ni dirigencia: eso sigue dependiendo del tono y del resultado.
- **Dónde:** `src/domain/pressCombo.js` (reglas puras) y `PressRoom.jsx` (la cuenta regresiva informa cuánto quedaba, cartel junto al medidor y mensaje en la reacción).
- **TDD:** `tests/domain/pressCombo.test.js` y 3 pruebas nuevas de interfaz en `tests/ui/pressRoom.test.jsx` (al toque, con lo justo, tiempo agotado).
- **Quality gates:** pruebas unitarias y BDD en verde, ESLint sin avisos.
