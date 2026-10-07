# Reporte de EjecuciA3n: B18 Lesiones y Cambios (match-injury-sub)

## 1. Resumen
Se implementA3 la mejora solicitada en la incidencia B18. Ahora, cuando un jugador se lesiona durante un partido, el juego proporciona informaciA3n mAs clara y opciones mAs amigables e intuitivas.

## 2. QuAc se cambiA3
1. **DecisiA3n RApida (Quick Decision)**
   - El tA-tulo del evento ahora nombra especA-ficamente al jugador y su posiciA3n base (e.g. `Se lesionA3 Juan Nro3 (DFC)`).
   - Se reescribiA3 el texto descriptivo del botA3n de acciA3n: en lugar de "Sacarlo ahora", el botA3n principal dice "ElegA- quiAcn entra".
   - Se mantiene intacta la opciA3n "Que siga" con sus penalizaciones fA-sicas respectivas.

2. **Panel de Sustituciones (SubstitutionsPanel.jsx)**
   - Se rediseAA3 visualmente la tarjeta de sustituciones para que sea fAcil de pulsar en dispositivos mA3viles:
     - Fuente mAs grande (`text-sm` vs `11px`).
     - Botones con `py-2` y `py-3` para un hit-box cA3modo en touch.
     - IndicaciA3n visual del jugador lesionado (texto en rojo).
   - **Ordenamiento Inteligente**: Cuando seleccionas a un jugador para salir (lesionado o no), el banco de suplentes se ordena automAticamente para mostrar primero a aquellos jugadores que mejor rinden en la posiciA3n del jugador saliente (calculando su `ratingAtSlot` exacto).

## 3. QuAc probar
| A?tem | CA3mo probarlo |
|---|---|
| **Aviso de LesiA3n** | JugA un partido hasta que haya una lesiA3n de tu equipo. El popup debe decir "Se lesionA3 X (posiciA3n)" y ofrecer "ElegA- quiAcn entra" o "Que siga". |
| **Panel de SustituciA3n (TamaAo)** | EntrA a la pantalla de cambios (por lesiA3n o voluntariamente). VerificA en tu telAcfono que los botones se vean mAs grandes y fAciles de tocar. |
| **Panel de SustituciA3n (Orden)** | Al seleccionar un jugador para salir (e.g. un DFC), comprobA que el banco de suplentes muestre arriba de todo a los jugadores que mejor media tienen en esa posiciA3n (DFC), y los mediocampistas/delanteros queden mAs abajo. |

## 4. Tests y QA
- **Unit & Integration:** Todos los tests de React Testing Library pasaron en verde, incluyendo `matchDecisions.test.jsx` (actualizado para contemplar los nuevos textos).
- **BDD:** No requiriA3 adiciA3n de specs nuevos. Se reajustaron selectores para RTL.
