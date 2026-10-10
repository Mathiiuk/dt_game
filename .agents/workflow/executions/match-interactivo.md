# /match más interactivo: córners y mano a mano con barra

## Cambios
- `PowerBar.jsx` (nuevo, extraído del penal): barra de potencia reutilizable que arranca distinta cada vez; `PenaltyShoot` ahora la usa.
- Córner a favor: se elige la zona y después se frena la barra ("¡Centrar!"); la calidad entra al motor (`0.7 + 0.6·calidad` sobre la chance; muy mala = centro desviado).
- Córner en contra: si se refuerza una zona, se frena la barra para despejar ("¡Despejar!"); con la barra en el verde la zona reforzada se cierra del todo (×0,45) y mal frenada se cierra mucho menos. "Dejar dos arriba" sigue siendo directo.
- Mano a mano a favor: "defina de primera" pasa por la barra ("¡Definir!") y la calidad mueve la chance (`0.7 + 0.6·calidad`); gambetear o ceder siguen directos.
- `matchEngine.js` (`applyChange`/resoluciones): `quality` opcional en `SETPIECE_CORNER`, `SETPIECE_DEF_CORNER` y `KEYPLAY_CHOICE`; sin calidad (decisiones viejas) todo se resuelve como antes.
- Tests: motor (calidad buena > mala en los tres casos y sin calidad igual que siempre) y `matchDecisions.test.jsx` (flujo de dos pasos).
- Queda para después: tiro libre en contra interactivo.
