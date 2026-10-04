# Especificación — feat-fase-06-dashboard-overview

## 1. Objetivo
Implementar el modelo de lectura agregado y la arquitectura del centro neurálgico de mando (Dashboard) de la Fase 06, integrando en una sola llamada cacheada con SWR (`dashboardApi.getOverview`) el resumen del club, el DT, finanzas, salud del plantel, próximo partido, eventos dinámicos y alertas críticas y bloqueantes.

## 2. Problema actual
La vista anterior realizaba múltiples llamadas desestructuradas y dispersas directamente desde el componente frontend, sin un modelo unificado de alertas críticas (plantel incompleto, bajas médicas, contratos por expirar, déficit de caja), lo que provocaba latencias innecesarias y riesgos de inconsistencia de datos.

## 3. Resultado esperado
1. Capa API `dashboardApi.getOverview(club, manager)` con caché en memoria SWR deduplicada en vuelo.
2. Sistema de alertas priorizadas (`HIGH`, `MEDIUM`, `LOW`) con bloqueo preventivo si no hay al menos 11 jugadores habilitados para disputar el partido.
3. Tarjeta central de próximo partido oficial con localía, estadio y botón condicional de avance.
4. Panel de métricas del plantel (condición física media, moral, balance en caja y mini-tabla de posiciones).
5. Diseño mobile-first con iconos de Lucide (cero emojis en crudo) y navegación accesible.

## 4. Alcance

### Incluido
- Módulo `src/api/dashboard.js` con consultas concurrentes y agregación analítica de estado.
- Interfaz `src/features/dashboard/Dashboard.jsx` renovada con banners de alertas y diseño responsivo.

### No incluido
- Simulación del partido en 2D, gestionada en Fase 10.

## 5. Criterios de aceptación
- [x] AC-01: Proyección consolidada cargada en menos de 100ms vía caché SWR.
- [x] AC-02: Banners de alertas críticas visibles con enlace de resolución directa.
- [x] AC-03: Botón de avance bloqueado si se presentan alertas críticas de plantel incompleto.
- [x] AC-04: El build de producción pasa 100% verde.

## 6. Trazabilidad
- Manifiesto: `.agents/workflow/tasks/feat-fase-06-dashboard-overview.yml`
- Contrato de dominio: `docs/Del_Potrero_al_Idolo_Fase_2_1/06_dashboard/06_dashboard_2.1.md`
