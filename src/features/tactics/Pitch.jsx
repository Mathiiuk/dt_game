import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '../../lib/utils'
import { getLayout } from '../../domain/formations'
import { fitLabel, slotBase } from '../../domain/positions'
import { ratingAtSlot } from '../../domain/ratings'

const RING = {
  NATURAL: 'border-accent text-accent',
  COMPATIBLE: 'border-warning text-warning',
  ADAPTED: 'border-[oklch(75%_0.16_55)] text-[oklch(75%_0.16_55)]',
  OUT_OF_POSITION: 'border-danger text-danger'
}

/** Trazado de la cancha (líneas de tiza sobre césped oscuro). Proporción vertical 68:100 */
function PitchLines() {
  const line = 'oklch(95% 0.012 100 / 0.22)'
  return (
    <svg viewBox="0 0 68 100" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="mow" width="68" height="12.5" patternUnits="userSpaceOnUse">
          <rect width="68" height="6.25" fill="oklch(24% 0.03 155)" />
          <rect y="6.25" width="68" height="6.25" fill="oklch(22% 0.028 155)" />
        </pattern>
      </defs>
      <rect width="68" height="100" fill="url(#mow)" />
      <g fill="none" stroke={line} strokeWidth="0.45">
        <rect x="2" y="2" width="64" height="96" rx="0.5" />
        <line x1="2" y1="50" x2="66" y2="50" />
        <circle cx="34" cy="50" r="8" />
        <rect x="14" y="2" width="40" height="15" />
        <rect x="24" y="2" width="20" height="6" />
        <path d="M 26 17 A 8 8 0 0 0 42 17" />
        <rect x="14" y="83" width="40" height="15" />
        <rect x="24" y="92" width="20" height="6" />
        <path d="M 26 83 A 8 8 0 0 1 42 83" />
      </g>
      <circle cx="34" cy="50" r="0.7" fill={line} />
    </svg>
  )
}

/** Ficha de jugador: número, apellido y anillo de afinidad posicional */
function Token({ slot, player, x, y, selected, onSelect, reduceMotion }) {
  const base = slotBase(slot)
  const affinity = player ? fitLabel(player.position, slot) : null
  const rating = player ? ratingAtSlot(player, slot) : null
  const lastName = player ? (player.last_name || '').split(' ').slice(-1)[0] : ''
  const label = player
    ? `${base}: ${player.first_name} ${player.last_name}, ${affinity.label}, media ${rating} en el puesto${player.is_injured ? ', lesionado' : ''}${selected ? ', seleccionado' : ''}`
    : `${base}: puesto vacío${selected ? ', seleccionado' : ''}`

  return (
    <motion.div
      // La posición anima con un resorte al cambiar de formación. Con "reducir movimiento" activo en el sistema se usa un
      // desplazamiento corto y lineal, sin rebote: el movimiento es parte esencial de la función (ver a dónde va cada jugador)
      initial={false}
      animate={{ left: `${x}%`, top: `${y}%` }}
      transition={reduceMotion ? { duration: 0.35, ease: 'easeOut' } : { type: 'spring', stiffness: 170, damping: 20, mass: 0.9 }}
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
    >
      <button
        type="button"
        onClick={() => onSelect(slot)}
        aria-label={label}
        aria-pressed={selected}
        className="group flex w-16 flex-col items-center gap-1 focus-visible:outline-none sm:w-20"
      >
        <span
          className={cn(
            'grid size-10 place-items-center rounded-full border-2 bg-bg font-display text-lg font-semibold shadow-raised transition-transform sm:size-11',
            player ? RING[affinity.code] : 'border-dashed border-fg-subtle text-fg-subtle',
            selected && 'scale-110 ring-2 ring-fg ring-offset-2 ring-offset-transparent',
            'group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-bg'
          )}
        >
          {player ? (player.shirt_number ?? '·') : '+'}
          {player?.is_injured && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-bg bg-danger" aria-hidden="true" />}
        </span>
        {player && (
          <span className="num -mt-3 ml-7 rounded-sm bg-bg px-1 text-[0.625rem] font-semibold leading-4 text-fg shadow-raised sm:ml-8" aria-hidden="true">{rating}</span>
        )}
        <span className={cn(
          'max-w-full truncate rounded-sm px-1.5 text-[0.6875rem] font-semibold leading-4',
          player ? 'bg-bg/80 text-fg' : 'text-fg-subtle'
        )}>
          {player ? lastName : base}
        </span>
      </button>
    </motion.div>
  )
}

/**
 * Cancha con los 11 titulares. `lineup` es { [slot]: playerId }; `players` el plantel completo.
 * Cada ficha está identificada por el puesto de la formación; al cambiar de formación se reposicionan con animación.
 */
export default function Pitch({ formation, lineup, players, selectedSlot, onSelectSlot, className }) {
  const reduceMotion = useReducedMotion()
  const byId = new Map(players.map(p => [p.id, p]))
  const layout = getLayout(formation)
  const seen = new Set()

  return (
    <div
      role="group"
      aria-label={`Cancha: formación ${formation}`}
      className={cn('relative mx-auto aspect-[68/100] w-full max-w-[28rem] overflow-hidden rounded-lg border border-line', className)}
    >
      <PitchLines />
      {/* La ficha se identifica por el JUGADOR (no por el puesto): al cambiar de formación cada jugador se desplaza
          con un resorte hacia su nuevo puesto en vez de "teletransportarse". Los puestos vacíos usan clave propia. */}
      {layout.map(({ slot, x, y }) => {
        const player = byId.get(lineup[slot])
        // Defensa ante datos viejos: si un mismo jugador figura en dos puestos, la segunda ficha usa clave propia
        const duplicated = player && seen.has(player.id)
        if (player) seen.add(player.id)
        return (
          <Token
            key={player ? (duplicated ? `p-${player.id}-${slot}` : `p-${player.id}`) : `empty-${slot}`}
            slot={slot}
            x={x}
            y={y}
            player={player}
            selected={selectedSlot === slot}
            onSelect={onSelectSlot}
            reduceMotion={reduceMotion}
          />
        )
      })}
    </div>
  )
}
