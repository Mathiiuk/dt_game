# Ejecución: pizarra del celular y frecuencia de lesiones

- Rama: `fix/pizarra-lesiones`. Roles: product-designer, backend/engine, qa-engineer (TDD).
- **Pizarra:** la cinta de resumen era `sticky top-0` y se pegaba sobre la barra superior del juego (se veía en la captura del usuario). Ahora la cinta y la barra de herramientas van en el flujo (sin `sticky`), con menos relleno. Verificado dentro del marco real (`AppShell`) a 360 x 740 y 390 x 800: el título "Táctica" se ve, no hay scroll vertical ni horizontal. (La prueba anterior no incluía el marco, por eso no lo detectó.)
- **Lesiones:** había dos tiradas que se sumaban: 0,8 % por minuto en el partido (≈ 51 % de partidos con una) y 2,5 % base por jugador al terminar (×1,5 a ×5 por cansancio). Ahora `src/domain/injuryRates.js` es la única fuente: 0,26 % por minuto entre los dos equipos (cada lado la mitad, y sube con cansancio, ritmo rápido, presión alta y mentalidad ofensiva) y 0,9 % por jugador al terminar. Con plantel descansado, a tu equipo se le lesiona alguien en ~19 % de los partidos; agotado y a todo o nada, bastante más. No se tocó severidad ni semanas de baja.
- Pruebas: `injuryRates.test.js` (incluye 300 partidos simulados: 15 a 27 % con una lesión entre los dos equipos), `tacticsMobile.test.jsx` (sin `sticky`).
- No se conectó el cuerpo médico al riesgo (no había un dato simple a mano): queda como mejora.
