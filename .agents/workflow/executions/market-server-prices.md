# market-server-prices

Mercado 2.0, etapa 1: precios a escala y fichajes resueltos por el servidor.

- Precios: antes un jugador medio valía ~$200.000 con una caja de $25.000. Nueva fórmula (`domain/valuation.js` y `player_value` en la base, comparadas por los tests): $6.000 un 55 de media a los 25 años, +12% por punto, prima de potencial y juventud, piso $1.500 y techo $150.000. Todos los jugadores existentes se recalcularon (promedio ~$8.400); la generación de jugadores nuevos usa la misma fórmula.
- `execute_transfer` (base, una transacción): valida club comprador, ventana de pases, jugador disponible, precio (el vendedor pide valor × peso de su reputación, acepta desde el 85%; el agente libre pide el 60%) y caja; mueve la plata de ambos clubes y el jugador y deja el registro. Probada en la base real con retroceso: cobra, acredita, mueve al jugador y rechaza el segundo intento.
- Cliente: `marketApi.buyPlayer` llama a la función y ya no escribe la caja ni el jugador; el mercado muestra el precio pedido; se quitó el pool de jugadores virtuales (no se podían fichar de forma autoritativa).
- Pendiente (etapa 2): las ventas (`executeSaleTransfer`) y renovaciones siguen moviendo plata desde el navegador; se pasan al servidor junto con la negociación.
