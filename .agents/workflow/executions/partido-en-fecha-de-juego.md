# El partido llega justo al avanzar la semana

**Síntoma (captura):** partido "en 3 días" (sábado); al avanzar la semana la fecha pasó de miércoles 21 a miércoles 28 y el partido quedó atrás.

**Causa:** la fecha de juego avanza siempre 7 días desde el 1 de julio (miércoles en 2026) pero los partidos de liga se generaban el 1 de agosto + 7·n (sábados): un partido solo es jugable con `match_date <= fecha de juego`, así que siempre había 3 días de desfase y el salto de 7 días pasaba de largo.

**Arreglo (sin tocar el motor del tiempo):** los partidos caen en el mismo día de la semana que la fecha de juego.
- `gameWeek.firstLeagueMatchDate(año)` = 1 de julio + 28 días (`YYYY-07-29`; semana 5; mismo día de la semana todos los años). Usado en `competition.js` (ligas del mundo y valor por defecto) y `seasonClose.js` (temporada nueva).
- Migración de datos `scripts/db/migration_league_dates.sql` (aplicada en producción tras prueba con rollback): 4.164 partidos de liga pendientes movidos −3 días (sábado → miércoles). Jugados (1.153), en juego (3) y copa (miércoles/jueves) sin tocar. Solo datos: la app anterior sigue funcionando.
- Inicio: "Se juega el miércoles, en 7 días. Avanzá la semana para llegar al día del partido."

**Verificación:** `tests/domain/leagueCalendar.test.js`; recuentos antes/después de la migración (los 4.164 pasaron a miércoles, ningún otro cambió); prueba de punta a punta con un usuario temporal en producción: club nuevo, 4 avances → fecha de juego 2026-07-29 y primer partido 2026-07-29 ("hoy"); usuario y datos borrados. La pretemporada de carreras nuevas pasa de 5 a 4 avances.
