# Plan de Pruebas — feat-fase-05-manager-levels

## 1. Casos de Prueba Verificados

### Caso 1: Cálculo de Curva de Niveles
- Nivel 1 = 0 XP.
- Nivel 2 = 150 XP.
- Nivel 3 = 455 XP.
- Nivel 50 = Nivel máximo topeado sin superar 50.

### Caso 2: Idempotencia en Entrega de XP
- Reintentar `awardXp` con el mismo `managerId`, `sourceType` y `sourceEntityId` devuelve `duplicate: true` sin sumar puntos adicionales.

### Caso 3: Desbloqueo de Habilidad (Perks)
- Si el DT tiene 1 punto disponible y nivel suficiente, el perk se desbloquea y el contador de puntos decrementa a 0.
- Si no tiene puntos disponibles, arroja error descriptivo.

### Caso 4: Verificación de Build
- `npm run build` genera la salida de producción 100% verde en ~1s.
