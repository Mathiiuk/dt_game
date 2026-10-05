# Reporte de Ejecución: match-experience-m5
- **Rama**: `feat/match-experience` (parte de `feat/lineup-chemistry`) | **Estado**: `DONE`
- **Problema**: el partido corría de un tirón (x1 duraba unos 4,5 segundos), no se podía pausar y "Final" estaba mezclado con las velocidades.
- **Cambios**: `src/domain/matchClock.js` (velocidades: x1 lento y legible, ~63 s por partido; x2 la velocidad que antes era la normal; x4 rápida; el reloj corre solo en juego, sin pausa y antes del 90). `useMatchClock` (hook del reloj con pausa). `MatchControls`: Pausa/Reanudar, grupo de velocidad accesible (radiogroup) y "Saltear partido" como acción aparte, que ahora pide confirmación. `MatchScreen` usa el hook, muestra un aviso en pausa para dar una orden táctica, arranca en x1 y consolida el resultado al llegar al 90.
- **La rueda de prensa obligatoria de M5** ya está hecha en `press-skip-t5`.
- **Límite**: los cambios de jugadores en pausa no existen todavía (el partido se simula completo de antemano); en pausa se pueden dar órdenes tácticas.
- **Tests**: `matchClock.test.js` (3) y `matchControls.test.jsx` (6, con temporizadores falsos); suite completa verde (678).
- **Sin verificar en navegador**.
