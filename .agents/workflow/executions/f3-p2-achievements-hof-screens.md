# Ejecución: f3-p2-achievements-hof-screens

- Dominios `src/domain/achievements.js` (filtros, resumen, rareza, avance) y `src/domain/hallOfFame.js` (filtros del ranking, podio).
- AchievementsScreen: resumen con barra de progreso accesible, filtros por categoría y estado (ChoiceChips), tarjetas con rareza, reclamo individual y masivo, estado vacío con "quitar filtros".
- HallOfFameScreen: proyección en vivo, olimpo con tarjetas-botón, ranking en tabla accesible, ficha del entrenador sobre `ResponsiveOverlay` (reemplaza el panel `fixed inset-0`). Corregido el efecto que dependía del objeto `manager` (bucle de render) -> `manager?.id`.
- Se retiró `BottomNav` de ambas. Verificado a 375 px. 5 tests nuevos.
