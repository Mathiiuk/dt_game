import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Flame, Gem, Shield, Star, Target, ThumbsDown, ThumbsUp, Trophy, Zap } from 'lucide-react'
import { TAP_GOAL, TAP_SECONDS, buildSequence, optionAtPosition, pickRumors, rumorWon } from '../../domain/storyStage'
import { cn } from '../../lib/utils'

const SYMBOLS = [Star, Flame, Shield, Gem, Target, Trophy]

/**
 * Desafío de memoria: se encienden unos símbolos de a uno y hay que repetirlos en el mismo orden.
 * Un error y se termina. `onDone(true|false)`.
 */
export function SequenceChallenge({ onDone }) {
  const seq = useMemo(() => buildSequence(Math.random, 4, SYMBOLS.length), [])
  const [lit, setLit] = useState(-1) // símbolo encendido durante la muestra
  const [showing, setShowing] = useState(true)
  const [typed, setTyped] = useState([])
  const [wrong, setWrong] = useState(false)

  // Muestra: cada símbolo se enciende unos instantes
  useEffect(() => {
    let i = 0
    let timers = []
    const step = () => {
      if (i >= seq.length) { setLit(-1); setShowing(false); return }
      setLit(seq[i])
      timers.push(setTimeout(() => setLit(-1), 520))
      i += 1
      timers.push(setTimeout(step, 780))
    }
    timers.push(setTimeout(step, 600))
    return () => timers.forEach(clearTimeout)
  }, [seq])

  const press = (n) => {
    if (showing || wrong) return
    const next = [...typed, n]
    if (n !== seq[typed.length]) { setWrong(true); setTimeout(() => onDone(false), 800); return }
    setTyped(next)
    if (next.length === seq.length) setTimeout(() => onDone(true), 500)
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-fg-muted">{showing ? 'Mirá bien el orden en que se prenden.' : wrong ? 'Ese no era. Se te mezcló el orden.' : `Ahora repetilos en el mismo orden (${typed.length} de ${seq.length}).`}</p>
      <ul className="grid grid-cols-3 gap-3" aria-label="Símbolos">
        {SYMBOLS.map((Icon, n) => (
          <li key={n}>
            <button
              type="button"
              disabled={showing || wrong}
              onClick={() => press(n)}
              aria-label={`Símbolo ${n + 1}`}
              className={cn(
                'grid aspect-square w-full place-items-center rounded-2xl border-2 transition-all',
                lit === n ? 'scale-105 border-gold bg-gold/30 text-gold' : 'border-line-strong bg-surface text-fg-muted active:scale-95',
                wrong && n === seq[typed.length] && 'border-danger',
                'disabled:cursor-default'
              )}
            >
              <Icon className="size-8" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <p className="flex justify-center gap-1.5" aria-hidden="true">
        {seq.map((_, i) => <span key={i} className={cn('size-2.5 rounded-full', i < typed.length ? 'bg-accent' : 'bg-surface-3')} />)}
      </p>
    </div>
  )
}

/** Desafío de insistencia: tocar muchas veces antes de que se acabe el tiempo. */
export function TapsChallenge({ onDone }) {
  const [count, setCount] = useState(0)
  const [left, setLeft] = useState(TAP_SECONDS * 10) // décimas de segundo
  const [started, setStarted] = useState(false)
  const done = useRef(false)

  const countRef = useRef(0)
  // El reloj corre con un intervalo propio: los toques rápidos no lo reinician
  useEffect(() => {
    if (!started) return undefined
    const id = setInterval(() => {
      setLeft(l => {
        if (l <= 1) {
          clearInterval(id)
          if (!done.current) { done.current = true; setTimeout(() => onDone(countRef.current >= TAP_GOAL), 0) }
          return 0
        }
        return l - 1
      })
    }, 100)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  const tap = () => {
    if (done.current) return
    if (!started) setStarted(true)
    countRef.current += 1
    setCount(countRef.current)
    if (countRef.current >= TAP_GOAL) { done.current = true; setTimeout(() => onDone(true), 350) }
  }

  return (
    <div className="space-y-5 text-center">
      <p className="text-sm text-fg-muted">{started ? 'Dale, dale, dale.' : `Tocá el botón ${TAP_GOAL} veces en ${TAP_SECONDS} segundos para convencerlo.`}</p>
      <div className="h-3 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuemin={0} aria-valuemax={TAP_GOAL} aria-valuenow={Math.min(count, TAP_GOAL)} aria-label="Convencimiento">
        <div className="h-full bg-accent transition-all duration-100" style={{ width: `${Math.min(100, (count / TAP_GOAL) * 100)}%` }} />
      </div>
      <button
        type="button"
        onPointerDown={tap}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); tap() } }}
        className="mx-auto grid size-40 touch-manipulation select-none place-items-center rounded-full border-4 border-accent bg-accent-soft text-accent transition-transform active:scale-90"
        aria-label="Insistir"
      >
        <Zap className="size-16" aria-hidden="true" />
      </button>
      <p className="num font-mono text-sm text-fg-subtle">{count} / {TAP_GOAL}{started && ` · ${(Math.max(0, left) / 10).toFixed(1)} s`}</p>
    </div>
  )
}

/** Desafío de verdadero o falso con reglas de fútbol: con dos aciertos de tres se gana. */
export function RumorChallenge({ onDone }) {
  const rumors = useMemo(() => pickRumors(), [])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [flash, setFlash] = useState(null) // true/false: acertó o no la última

  const answer = (value) => {
    if (flash !== null) return
    const next = [...answers, value]
    setAnswers(next)
    setFlash(value === rumors[index].ok)
    setTimeout(() => {
      setFlash(null)
      if (index + 1 >= rumors.length) onDone(rumorWon(next, rumors))
      else setIndex(i => i + 1)
    }, 800)
  }

  return (
    <div className="space-y-5">
      <p className="text-xs font-bold uppercase tracking-widest text-fg-subtle">Verdadero o falso · {index + 1} de {rumors.length}</p>
      <p key={index} className="animate-rise-in text-xl font-medium leading-relaxed text-fg">{rumors[index].text}</p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => answer(true)} disabled={flash !== null} className={cn('flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 text-base font-bold transition-all active:scale-95', flash !== null && rumors[index].ok ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong bg-surface text-fg')}>
          <ThumbsUp className="size-5" aria-hidden="true" />Verdadero
        </button>
        <button type="button" onClick={() => answer(false)} disabled={flash !== null} className={cn('flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 text-base font-bold transition-all active:scale-95', flash !== null && !rumors[index].ok ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong bg-surface text-fg')}>
          <ThumbsDown className="size-5" aria-hidden="true" />Falso
        </button>
      </div>
      <p className="h-5 text-center text-sm font-semibold" role="status">{flash === true ? 'Bien, sabés de fútbol.' : flash === false ? 'Uh, ese no era.' : ''}</p>
    </div>
  )
}

/**
 * Elegir con puntería: una barra recorre las opciones (una zona por opción) y se la frena sobre la que se quiere.
 * Si cae en una opción que no se puede elegir, la barra sigue y se prueba de nuevo.
 */
export function TargetPick({ options, enabled, busy, onPick }) {
  const trackRef = useRef(null)
  const markerRef = useRef(null)
  const [landed, setLanded] = useState(null)
  const [bounced, setBounced] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const stop = () => {
    if (landed !== null || busy) return
    const track = trackRef.current?.getBoundingClientRect()
    const marker = markerRef.current?.getBoundingClientRect()
    const pos = track && marker && track.width > 0 ? (marker.left + marker.width / 2 - track.left) / track.width : 0.5
    const index = optionAtPosition(pos, options.length)
    if (!enabled[index]) { setBounced(true); timer.current = setTimeout(() => setBounced(false), 1100); return }
    setLanded(index)
    timer.current = setTimeout(() => onPick(options[index]), 650)
  }

  return (
    <div className="space-y-2">
      <div ref={trackRef} className="relative flex h-12 overflow-hidden rounded-xl border border-line-strong bg-surface" aria-hidden="true">
        {options.map((opt, i) => (
          <div key={opt.id} className={cn('grid flex-1 place-items-center border-l border-line/60 font-display text-lg font-semibold first:border-l-0', enabled[i] ? 'text-fg-muted' : 'bg-surface-3/60 text-fg-subtle line-through', landed === i && 'bg-accent/30 text-accent')}>
            {['A', 'B', 'C', 'D', 'E'][i] || i + 1}
          </div>
        ))}
        <div ref={markerRef} className={cn('penalty-marker sweep-slow absolute inset-y-0 w-1.5 -translate-x-1/2 rounded-full bg-gold', landed !== null && 'penalty-marker-paused')} />
      </div>
      <button
        type="button"
        onClick={stop}
        disabled={landed !== null || busy}
        className="min-h-12 w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-strong disabled:opacity-60"
      >
        {landed !== null ? 'Elegiste' : 'Frenar la barra'}
      </button>
      <p className="h-4 text-center text-xs text-warning" role="status">{bounced ? 'Esa opción no se puede elegir ahora: probá de nuevo.' : ''}</p>
    </div>
  )
}
