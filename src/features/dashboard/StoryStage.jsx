import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronRight, Coins, Hourglass, MessageSquareQuote, Newspaper, Shirt, Sparkles, Users, Wallet, X } from 'lucide-react'
import { splitBeats, effectChips } from '../../domain/storyFlavor'
import { parseArcCode } from '../../domain/arcs'
import { arcById } from '../../domain/arcCatalog'
import { EVENT_KIND_LABEL, HOLD_MS, TIMER_SECONDS, canChoose, challengeFor, isArcEvent, randomOption, safestOption, stageModeFor } from '../../domain/storyStage'
import { RumorChallenge, SequenceChallenge, TapsChallenge, TargetPick } from './StoryMinigames'
import { BillsChallenge, ReflexChallenge } from './StoryActionGames'
import { BalanceChallenge, CalmChallenge, ChantChallenge, HeadlineChallenge } from './StoryCategoryGames'
import { formatMoney } from '../../lib/format'
import { feel } from '../../lib/feedback'
import { cn } from '../../lib/utils'
import { Badge, Button } from '../../components/ui'

const CATEGORY_ICON = { COMMUNITY: Users, LOCKER_ROOM: Shirt, BOARD_PRESS: Newspaper, FINANCIAL_CRISIS: Wallet }
const LETTERS = ['A', 'B', 'C', 'D', 'E']
const CHALLENGE_INFO = {
  SEQUENCE: { title: 'Desafío de memoria', text: 'Repetí el orden en que se prenden los símbolos.', Game: SequenceChallenge },
  TAPS: { title: 'Desafío de insistencia', text: 'Convencelo tocando el botón lo más rápido que puedas.', Game: TapsChallenge },
  RUMOR: { title: 'Verdadero o falso', text: 'Contestá bien dos de tres preguntas de fútbol.', Game: RumorChallenge },
  REFLEX: { title: 'Desafío de reflejos', text: 'Atrapá las noticias antes de que se escapen.', Game: ReflexChallenge },
  BILLS: { title: 'Desafío de billetes', text: 'Juntá los billetes sueltos en la caja del club.', Game: BillsChallenge },
  // Los propios de cada tipo de evento
  CHANT: { title: 'El cántico de la tribuna', text: 'Seguí el ritmo: tocá cuando el aro llega al círculo.', Game: ChantChallenge },
  CALM: { title: 'Calmar al vestuario', text: 'Mantené la tensión en la zona verde tocando para bajarla.', Game: CalmChallenge },
  HEADLINE: { title: 'Armá el titular', text: 'Tocá las palabras en el orden en que se lee el titular.', Game: HeadlineChallenge },
  BALANCE: { title: 'Cuadrar la caja', text: 'Elegí los gastos que suman justo lo que falta cubrir.', Game: BalanceChallenge }
}

const chapterOf = (title) => {
  const m = String(title || '').match(/\((\d+)\s*\/\s*(\d+)\)\s*$/)
  return m ? { current: Number(m[1]), total: Number(m[2]), clean: String(title).replace(m[0], '').trim() } : null
}

/** Botón de confirmación que se llena mientras se lo mantiene apretado */
function HoldButton({ label, onComplete, disabled }) {
  const [progress, setProgress] = useState(0)
  const raf = useRef(0)
  const start = useRef(0)

  const stop = () => { cancelAnimationFrame(raf.current); setProgress(0) }
  const begin = () => {
    if (disabled) return
    start.current = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - start.current) / HOLD_MS)
      setProgress(p)
      if (p >= 1) { onComplete(); return }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); onComplete() } }}
      className="relative min-h-14 w-full touch-none select-none overflow-hidden rounded-xl bg-surface-3 px-4 py-3 text-sm font-bold uppercase tracking-wider text-fg transition-opacity disabled:opacity-40"
    >
      <span className="absolute inset-y-0 left-0 bg-accent/80" style={{ width: `${progress * 100}%` }} aria-hidden="true" />
      <span className="relative">{label}</span>
    </button>
  )
}

