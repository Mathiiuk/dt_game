# Specification — club-summary-numbers (B8 de docs/roadmap_v2.md)

## 1. Objetivo
El resumen de `/club` muestra los mismos números que `/finances`.

## 2. Causa
`ClubScreen.jsx` usaba un ingreso semanal fijo de $40.000 (la caja inicial ronda los $20.000) y dividía por 52 un sueldo que ya es semanal: la nómina se veía 52 veces más chica y el "Margen semanal" no coincidía con Finanzas.

## 3. Cambio
- El resumen toma sueldos (plantel y staff) y el flujo de la semana de `financesApi.getFinances`. Si no se puede leer, muestra "—".
- "Margen semanal" pasa a "Por semana: lo que entra menos lo que sale".
- El costo de otear ($5.000) no se toca: se revisa en el documento D2.

## 5. Criterios de aceptación
- [x] AC-01: sueldos y flujo semanal del Club coinciden con Finanzas.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/club-summary-numbers.yml`
