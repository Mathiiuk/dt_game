# Avisos push con motivo

- **Nuevos avisos del club** (preferencia "club", horario 9–22 de Buenos Aires, sin repetirse gracias a `push_outbox`): `injury` (el mejor lesionado ≥ 7 días, "y N más") y `contract_end` (contratos que vencen en 90 días del juego). Solo se mandan si la persona no entra hace más de un día (y menos de 30).
- `supabase/functions/_shared/pushCopy.ts`: textos nuevos (abren `/squad`). `scripts/db/migration_push_motivos.sql`: amplía `push_due`. Aditivo.
- **Producción:** función `push-dispatch` v2 desplegada y verificada (responde 400 a una acción desconocida, o sea que arranca); migraciones `push_due_injury_contract_end` y `push_due_solo_service_role` aplicadas.
- **Hallazgo de seguridad corregido:** `push_due()` tenía EXECUTE para `authenticated` (valor por defecto de Supabase): cualquier persona con sesión podía llamarla por RPC, ver nombres de sala/jugadores de otros y gastar avisos ajenos. Ahora solo `service_role`. Verificado en `pg_proc`.
- Tests: `pushCopy` (2 nuevos), `push-sql` (5 nuevos).
