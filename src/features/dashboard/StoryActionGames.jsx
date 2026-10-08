import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Banknote, Newspaper, Timer, Wallet } from 'lucide-react'
import { BILLS_COUNT, BILLS_NEEDED, BILLS_SECONDS, REFLEX_NEEDED, REFLEX_TARGETS, billsWon, buildBills, buildReflexTargets, reflexWon } from '../../domain/storyStage'
import { cn } from '../../lib/utils'

/**
 * Desafío de reflejos: aparecen noticias de a una, unos instantes, y hay que tocarlas antes de que se escapen.
 * Con tres de cinco se gana.
 */
export function ReflexChallenge({ onDone }) {
  const targets = useMemo(() => buildReflexTargets(), [])
  const [index, setIndex] = useState(-1) // -1: preparándose
  const [visible, setVisible] = useState(false)
  const [hits, setHits] = useState(0)
  const [escaped, setEscaped] = useState(false)
  const hitsRef = useRef(0)
  const caught = useRef(false)

  // Cada noticia: espera, se muestra, y si no la tocan se escapa
  useEffect(() => {
    const timers = []
    let i = 0
    const next = () => {
      if (i >= targets.length) { timers.push(setTimeout(() => onDone(reflexWon(hitsRef.current)), 500)); return }
      const t = targets[i]
      caught.current = false
      timers.push(setTimeout(() => {
        setIndex(i)
        setVisible(true)
        timers.push(setTimeout(() => {
          setVisible(false)
          if (!caught.current) setEscaped(true)
          i += 1
          timers.push(setTimeout(next, 250))
        }, t.life))
      }, t.wait + (i === 0 ? 600 : 0)))
    }
    next()
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets])

  const hit = () => {
    if (!visible || caught.current) return
    caught.current = true
    hitsRef.current += 1
    setHits(hitsRef.current)
    setEscaped(false)
    setVisible(false)
  }

  const target = targets[index]
  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-muted">Tocá cada noticia antes de que se escape. Necesitás {REFLEX_NEEDED} de {REFLEX_TARGETS}.</p>
      <div className="relative h-64 overflow-hidden rounded-2xl border border-line-strong bg-surface" aria-label="Zona de reflejos">
        {visible && target && (
          <button
            type="button"
            onPointerDown={hit}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit() } }}
            aria-label="Noticia"
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            className="absolute grid size-16 -translate-x-1/2 -translate-y-1/2 animate-pulse place-items-center rounded-full border-2 border-gold bg-gold/30 text-gold active:scale-90"
          >
            <Newspaper className="size-8" aria-hidden="true" />
          </button>
        )}
        {!visible && index < 0 && <p className="absolute inset-0 grid place-items-center text-sm text-fg-subtle">Atento...</p>}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex gap-1.5" aria-hidden="true">
          {targets.map((_, i) => <span key={i} className={cn('size-2.5 rounded-full', i < index || (i === index && !visible) ? 'bg-accent' : 'bg-surface-3')} />)}
        </span>
        <span className="num font-mono font-bold text-fg" role="status">{hits} / {REFLEX_TARGETS}{escaped ? ' · se escapó' : ''}</span>
      </div>
    </div>
  )
}

/**
 * Desafío de billetes: hay que arrastrar los billetes sueltos hasta la caja antes de que se acabe el tiempo.
 * Con cinco de seis se gana.
 */
export function BillsChallenge({ onDone }) {
  const areaRef = useRef(null)
  const boxRef = useRef(null)
  const bills = useMemo(() => buildBills(), [])
  const [pos, setPos] = useState(() => Object.fromEntries(bills.map(b => [b.id, { x: b.x, y: b.y }]))) // en % del área
  const [saved, setSaved] = useState(() => new Set())
  const [left, setLeft] = useState(BILLS_SECONDS)
  const drag = useRef(null)
  const finished = useRef(false)
  const savedRef = useRef(0)

  const finish = (won) => {
    if (finished.current) return
    finished.current = true
    setTimeout(() => onDone(won), 500)
  }

  useEffect(() => {
    const id = setInterval(() => {
      setLeft(l => {
        if (l <= 1) { clearInterval(id); finish(billsWon(savedRef.current)); return 0 }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const move = (e) => {
    if (drag.current === null || finished.current) return
    const rect = areaRef.current.getBoundingClientRect()
    const x = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(4, Math.min(96, ((e.clientY - rect.top) / rect.height) * 100))
    setPos(p => ({ ...p, [drag.current]: { x, y } }))
  }

  const drop = (e, id) => {
    if (drag.current !== id) return
    drag.current = null
    const box = boxRef.current.getBoundingClientRect()
    if (e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom) {
      savedRef.current += 1
      setSaved(prev => new Set(prev).add(id))
      if (billsWon(savedRef.current)) finish(true)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-muted">Arrastrá los billetes a la caja antes de que se acabe el tiempo. Necesitás {BILLS_NEEDED} de {BILLS_COUNT}.</p>
      <div ref={areaRef} onPointerMove={move} className="relative h-72 touch-none overflow-hidden rounded-2xl border border-line-strong bg-surface" aria-label="Zona de billetes">
        {bills.map(b => !saved.has(b.id) && (
          <button
            key={b.id}
            type="button"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); drag.current = b.id; move(e) }}
            onPointerUp={(e) => drop(e, b.id)}
            onPointerCancel={() => { drag.current = null }}
            aria-label={`Billete ${b.id + 1}`}
            style={{ left: `${pos[b.id].x}%`, top: `${pos[b.id].y}%` }}
            className="absolute grid h-10 w-16 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none place-items-center rounded-md border-2 border-accent bg-accent/25 text-accent shadow-raised active:cursor-grabbing"
          >
            <Banknote className="size-6" aria-hidden="true" />
          </button>
        ))}
        <div ref={boxRef} className="absolute inset-x-6 bottom-3 grid h-16 place-items-center rounded-xl border-2 border-dashed border-gold/70 bg-gold-soft text-gold" aria-label="Caja del club">
          <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"><Wallet className="size-5" aria-hidden="true" />Caja del club</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-fg-subtle"><Timer className={cn('size-4', left <= 3 && 'text-danger')} aria-hidden="true" />{left} s</span>
        <span className="num font-mono font-bold text-fg" role="status">{saved.size} / {BILLS_COUNT} en la caja</span>
      </div>
    </div>
  )
}
