# Velocidad de las secciones

## Cambios
- **Pantallas con carga perezosa** (`GameApp.jsx`): el trozo del juego pasó de 1,4 MB a ~240 KB; cada pantalla (partido, mercado, plantel, club, finanzas, táctica, calendario, tabla…) se descarga al entrar (quedan fijas acceso, bienvenida, inicio y menú). `Suspense` con aviso liviano, también dentro del `AppShell` para que el menú no desaparezca. `vite.config.ts`: `manualChunks` separa supabase, motion, iconos, radix y react en trozos propios que se cachean aparte.
- **Sesión**: `authApi.getSession` recuerda la carrera activa un minuto (se consultaba en cada pantalla y al volver a la pestaña); se olvida al cerrar sesión.
- **/match**: usa el club del contexto (sin pedir sesión, DT y club otra vez) y pide táctica, plantel, cuerpo técnico y partido a la vez.
- **Calendario**: la fecha del club y los partidos se piden a la vez; `resolveCareerId` se recuerda 2 minutos.
- **Mercado**: pozo de agentes libres, clubes de la liga e informes de ojeo en paralelo; la pantalla pide mercado, informes, plantel propio y derechos a la vez.
- **Inicio**: el cierre pendiente entra al mismo `Promise.all` del resto.
- Tests: `tests/static/lazy-routes.test.js`, `tests/api/authCareerCache.test.js`, `tests/api/calendarParallel.test.js`, `tests/api/marketParallel.test.js` y un caso nuevo en `matchDecisions.test.jsx`.
- Queda: columnas explícitas en `select('*')` del plantel y medir con `timed()` pantalla por pantalla en producción.
