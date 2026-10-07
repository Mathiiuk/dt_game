# Specification — board-balance-calibration

## 1. Objetivo
Revisar y dejar calibrado el balance de despidos: que un equipo promedio casi nunca tenga problemas con la directiva y uno flojo sí.

## 2. Hallazgos
- Las dos destituciones de la corrida de prueba salieron de la opción explícita "Plantarte: 50% te echan" que el conductor eligió, no de un desbalance; en tres temporadas con decisiones sensatas no hubo ningún despido.
- Simulando 19 partidos por temporada: con el umbral de ultimátum en 35, un equipo flojo (15% gana, 20% empata) recibía ultimátum solo en el 41% de las temporadas. Con cuentas sanas, financiera y plantel aportan 35 puntos fijos de la confianza global: lo deportivo tenía que llegar a cero para llegar a 35.
- El despido fulminante (confianza menor a 15 sin ultimátum previo) era inalcanzable: el ultimátum saltaba siempre antes. Código muerto.

## 3. Cambio
- `evaluateBoardAfterMatch` (domain/boardConfidence.js): la parte numérica de la directiva como función pura; `boardApi.updateConfidenceAfterMatch` solo aplica sus consecuencias.
- Umbral de ultimátum 35 -> 40. Resultado simulado (2.000 temporadas por celda): equipo promedio 1% de ultimátum y 0,1% de despido; flojo 67% y 38%; promedio con la caja en rojo 26% y 6%. Siempre hay un ultimátum antes del despido.

## 5. Criterios de aceptación
- [x] AC-01: ánimo deportivo +4/-1/-6 y ponderación 50/30/20 (paridad con la lógica anterior).
- [x] AC-02: ultimátum de 4 puntos en 3 partidos; fallarlo es el despido; superarlo suma +20 y +15.
- [x] AC-03: calibración por simulación fijada en tests.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/board-balance-calibration.yml`
