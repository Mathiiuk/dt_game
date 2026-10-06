# Reporte de Ejecución: climate-feel
- **Rama**: `feat/climate-feel` | **Estado**: `DONE`
- **Backlog del diseño de consecuencias cerrado**:
  - **Combos y círculos viciosos** (`domain/combos.js`): fiesta del pueblo (entrada barata + 3 victorias), entradas caras sin ganar (círculo vicioso), plantel reventado (3 semanas a máxima intensidad con 3 o más lesionados), racha de campeón (6 sin perder). Se disparan una sola vez por racha, se aplican en el cierre semanal (en la misma rama que el humor por precio, sin pisar escrituras) y salen en el feed con insignia "Combo" o "Círculo vicioso". `climateApi.processWeek` lee la carga de entrenamiento en la misma ronda de lecturas.
  - **Clima visible**: la tarjeta de clima cambia de tono (verde, ámbar, rojo) según el estado, sin animaciones; en las primeras semanas no se tiñe.
  - **Resumen de historia de la temporada** (`domain/seasonStory.js`): al cerrar la temporada cuenta el año con la posición, la barra, los favores, los escándalos, las ventas, los combos y la caja.
- **Hallazgo y arreglo de economía**: los premios de fin de temporada ($1.000 a $100.000) y de la Copa ($2.000.000 el campeón, $200.000 por partido) eran de otra escala frente a una caja de ~$20.000 y un margen de unos $45.000 al año. Reescalados: temporada de $1.000 a $12.000 (goleador +$1.500); copa campeón $25.000, finalista $12.000, $2.500 por victoria y $800 por derrota en cada partido.
- **Tests**: `combosAndStory.test.js` (13), `climateCombos.test.js` (5), ampliaciones de `climatePanel.test.jsx` y `seasonStoryModal.test.jsx` (3); suite completa verde.
