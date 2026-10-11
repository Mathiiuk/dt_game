// Rutas del juego (área privada, sin indexar). Vercel solo reescribe estas a la app; cualquier otra ruta recibe el 404 real (404.html).
// tests/static/vercelRoutes.test.js exige que esta lista, vercel.json y GameApp.jsx digan lo mismo.
export const GAME_PATHS = [
  '/auth', '/login', '/registro', '/welcome', '/create-manager', '/create-club', '/design', '/match', '/endgame',
  '/dashboard', '/post-match', '/events', '/calendar', '/tactics', '/standings', '/market', '/squad', '/club',
  '/finances', '/training', '/manager', '/national-team', '/international-cup', '/friends', '/achievements', '/more',
  '/hall-of-fame', '/logbook', '/game'
]

export const isGamePath = (pathname) => GAME_PATHS.includes(pathname.replace(/\/+$/, '') || '/')
