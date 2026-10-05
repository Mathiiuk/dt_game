# Ejecución: f3-p2-market-screen

- Dominio puro `src/domain/market.js` (precio, filtros, orden, ofertas sugeridas, validación y motivo de bloqueo) con tests.
- `MarketScreen` rediseñada: resumen de caja, filtros por línea/texto/ritmo/asequibles, orden, tarjetas con atributos ocultos hasta ojear, estados de carga y vacío.
- `OfferModal` sobre `ResponsiveOverlay` (reemplaza el panel `fixed inset-0`); el error de monto se muestra junto al campo.
- Corregido: el estado del mercado mostraba siempre "Cerrado" (la API devuelve `windowName`, no `name`); el filtro de posición usaba códigos que no existen en la BD, ahora filtra por línea en el cliente.
- Verificado a 375 px: sin desborde horizontal. Suite: 131 tests en verde.
