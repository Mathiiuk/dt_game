# Ejecución: fix-milestones-duplicates
Causa: `getClubMilestones` insertaba el hito de fundación cuando la lista estaba vacía, y ClubScreen y ClubHistoryTab la llamaban a la vez; los hitos de temporada se insertaban sin protección.
- Leer ya no escribe: sin hitos se muestra el de fundación sin guardarlo; el real se crea al fundar el club (`createClub`).
- `addMilestone` y los 3 hitos de `season.js` usan `upsert` con `ignoreDuplicates` sobre `(club_id, year, title)`.
- Migración aplicada (scripts/db/migration_milestones_unique.sql): borró 1 duplicado existente y creó el índice único `club_milestones_club_year_title_key`. Verificado: 0 duplicados.
- 3 tests nuevos.
