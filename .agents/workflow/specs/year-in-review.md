# Specification — year-in-review

## 1. Objetivo
Línea de contenido "Temporadas": que el resumen del año de la gala cuente los fichajes y el ranking de decisiones.

## 2. Cambio
- `signingsSummary` (compras, ventas, gasto, ingreso y mayor compra) y `decisionRanking` (mejor y peor consecuencia del año por impacto en hinchada, dirigencia y vestuario) en `domain/yearInReview.js`.
- `seasonStory` suma las líneas "Compraste N jugadores por $X y vendiste M por $Y", "Tu mejor decisión: ..." y "La que más te costó: ..." (sin inventar nada si no hubo movimientos o impacto).
- `climateApi.getSeasonSummaryData` trae los traspasos del club de la temporada y las consecuencias con su impacto.
- Migración `migration_transfer_audit_season_year.sql` (aplicada): `negotiate_transfer` y `resolve_sale_offer` registran la TEMPORADA en `transfer_audit_log` (antes el año calendario, que mezclaba las temporadas). Los registros viejos conservan el año calendario.

## 5. Criterios de aceptación
- [x] AC-01: compras y ventas del club (los traspasos ajenos no cuentan).
- [x] AC-02: mejor y peor decisión por impacto; sin impacto no cuentan.
- [x] AC-03: la historia agrega las líneas y no inventa fichajes.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/year-in-review.yml`
