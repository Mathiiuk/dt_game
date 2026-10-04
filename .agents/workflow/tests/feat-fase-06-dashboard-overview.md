# Plan de Pruebas — feat-fase-06-dashboard-overview

## 1. Casos de Prueba Verificados

### Caso 1: Consolidación Agregada de Métricas
- `dashboardApi.getOverview` retorna en un solo objeto resumen del DT, resumen del club, finanzas, salud del plantel, próximo partido y alertas urgentes.

### Caso 2: Generación de Alertas de Lesiones y Contratos
- Si hay futbolistas con `is_injured = true`, se genera la alerta de severidad media con conteo de bajas médicas.
- Si hay contratos con vencimiento en un año o menos, se genera la alerta preventiva.

### Caso 3: Control Bloqueante de Avance
- Si el número de futbolistas aptos es inferior a 11, el botón de avance temporal muestra advertencia y bloquea el avance.

### Caso 4: Verificación de Build
- `npm run build` genera la salida de producción 100% verde sin advertencias bloqueantes.
