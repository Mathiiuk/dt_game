# Specification — standings-zones-by-tier (B5 + B14 de docs/roadmap_v2.md)

## 1. Objetivo
La Tabla muestra lo que pasa de verdad al cerrar la temporada y nunca datos inventados.

## 3. Cambio
- `domain/standings.js`: `zoneOf(pos, total, tier)` y `zoneLegend(tier)` salen de `domain/pyramid` (suben 2 salvo en Primera, bajan 3 salvo en la última). Se quita la zona "Reducido" (decisión del usuario, 07/10/2026: no hay playoff jugable).
- `StandingsScreen.jsx`: zonas y referencias según la división del club; en la última división avisa que no hay descensos; si la carga falla muestra "No pudimos cargar la tabla" con "Reintentar".
- `api/competition.js`: se elimina la tabla inventada (`generateFallbackStandings`, "Tu Club" ganando 2-0) y `getZoneForPosition`; `getStandings` devuelve el error.
- `LeaguePyramidModal.jsx`: sin pestaña ni texto del reducido; ascensos y descensos salen de `domain/pyramid`. Ya no lee el año fijo 2026.
- Textos de objetivos: "Terminar entre los seis primeros" y "Terminar en la mitad de arriba" en lugar del reducido.
- Sin migración. `competitionTiersApi.simulatePlayoffs` queda sin uso (no se tocó).

## 5. Criterios de aceptación
- [x] AC-01: en la división 5 nadie queda marcado en descenso.
- [x] AC-02: en una división intermedia se marcan 2 ascensos y 3 descensos.
- [x] AC-03: no aparece el reducido en la Tabla ni en la Pirámide.
- [x] AC-04: un error de carga muestra el aviso con "Reintentar", sin tabla.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/standings-zones-by-tier.yml`
