# Ejecución: sala de amigos sin desborde en el celular

- Rama: `fix/amigos-movil`
- Problema (captura del usuario): la liga de la sala se salía de la pantalla (scroll horizontal, textos cortados).
- Causa: la tabla fijaba 34 rem de ancho mínimo y las grillas de una columna crecían con el contenido (los resultados no se cortaban).
- Arreglo: tablas compactas (#, club con insignias debajo, PJ, DG, Pts; el resto de columnas desde `sm`), grillas `minmax(0,1fr)` y nombres con `truncate`, en `LeagueView`, `CupView`, `FriendsScreen`, `LeagueSetupCard`.
- Verificación: render con Chromium a 390 px, ancho del documento 390/390 (antes 429/390). Prueba estática `tests/static/friends-mobile-layout.test.js`.
