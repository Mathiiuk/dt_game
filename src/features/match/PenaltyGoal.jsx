import React, { useEffect, useRef, useState } from 'react'
import { Hand, CircleDot } from 'lucide-react'
import { cn } from '../../lib/utils'
import { shotPath } from '../../domain/shotPath'
import PowerBar from './PowerBar'

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
  // Adónde llega la pelota (depende de la zona y de la calidad del golpe) y si ya salió: cada penal es distinto
  const [path, setPath] = useState(null)
  const [flying, setFlying] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const kick = (quality) => {
    if (shot) return
    setShot(true)
    setPath(shotPath({ aim, quality }))
    // un cuadro después se le da el destino para que la transición de CSS la haga viajar
    requestAnimationFrame(() => requestAnimationFrame(() => setFlying(true)))
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
        {shot && path && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute text-fg"
            style={{
              left: flying ? `${path.x}%` : '50%',
              bottom: flying ? `${path.y}%` : '6%',
              transform: `translate(-50%, 50%) scale(${flying ? 0.85 : 1.15})`,
              opacity: flying && path.off ? 0.35 : 1,
              transition: `left ${path.ms}ms ease-out, bottom ${path.ms}ms cubic-bezier(.2,.8,.3,1), transform ${path.ms}ms ease-out, opacity ${path.ms}ms ease-in`
            }}
          ><CircleDot className="size-6" /></span>
        )}
      </div>

      {aim && <PowerBar onStop={kick} />}
    </div>
  )
}
