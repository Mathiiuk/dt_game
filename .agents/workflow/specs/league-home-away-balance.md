# Specification — league-home-away-balance

## 1. Objetivo
Que el calendario de liga reparta la localía de forma pareja entre todos los clubes.

## 2. Problema actual
`generateRoundRobinFixtures` armaba mal el cuadro: el club del usuario jugaba casi todo de visitante (en una corrida de prueba, 1 de local en 14 partidos), con lo que casi no cobraba taquilla y la economía se rompía.

## 3. Resultado esperado
Función pura `roundRobinSchedule` (domain/leagueSchedule.js): una rueda de n-1 fechas, cada par se cruza una vez, cada club juega de local 9 o 10 veces (20 clubes) y nunca más de 3 visitas seguidas.

## 4. Alcance
Incluido: función, uso en la creación de ligas nuevas, tests. No incluido: reparar ligas ya creadas (se regeneran al reiniciar la carrera).

## 5. Criterios de aceptación
- [x] AC-01: 20 clubes dan 19 fechas de 10 partidos sin repetir cruces.
- [x] AC-02: localía 9/10 por club.
- [x] AC-03: máximo 3 visitas seguidas.
- [x] AC-04: cantidad impar de clubes con descanso.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/league-home-away-balance.yml`
