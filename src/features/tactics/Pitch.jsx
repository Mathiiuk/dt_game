import React, { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Bandage } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getLayout } from '../../domain/formations'
import { clampPoint } from '../../domain/freeLayout'
import { fitLabel, slotBase } from '../../domain/positions'
import { ratingAtSlot } from '../../domain/ratings'
import { cardStatus, suspensionNote } from '../../domain/suspensions'

const RING = {
  NATURAL: 'border-accent text-accent',
  COMPATIBLE: 'border-warning text-warning',
  ADAPTED: 'border-ring-adapted text-ring-adapted',
  OUT_OF_POSITION: 'border-danger text-danger'
}

const LINK_COLOR = { GOOD: 'var(--color-link-good)', OK: 'var(--color-link-ok)', BAD: 'var(--color-link-bad)' }

/** Enlaces de química entre fichas vecinas: líneas verdes (buena), amarillas (regular) y rojas (mala) */
function ChemistryLinks({ links, positions }) {
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 z-[5] size-full" preserveAspectRatio="none" aria-hidden="true">
      {links.map(l => {
        const a = positions[l.a]
        const b = positions[l.b]
        if (!a || !b) return null
        return (
          <line
            key={`${l.a}-${l.b}`}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={LINK_COLOR[l.tone]}
            strokeWidth={l.tone === 'GOOD' ? 2.2 : 1.6}
            strokeLinecap="round"
            strokeOpacity="0.85"
            vectorEffect="non-scaling-stroke"
          />
        )
      })}
    </svg>
  )
}

const DRAG_THRESHOLD = 6
const KEY_STEP = 2
const ARROWS = { ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP] }

