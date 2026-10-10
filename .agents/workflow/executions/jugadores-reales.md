# Jugadores reales (nombres cambiados)

- Fuente: Wikipedia en español (plantel actual de cada club, plantilla `{{Jugador de fútbol}}`), CC BY-SA 4.0. AFA y Promiedos no sirven para descargar datos.
- Derechos: solo se usan nombre, club y posición; el nombre se cambia con `alterName` (los nombres reales nunca se guardan). Sin fotos ni escudos; atributos inventados.
- Pipeline: `scripts/data/fetch-squads.mjs` -> `squads.generated.json` -> `squadRows`/`squadsInsertSql` -> `scripts/db/data_real_squads.sql`.
- Cobertura: se revisaron a mano las 61 páginas descargadas; se cargaron 16 clubes cuya página es realmente la del club y con nombres bien formados. El resto usa los nombres derivados de antes.
- Base: tabla `real_squads` (RLS solo lectura) y `league_scorer_name` busca por nombre del club y plaza, con respaldo derivado (`scripts/db/migration_real_squads.sql`). Probado en producción con transacción revertida.
- Los 127 clubes restantes usan plantillas ficticias verosímiles (scripts/db/data_fictional_squads.sql): ya no hay nombres genéricos tipo "Rival #3". El once rival del partido toma sus nombres de real_squads (namesFromSquad); el respaldo del motor usa rivalNames.
