# Reporte de Ejecución: bench-complaints
- **Rama**: `feat/bench-complaints` | **Estado**: `DONE`
- **Problema**: los suplentes nunca reclamaban minutos (pendiente de T3: faltaba un contador).
- **Solución sin migración**: se usan las filas de `player_match_stats` de los últimos 4 partidos (los ids salen de las rachas ya cacheadas). `domain/squadConsequences.benchComplainers`: sin ningún minuto en 4 partidos, ni lesionados ni retirados, máximo 3 por semana, primero los de mejor nivel. `climateApi.applyBenchComplaints` en el cierre semanal: moral -3 en una sola escritura y registro "Esto pasó por tu decisión", dentro de la misma ronda paralela del clima (no suma profundidad al avance).
- **Tests**: 3 de dominio y 2 de API; suite completa verde (758).
