# Reto del día (Dilemas del día, tabla global y de amigos)

**Qué es:** cada día (hora de Buenos Aires) tres dilemas bizarros iguales para todos y un objetivo ("Terminá con la Barra en 65 o más"). Una sola oportunidad; el servidor calcula el puntaje (cuatro medidores finales + suerte del árbitro + 40 si se cumple el objetivo) y arma la tabla del día.

**Base de datos (aditivo, ya aplicado en producción):**
- `daily_decisions` (14 dilemas, 3 opciones con efectos y reacción) y `daily_scores` (una fila por persona y día; se borra con la cuenta). RLS activado y sin políticas: nadie lee directo.
- Funciones: `daily_get` (dilemas sin efectos + mi resultado), `daily_submit` (valida las opciones, calcula y guarda; un intento por día), `daily_board` (global o solo compañeros de sala; hoy y 6 días atrás). Solo `authenticated` ejecuta esas tres; las auxiliares quedan internas.
- Probado con un bloque con rollback: opción inválida, respuesta incompleta, doble intento, puntaje, puesto y tabla. Sin filas de prueba.

**Cliente:** `src/api/dailyChallenge.js`, `src/features/daily/DailyChallengeScreen.jsx` (ruta `/reto`; dilema por dilema, resumen, resultados con lo que cambió, tabla Todos / Mis amigos, compartir) y `DailyChallengeLink` en el Inicio. Menú "Reto del día", paso en el tutorial, `/reto` en las rutas del juego (vercel.json, robots, index.html). Tarjeta para compartir (`momentShare` tipo `daily`). Evento `daily_complete`.

**Tests:** `dailyChallenge` (6 de pantalla), `momentShare` (1), `daily-sql` (8).
