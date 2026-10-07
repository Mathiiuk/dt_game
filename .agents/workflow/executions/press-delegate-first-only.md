# Execution — press-delegate-first-only (B15)

## Qué se hizo
- "No presentarme" y "Delegar en 2º entrenador" solo aparecen antes de contestar la primera pregunta. Después queda "Terminar acá", que cierra la conferencia conservando lo respondido.
- Delegar ya no pisa respuestas dadas ni suma moral encima; dos clics seguidos suman una sola vez.
- Salir de la pantalla con respuestas dadas termina la conferencia sin multa (antes contaba como no presentarse).

## Evidencia
- `pnpm test`: 150 archivos, 1.241 tests en verde (7 nuevos).
- `npm run lint`: 0 errores, 13 avisos (tope 13). `pnpm test:bdd`: 57 escenarios.
- `agt task:verify press-delegate-first-only`: todos los gates pasaron.
- No verificado en el navegador: hace falta jugar un partido con una cuenta real.

## Qué probar (B15)
1. Después de un partido, entrar a la prensa: en la primera pregunta están "No presentarme" y "Delegar".
2. Contestar la primera y pasar a la siguiente: los dos botones ya no están y aparece "Terminar acá".
3. Apretar "Terminar acá": el resumen muestra solo lo que contestaste y no hay multa.
4. En otro partido, contestar una pregunta e irte con "Volver al inicio": no cobra multa.
