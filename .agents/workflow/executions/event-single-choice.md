# Execution — event-single-choice (B1)

## Qué se hizo
- `eventsApi.resolveEvent` reclama el evento en un solo paso antes de aplicar efectos; el segundo intento no cambia nada. Si la caja falla, el evento vuelve a quedar pendiente.
- La tarjeta del evento en el Inicio bloquea todas las opciones mientras se resuelve una.

## Evidencia
- `pnpm test`: 148 archivos, 1.234 tests en verde (4 nuevos en `tests/api/eventSingleChoice.test.js`).
- `npm run lint`: 0 errores, 13 avisos (tope 13).
- `pnpm test:bdd`: 57 escenarios en verde.
- `agt task:verify event-single-choice`: todos los gates pasaron.
- No verificado en el navegador: hace falta una cuenta con un evento pendiente.

## Qué probar (B1)
1. Con un evento pendiente en el Inicio, apretar una opción: las demás quedan apagadas hasta que termina.
2. Apretar dos opciones lo más rápido posible: la caja se mueve una sola vez (mirar Movimientos en Finanzas).
3. Abrir el mismo evento en dos pestañas y elegir distinto en cada una: la segunda no cambia nada y el evento desaparece al recargar.
