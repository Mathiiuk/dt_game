import React, { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

/** Aviso fijo arriba cuando se pierde la conexión: el juego guarda en el servidor y necesita internet */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)

  useEffect(() => {
    const down = () => setOffline(true)
    const up = () => setOffline(false)
    window.addEventListener('offline', down)
    window.addEventListener('online', up)
    return () => { window.removeEventListener('offline', down); window.removeEventListener('online', up) }
  }, [])

  if (!offline) return null
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-black">
      <WifiOff className="size-4" aria-hidden="true" />Sin conexión. Cuando vuelva internet, el juego sigue donde lo dejaste.
    </div>
  )
}
