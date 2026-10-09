# cierre-temporada

Se arregla el cierre de temporada: "Error al procesar el cierre de temporada" impedía cerrar cualquier temporada.

- **Síntoma:** al apretar "Cerrar temporada y abrir el nuevo año" aparecía el aviso genérico y la temporada no se cerraba, así que el juego quedaba trabado al final del año.
- **Causa:** la función de la base `close_season_atomic` (la que cierra la temporada en el servidor) tenía **tres errores encadenados**; cada uno escondía al siguiente, porque la función se cortaba en el primero:
  1. Buscaba la posición del club en una columna `ord` que no existe (`column "ord" does not exist`): la columna que genera `WITH ORDINALITY` se llama `ordinality`.
  2. Leía el premio de `settle_season_prize` como si fuera una fila con columnas (`record has no field "total"`), pero esa función devuelve un `jsonb`.
  3. Insertaba la nota de la hemeroteca en `hemeroteca_articles`, que no existe; la tabla se llama `club_hemeroteca`.
- **Desde cuándo:** la base tuvo 3 cierres buenos hasta el 7-oct; desde que se instaló la versión "en servidor" ningún cierre pudo completarse. El de hoy es el primero que se intentó desde entonces.
- **Aplicado en la base** (migraciones `season_close_ordinality`, `season_close_prize_jsonb` y `season_close_hemeroteca_table`); el archivo `scripts/db/migration_season_close_ordinality.sql` quedó idéntico a lo desplegado (huella del cuerpo igual en ambos).
- **Probado en la base real con retroceso**, sobre el club del caso (Potrero, 23/06/2027, división 5): cierre completo con puesto 1, ascenso a la división 4, premio $13.500 (puesto + goleador), nuevo año 2027, fecha pasa al 01/07/2027 y snapshot creado; la transacción se deshizo, no se tocó ningún dato.
- **Las partes que corren en la app** (evolución de jugadores, liga nueva, partidos del nuevo año y registro de la transición) se revisaron contra las columnas reales de la base y coinciden.
- **TDD:** `tests/static/season-close-sql.test.js` protege los tres arreglos y la firma de la función.
- **Quality gates:** unitarias y BDD en verde, ESLint sin avisos.
