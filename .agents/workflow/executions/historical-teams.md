# Reporte de Ejecución: historical-teams

## 1. Resumen
Se integraron los clubes históricos del fútbol argentino documentados en la tabla histórica de Promiedos (https://www.promiedos.com.ar/tablahistorica) adaptados a cada una de las 5 categorías de la pirámide de ligas del juego, desde la 5ª división (Torneo Regional Amateur / Potrero) hasta la 1ª División (Primera).

Cada club cuenta con:
- `name`: Nombre oficial del club.
- `short_name`: Sigla oficial o distintiva única (sin colisiones en el catálogo de 142 clubes).
- `city`: Barrio o ciudad de origen real.
- `primary_color` y `secondary_color`: Colores tradicionales en HEX.
- `founded_year`: Año de fundación histórico.
- `stadium_name`: Nombre real del estadio.
- `stadium_capacity`: Capacidad del estadio.
- `tier`: Categoría futbolística (1 a 5).

## 2. Modificaciones realizadas
- **`src/domain/historicalClubs.js`**: Nuevo módulo con el catálogo estructurado de 142 clubes históricos (`HISTORICAL_CLUBS_BY_TIER` con 28 a 30 clubes por nivel y `ALL_HISTORICAL_CLUBS`).
- **`src/domain/rivalClubs.js`**: Re-exporta el catálogo y actualiza `pickRivalClubs(seed, count, options, tier)` para filtrar deterministamente por categoría (`tier`) y exclusiones de nombres (`exclude`), manteniendo retrocompatibilidad.
- **`src/api/competition.js`**:
  - `_initializeLeague`: Asigna categoría 5 y excluye el nombre del club del usuario, inyectando colores, ciudad, estadio y capacidad reales.
  - `prepareNextLeague`: Sortea rivales con `{ tier: newTier, exclude }` o `{ tier: oldTier, exclude }` conservando la identidad del estadio y colores.
- **`tests/domain/rivalClubs.test.js`**: 11 pruebas unitarias cubriendo unicidad de nombres, siglas, distribución por categoría y determinismo.
- **`.agents/workflow/features/historical-teams.feature` & `tests/bdd/steps/historical-teams.steps.js`**: 3 escenarios BDD ejecutables con etiqueta `@auto`.

## 3. Verificación de Quality Gates
- **`pnpm lint`**: 13 advertencias (0 errores, cumple límite `--max-warnings=13`).
- **`pnpm test`**: 157 archivos de test y 1.311 pruebas unitarias pasando (100%).
- **`pnpm test:bdd`**: 60 escenarios BDD y 187 pasos pasando (100%).
- **`pnpm build`**: Build de Vite finalizado limpiamente en 1.76s.
- **`agt task:verify historical-teams`**: Verificado y aprobado (PASS en todos los gates).
