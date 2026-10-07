# Specification — season-close-flow

## 1. Objetivo
Que la temporada se pueda cerrar de verdad: llegar a la gala en la semana 52, cobrar el premio, ascender o no según el puesto y arrancar la temporada siguiente con su calendario de partidos.

## 2. Problema actual
Hallado corriendo una temporada completa en el navegador:
- El botón de la gala dependía de `clubs.current_week` (columna que no existe): nunca aparecía.
- Al pasar la semana 52 el avance llamaba a `gameLoopApi.endSeason`, que ascendía a TODOS los clubes, no liquidaba el premio y no creaba partidos para el año siguiente (quedaba un año entero sin partidos).
- La consulta de la tabla del cierre pedía `clubs.logo_url` (no existe): fallaba en silencio y el snapshot quedaba sin tabla ni campeón.

## 3. Resultado esperado
- En la semana 52 el inicio ofrece la gala; el avance de semana se rechaza (`ERR_SEASON_END`).
- La gala liquida el premio en el servidor, guarda el historial y arma los partidos de la temporada siguiente (desde el 1 de agosto) en la misma liga.
- Sin camino alternativo que cierre la temporada ascendiendo a todos.

## 4. Alcance
Incluido: `isSeasonEnded`, guarda en `advanceWeek`, `executeSeasonClose` (historial, calendario nuevo, error visible), pantalla de tabla, retiro de `endSeason`, columna inexistente.
No incluido: ascensos y descensos reales entre divisiones para los clubes de la IA.

## 5. Criterios de aceptación
- [x] AC-01: semana 52 (fecha del juego) = temporada terminada.
- [x] AC-02: `advanceWeek` en semana 52 lanza `ERR_SEASON_END`.
- [x] AC-03: el cierre crea los partidos del año siguiente de la liga del club.
- [x] AC-04: si no se puede leer la tabla, el cierre se corta antes de cobrar nada.
- [x] AC-05: ningún código pide `logo_url` de clubs.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/season-close-flow.yml`
