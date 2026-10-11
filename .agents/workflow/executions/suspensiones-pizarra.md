# Suspensiones por tarjetas + pizarra sin encimarse

**Hallazgo:** `players.is_suspended` solo se leía; nadie lo activaba. Las tarjetas solo bajaban la nota. Se construyó la regla.

**Regla** (`src/domain/suspensions.js`, puro): roja directa o doble amarilla = 1 partido (`RED`); 5ª amarilla de la temporada = 1 partido (`YELLOWS`) y el contador vuelve a 0; el suspendido que no juega cumple una fecha; 4 amarillas = "apercibido".
**Base (aditiva, `scripts/db/migration_suspensions.sql`, aplicada y probada con rollback):** `players.yellow_cards_season`, `suspended_matches`, `suspension_reason` (check RED/YELLOWS); `batch_update_players` acepta las claves nuevas sin cambiar el comportamiento anterior; `is_suspended` se mantiene.
**Cableado:** `postMatch.js` (una sola escritura en lote, filas unidas por jugador con `mergeRowsById`), `seasonClose.js` (amarillas a 0 en la etapa COMPLETE, no bloquea el cierre si falla).
**Pizarra:** insignia en la esquina de la ficha (cruz roja / tarjeta roja / amarilla / aviso punteado), pastillas de texto solo ≥ sm, fichas más compactas en celular, chip "N suspendidos" y leyenda de una línea. Plantel: etiquetas con motivo.
**Tests:** `suspensions.test.js` (12), `pitch.test.jsx`, `tacticsMobile.test.jsx`, `squadScreen.test.jsx`. Captura a 360 px revisada.
**Pendiente / a validar en uso real:** el motor de partidos genera pocas rojas (3 % de las faltas); si las suspensiones se sienten raras, ajustar ahí.
