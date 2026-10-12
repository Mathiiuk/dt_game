import React, { useEffect, useRef, useState } from 'react'
import { WifiOff, Turtle, Wifi } from 'lucide-react'
import { useNetStatus } from '../hooks/useOnline'

const RECONNECTED_MS = 2500

/**
 * Aviso fijo arriba sobre el estado de la red: sin conexión (el juego guarda en el servidor, así que solo se puede mirar lo ya cargado),
 * conexión lenta (algún pedido tarda de más) y, un momento, "volviste a estar en línea".
 * `onRetry` (opcional) vuelve a pedir los datos de la pantalla.
 */
export default function OfflineBanner({ onRetry }) {
  const { online, slow } = useNetStatus()
  const [justBack, setJustBack] = useState(false)
  const wasOffline = useRef(!online)

  useEffect(() => {
    if (!online) { wasOffline.current = true; setJustBack(false); return undefined }
    if (!wasOffline.current) return undefined
    wasOffline.current = false
    setJustBack(true)
    const timer = setTimeout(() => setJustBack(false), RECONNECTED_MS)
    return () => clearTimeout(timer)
  }, [online])

  if (online && !slow && !justBack) return null

  const tone = !online ? 'bg-warning text-primary-fg' : justBack ? 'bg-primary text-primary-fg' : 'bg-surface-3 text-fg'
  return (
    <div role="status" className={`fixed inset-x-0 top-0 z-[70] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-sm font-medium ${tone}`}>
      {!online ? <WifiOff className="size-4 shrink-0" aria-hidden="true" /> : justBack ? <Wifi className="size-4 shrink-0" aria-hidden="true" /> : <Turtle className="size-4 shrink-0" aria-hidden="true" />}
      <span>
        {!online && 'Sin conexión: podés mirar lo que ya cargaste (solo lectura). Guardar y jugar vuelven con internet.'}
        {online && justBack && 'Volviste a estar en línea.'}
        {online && !justBack && 'Conexión lenta: seguimos intentando…'}
      </span>
      {!online && onRetry && <button type="button" onClick={onRetry} className="rounded-md border border-black/40 px-2 py-0.5 text-xs font-semibold">Reintentar</button>}
    </div>
  )
}