/** Moneda que gira y cae en una opción al azar */
function CoinFlip({ onResult, options, ctx, disabled }) {
  const [flipping, setFlipping] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const flip = () => {
    if (flipping || disabled) return
    setFlipping(true)
    timer.current = setTimeout(() => onResult(randomOption(options, ctx)), 1300)
  }
  return (
    <button
      type="button"
      onClick={flip}
      disabled={disabled || flipping}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gold/60 bg-gold-soft px-4 py-3 text-sm font-bold text-gold transition-colors hover:bg-gold/20 disabled:opacity-60"
    >
      <Coins className={cn('size-5', flipping && 'animate-spin')} aria-hidden="true" />
      {flipping ? 'La moneda está en el aire...' : 'Dejarlo a la suerte'}
    </button>
  )
}

/** Cuenta regresiva de la decisión: al llegar a cero decide el narrador */
function DecisionTimer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds)
  const expire = useRef(onExpire)
  expire.current = onExpire
  useEffect(() => {
    if (left <= 0) { expire.current(); return undefined }
    const id = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(id)
  }, [left])
  return (
    <div role="timer" aria-label={`Quedan ${left} segundos`} className="flex items-center gap-2 text-xs">
      <Hourglass className={cn('size-4', left <= 4 ? 'text-danger' : 'text-gold')} aria-hidden="true" />
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div className={cn('h-full transition-all duration-1000 ease-linear', left <= 4 ? 'bg-danger' : 'bg-gold')} style={{ width: `${(left / seconds) * 100}%` }} />
      </div>
      <span className="num w-6 text-right font-mono font-bold text-fg">{left}</span>
    </div>
  )
}

/**
 * Historia o decisión a pantalla completa (sirve tanto para los capítulos de las historias como para los eventos sueltos del club).
 * Tres momentos: leer el capítulo (de a poco, tocando), decidir (con una mecánica distinta
 * según el capítulo: mantener apretado, moneda o reloj) y ver cómo quedó la cosa. Las opciones y sus efectos son las reales del evento.
 */
