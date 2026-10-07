# Specification — league-promotion-relegation

## 1. Objetivo
Que subir y bajar de categoría sea real: el puesto final mueve al club de liga y los rivales de la IA rotan.

## 2. Problema actual
Al terminar entre los dos primeros el club "subía" de categoría pero seguía jugando con los mismos 19 rivales; nadie descendía; los clubes de la IA no se movían.

## 3. Resultado esperado
- La base (`settle_season_prize`) decide el movimiento: los 2 primeros suben (salvo en Primera), los 3 últimos bajan (salvo en la última categoría), el resto se queda. Presupuesto salarial: +80% al subir, -15% al bajar, +10% si se queda.
- Si cambia la categoría: liga nueva con 19 rivales con la fuerza de esa división (46 a 66 en la quinta, +4 por escalón hacia arriba) y su calendario.
- Si se queda: los clubes de la IA que subirían o bajarían se reemplazan por recién llegados (los que suben dejan su lugar a equipos más débiles de la categoría, los que bajan a equipos más fuertes).
- La gala avisa del ascenso o descenso antes de cerrar y la historia del año lo cuenta.

## 4. Alcance
Incluido: `domain/pyramid.js`, migración, `competitionApi.prepareNextLeague`, cierre de temporada, gala e historia, tests y escenario BDD.
No incluido: simular las ligas de las otras divisiones (se arman con rivales de la fuerza que corresponde); ingresos por categoría (segunda pasada de A2 del roadmap); los clubes de la IA que se van quedan en la base (el snapshot los referencia).

## 5. Criterios de aceptación
- [x] AC-01: movimiento según puesto y categoría (probado en la base real: sube 3→2 con +80%, baja 3→4 con -15%, campeón de Primera se queda).
- [x] AC-02: ascenso o descenso crea una liga nueva con rivales de la fuerza de la división.
- [x] AC-03: sin cambio de categoría rotan solo los clubes que corresponden (nadie sube en Primera ni baja en la última).
- [x] AC-04: calendario de 190 partidos desde el 1 de agosto del año siguiente.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/league-promotion-relegation.yml`
