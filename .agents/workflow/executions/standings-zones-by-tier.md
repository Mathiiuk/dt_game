# Execution — standings-zones-by-tier (B5 + B14)

## Qué se hizo
- La Tabla marca ascenso y descenso según la división real; en la última no hay rojo. Se sacó el Reducido de la Tabla y de la Pirámide.
- Si la tabla no carga, aparece un aviso con "Reintentar" en vez de una tabla inventada.

## Evidencia
- Gates de `agt task:verify` en verde (lint, tests unitarios, BDD).
- No verificado en el navegador.

## Qué probar (B5 + B14)
1. En la Tabla (división 5): los dos primeros en verde, nadie en rojo, y la leyenda dice "En esta división no hay descensos".
2. Botón "Pirámide": una sola lista de divisiones, sin pestaña de reducido; la división 5 dice "Sin descensos".
3. Cortar internet y recargar la Tabla: aviso "No pudimos cargar la tabla" con "Reintentar".
