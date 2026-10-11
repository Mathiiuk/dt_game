# Semana con días reales + ayuda "?" en la pizarra del celular

**Error 1 — animación incoherente:** `WeekProgress` mostraba siempre Lun→Dom, pero el juego avanza de a 7 días desde el día actual (miércoles → miércoles) y los partidos son los sábados, así que luego decía "en 3 días". Decisión del usuario: mostrar los días reales, sin tocar el motor.
- `weekFlavor.js`: `weekDays(fromDate)` (7 días reales, sin desfase de zona horaria), `dayPhrase(día)` (el sábado juegan los rivales, el domingo se descansa), `weekSummary` con "Hoy es …" y "Próximo partido: … (en N días)" calculado igual que el Inicio (`daysBetween`).
- `useAdvanceWeek`: recibe `fromDate` y `readSnapshot` (caja + próximo partido, `readWeekSnapshot.js`); devuelve `days`.
- `WeekProgress`: día y número reales en la línea de tiempo y frase atada al día resaltado.
- `firstSteps.nextStep`: "El partido es el sábado, en 3 días".

**Error 2 — textos informativos perdidos en la pizarra móvil:** nuevo `HelpHint` ("?" con área táctil de 44 px que abre un cuadro chico; el tooltip de hover no sirve en táctil). Textos en `domain/tacticsHelp.js`.
- "?" junto a la formación (cómo usar la pizarra) y al final del resumen (nivel, química, fuera de puesto + colores del anillo, líneas de química y símbolos de bajas).
- "?" en Formación, Mentalidad y Estilos listos (hoja Estilo) y en pase, ritmo y presión (hoja Ajustes).
- Se quitó el párrafo fijo bajo la cancha (queda solo el aviso corto del modo Editar). Sin scroll nuevo. Escritorio no cambia.

**Tests:** `weekFlavor` (9), `weekProgress`, `useAdvanceWeek`, `helpHint`, `tacticsMobile` (4 nuevos), `firstSteps`. Capturas a 360 px revisadas.
