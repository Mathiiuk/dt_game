import React from 'react'
import { track } from '../../lib/analytics'

/** Error de una versión vieja: tras una actualización el archivo que pide la pantalla ya no existe */
export const isChunkError = (error) => /dynamically imported module|Loading chunk|Importing a module script failed/i.test(String(error?.message || error))

const RELOAD_FLAG = 'vestuario-chunk-reload'

/**
 * Si una pantalla falla no se deja la pantalla en blanco: se muestra un aviso amable con salida.
 * Si es un archivo viejo, recarga sola una vez para traer la versión nueva.
 */
export default class ErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    track('app_error')
    try { window.__reportError?.(error) } catch { /* el reporte nunca debe romper la pantalla de error */ }
    if (isChunkError(error)) {
      try {
        if (!window.sessionStorage.getItem(RELOAD_FLAG)) {
          window.sessionStorage.setItem(RELOAD_FLAG, '1')
          window.location.reload()
        }
      } catch { /* sin almacenamiento: queda el botón de recargar */ }
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="grid min-h-dvh place-items-center bg-bg px-5 py-12 text-center text-fg">
        <div className="max-w-md">
          <p className="font-display text-6xl font-bold text-danger" aria-hidden="true">¡Ups!</p>
          <h1 className="mt-3 text-balance font-display text-3xl font-bold leading-tight">Se pinchó la pelota</h1>
          <p className="mt-3 text-fg-muted">Algo falló en el partido. Tu carrera está a salvo: recargá la página y seguí. Si se repite, escribinos a contacto@vestuario.com.ar.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-12 items-center justify-center rounded-md bg-accent px-6 font-semibold text-accent-fg hover:bg-accent-strong">Recargar</button>
            <a href="/" className="inline-flex min-h-12 items-center justify-center rounded-md border border-line px-6 font-semibold text-fg hover:bg-surface-2">Volver al inicio</a>
          </div>
        </div>
      </div>
    )
  }
}
