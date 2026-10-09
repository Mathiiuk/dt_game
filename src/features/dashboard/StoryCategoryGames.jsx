import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Music2, ShieldCheck, Newspaper, Wallet } from 'lucide-react'
import {
  CALM_BAND, CALM_NEEDED, CALM_SECONDS, CALM_START, CALM_TICK_MS, CHANT_NEEDED, CHANT_WINDOW_MS, BALANCE_TRIES, HEADLINE_MISTAKES,
  balanceSum, balanceWon, buildBalance, buildChant, buildHeadline, calmTick, calmWon, chantHit, chantWon, headlineNext
} from '../../domain/storyStage'
import { formatMoney } from '../../lib/format'
import { feel } from '../../lib/feedback'
import { cn } from '../../lib/utils'

// Los minijuegos propios de cada tipo de evento. Todos reciben `onDone(ganó)` y se toman un instante para mostrar cómo salió.
const END_DELAY_MS = 700
const APPROACH_MS = 650 // cuánto antes de cada golpe empieza a cerrarse el aro

/** Termina el juego un momento después, y si se desmonta antes no avisa */
function useFinish(onDone) {
  const timer = useRef(null)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => () => clearTimeout(timer.current), [])
  return (won) => { clearTimeout(timer.current); timer.current = setTimeout(() => done.current(won), END_DELAY_MS) }
}

/**
 * EL CÁNTICO (comunidad y barrio): la tribuna canta a ritmo; un aro se cierra sobre el círculo y hay que tocar justo cuando llega.
 * Con tres de cuatro golpes se gana.
 */
export function ChantChallenge({ onDone }) {
  const beats = useMemo(() => buildChant(), [])
  const finish = useFinish(onDone)
  const startedAt = useRef(Date.now())
  const taken = useRef(new Set())
  const hitsRef = useRef(0)
  const [approaching, setApproaching] = useState(-1) // golpe cuyo aro se está cerrando
  const [hits, setHits] = useState(0)
  const [flash, setFlash] = useState(null) // 'hit' | 'miss'

  useEffect(() => {
    const timers = []
    startedAt.current = Date.now()
    beats.forEach((beat, i) => {
      timers.push(setTimeout(() => setApproaching(i), Math.max(0, beat.at - APPROACH_MS)))
    })
    const last = beats[beats.length - 1].at
    timers.push(setTimeout(() => { setApproaching(-1); finish(chantWon(hitsRef.current)) }, last + CHANT_WINDOW_MS + 300))
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beats])

  const tap = () => {
    const now = Date.now() - startedAt.current
    const index = beats.findIndex((b, i) => !taken.current.has(i) && chantHit(now, b.at))
    if (index === -1) { setFlash('miss'); feel('bad'); return }
    taken.current.add(index)
    hitsRef.current += 1
    setHits(hitsRef.current)
    setFlash('hit')
    feel('good')
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-muted">Tocá el círculo justo cuando el aro lo alcanza. Necesitás {CHANT_NEEDED} de {beats.length}.</p>
      <div className="relative grid h-64 place-items-center overflow-hidden rounded-2xl border border-line-strong bg-surface" aria-label="Zona del cántico">
        <span key={approaching} aria-hidden="true" className={cn('absolute size-24 rounded-full border-4 border-gold', approaching >= 0 ? 'animate-chant-ring' : 'opacity-0')} style={{ animationDuration: `${APPROACH_MS}ms` }} />
        <button
          type="button"
          onPointerDown={tap}
          aria-label="Seguir el cántico"
          className={cn('relative grid size-24 place-items-center rounded-full border-2 transition-colors', flash === 'hit' ? 'border-accent bg-accent-soft text-accent' : flash === 'miss' ? 'border-danger bg-danger-soft text-danger' : 'border-line-strong bg-surface-2 text-fg')}
        >
          <Music2 className="size-9" aria-hidden="true" />
        </button>
      </div>
      <p className="text-center text-xs font-semibold text-fg-muted" role="status">Aciertos: <span className="num text-fg">{hits}</span> de {beats.length}</p>
    </div>
  )
}

