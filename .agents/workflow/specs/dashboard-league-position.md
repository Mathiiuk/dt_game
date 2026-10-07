# Specification — dashboard-league-position (B4 de docs/roadmap_v2.md)

## 1. Objetivo
El Inicio muestra el mismo puesto que la Tabla. Antes leía `standings.rank`, una columna que no existe, y quedaba siempre en "—".

## 3. Cambio
- `api/dashboard.js`: el puesto sale de `competitionApi.getStandings` (la tabla ordenada con los criterios de desempate, con caché). Si la tabla falla, el Inicio carga igual sin puesto.
- `Dashboard.jsx`: sin puesto muestra "—" (antes "—º").
- De paso (año fijo 2026): la evolución del Plantel pide el balance de la última temporada cerrada según la fecha del juego, en vez de `club.current_season_year`, que no existe.

## 5. Criterios de aceptación
- [x] AC-01: puesto, puntos y jugados del Inicio coinciden con la Tabla.
- [x] AC-02: un error al leer la tabla no rompe el Inicio.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/dashboard-league-position.yml`
