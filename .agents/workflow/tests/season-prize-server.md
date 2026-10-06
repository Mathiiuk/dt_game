# Test Plan — season-prize-server

## 1. Objetivo
Probar que el premio de fin de temporada lo liquida la base, con la escala correcta, una sola vez y sin escrituras de caja desde el navegador.

## 2. Riesgos a validar
Premio mal calculado, doble cobro, goleador leído de una columna inexistente, club ajeno liquidando.

## 3. Unit tests
- [x] El cierre llama a `settle_season_prize` con club, temporada y carrera y devuelve puesto, premio, caja, presupuesto salarial y categoría de la base.
- [x] El navegador no escribe `budget`, `wage_budget` ni `league_tier` en `clubs`.
- [x] El balance anual usa el premio de la base.
- [x] Un rechazo de la base corta el cierre con su mensaje; un premio ya liquidado no rompe el cierre.
- [x] Escala de premios por puesto y bono (paridad con la base).

## 4. Integration tests (base real, con retroceso)
- [x] Puesto 11 → 2.500 y asiento único; repetir → ya liquidado; club inexistente → rechazado; primero → 12.000, ascenso y presupuesto salarial x1,8.

## 5. E2E tests
- [ ] Cierre de una temporada completa con la cuenta real (52 semanas): pendiente del recorrido de punta a punta.

## 6. Regression tests
- [x] `seasonIsolation.test.js` (el cierre toca solo la liga del club).

## 7. Security checks
- [x] `SECURITY INVOKER`, club del usuario obligatorio, sin importes del cliente.

## 8. Smoke tests
- [ ] Cierre en el navegador.
