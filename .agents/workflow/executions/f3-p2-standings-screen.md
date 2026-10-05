# Ejecución: f3-p2-standings-screen

- Dominio `src/domain/standings.js` (zonas por posición y tamaño, diferencia de gol, racha).
- StandingsScreen rediseñada: tabla accesible (scope, abbr, aria-current, zona dicha en texto para lectores de pantalla), columnas que se ocultan por ancho (móvil: Pos, Club, PJ, DIF, PTS), leyenda de zonas, estado vacío.
- Zona de descenso ahora depende del total de clubes (antes fija 18º-20º).
- Verificado a 375 px: 20 filas sin desborde. 4 tests nuevos.
