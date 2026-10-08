import React, { useEffect, useRef, useState } from 'react'
import { Hand, CircleDot } from 'lucide-react'
import { cn } from '../../lib/utils'

const ZONES = { L: 'Izquierda', C: 'Centro', R: 'Derecha' }

/**
 * Penal en contra: el arco con tres zonas. El DT toca hacia dónde se tira el arquero.
 * Es la misma decisión de siempre (izquierda, centro o derecha), pero se juega en el arco en vez de en una lista.
 * `options` son las opciones del momento; se elige la que tiene el `dive` de la zona tocada.
 */
export default function PenaltyGoal({ options, onChoose }) {
  const [picked, setPicked] = useState(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const byDive = Object.fromEntries(options.filter(o => o.dive).map(o => [o.dive, o]))

  const choose = (dive) => {
    if (picked || !byDive[dive]) return
    setPicked(dive)
    // Un instante para ver al arquero tirarse antes de seguir
    timer.current = setTimeout(() => onChoose(byDive[dive]), 650)
  }

  return (
    <div>
      <div className="relative mx-auto h-36 w-full max-w-xs overflow-hidden rounded-t-md border-x-4 border-t-4 border-fg bg-[repeating-linear-gradient(45deg,transparent_0_6px,oklch(100%_0_0/0.06)_6px_7px)]">
        <div className="grid h-full grid-cols-3">
          {Object.keys(ZONES).map(dive => (
            <button
              key={dive}
              type="button"
              onClick={() => choose(dive)}
              disabled={!!picked}
              aria-label={`Que se tire a la ${ZONES[dive].toLowerCase()}`}
              className={cn(
                'relative border-l border-line/40 first:border-l-0 transition-colors',
                picked === dive ? 'bg-accent/30' : 'hover:bg-accent-soft active:bg-accent/30',
                'disabled:cursor-default'
              )}
            >
              <span className="absolute inset-x-0 bottom-2 text-[0.6875rem] font-bold uppercase tracking-wider text-fg-muted">{ZONES[dive]}</span>
            </button>
          ))}
        </div>
        {/* Arquero: se queda en el medio hasta que el DT elige y entonces se tira */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute bottom-8 left-1/2 text-3xl transition-transform duration-500 ease-out',
            picked === 'L' && '-translate-x-[230%] -rotate-45',
            picked === 'R' && 'translate-x-[130%] rotate-45',
            !picked && '-translate-x-1/2'
          )}
        >
          <Hand className="size-8 text-gold" />
        </span>
      </div>
      <p className="mt-2 text-center text-xs text-fg-subtle">Tocá la zona hacia donde se tira tu arquero. Si adivina, casi siempre la ataja.</p>
    </div>
  )
}

/**
 * Penal a favor: dos toques. Primero se apunta a una zona del arco y después se frena la barra de potencia
 * en el verde. Una barra bien frenada sube la chance de gol; una mal frenada la baja (y si es muy mala, se va a la tribuna).
 * Devuelve `{ aim: 'L'|'C'|'R', quality: 0..1 }`.
 */
export function PenaltyShoot({ takerName, onDone }) {
  const [aim, setAim] = useState(null)
  const [shot, setShot] = useState(false)
  // La barra se mueve con una animación de CSS (suave, sin re-renderizar nada); al patear se lee dónde quedó el marcador
  const trackRef = useRef(null)
  const markerRef = useRef(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const kick = () => {
    if (shot) return
    const track = trackRef.current?.getBoundingClientRect()
    const marker = markerRef.current?.getBoundingClientRect()
    const pos = track && marker && track.width > 0 ? Math.max(0, Math.min(1, (marker.left + marker.width / 2 - track.left) / track.width)) : 0.5
    const quality = Math.max(0, 1 - Math.abs(pos - 0.5) * 2)
    setShot(true)
    timer.current = setTimeout(() => onDone({ aim, quality }), 700)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-fg">{aim ? `${takerName} está listo. Frená la barra en el verde.` : `${takerName} agarra la pelota. ¿Adónde la manda?`}</p>
      <div className="relative mx-auto h-32 w-full max-w-xs overflow-hidden rounded-t-md border-x-4 border-t-4 border-fg bg-[repeating-linear-gradient(45deg,transparent_0_6px,oklch(100%_0_0/0.06)_6px_7px)]">
        <div className="grid h-full grid-cols-3">
          {Object.keys(ZONES).map(zone => (
            <button
              key={zone}
              type="button"
              onClick={() => !aim && setAim(zone)}
              disabled={!!aim}
              aria-label={`Apuntar a la ${ZONES[zone].toLowerCase()}`}
              className={cn('border-l border-line/40 first:border-l-0 transition-colors', aim === zone ? 'bg-accent/30' : !aim && 'hover:bg-accent-soft active:bg-accent/30', 'disabled:cursor-default')}
            >
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-fg-muted">{ZONES[zone]}</span>
            </button>
          ))}
        </div>
        {shot && (
          <span aria-hidden="true" className={cn('pointer-events-none absolute bottom-4 left-1/2 text-fg transition-all duration-500 ease-out', aim === 'L' && '-translate-x-[260%] -translate-y-14', aim === 'R' && 'translate-x-[160%] -translate-y-14', aim === 'C' && '-translate-x-1/2 -translate-y-16')}><CircleDot className="size-6" /></span>
        )}
      </div>

      {aim && (
        <>
          <div ref={trackRef} className="relative mx-auto h-5 w-full max-w-xs overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
            <div className="absolute inset-y-0 left-[35%] w-[30%] bg-accent/40" />
            <div ref={markerRef} className={cn('penalty-marker absolute inset-y-0 w-1.5 -translate-x-1/2 rounded-full bg-fg', shot && 'penalty-marker-paused')} />
          </div>
          <button
            type="button"
            onClick={kick}
            disabled={shot}
            className="min-h-12 w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {shot ? '¡Pateó!' : '¡Patear!'}
          </button>
        </>
      )}
    </div>
  )
}