/**
 * CALMAR AL VESTUARIO (vestuario): la tensión sube sola; hay que tocar para bajarla y mantenerla en la franja verde
 * (ni demasiado caliente, ni dormido) durante lo suficiente.
 */
export function CalmChallenge({ onDone }) {
  const finish = useFinish(onDone)
  const [state, setState] = useState({ tension: CALM_START, seconds: 0 })
  const [left, setLeft] = useState(CALM_SECONDS)
  const stateRef = useRef(state)
  const tapped = useRef(false)
  const ticks = useRef(0)
  const ended = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      if (ended.current) return
      ticks.current += 1
      const next = calmTick(stateRef.current, tapped.current)
      tapped.current = false
      stateRef.current = next
      setState(next)
      setLeft(Math.max(0, CALM_SECONDS - (ticks.current * CALM_TICK_MS) / 1000))
      if (ticks.current * CALM_TICK_MS >= CALM_SECONDS * 1000) {
        ended.current = true
        clearInterval(id)
        finish(calmWon(next.seconds))
      }
    }, CALM_TICK_MS)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const inBand = state.tension >= CALM_BAND[0] && state.tension <= CALM_BAND[1]
  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-muted">La tensión sube sola: tocá para bajarla y mantenela en lo verde. Necesitás {CALM_NEEDED} de los {CALM_SECONDS} segundos.</p>
      <div className="relative mx-auto h-56 w-full max-w-[16rem] overflow-hidden rounded-2xl border border-line-strong bg-surface" role="meter" aria-label="Tensión del vestuario" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.tension)}>
        <div className={cn('absolute inset-x-0 bottom-0 transition-all duration-200', inBand ? 'bg-accent/70' : 'bg-danger/70')} style={{ height: `${state.tension}%` }} aria-hidden="true" />
        {/* La franja verde va por encima del relleno, con bordes, para que se vea siempre dónde hay que mantenerla */}
        <div className="pointer-events-none absolute inset-x-0 border-y-2 border-dashed border-accent bg-accent/15" style={{ bottom: `${CALM_BAND[0]}%`, height: `${CALM_BAND[1] - CALM_BAND[0]}%` }} aria-hidden="true">
          <span className="absolute right-2 top-1 text-[10px] font-bold uppercase tracking-widest text-accent">Zona verde</span>
        </div>
      </div>
      <button
        type="button"
        onPointerDown={() => { tapped.current = true; feel('tap') }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapped.current = true } }}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-accent/60 bg-accent-soft px-4 py-3 text-sm font-bold uppercase tracking-wider text-accent transition-transform active:scale-[0.98]"
      >
        <ShieldCheck className="size-5" aria-hidden="true" />Calmar
      </button>
      <p className="flex justify-between text-xs font-semibold text-fg-muted" role="status">
        <span>En lo verde: <span className="num text-fg">{state.seconds.toFixed(1)}</span> s</span>
        <span>Quedan <span className="num text-fg">{Math.ceil(left)}</span> s</span>
      </p>
    </div>
  )
}

