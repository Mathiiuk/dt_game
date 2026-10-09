import React, { useEffect, useRef, useState } from 'react'
import { CircleDot, Hand } from 'lucide-react'
import { cn } from '../../lib/utils'
import { feel } from '../../lib/feedback'
import { flightPlan } from '../../domain/shotPath'

const ZONES = ['L', 'C', 'R']
const NAMES = { L: 'izquierda', C: 'el medio', R: 'derecha' }
const FLIGHT_MS = 850
const LATE_MS = 1350

/** Calidad de la reacción (0 a 1) según a dónde se tiró el arquero y cuánto tardó */
export function reactionQuality({ tapped, target, elapsed, flight = FLIGHT_MS }) {
  if (tapped === null) return 0 // llegó tarde: no se movió
  if (tapped !== target) return 0.1 // se tiró para el otro lado
  return Math.max(0.55, Math.min(1, 1 - (elapsed / flight) * 0.45))
}

/** Frase del relato según cómo reaccionó el arquero */
export const reactionLabel = (quality) =>
  quality >= 0.85 ? 'Tu arquero salió volando y se estiró al máximo' : quality >= 0.55 ? 'Tu arquero llegó justo' : quality > 0.1 ? 'Tu arquero llegó tarde' : 'Tu arquero se tiró para el otro lado'

/**
 * Remate en contra: la pelota sale hacia una de las tres zonas del arco y hay que tirar al arquero ahí, lo más rápido posible.
 * Reaccionar bien baja la chance de gol del rival; reaccionar mal la sube. `onDone({ quality, label })`.
 */
export default function SaveReflex({ onDone }) {
  const [target] = useState(() => ZONES[Math.floor(Math.random() * 3)])
  // De dónde sale la pelota, cuánto tarda y a qué altura entra: cada remate es distinto
  const [plan] = useState(() => flightPlan())
  const [phase, setPhase] = useState('wait') // wait → fly → done
  const [tapped, setTapped] = useState(undefined) // undefined: todavía no tocó
  const [moving, setMoving] = useState(false)
  const start = useRef(0)
  const timers = useRef([])
  const finished = useRef(false)

  const finish = (zone, elapsed, early = false) => {
    if (finished.current) return
    finished.current = true
    setTapped(zone)
    setPhase('done')
    const quality = early ? 0.2 : reactionQuality({ tapped: zone, target, elapsed, flight: plan.flightMs })
    feel(quality >= 0.55 ? 'good' : 'bad')
    const label = early ? 'Tu arquero se adelantó y lo engañaron' : zone === null ? 'Tu arquero no alcanzó a reaccionar' : reactionLabel(quality)
    timers.current.push(setTimeout(() => onDone({ quality, label }), 900))
  }

  // Espera un instante (sin avisar cuándo) y la pelota arranca; si no se mueve nadie a tiempo, llega tarde
  useEffect(() => {
    const wait = 600 + Math.floor(Math.random() * 700)
    timers.current.push(setTimeout(() => {
      if (finished.current) return
      start.current = performance.now()
      setPhase('fly')
      // un cuadro después se le da el destino para que la transición de CSS la haga viajar
      requestAnimationFrame(() => requestAnimationFrame(() => setMoving(true)))
      timers.current.push(setTimeout(() => finish(null, plan.flightMs + (LATE_MS - FLIGHT_MS)), plan.flightMs + (LATE_MS - FLIGHT_MS)))
    }, wait))
    const all = timers.current
    return () => all.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const press = (zone) => {
    if (finished.current) return
    if (phase === 'wait') { finish(zone, 0, true); return } // se tiró antes de que patearan
    finish(zone, performance.now() - start.current)
  }

  const targetLeft = `${{ L: 16.5, C: 50, R: 83.5 }[target] + plan.jitterX}%`
  const ok = phase === 'done' && tapped === target
  return (
    <div className="space-y-2">
      <p className="text-center text-sm text-fg-muted" role="status">
        {phase === 'wait' && 'Atento al remate... no te adelantes.'}
        {phase === 'fly' && '¡Ahora! Tocá hacia dónde va.'}
        {phase === 'done' && (tapped === undefined || tapped === null ? 'Llegaste tarde.' : tapped !== target ? `Era ${NAMES[target]}. Te tiraste mal.` : ok ? '¡Llegaste!' : '')}
      </p>
      <div className="relative mx-auto h-44 w-full max-w-xs overflow-hidden rounded-t-md border-x-4 border-t-4 border-fg bg-[repeating-linear-gradient(45deg,transparent_0_6px,oklch(100%_0_0/0.06)_6px_7px)]">
        <div className="grid h-full grid-cols-3">
          {ZONES.map(zone => (
            <button
              key={zone}
              type="button"
              onPointerDown={() => press(zone)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(zone) } }}
              disabled={phase === 'done'}
              aria-label={`Tirarse a ${NAMES[zone]}`}
              className={cn('border-l border-line/40 first:border-l-0 transition-colors disabled:cursor-default', tapped === zone ? 'bg-accent/30' : 'active:bg-accent/20')}
            />
          ))}
        </div>
        {/* La pelota sale de abajo, al medio, y viaja a su zona */}
        {phase !== 'wait' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute text-fg"
            style={{ left: moving ? targetLeft : `${plan.startX}%`, top: moving ? `${plan.endTop}%` : '88%', transform: 'translate(-50%, -50%)', transition: `left ${plan.flightMs}ms linear, top ${plan.flightMs}ms ease-out` }}
          >
            <CircleDot className="size-7" />
          </span>
        )}
        {phase === 'done' && tapped && (
          <span aria-hidden="true" className="pointer-events-none absolute bottom-3 text-gold" style={{ left: { L: '16.5%', C: '50%', R: '83.5%' }[tapped], transform: 'translateX(-50%)' }}>
            <Hand className="size-9" />
          </span>
        )}
      </div>
    </div>
  )
}
