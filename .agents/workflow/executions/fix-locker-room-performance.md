# Ejecución: fix-locker-room-performance (B9 y B11)
**Causa raíz de que las charlas "no se notaran":** `players` tenía DOS columnas de moral independientes (`morale` y `state_morale`). Las charlas del vestuario escribían `morale`; el Inicio, el partido y el post-partido leen `state_morale`. Migración aplicada (scripts/db/migration_sync_player_morale.sql): trigger bidireccional que las mantiene iguales y sincronización de los datos (verificado: 0 filas desfasadas; prueba en transacción revertida: escribir una actualiza la otra en ambos sentidos).
Vestuario:
- `holdTeamMeeting` recibía la semana fija `1`: el enfriamiento de 4 semanas bloqueaba para siempre tras la primera reunión. Ahora usa la semana ABSOLUTA del juego (`src/domain/gameWeek.js`, no se reinicia al cambiar de temporada).
- La moral del plantel se actualiza en UNA llamada (`batch_update_players` sobre `state_morale`) en vez de un UPDATE por jugador; cohesión, fecha y bitácora en paralelo; las charlas individuales también en paralelo.
- La pestaña no hace pantalla de carga completa ni recarga todo el Club tras cada acción; los errores salen en castellano (`friendlyError`). Los botones ya bloquean y muestran spinner (feat/async-button-feedback).
Fecha FIFA (B11): el partido hacía ~70 consultas en serie (caps, select y update de fatiga por cada convocado). Ahora la fatiga va en una llamada y los caps en paralelo; además una fecha ya jugada ya no se puede volver a jugar (antes un doble clic repetía XP y honorarios).
Tests: 5 nuevos. Pendiente en M2: medir tiempos reales en la cuenta de prueba.
