# market-sales

Mercado 2.0, etapa 2b: las ofertas por tus jugadores se resuelven en el servidor.

- `resolve_sale_offer` (base): el monto sale de la oferta guardada (antes el navegador mandaba monto, comprador y vendedor); valida que la oferta sea del club de la persona y que el jugador siga siendo suyo; 80% del precio entra a la caja y el comprador paga el total (mínimo 0); mueve al jugador; contraoferta aceptada hasta +25%; rechazar una oferta 20% sobre el valor enoja al jugador (-15 de moral, -25 si es Ambicioso o Estrella).
- Probada en la base real con retroceso: contraoferta fuera de rango rechazada, venta cobrada (caja 25.000 -> 33.000, comprador 25.000 -> 15.000), repetir la misma oferta y vender a un jugador que ya no es tuyo se rechazan.
- Cliente: `contractApi.resolveOffer` llama a la función (misma firma, la base ignora monto y clubes) y aplica las consecuencias de vender al ídolo o capitán; se eliminó `executeSaleTransfer`.
- Pendiente: renovaciones, rescisiones y primas de firma siguen moviendo plata desde el navegador.
