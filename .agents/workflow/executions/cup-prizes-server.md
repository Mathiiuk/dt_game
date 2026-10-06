# cup-prizes-server

Los premios de la Copa Continental (por partido y del campeón) los acredita la base dentro de `play_cup_fixture`, en la misma transacción que guarda el resultado. Como el partido no se puede volver a jugar, el premio no se cobra dos veces.

- Migración: `scripts/db/migration_cup_prizes_server.sql` (aplicada a dt_database).
- Cliente: `internationalCup.processUserMatchResult` ya no escribe `budget`; informa `match_bonus` y `champion_prize` que devuelve la función.
- Test nuevo: el navegador no toca la caja.
