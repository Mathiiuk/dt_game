# Reporte de Ejecución: press-skip-t5
- **Rama**: `feat/press-skip` | **Estado**: `DONE`
- **Problema**: la rueda de prensa solo movía la moral del plantel, se podía ignorar sin consecuencias y cada respuesta hacía un UPDATE por jugador.
- **Cambios**: `src/domain/press.js` (resultado del partido, efecto de cada tono sobre hinchada y dirigencia, multa por no presentarse, evento aleatorio al omitir: derrota 55% rumor / 35% nada / 10% la hinchada lo entiende; empate 35% molestia; victoria 50% soberbia; multa mitad con dirigencia > 70). `pressApi.skipConference` (idempotente, cobra la multa con asiento FINE, estado SKIPPED, aplica consecuencias), `submitAnswer` aplica hinchada y dirigencia por tono y mueve la moral en lote, `delegateToAssistant` en lote. `PostMatchScreen`: botón "No presentarme" con aviso de la multa, y salir de la pantalla sin resolver la conferencia cuenta como omitirla (con el mismo aviso).
- **Tests**: `press.test.js` (11, incluye las probabilidades exactas), `pressSkip.test.js` (6), `postMatchPress.test.jsx` (4); suite completa verde (525).
- **Pendiente**: la conferencia relámpago durante el partido (decisiones rápidas) queda en el backlog.
