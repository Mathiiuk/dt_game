# Reporte de Ejecución: f2-scripts-env-credentials

- **Rama**: `fix/f2-scripts-env-credentials` | **Estado**: `DONE` (hallazgo G-03)
- 35 scripts (`scripts/db/*.cjs`, `update_db.cjs`) ya no contienen la cadena de conexión; leen `process.env.DATABASE_URL` y fallan con mensaje claro si falta.
- Uso: `node --env-file=.env.local scripts/db/<script>.cjs`. Se documentó `DATABASE_URL` en `.env.example` (el valor real va solo en `.env.local`, ignorado por git).
- Verificación: `git grep` de `postgres://usuario:clave@` en scripts = 0 coincidencias; `node --check` OK en los 35 archivos.
- **ACCIÓN MANUAL PENDIENTE**: la contraseña anterior sigue en el historial de git. Rotarla en Supabase (Project Settings > Database > Reset database password) y actualizar `.env.local`.
