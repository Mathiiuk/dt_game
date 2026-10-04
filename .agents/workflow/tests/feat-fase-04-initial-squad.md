# Plan de Pruebas — feat-fase-04-initial-squad

## 1. Casos de Prueba Verificados

### Caso 1: Generación de 20 Jugadores y Cuotas Posicionales
- La llamada a `generateInitialSquad` genera exactamente 20 futbolistas.
- Contiene: 2 Porteros, 6 Defensores, 7 Mediocampistas y 5 Delanteros.

### Caso 2: Unicidad de Dorsales
- Cada jugador del club posee un `shirt_number` único del 1 al 20 sin colisiones.

### Caso 3: Idempotencia ante Reintentos
- Si el club ya tiene jugadores generados, llamadas sucesivas devuelven el plantel sin crear filas duplicadas en la base de datos.

### Caso 4: Verificación de Build
- `npm run build` genera la salida de producción 100% verde sin errores.
