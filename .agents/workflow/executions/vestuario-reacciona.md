# vestuario-reacciona

El eco de la prensa: lo que el DT dice en la conferencia vuelve como una historia corta con decisión.

- **Antes:** responder en la rueda de prensa movía moral, hinchada y dirigencia en el momento, y ahí terminaba.
- **Ahora:** tras responder, los tonos combativo, elogioso y autocrítico pueden dejar un evento (`EVT_PRESS_ECHO_<TONO>`) con el periodista recurrente del club, el medio, el rival y la frase que dijiste. Cada uno tiene 3 opciones con efectos propios (hinchada, dirigencia, vestuario, moral, reputación). El pragmático no deja eco.
- **Reglas:** probabilidad por tono (combativo 70%, elogioso y autocrítico 45%), no se suma si ya hay 3 eventos pendientes y nunca rompe la respuesta (si falla solo se avisa).
- **Dónde:** `src/domain/pressEcho.js` (reglas puras), `pressApi.createEcho` y `submitAnswer` en `src/api/press.js`; `PostMatchScreen` pasa el rival. Sin migraciones: usa `dynamic_events` con la categoría `BOARD_PRESS`.
- **TDD:** `tests/domain/pressEcho.test.js` (contenido, azar inyectado, recorte) y `tests/api/pressEcho.test.js` (creación, sin suerte, tope de pendientes, falla tolerada).
- **Quality gates:** 1482 pruebas unitarias y 70 escenarios BDD en verde, ESLint sin avisos.
- **Siguiente:** racha de reflejos en la prensa y duelo de bocones antes de los clásicos.
