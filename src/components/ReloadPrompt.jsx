import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  // En el celular queda arriba del menú inferior (56 px más la zona segura) para no taparlo; en escritorio, abajo a la derecha

  return (
    <div role="status" className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] rounded-xl border border-line bg-surface p-4 shadow-2xl lg:inset-x-auto lg:bottom-4 lg:right-4 lg:max-w-sm">
      <div className="mb-4 text-sm font-medium text-fg">
        {offlineReady
          ? <span>El juego está listo para usarse offline.</span>
          : <span>Hay una nueva actualización disponible.</span>}
      </div>
      <div className="flex gap-2">
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-4 py-2 text-sm font-bold text-black transition-colors bg-accent rounded hover:bg-accent-strong"
          >
            Actualizar juego
          </button>
        )}
        <button
          onClick={() => close()}
          className="px-4 py-2 text-sm font-bold text-fg transition-colors border rounded border-line hover:bg-surface-3"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
