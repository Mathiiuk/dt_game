import React from 'react'
import { ArrowLeftRight, CheckCircle, FastForward, Flame, Pause, Play, ShieldAlert, Sparkles, Timer } from 'lucide-react'
import { MATCH_SPEEDS } from '../../domain/matchClock'
import { SHOUT_TYPES } from '../../api/matchEngine'
import { cn } from '../../lib/utils'

// Icono y resumen del efecto de cada orden (el texto largo vive en matchEngine; acá va lo que se lee de un vistazo)
const SHOUT_LOOK = {
  SHOUT_FOCUS: { icon: ShieldAlert, effect: '+15% defensa' },
  SHOUT_CALM: { icon: Sparkles, effect: '+15% posesión' },
  SHOUT_ATTACK: { icon: Flame, effect: '+20% ataque · −15% defensa' },
  SHOUT_LOCK: { icon: ShieldAlert, effect: '+25% defensa · −30% ataque' }
}
const clean = (text) => text.replace(/[¡!¿?]/g, '')

function Block({ title, children, className }) {
  return (
    <section aria-label={title} className={cn('space-y-2', className)}>
      <h4 className="eyebrow">{title}</h4>
      {children}
    </section>
  )
}

/**
 * Dirección técnica de escritorio: todo lo que el DT hace durante el partido, en un solo panel
 * (control del partido, órdenes desde el banco y cambios). En el celular siguen los botones de abajo y las hojas.
 */
export default function DirectionPanel({
  matchState, paused, onTogglePause, speed, onSpeed, onSkip,
  shoutWait = 0, activeOrder, onApplyOrder,
  subsLeft = 0, subsMade = [], onOpenSubs,
  onStart, onSummary
}) {
  return (
    <section aria-label="Dirección técnica" className="space-y-4 rounded-xl border border-line bg-surface p-4">
      <h3 className="flex items-center gap-2 font-slab text-lg font-bold text-fg">
        <Timer className="size-4.5 text-accent" aria-hidden="true" />
        Dirección técnica
      </h3>

      {matchState === 'pre-match' && (
        <button
          type="button"
          onClick={onStart}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wider text-primary-fg shadow-lg transition-colors hover:bg-primary-strong"
        >
          <Play className="size-5 fill-primary-fg" aria-hidden="true" />
          Comenzar partido
        </button>
      )}

      {matchState === 'finished' && (
        <button
          type="button"
          onClick={onSummary}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wider text-primary-fg shadow-lg transition-colors hover:bg-primary-strong"
        >
          <CheckCircle className="size-5" aria-hidden="true" />
          Resumen
        </button>
      )}

      {matchState === 'playing' && (
        <>
          <Block title="Control del partido">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onTogglePause}
                aria-pressed={paused}
                aria-label={paused ? 'Reanudar' : 'Pausa'}
                className={cn(
                  'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-bold transition-colors',
                  paused ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-bg text-fg hover:bg-surface-3'
                )}
              >
                {paused ? <Play className="size-4.5" aria-hidden="true" /> : <Pause className="size-4.5" aria-hidden="true" />}
                {paused ? 'Reanudar' : 'Pausa'}
              </button>
              <div role="radiogroup" aria-label="Velocidad del partido" className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 p-1">
                {MATCH_SPEEDS.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={speed === s.id}
                    title={s.hint}
                    onClick={() => onSpeed(s.id)}
                    className={cn('min-h-9 rounded-md px-3 text-sm font-bold transition-colors', speed === s.id ? 'bg-primary text-primary-fg' : 'text-fg-muted hover:text-fg')}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={onSkip}
              className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-bg text-sm font-semibold text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
            >
              <FastForward className="size-4" aria-hidden="true" />
              Saltear partido
            </button>
          </Block>

          <Block title="Órdenes desde el banco">
            <div role="group" aria-label="Órdenes desde el banco" className="grid grid-cols-1 gap-2">
              {SHOUT_TYPES.map(order => {
                const look = SHOUT_LOOK[order.id] || { icon: Flame, effect: '' }
                const Icon = look.icon
                const active = activeOrder === order.id
                return (
                  <button
                    key={order.id}
                    type="button"
                    disabled={shoutWait > 0}
                    aria-pressed={active}
                    onClick={() => onApplyOrder(order)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                      active ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-line bg-bg hover:border-primary hover:bg-surface-2'
                    )}
                  >
                    <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', active ? 'bg-primary text-primary-fg' : 'bg-surface-3 text-fg-muted')} aria-hidden="true">
                      <Icon className="size-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug text-fg">{clean(order.label)}</span>
                      <span className="block text-xs text-fg-subtle">{look.effect}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-fg-muted" role="status">
              {shoutWait > 0 ? `Podés volver a dar una orden en ${shoutWait} min.` : 'Dura 15 minutos. Después hay que esperar para dar otra.'}
            </p>
          </Block>

          <Block title="Cambios">
            <button
              type="button"
              onClick={onOpenSubs}
              disabled={subsLeft === 0}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary text-sm font-bold text-primary-fg transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-3 disabled:text-fg-subtle"
            >
              <ArrowLeftRight className="size-4.5" aria-hidden="true" />
              Hacer un cambio
            </button>
            <p className="text-xs text-fg-muted">
              {subsLeft === 0 ? 'Ya hiciste todos los cambios permitidos.' : `${subsLeft} ${subsLeft === 1 ? 'cambio disponible' : 'cambios disponibles'}`}
            </p>
            {subsMade.length > 0 && (
              <ol aria-label="Cambios realizados" className="divide-y divide-line rounded-lg border border-line bg-bg text-xs">
                {subsMade.map((s, i) => (
                  <li key={`${s.minute}-${i}`} className="flex items-center gap-2 px-2.5 py-1.5">
                    <span className="num font-mono font-bold text-fg">{s.minute}'</span>
                    <span className="min-w-0 flex-1 truncate text-fg-muted">
                      <span className="text-danger">sale</span> {s.outName} · <span className="text-accent">entra</span> {s.inName}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Block>
        </>
      )}
    </section>
  )
}
