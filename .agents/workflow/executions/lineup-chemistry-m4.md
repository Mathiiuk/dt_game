# Reporte de Ejecución: lineup-chemistry-m4
- **Rama**: `feat/lineup-chemistry` (parte de `feat/pizarra-2`) | **Estado**: `DONE` (tanda 2 de M4)
- **Problema**: no existía la química del equipo: armar el once con compañeros de siempre, mentorías o en el puesto natural no cambiaba nada.
- **Cambios**: `src/domain/chemistry.js` (enlace de 0 a 3 entre vecinos según nacionalidad, tiempo jugando juntos —partidos jugados—, mentoría activa, personalidades que se complementan o chocan y puesto natural; vecinos por cercanía en la cancha; química del once 0-100 y factor de rendimiento de -3% a +3%; enlaces más débiles con su razón). `src/api/chemistry.js` (mentorías activas y arquetipos). `Pitch` dibuja los enlaces (verde, amarillo, rojo). La pizarra muestra la química y los vínculos para mejorar. `MatchScreen` calcula la química del once real y `matchEngineApi.startMatch` la aplica al lado del DT (`userPowerFactor`).
- **Límite del modelo**: el jugador no guarda desde cuándo está en el club, así que "tiempo en el club" usa los partidos jugados como aproximación.
- **Tests**: `chemistry.test.js` (dominio, 13) y `chemistry.test.js` (API y efecto en el partido, 4); suite completa verde (666).
- **Sin verificar en navegador**: las líneas de química y el arrastre no se vieron en pantalla.