/** Trazado de la cancha (líneas de tiza sobre césped apagado; los colores salen de los tokens de cada tema). Proporción vertical 68:100 */
function PitchLines() {
  const line = 'var(--color-pitch-line)'
  return (
    <svg viewBox="0 0 68 100" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="mow" width="68" height="12.5" patternUnits="userSpaceOnUse">
          <rect width="68" height="6.25" fill="var(--color-pitch)" />
          <rect y="6.25" width="68" height="6.25" fill="var(--color-pitch-2)" />
        </pattern>
      </defs>
      <rect width="68" height="100" fill="url(#mow)" />
      <g fill="none" stroke={line} strokeWidth="0.45" strokeOpacity="0.7">
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

const CARD = 'absolute -right-1.5 -top-2 border-2 border-surface'

/** Insignia en la esquina de la ficha: cruz roja (lesión), tarjeta roja (expulsado), amarilla (suspendido por 5 amarillas) o aviso de apercibido */
function StatusBadge({ status }) {
  if (status === 'injured') {
    return <span data-card-status="injured" className={cn(CARD, 'grid size-5 place-items-center rounded-full bg-danger text-xs font-bold leading-none text-danger-fg')} aria-hidden="true">+</span>
  }
  if (status === 'red') return <span data-card-status="red" className={cn(CARD, 'h-5 w-3.5 rounded-[3px] bg-danger')} aria-hidden="true" />
  if (status === 'yellow-ban') return <span data-card-status="yellow-ban" className={cn(CARD, 'h-5 w-3.5 rounded-[3px] bg-card-yellow')} aria-hidden="true" />
  return <span data-card-status="warning" className={cn(CARD, 'h-4 w-3 rounded-[2px] border-dashed border-card-yellow bg-card-yellow/40')} aria-hidden="true" />
}

/**
 * Ficha de jugador: número, apellido y anillo de afinidad posicional.
 * Con `draggable` se arrastra; seleccionada, también se mueve con las flechas del teclado.
 */
function Token({ slot, player, x, y, selected, onSelect, draggable, dragging, onPointerDown, onPointerMove, onPointerUp, onNudge, reduceMotion, captain }) {
  const base = slotBase(slot)
  const affinity = player ? fitLabel(player.position, slot) : null
  const rating = player ? ratingAtSlot(player, slot) : null
  const status = cardStatus(player)
  const lastName = player ? (player.last_name || '').split(' ').slice(-1)[0] : ''
  const label = player
    ? `${base}: ${player.first_name} ${player.last_name}, ${affinity.label}, media ${rating} en el puesto${captain ? ', capitán' : ''}${player.is_injured ? ', lesionado' : ''}${status && status !== 'injured' ? `, ${suspensionNote(player)}`.replace(/\.$/, '') : ''}${selected ? ', seleccionado' : ''}`
    : `${base}: puesto vacío${selected ? ', seleccionado' : ''}`

  const handleKeyDown = (e) => {
    const step = ARROWS[e.key]
    if (!step || !selected || !onNudge) return
    e.preventDefault()
    onNudge(slot, x + step[0], y + step[1])
  }

  return (
    <motion.div
      // La posición anima con un resorte al cambiar de formación. Con "reducir movimiento" activo en el sistema se usa un
      // desplazamiento corto y lineal, sin rebote: el movimiento es parte esencial de la función (ver a dónde va cada jugador).
      // Mientras se arrastra, la ficha sigue al dedo sin resorte.
      initial={false}
      animate={{ left: `${x}%`, top: `${y}%` }}
      transition={dragging ? { duration: 0 } : reduceMotion ? { duration: 0.35, ease: 'easeOut' } : { type: 'spring', stiffness: 170, damping: 20, mass: 0.9 }}
      className={cn('absolute -translate-x-1/2 -translate-y-1/2', dragging ? 'z-20' : 'z-10')}
    >
      <button
        type="button"
        onClick={() => onSelect(slot)}
        onPointerDown={draggable ? (e) => onPointerDown(e, slot) : undefined}
        onPointerMove={draggable ? onPointerMove : undefined}
        onPointerUp={draggable ? onPointerUp : undefined}
        onPointerCancel={draggable ? onPointerUp : undefined}
        onKeyDown={handleKeyDown}
        aria-label={label}
        aria-pressed={selected}
        className={cn('group flex w-14 flex-col items-center gap-1 focus-visible:outline-none sm:w-20', draggable && 'touch-none cursor-grab active:cursor-grabbing')}
      >
        <span
          className={cn(
            'relative grid size-9 place-items-center rounded-full border-2 bg-surface font-display text-base font-semibold shadow-raised transition-transform sm:size-11 sm:text-lg',
            player ? RING[affinity.code] : 'border-dashed border-fg-subtle text-fg-subtle',
            selected && 'scale-110 ring-2 ring-fg ring-offset-2 ring-offset-transparent',
            dragging && 'scale-110 shadow-overlay',
            'group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-bg'
          )}
        >
          {player ? (player.shirt_number ?? '·') : '+'}
          {status && <StatusBadge status={status} />}
          {player && <span className="num absolute -bottom-2 -right-3 z-10 min-w-5 rounded-sm border border-surface bg-fg px-1 text-center text-[0.6875rem] font-bold leading-4 text-bg shadow-raised" aria-hidden="true">{rating}</span>}
          {captain && <span className="absolute -left-1 -top-1 grid size-4 place-items-center rounded-full bg-gold text-[0.5625rem] font-bold leading-none text-bg" aria-hidden="true">C</span>}
        </span>
        <span className={cn(
          'max-w-full truncate rounded-sm px-1.5 text-[0.6875rem] font-semibold leading-4',
          player ? 'bg-surface/90 text-fg' : 'text-pitch-line'
        )}>
          {player ? lastName : base}
        </span>
        {/* Bajas con texto solo en pantallas anchas: en el celular la insignia de la ficha alcanza y la pastilla tapaba a los vecinos */}
        {status === 'injured' && <span className="-mt-0.5 hidden rounded-sm bg-danger px-1 text-[0.5625rem] font-bold uppercase leading-4 tracking-wide text-danger-fg sm:inline-block" aria-hidden="true"><Bandage className="mr-0.5 inline size-2.5 align-[-1px]" />Lesionado</span>}
        {(status === 'red' || status === 'yellow-ban') && <span className={cn('-mt-0.5 hidden rounded-sm px-1 text-[0.5625rem] font-bold uppercase leading-4 tracking-wide sm:inline-block', status === 'red' ? 'bg-danger text-danger-fg' : 'bg-card-yellow text-fg')} aria-hidden="true">Suspendido</span>}
      </button>
    </motion.div>
  )
}

/**
 * Cancha con los 11 titulares. `lineup` es { [slot]: playerId }; `players` el plantel completo.
 * El layout sale de `layout` (alineación libre) o de la formación fija. Cada ficha está identificada por el jugador:
 * al cambiar de formación se reposicionan con animación.
 *
 * Con `onMove(slot, x, y, { keepSelection })` las fichas se arrastran a cualquier lugar. En el celular también se puede tocar
 * una ficha y después tocar el lugar de la cancha, o mover la seleccionada con las flechas del teclado.
 */
export default function Pitch({ formation, layout: layoutProp, lineup, players, selectedSlot, onSelectSlot, onMove, links, captainId = null, className }) {
  const reduceMotion = useReducedMotion()
  const boxRef = useRef(null)
  const dragRef = useRef(null)
  const suppressClick = useRef(false)
  const [drag, setDrag] = useState(null) // { slot, x, y } mientras se arrastra

  const byId = new Map(players.map(p => [p.id, p]))
  const layout = layoutProp || getLayout(formation)
  const seen = new Set()

  /** Punto de la cancha (en %) bajo el puntero */
  const pointFromEvent = (e) => {
    const rect = boxRef.current?.getBoundingClientRect()
    if (!rect || !rect.width || !rect.height) return null
    return { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 }
  }

  const handlePointerDown = (e, slot) => {
    if (e.button !== undefined && e.button !== 0) return
    dragRef.current = { slot, startX: e.clientX, startY: e.clientY, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD) return
    d.moved = true
    const point = pointFromEvent(e)
    if (point) setDrag({ slot: d.slot, ...clampPoint(point.x, point.y, d.slot === 'PO') })
  }

  const handlePointerUp = (e) => {
    const d = dragRef.current
    dragRef.current = null
    if (!d?.moved) return
    // El click que sigue a un arrastre no debe seleccionar la ficha
    suppressClick.current = true
    setTimeout(() => { suppressClick.current = false }, 0)
    const point = pointFromEvent(e)
    setDrag(null)
    if (point) onMove(d.slot, point.x, point.y, { keepSelection: false })
  }

  const handleSelect = (slot) => {
    if (suppressClick.current) return
    onSelectSlot(slot)
  }

  // Tocar un lugar vacío de la cancha mueve ahí la ficha seleccionada
  const handleBackgroundClick = (e) => {
    if (!onMove || !selectedSlot || e.target.closest('button')) return
    const point = pointFromEvent(e)
    if (point) onMove(selectedSlot, point.x, point.y, { keepSelection: false })
  }

  return (
    <div
      ref={boxRef}
      role="group"
      aria-label={`Cancha: formación ${formation}`}
      onClick={handleBackgroundClick}
      className={cn('relative mx-auto aspect-[68/100] w-full max-w-[28rem] overflow-hidden rounded-lg border border-line', className)}
    >
      <PitchLines />
      {links?.length > 0 && (
        <ChemistryLinks
          links={links}
          positions={Object.fromEntries(layout.map(p => [p.slot, drag?.slot === p.slot ? { x: drag.x, y: drag.y } : { x: p.x, y: p.y }]))}
        />
      )}
      {/* La ficha se identifica por el JUGADOR (no por el puesto): al cambiar de formación cada jugador se desplaza
          con un resorte hacia su nuevo puesto en vez de "teletransportarse". Los puestos vacíos usan clave propia. */}
      {layout.map(({ slot, x, y }) => {
        const player = byId.get(lineup[slot])
        // Defensa ante datos viejos: si un mismo jugador figura en dos puestos, la segunda ficha usa clave propia
        const duplicated = player && seen.has(player.id)
        if (player) seen.add(player.id)
        const dragging = drag?.slot === slot
        return (
          <Token
            key={player ? (duplicated ? `p-${player.id}-${slot}` : `p-${player.id}`) : `empty-${slot}`}
            slot={slot}
            x={dragging ? drag.x : x}
            y={dragging ? drag.y : y}
            player={player}
            captain={Boolean(player && captainId && player.id === captainId)}
            selected={selectedSlot === slot}
            onSelect={handleSelect}
            draggable={Boolean(onMove)}
            dragging={dragging}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onNudge={onMove ? (s, nx, ny) => onMove(s, nx, ny, { keepSelection: true }) : undefined}
            reduceMotion={reduceMotion}
          />
        )
      })}
    </div>
  )
}
