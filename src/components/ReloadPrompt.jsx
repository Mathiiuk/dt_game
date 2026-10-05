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

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 m-4 border shadow-2xl bg-surface border-line rounded-xl max-w-sm">
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
            Actualizar Juego
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
