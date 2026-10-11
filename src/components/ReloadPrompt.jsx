import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { isSafeToUpdate } from '../lib/updateGuard'
import { STALE_EVENT } from '../lib/staleVersion'

/**
 * Aviso de versión nueva. Nunca corta lo que la persona está haciendo:
 * - si es un buen momento (fuera de un partido y sin nada a medias) ofrece "Actualizar ahora";
 * - si no, avisa que se instala cuando termine;
 * - con una actualización pendiente, se instala sola al cambiar de sección en un momento seguro.
 * También cubre el caso de una pestaña vieja que pide un archivo que ya no existe (`vite:preloadError`).
 */
export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisterError(error) {
      console.log('SW registration error', error)
    }
  })
  const { pathname } = useLocation()
  const [stale, setStale] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const onStale = () => setStale(true)
    window.addEventListener(STALE_EVENT, onStale)
    return () => window.removeEventListener(STALE_EVENT, onStale)
  }, [])

  const pending = needRefresh || stale
  const apply = () => (needRefresh ? updateServiceWorker(true) : window.location.reload())

  // Con una actualización pendiente, al cambiar de sección (y solo si es seguro) se instala sola
  const lastPath = useRef(pathname)
  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    if (pending && isSafeToUpdate({ pathname })) apply()
  })

  const close = () => {
    setOfflineReady(false)
    setHidden(true)
  }

  if (!pending && !offlineReady) return null
  if (pending && hidden) return null

  const safe = isSafeToUpdate({ pathname })

  // En el celular queda arriba del menú inferior (56 px más la zona segura) para no taparlo; en escritorio, abajo a la derecha
  return (
    <div role="status" className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] rounded-xl border border-line bg-surface p-4 shadow-2xl lg:inset-x-auto lg:bottom-4 lg:right-4 lg:max-w-sm">
      <div className="mb-4 space-y-1 text-sm">
        {pending ? (
          <>
            <p className="font-medium text-fg">Hay una versión nueva del juego.</p>
            <p className="text-fg-muted">{safe ? 'Se instala sola al cambiar de sección. Tu partida está a salvo.' : 'La instalamos cuando termines lo que estás haciendo. Tu partida está a salvo.'}</p>
          </>
        ) : (
          <p className="font-medium text-fg">El juego está listo para usarse offline.</p>
        )}
      </div>
      <div className="flex gap-2">
        {pending && safe && (
          <button
            type="button"
            onClick={apply}
            className="px-4 py-2 text-sm font-bold text-black transition-colors bg-accent rounded hover:bg-accent-strong"
          >
            Actualizar ahora
          </button>
        )}
        <button
          type="button"
          onClick={() => { close(); if (!pending) setNeedRefresh(false) }}
          className="px-4 py-2 text-sm font-bold text-fg transition-colors border rounded border-line hover:bg-surface-3"
        >
          {pending ? 'Después' : 'Cerrar'}
        </button>
      </div>
    </div>
  )
}