/** ARMÁ EL TITULAR (dirigencia y prensa): las palabras vienen mezcladas y hay que tocarlas en el orden del titular. Dos errores y se pierde. */
export function HeadlineChallenge({ onDone }) {
  const { answer, words } = useMemo(() => buildHeadline(), [])
  const finish = useFinish(onDone)
  const [placed, setPlaced] = useState([]) // ids ya puestos, en orden
  const [mistakes, setMistakes] = useState(0)
  const [finished, setFinished] = useState(false)

  const pick = (word) => {
    if (finished || placed.includes(word.id)) return
    if (headlineNext(placed, word) === 'OK') {
      const next = [...placed, word.id]
      setPlaced(next)
      feel('good')
      if (next.length === answer.length) { setFinished(true); finish(true) }
      return
    }
    const m = mistakes + 1
    setMistakes(m)
    feel('bad')
    if (m >= HEADLINE_MISTAKES) { setFinished(true); finish(false) }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-muted">Tocá las palabras en el orden en que se lee el titular. Podés equivocarte {HEADLINE_MISTAKES - 1} vez.</p>
      <div className="rounded-2xl border border-line-strong bg-surface p-4" aria-label="Titular" role="group">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gold"><Newspaper className="size-4" aria-hidden="true" />Titular</p>
        <p className="min-h-16 font-display text-2xl font-semibold leading-snug text-fg" aria-live="polite">
          {placed.length === 0 ? <span className="text-fg-subtle">…</span> : placed.map(id => answer[id]).join(' ')}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Palabras">
        {words.map(word => (
          <button
            key={word.id}
            type="button"
            disabled={placed.includes(word.id) || finished}
            onClick={() => pick(word)}
            className="min-h-11 rounded-xl border-2 border-line-strong bg-surface-2 px-4 py-2 text-sm font-bold uppercase tracking-wide text-fg transition-all active:scale-95 disabled:opacity-30"
          >{word.text}</button>
        ))}
      </div>
      <p className="text-center text-xs font-semibold text-fg-muted" role="status">Errores: <span className="num text-fg">{mistakes}</span> de {HEADLINE_MISTAKES}</p>
    </div>
  )
}

/** CUADRAR LA CAJA (crisis de plata): elegir los gastos que suman exactamente lo que falta cubrir. Dos intentos. */
export function BalanceChallenge({ onDone }) {
  const { items, target } = useMemo(() => buildBalance(), [])
  const finish = useFinish(onDone)
  const [selected, setSelected] = useState([])
  const [tries, setTries] = useState(0)
  const [message, setMessage] = useState('')
  const [finished, setFinished] = useState(false)
  const sum = balanceSum(selected, items)

  const toggle = (id) => { if (!finished) setSelected(sel => (sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id])) }
  const close = () => {
    if (finished) return
    if (balanceWon(selected, items, target)) { feel('win'); setFinished(true); setMessage('¡La caja cierra!'); finish(true); return }
    const used = tries + 1
    setTries(used)
    feel('bad')
    if (used >= BALANCE_TRIES) { setFinished(true); setMessage('No cierra y se acabaron los intentos.'); finish(false) }
    else { setMessage(sum > target ? `Te pasaste por ${formatMoney(sum - target)}. Te queda un intento.` : `Te faltan ${formatMoney(target - sum)}. Te queda un intento.`); setSelected([]) }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-muted">Elegí los gastos que suman exactamente lo que falta cubrir. Tenés {BALANCE_TRIES} intentos.</p>
      <div className="flex items-center justify-between rounded-2xl border border-gold/50 bg-gold-soft px-4 py-3">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold"><Wallet className="size-4" aria-hidden="true" />A cubrir</span>
        <span className="num font-display text-2xl font-semibold text-fg">{formatMoney(target)}</span>
      </div>
      <ul className="grid grid-cols-2 gap-2" aria-label="Gastos">
        {items.map(item => {
          const on = selected.includes(item.id)
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={on}
                disabled={finished}
                onClick={() => toggle(item.id)}
                className={cn('flex min-h-14 w-full flex-col items-start rounded-xl border-2 px-3 py-2 text-left transition-all active:scale-[0.98] disabled:opacity-60', on ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface-2')}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">{item.label}</span>
                <span className="num font-display text-lg font-semibold text-fg">{formatMoney(item.amount)}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="flex items-center justify-between text-sm" role="status">
        <span className="text-fg-muted">Sumás <span className="num font-semibold text-fg">{formatMoney(sum)}</span></span>
        <span className="text-xs font-semibold text-fg-subtle">Intento {Math.min(tries + 1, BALANCE_TRIES)} de {BALANCE_TRIES}</span>
      </div>
      {message && <p className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-fg-muted" aria-live="polite">{message}</p>}
      <button type="button" onClick={close} disabled={finished || selected.length === 0} className="min-h-12 w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold uppercase tracking-wider text-accent-fg disabled:opacity-40">Cerrar caja</button>
    </div>
  )
}
