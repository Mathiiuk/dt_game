# Plan de Implementación — feat-fase-06-dashboard-overview

## 1. Enfoque General
Construir una arquitectura de lectura agregada eficiente en `src/api/dashboard.js` para desacoplar el renderizado del frontend de las consultas de base de datos individuales, optimizando la experiencia del DT con alertas accionables.

## 2. Fases de Trabajo
1. **Capa API de Dominio (`src/api/dashboard.js`)**:
   - Implementar `getOverview` combinando consultas concurrentes mediante `Promise.all`.
   - Calcular métricas de salud de plantel (fitness, moral, lesionados, suspendidos, disponibles).
   - Generar alertas autoritativas de severidad alta, media y baja.
2. **Capa de Presentación (`src/features/dashboard/Dashboard.jsx`)**:
   - Conectar con `dashboardApi.getOverview`.
   - Renderizar banners de alertas con navegación de resolución.
   - Diseñar tarjeta de próximo partido y panel de estado con Tailwind.
3. **Verificación y Quality Gates**:
   - Ejecutar `npx agt task:verify feat-fase-06-dashboard-overview`.
   - Sincronizar memoria con `npx agt memory:sync`.
