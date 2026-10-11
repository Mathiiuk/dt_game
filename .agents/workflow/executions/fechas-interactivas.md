# Ejecución: fechas interactivas en la sala de amigos

- Ramas: `fix/amigos-movil` (diseño en el celular, ya publicada) y `feat/fechas-interactivas`.
- Pedido: el formato de jugar no se entendía (¿qué pasa con las otras cuentas?) y faltaba interacción.
- Cómo funciona ahora: cada fecha tiene plazo (12/24/48 h, lo elige el creador). Cada DT elige planteo (Presión > Equilibrado > Contra > Presión, +3 de fuerza al que acierta) y arenga, y pronostica los partidos (prode: 1 punto y 5 mangos por acierto). Cuando todos eligieron o vence el plazo, cualquier DT que abra la sala dispara el cierre (`friend_try_close`, sin cron); el creador puede cerrar cuando quiera. Las otras cuentas no se ven afectadas: solo cambian resultados, puntos y mangos de la sala.
- Relato y titular por partido (minutos de gol guardados en el servidor, texto determinista en `friendStory.js`).
- Avisos: banner en todo el juego y punto en el menú cuando falta el planteo o hay una fecha jugada sin ver (`friend_pending`).
- SQL: `scripts/db/migration_friend_rounds.sql`, aplicada en producción y probada con rollback (cierre prematuro rechazado, cierre con todos listos por un no creador, plazo vencido, prode, avisos).
- Pruebas: `friendPlans.test.js`, `friend-rounds-sql.test.js`, ampliados `friends.test.js`, `friendsScreen.test.jsx`, `appShell.test.jsx`; captura a 390 px sin desborde.
