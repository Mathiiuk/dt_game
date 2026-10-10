import React, { useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { feel } from '../../lib/feedback'
import { sweepPhase } from '../../domain/shotPath'

/**
 * Barra de potencia: un marcador va y viene y hay que frenarlo en el verde (el medio). Arranca en otro punto y a otra velocidad
 * cada vez, para que el timing no se memorice. `onStop(quality)` recibe 0 (en la punta) a 1 (justo al medio).
 * Se mueve con una animación de CSS (suave, sin re-renderizar nada); al frenar se lee dónde quedó el marcador.
 */
export default function PowerBar({ actionLabel = '¡Patear!', doneLabel = '¡Pateó!', onStop }) {
  const [stopped, setStopped] = useState(false)
  const [sweep] = useState(() => sweepPhase())
  // Con "menos movimiento" se deja la velocidad lenta de siempre
  const slowMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  const trackRef = useRef(null)
  const markerRef = useRef(null)

  const stop = () => {
    if (stopped) return
    feel('pick')
    const track = trackRef.current?.getBoundingClientRect()
    const marker = markerRef.current?.getBoundingClientRect()
    const pos = track && marker && track.width > 0 ? Math.max(0, Math.min(1, (marker.left + marker.width / 2 - track.left) / track.width)) : 0.5
    const quality = Math.max(0, 1 - Math.abs(pos - 0.5) * 2)
    setStopped(true)
    onStop(quality)
  }

  return (
    <>
      <div ref={trackRef} className="relative mx-auto h-5 w-full max-w-xs overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        <div className="absolute inset-y-0 left-[35%] w-[30%] bg-accent/40" />
        <div ref={markerRef} style={{ animationDelay: `${sweep.delay}s`, ...(slowMotion ? {} : { animationDuration: `${sweep.duration}s` }) }} className={cn('penalty-marker absolute inset-y-0 w-1.5 -translate-x-1/2 rounded-full bg-fg', stopped && 'penalty-marker-paused')} />
      </div>
      <button
        type="button"
        onClick={stop}
        disabled={stopped}
        className="min-h-12 w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-strong disabled:opacity-60"
      >
        {stopped ? doneLabel : actionLabel}
      </button>
    </>
  )
}
