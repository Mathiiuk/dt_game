# Specification — buyback-clause

## 1. Objetivo
Línea de contenido "Mercado": cláusulas de recompra.

## 2. Cambio
- Migración `migration_buyback_clause.sql` (aplicada): tabla `buyback_rights` (con seguridad por dueño), `grant_buyback` (sobre la venta más reciente del jugador en la temporada: cobra el 10% de la venta con `club_cash_move`, fija el precio de recompra en el 125% y vence dos temporadas después) y `exercise_buyback` (cobra, trae al jugador de vuelta, registra el traspaso y consume el derecho; rechaza derechos vencidos).
- Cliente: `buybackApi` y `domain/buyback.js` (mismos importes que la base, con test de paridad).
- Plantel: al aceptar una oferta se pregunta si querés dejar la cláusula (con el costo y el precio de recompra). Mercado: sección "Derechos de recompra" con el botón para ejercerlos (habilitado con el mercado abierto y caja suficiente).

## 5. Criterios de aceptación
- [x] AC-01: probado en la base real (sin venta rechazada, 800 de costo y 10.000 de precio sobre una venta de 8.000, repetida rechazada, ejercida con la caja bajando 10.800, vencida rechazada).
- [x] AC-02: paridad de importes entre dominio y base.
- [x] AC-03: pantallas con confirmación.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/buyback-clause.yml`
