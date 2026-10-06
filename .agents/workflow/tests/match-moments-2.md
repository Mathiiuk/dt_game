# Test Plan — match-moments-2

## 1. Objetivo
Probar penales, castigo del arquero lesionado y reacciones del rival.

## 2. Riesgos a validar
Penales sin resolver, azar propio que altere el partido, decisiones que no llegan al motor.

## 3. Unit tests
- [x] Motor: cada penal se resuelve al minuto siguiente, suma al marcador, quien patea importa, adivinar la esquina ataja, el rival reacciona a los 60 y 75.
- [x] Momentos: penal a favor (tres mejores definidores con su probabilidad, sin el arquero), penal en contra (tres esquinas), una decisión por penal, arquero lesionado.

## 4. Integration tests
- [x] Pantalla del partido: el penal pausa el partido, la elección llega al motor como cambio y el partido se rejuega.

## 5. E2E tests
- [ ] Con la cuenta real: pendiente de que salga un penal en un partido.

## 6. Regression tests
- [x] Tests estadísticos de gritos y rojas con más muestras.

## 7. Security checks
- [x] Sin cambios de base.

## 8. Smoke tests
- [ ] Jugar un partido completo en el navegador.
