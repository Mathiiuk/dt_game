# Specification — season-prize-server

## 1. Objetivo
Que el premio de fin de temporada (por puesto y por goleador), el presupuesto salarial del año siguiente y la categoría del club los calcule y escriba el servidor.

## 2. Problema actual
`seasonCloseApi.executeSeasonClose` leía la tabla, elegía el premio y escribía `budget`, `wage_budget` y `league_tier` desde el navegador. Además buscaba al goleador en una columna que no existe (`players.goals_season`), por lo que el bono nunca se pagaba y el snapshot de la temporada guardaba siempre goleador vacío.

## 3. Resultado esperado
- Función SQL `settle_season_prize` que calcula el puesto desde la tabla de la liga del club, el premio, el bono del goleador (8 goles o más en la temporada, contados del relato de los partidos), el ascenso y el presupuesto salarial, y registra un asiento `SEASON_PRIZE` en el libro mayor.
- Idempotente por club y temporada.
- El cierre de temporada del cliente usa su resultado.

## 4. Alcance
### Incluido
Migración, cliente (`executeSeasonClose`), tests de la escala y del contrato, prueba en la base real.
### No incluido
Premios de la copa continental (ya en el servidor), historia/hemeroteca, evolución de jugadores y reinicio de la tabla (siguen en el cliente).

## 5. Criterios de aceptación
- [ ] AC-01: el premio sale de la posición real en la tabla de la liga del club (campeón 12.000, subcampeón 8.000, 3.º a 6.º 5.000, 7.º a 17.º 2.500, resto 1.000).
- [ ] AC-02: el bono de 1.500 se paga si el goleador del club llegó a 8 goles en la temporada.
- [ ] AC-03: liquidar dos veces la misma temporada no cobra dos veces.
- [ ] AC-04: el navegador no escribe `budget`, `wage_budget` ni `league_tier` al cerrar la temporada.
- [ ] AC-05: un club ajeno no puede liquidar.

## 6. Restricciones
`SECURITY INVOKER`; escala igual a la de `getPrizeForPosition` (test de paridad); sin cambiar lo que ve el jugador en el resumen de la temporada.

## 7. Dependencias
Liga en el servidor (la tabla es confiable), libro mayor.

## 8. Riesgos
- Que el cierre se reintente tras un fallo parcial: la liquidación es idempotente.
- Que sin tabla de liga se inventara un premio máximo: se toma mitad de tabla.

## 9. Impacto
### Frontend
`executeSeasonClose` (mismo resultado). ### Backend
Función nueva. ### Database
Asiento de libro mayor `SEASON_PRIZE`. ### Seguridad
El navegador ya no decide cuánto cobra el club al terminar el año.

## 10. Preguntas / incertidumbres
Umbral de 8 goles del bono: elegido para una liga de 19 partidos; ajustable.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/season-prize-server.yml`
