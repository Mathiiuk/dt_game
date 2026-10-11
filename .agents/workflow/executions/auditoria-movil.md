# Auditoría móvil de todas las pantallas

**Método:** Chromium (Playwright) a 360 px con un usuario de prueba con club; 5 páginas públicas + 19 rutas del juego; se midió desborde horizontal y alto de scroll, y se revisó cada captura completa.

## Hallazgos y arreglos
- Sin desborde horizontal en ninguna pantalla.
- **Carrera del DT:** la trayectoria mostraba el club dos veces. Causa: dos pedidos simultáneos creaban el primer ciclo. Arreglo: un único alta compartido (`createFirstStint` + `initInFlight` en `src/api/career.js`). Test: `tests/api/careerStintInit.test.js` (rojo antes, verde después).
- **Logros:** ~5000 px de scroll. Tarjetas compactas (icono menor, descripción en 2 líneas, botón solo si hay algo para reclamar).
- **Mercado:** filtros en 5 filas. Líneas en una fila deslizable y ritmo/orden en una sola fila (`ChoiceChips` ahora no encoge ni parte las etiquetas).
- **Finanzas:** separación entre título y monto en los desgloses.
- Sin cambios: Club, Entrenamiento, Tabla, Más, Inicio.

## Pendiente
- Posibles ciclos duplicados ya existentes en cuentas reales (no dañan; se pueden limpiar luego con un índice único parcial por `manager_id` donde `ended_at is null`).
- Pantallas de alta (bienvenida, crear DT, crear club) no auditadas aún.