export default function StoryStage({ event, budget, boardConfidence, result, busy, onChoose, onLater, onClose }) {
  const arc = arcById(parseArcCode(event.template_code)?.arcId)
  const chapter = chapterOf(event.title)
  // Las historias se leen de a momentos; los eventos sueltos, de un solo toque (son cortos y no hace falta tanto tap)
  const beats = useMemo(() => (isArcEvent(event) ? splitBeats(event.description) : [{ type: 'tell', text: event.description }]), [event.description, event.template_code]) // eslint-disable-line react-hooks/exhaustive-deps
  const options = Array.isArray(event.options) ? event.options : []
  const mode = stageModeFor(event)
  const ctx = { budget, boardConfidence }
  const CategoryIcon = CATEGORY_ICON[event.category] || BookOpen

  const [beat, setBeat] = useState(0)
  const [selected, setSelected] = useState(null)
  const [timedOut, setTimedOut] = useState(false)
  // Desafío de pista: null = todavía no se jugó; 'playing' = en juego; 'won' | 'lost' | 'skipped' = terminado
  const challengeKind = useMemo(() => challengeFor(event), [event])
  const [clue, setClue] = useState(challengeKind ? null : 'skipped')
  const peek = clue === 'won'
  const reading = beat < beats.length && !result
  const inChallenge = !reading && !result && clue !== 'won' && clue !== 'lost' && clue !== 'skipped'
  const current = beats[Math.min(beat, beats.length - 1)]

  // Esc: dejarlo para más tarde (la historia queda pendiente en el inicio)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !result) onLater() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, onLater])

  const choose = (opt) => { if (opt && !busy) { feel('pick'); onChoose(opt) } }

  return (
    <div role="dialog" aria-modal="true" aria-label={chapter?.clean || event.title} className="fixed inset-0 z-[70] flex h-dvh flex-col bg-bg [background-image:radial-gradient(ellipse_at_top,oklch(30%_0.05_150/0.55),transparent_60%)]">
      {/* Encabezado: de qué historia es y en qué capítulo vamos */}
      <header className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold"><CategoryIcon className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-widest text-gold">
            <span className="min-w-0 break-words">{arc?.title || EVENT_KIND_LABEL[event.category] || 'Decisión del DT'}</span>
            {event.severity === 'CRITICAL' && <Badge tone="danger" dot className="shrink-0">Urgente</Badge>}
          </p>
          {chapter && (
            <div className="mt-1 flex items-center gap-1" aria-label={`Capítulo ${chapter.current} de ${chapter.total}`}>
              {Array.from({ length: chapter.total }, (_, i) => (
                <span key={i} className={cn('h-1.5 w-7 rounded-full', i < chapter.current ? 'bg-gold' : 'bg-surface-3', i === chapter.current - 1 && 'animate-pulse')} />
              ))}
            </div>
          )}
        </div>
        {!result && (
          <button type="button" onClick={onLater} aria-label="Dejar para más tarde" className="grid size-10 shrink-0 place-items-center rounded-xl text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg">
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {result ? (
          /* ---------- Así quedó la cosa ---------- */
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 animate-rise-in">
            <div className="flex items-center gap-2 text-accent"><Sparkles className="size-6" aria-hidden="true" /><p className="text-xs font-bold uppercase tracking-widest">Así quedó la cosa</p></div>
            {result.choice && <p className="text-sm text-fg-subtle">Elegiste: <span className="font-semibold text-fg">{result.choice}</span></p>}
            <h2 className="font-display text-2xl font-semibold leading-snug text-fg sm:text-3xl">{result.note}</h2>
            <p className="text-base italic leading-relaxed text-fg-muted">{result.reaction}</p>
            {effectChips(result.effects).length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Lo que cambió">
                {effectChips(result.effects).map(c => (
                  <li key={c.key}><Badge tone={c.value > 0 ? 'accent' : 'danger'} className="num px-3 py-1 text-sm">{c.label} {c.value > 0 ? '+' : ''}{c.value}</Badge></li>
                ))}
              </ul>
            )}
            <Button size="lg" className="mt-2 w-full" onClick={onClose}>Seguir<ChevronRight /></Button>
          </div>
        ) : reading ? (
          /* ---------- Leer: un momento por vez, tocando en cualquier lado ---------- */
          <button type="button" onClick={() => setBeat(b => b + 1)} className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto text-left" aria-label="Seguir leyendo">
            <div key={beat} className="my-auto animate-rise-in space-y-4">
              {chapter && <p className="font-display text-xl font-semibold text-gold">{chapter.clean}</p>}
              {current.type === 'say' ? (
                <p className="rounded-2xl rounded-tl-none border-l-4 border-gold bg-gold-soft px-4 py-4 text-xl italic leading-relaxed text-fg sm:text-2xl">
                  <MessageSquareQuote className="mb-2 size-5 text-gold" aria-hidden="true" />“{current.text}”
                </p>
              ) : (
                <p className="text-xl leading-relaxed text-fg sm:text-2xl">{current.text}</p>
              )}
            </div>
            <span className="flex items-center justify-between text-xs text-fg-subtle">
              <span className="flex items-center gap-1.5" aria-hidden="true">
                {beats.map((_, i) => <span key={i} className={cn('h-1.5 rounded-full transition-all', i === beat ? 'w-6 bg-gold' : i < beat ? 'w-1.5 bg-gold/60' : 'w-1.5 bg-surface-3')} />)}
              </span>
              <span className="flex items-center gap-1 font-semibold text-fg-muted">Tocá para seguir<ChevronRight className="size-4" aria-hidden="true" /></span>
            </span>
          </button>
        ) : inChallenge ? (
          /* ---------- Desafío de pista ---------- */
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-5 animate-rise-in">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-gold">Pista para decidir</p>
              <h2 className="font-display text-2xl font-semibold text-fg">{CHALLENGE_INFO[challengeKind].title}</h2>
              <p className="text-sm text-fg-muted">{CHALLENGE_INFO[challengeKind].text} Si lo lográs, te muestro lo que cambia cada opción. Si no, decidís a ciegas.</p>
            </div>
            {clue === 'playing' ? (
              (() => { const Game = CHALLENGE_INFO[challengeKind].Game; return <Game onDone={(won) => { feel(won ? 'win' : 'lose'); setClue(won ? 'won' : 'lost') }} /> })()
            ) : (
              <div className="space-y-2">
                <Button size="lg" className="w-full" onClick={() => setClue('playing')}>Jugar el desafío</Button>
                <button type="button" onClick={() => setClue('skipped')} className="w-full py-2 text-xs font-semibold text-fg-subtle underline-offset-2 hover:text-fg hover:underline">Paso, decido a ciegas</button>
              </div>
            )}
          </div>
        ) : (
          /* ---------- Decidir ---------- */
          <div className="flex min-h-0 flex-1 flex-col gap-3 animate-rise-in">
            <div className="shrink-0 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-fg-subtle">¿Qué hacés?</p>
              {mode === 'TIMER' && !timedOut && <DecisionTimer seconds={TIMER_SECONDS} onExpire={() => { setTimedOut(true); choose(safestOption(options, ctx)) }} />}
              {peek && <p className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-xs font-semibold text-accent"><Sparkles className="size-4" aria-hidden="true" />Pista ganada: ves lo que cambia cada opción.</p>}
              {clue === 'lost' && <p className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-fg-muted">No salió la pista. Decidís a ciegas.</p>}
              {timedOut && <p className="rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-xs font-semibold text-warning">Se te acabó el tiempo: decidió el narrador.</p>}
            </div>

            <ul className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto [&>li:first-child]:mt-auto [&>li:last-child]:mb-auto">
              {options.map((opt, i) => {
                const ok = canChoose(opt, ctx)
                const cost = Number(opt.cost || 0)
                const active = selected?.id === opt.id
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      disabled={!ok || busy || mode === 'TARGET'}
                      onClick={() => (mode === 'HOLD' ? setSelected(opt) : choose(opt))}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all active:scale-[0.99] disabled:opacity-45',
                        active ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface hover:border-accent hover:bg-surface-2',
                        mode === 'TARGET' && ok && 'disabled:opacity-100'
                      )}
                    >
                      <span className={cn('grid size-8 shrink-0 place-items-center rounded-full font-display text-base font-semibold', active ? 'bg-accent text-accent-fg' : 'bg-surface-3 text-fg-muted')} aria-hidden="true">{LETTERS[i] || i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-base font-semibold text-fg">{opt.label}</span>
                        {opt.description && <span className="mt-0.5 block break-words text-sm leading-relaxed text-fg-muted">{opt.description}</span>}
                        {peek && effectChips(opt.effects).length > 0 && (
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            {effectChips(opt.effects).map(c => <Badge key={c.key} tone={c.value > 0 ? 'accent' : 'danger'} className="num">{c.label} {c.value > 0 ? '+' : ''}{c.value}</Badge>)}
                          </span>
                        )}
                        {(cost > 0 || !ok) && (
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            {cost > 0 && <Badge tone={budget >= cost ? 'warning' : 'danger'} className="num">-{formatMoney(cost)}</Badge>}
                            {!ok && cost === 0 && <Badge tone="danger">Sin respaldo de la dirigencia</Badge>}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="shrink-0 space-y-2">
              {mode === 'HOLD' && (
                <HoldButton
                  label={selected ? 'Mantené apretado para decidir' : 'Elegí una opción'}
                  disabled={!selected || busy}
                  onComplete={() => choose(selected)}
                />
              )}
              {mode === 'TARGET' && <TargetPick options={options} enabled={options.map(o => canChoose(o, ctx))} busy={busy} onPick={choose} />}
              {mode === 'COIN' && <CoinFlip options={options} ctx={ctx} disabled={busy} onResult={choose} />}
              <button type="button" onClick={onLater} className="w-full py-2 text-xs font-semibold text-fg-subtle underline-offset-2 hover:text-fg hover:underline">Decidir más tarde</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
