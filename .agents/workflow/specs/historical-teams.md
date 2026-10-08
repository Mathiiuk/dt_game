# Specification — historical-teams

## 1. Objetivo
Incorporar los clubes históricos del fútbol argentino documentados en la tabla histórica de Promiedos (https://www.promiedos.com.ar/tablahistorica) adaptados a cada una de las 5 categorías del juego (desde la 5ª división / Potrero hasta la 1ª División de Primera), dotándolos de estadios reales, ciudades de origen, colores tradicionales y siglas oficiales.

## 2. Problema actual
Hasta ahora, `src/domain/rivalClubs.js` contaba con un pozo plano de 58 nombres ficticios o semi-ficticios (`Deportivo Central`, `Social y Deportivo Rivadavia`, etc.) que no distinguían categorías. Un usuario en Potrero (División 5) o en Primera División jugaba contra los mismos rivales genéricos sin el folklore y la mística real del fútbol argentino (River, Boca, Chacarita, Los Andes, Sacachispas, Kimberley, etc.). Además, los clubes rivales generados en base de datos no tenían asignados estadios reales, capacidades ni colores fieles a sus camisetas históricas.

## 3. Resultado esperado
1. Catálogo histórico exhaustivo (`HISTORICAL_CLUBS_BY_TIER`) con más de 140 clubes reales del fútbol argentino clasificados por división:
   - **Tier 1 (Primera División):** Los grandes e históricos de la A (River, Boca, Independiente, Racing, San Lorenzo, Vélez, Estudiantes LP, Newell's, Rosario Central, Huracán, Banfield, Lanús, Argentinos Jrs, Ferro, etc.).
   - **Tier 2 (Primera B Nacional):** Tradicionales del ascenso nacional e históricos de la A (Chacarita, Quilmes, Atlanta, All Boys, Instituto, San Martín de Tucumán, Aldosivi, Nueva Chicago, Deportivo Morón, etc.).
   - **Tier 3 (Primera B Metropolitana / Federal A):** Clubes emblemáticos del ascenso metropolitano e interior (Los Andes, Deportivo Español, Colegiales, Talleres RE, Comunicaciones, Dock Sud, Argentino de Quilmes, Cipolletti, Juventud Antoniana, etc.).
   - **Tier 4 (Primera C):** Clubes de la C con fuerte identidad de barrio (Midland, San Martín de Burzaco, El Porvenir, Berazategui, General Lamadrid, Victoriano Arenas, Central Ballester, Atlas, Muñiz, Real Pilar, etc.).
   - **Tier 5 (Torneo Regional Amateur / Potrero):** Equipos representativos del interior profundo y regional amateur (Kimberley MdP, Deportivo Rincón, Sol de Mayo, Sarmiento de La Banda, Costa Brava, Altos Hornos Zapla, Jorge Newbery, Germinal de Rawson, Mandiyú, etc.).
2. Cada club cuenta con:
   - `name`: Nombre oficial del club.
   - `short_name`: Sigla oficial o distintiva única (sin colisiones).
   - `city`: Ciudad o barrio real.
   - `primary_color` y `secondary_color`: Colores tradicionales en HEX.
   - `stadium_name`: Nombre real del estadio.
   - `stadium_capacity`: Capacidad del estadio.
   - `founded_year`: Año de fundación histórico.
   - `tier`: Categoría asignada (1 a 5).
3. `pickRivalClubs(seed, count, options)` permite filtrar por categoría (`tier`) manteniendo compatibilidad retroactiva con firmas previas (`pickRivalClubs(seed, count, exclude)`).
4. `src/api/competition.js` asigna los rivales adecuados para la categoría al inicializar la liga (tier 5) y al ascender, descender o mantenerse de temporada en temporada.

## 4. Alcance

### Incluido
- Creación de catálogo estructurado de clubes históricos argentinos organizados en 5 categorías (`src/domain/historicalClubs.js` y re-exportación en `src/domain/rivalClubs.js`).
- Adaptación de `pickRivalClubs` para soportar filtro por categoría (`tier`) y exclusión de nombres.
- Integración en `src/api/competition.js` (`_initializeLeague` y `prepareNextLeague`) pasando la categoría correspondiente y poblando estadios y colores reales.
- Tests unitarios exhaustivos en `tests/domain/rivalClubs.test.js`.
- Escenarios BDD ejecutables `@auto` en `.agents/workflow/features/historical-teams.feature` y pasos en `tests/bdd/steps/league.steps.js`.

### No incluido
- Modificación de motores de simulación de partidos (`matchEngine.js`).
- Alteración de los contratos de base de datos de la tabla `clubs` (se aprovechan las columnas ya existentes: `name`, `short_name`, `city`, `colors`, `stadium_name`, `stadium_capacity`, `league_tier`, `founded_year`).

## 5. Criterios de aceptación
- [ ] **AC-01:** `RIVAL_POOL` contiene más de 120 clubes históricos argentinos sin nombres duplicados y sin siglas (`short_name`) repetidas.
- [ ] **AC-02:** Cada una de las 5 categorías (`tier` 1 al 5) cuenta con al menos 25 clubes reales con datos completos (`name`, `short_name`, `city`, `primary_color`, `stadium_name`, `stadium_capacity`).
- [ ] **AC-03:** `pickRivalClubs(seed, 19, { tier })` retorna deterministamente 19 rivales de la categoría especificada sin repetir.
- [ ] **AC-04:** La exclusión de nombres (ej. nombre del club del jugador) funciona correctamente impidiendo que dicho club aparezca como rival.
- [ ] **AC-05:** `src/api/competition.js` utiliza los datos reales de estadio, ciudad y colores al crear rivales en la base de datos.
- [ ] **AC-06:** Todos los Quality Gates (`pnpm test`, `pnpm test:bdd`, `pnpm lint`, `pnpm build`) pasan con 100% de éxito.

## 6. Restricciones
- Codificación UTF-8 sin BOM.
- Máximo 13 advertencias de ESLint permitidas.
- Compatibilidad absoluta con las firmas existentes de `pickRivalClubs`.

## 7. Dependencias
- `src/domain/cupMatch.js` (`seededRandom`)
- `src/domain/pyramid.js` (`tierStrengthRange`, `BOTTOM_TIER`, `TOP_TIER`)
- `src/domain/divisions.js` (`divisionName`)

## 8. Riesgos
- Posibles colisiones de siglas de 3 letras entre clubes con nombres similares (ej: Atlanta vs Atlas, Deportivo Merlo vs Mercedes). Mitigado con asignación única meticulosa (ATS, CMR, etc.) y tests de unicidad con `Set`.

## 9. Impacto
- **Frontend / UI:** Mayor inmersión y realismo al ver los nombres reales de los clubes argentinos y sus estadios en tablas de posiciones, fixtures y noticias.
- **Backend / Domain:** Datos ricos y estructurados para cada división futbolística argentina.
- **Database:** Los registros de `clubs` se guardan con estadios reales, ciudades reales y colores oficiales.

## 10. Preguntas / incertidumbres
- Ninguna. La estructura de la pirámide de 5 divisiones y 20 clubes por liga ya está consolidada.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/historical-teams.yml`
