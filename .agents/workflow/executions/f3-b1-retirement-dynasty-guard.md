# Reporte de Ejecución: f3-b1-retirement-dynasty-guard
- **Rama**: `fix/f3-b1-retirement-dynasty-guard` | **Estado**: `DONE` (pendiente prueba E2E de retiro con confirmación del usuario)
- **Causas**:
  1. `startNewDynasty` hacía `UPDATE managers SET user_id = NULL`; la política RLS de UPDATE (`auth.uid() = user_id`, sin `WITH CHECK`) valida también la fila nueva, por lo que Postgres rechaza el cambio (42501) → "Error al iniciar la nueva dinastía". Además, desvincular al DT retirado lo oculta de su propio dueño (RLS de SELECT).
  2. No había guard de rutas: tras el retiro `getManager` (filtra `is_retired=false`) devuelve `null`, el contexto conservaba el DT viejo y el usuario podía volver a cualquier pantalla (botón atrás / URL).
- **Fix**:
  - `endgame.js`: `startNewDynasty` ya no desvincula; valida que el DT esté retirado y registra `DYNASTY_STARTED` en auditoría. `getManager` ignora retirados, así que el sucesor se crea sin conflicto y el legado queda ligado a la cuenta.
  - `manager.js`: `getLatestRetiredManager(userId)`.
  - `GameContext.jsx`: estado `retiredManager`; sin DT activo y con retirado → redirige a `/endgame` (rutas permitidas: `/endgame`, `/hall-of-fame`, `/create-manager`).
  - `RequireCareer.jsx` envuelve las 15 rutas de juego (sin sesión → `/auth`; retirado → `/endgame`; sin DT → `/create-manager`).
  - `EndgameScreen.jsx`: funciona con el DT retirado, oculta el botón "volver", navega con `replace`.
  - `CreateClubWizard.jsx`: `refreshContext()` al fundar el club (el contexto ya no queda obsoleto tras la sucesión).
- **Verificación (navegador, DT activo)**: las 15 rutas siguen accesibles; `/endgame` con DT activo muestra "Aún no te has retirado". El flujo de retiro real (irreversible para la cuenta de prueba) queda pendiente de tu confirmación.
- **Hallazgo aparte**: consultas a `players.number` (columna inexistente; la real es `shirt_number`) en evolución/retiros generan errores 42703 en consola.
