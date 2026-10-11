import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import HomeLanding from './features/home/HomeLanding'
import InfoPage from './features/home/InfoPage'
import { PUBLIC_PAGES } from './data/publicPages'
import CookieBanner from './features/consent/CookieBanner'
import OfflineBanner from './components/OfflineBanner'
import NotFoundScreen from './features/errors/NotFoundScreen'
import { isGamePath } from './data/gameRoutes'

// El juego entero (base de datos, pantallas, PWA) se descarga sólo cuando se sale de la parte pública:
// la portada queda liviana y carga rápido para quien llega desde un buscador.
const GameApp = lazy(() => import('./GameApp'))

function GameLoading() {
  return (
    <div role="status" aria-label="Cargando" className="grid min-h-dvh place-items-center bg-bg text-accent">
      <Loader2 className="size-8 animate-spin" aria-hidden="true" />
    </div>
  )
}

/**
 * Dos aplicaciones en una: la parte pública (portada y páginas del sitio, indexables)
 * y el juego (todo lo demás, privado y sin indexar).
 */
function GameOrNotFound() {
  const { pathname } = useLocation()
  return isGamePath(pathname)
    ? <Suspense fallback={<GameLoading />}><GameApp /></Suspense>
    : <NotFoundScreen />
}

function App() {
  return (
    <BrowserRouter>
      <CookieBanner />
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<HomeLanding />} />
        {PUBLIC_PAGES.map(page => (
          <Route key={page.path} path={page.path} element={<InfoPage path={page.path} />} />
        ))}
        <Route path="*" element={<GameOrNotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
