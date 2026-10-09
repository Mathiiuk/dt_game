import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Mic, Newspaper, PenLine, ThumbsDown, ThumbsUp, Timer, TimerOff, UserCheck, UserX, Volume2, VolumeX, Zap } from 'lucide-react'
import { AsyncButton } from '../../components/ui'
import { formatMoney } from '../../lib/format'
import { feel, setSoundEnabled, soundEnabled } from '../../lib/feedback'
import { toneLabel, PRESS_MAX_QUESTIONS } from '../../domain/press'
import { NamedIcon } from '../../components/ui/named-icon'
import { reporterOf, roomFace, nextRoomMood, TONE_ICON, lightningRound, lightningTotal, LIGHTNING_TIMEOUT } from '../../domain/pressScene'
import { BINGO_CLICHES, PRESS_SECONDS, headlineResult, headlineRound, phraseResult, phraseRound, roomReaction, timeoutOption } from '../../domain/pressRoom'

const TONE_COLORS = {
  PRAISING: 'border-accent/40 text-accent bg-accent-soft',
  COMBATIVE: 'border-danger/40 text-danger bg-danger-soft',
  SELF_CRITICAL: 'border-line-strong/40 text-fg-muted bg-surface-2',
  PRAGMATIC: 'border-line text-fg bg-surface/40'
}

const NO_TIMER_KEY = 'press_no_timer'
const readNoTimer = () => { try { return localStorage.getItem(NO_TIMER_KEY) === '1' } catch { return false } }
const phraseKey = (conferenceId) => `press_phrase_${conferenceId}`
const phraseDoneBefore = (conferenceId) => { try { return sessionStorage.getItem(phraseKey(conferenceId)) === '1' } catch { return false } }
const headlineKey = (conferenceId) => `press_headline_${conferenceId}`
const headlineDoneBefore = (conferenceId) => { try { return sessionStorage.getItem(headlineKey(conferenceId)) === '1' } catch { return false } }
const clicheText = Object.fromEntries(BINGO_CLICHES.map(c => [c.id, c.text]))

const signed = (n) => (n > 0 ? 'sube' : n < 0 ? 'baja' : 'sin cambios')

/** Cuenta regresiva de una pregunta: al llegar a cero responde sola con la opción más cauta */
function Countdown({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds)
  const expire = useRef(onExpire)
  expire.current = onExpire

  useEffect(() => {
    if (left <= 0) {
      expire.current()
      return undefined
    }
    const id = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(id)
  }, [left])

  return (
    <div role="timer" aria-label={`Quedan ${left} segundos`} className="flex items-center gap-2 text-xs">
      <Timer className={`size-3.5 ${left <= 4 ? 'text-danger' : 'text-accent'}`} aria-hidden="true" />
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div className={`h-full transition-all duration-1000 ease-linear ${left <= 4 ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${(left / seconds) * 100}%` }} />
      </div>
      <span className="num w-6 text-right font-mono font-bold text-fg">{left}</span>
    </div>
  )
}

/** Escribe el texto de a poco, como si el periodista lo dijera en vivo. Tocar el globo lo muestra completo. */
function useTypewriter(text, onDone) {
  const [count, setCount] = useState(0)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    setCount(0)
  }, [text])
  useEffect(() => {
    if (count >= text.length) { done.current?.(); return undefined }
    const id = setTimeout(() => setCount(c => Math.min(text.length, c + 2)), 22)
    return () => clearTimeout(id)
  }, [count, text])
  return [text.slice(0, count), count >= text.length, () => setCount(text.length)]
}

/** Humor de la sala: una barra que sube y baja con cada respuesta */
function RoomMeter({ mood, compact = false }) {
  const face = mood >= 66 ? 'Smile' : mood >= 40 ? 'Meh' : 'Angry'
  return (
    <div className="flex items-center gap-2 text-xs" role="meter" aria-label="Humor de la sala" aria-valuemin={0} aria-valuemax={100} aria-valuenow={mood}>
      <NamedIcon name={face} className={`size-5 ${mood >= 66 ? 'text-accent' : mood >= 40 ? 'text-warning' : 'text-danger'}`} />
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div className={`h-full transition-all duration-700 ${mood >= 66 ? 'bg-accent' : mood >= 40 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${mood}%` }} />
      </div>
      {!compact && <span className="text-fg-subtle">Humor de la sala</span>}
    </div>
  )
}

/** Ronda relámpago: tres preguntas de sí o no con poco tiempo; cada respuesta tiene su comentario y el total mueve la hinchada */
function LightningRound({ onFinish }) {
  const round = useMemo(() => lightningRound(), [])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [shown, setShown] = useState(null) // respuesta recién dada, a la vista un momento
  const current = round[index]
  const finished = index >= round.length

  const pick = (answer) => {
    if (shown) return
    setShown(answer)
    setAnswers(prev => [...prev, answer])
  }
  const advance = () => {
    const total = answers.length
    setShown(null)
    setIndex(i => i + 1)
    if (total >= round.length) onFinish(lightningTotal(answers))
  }

  if (finished) {
    const total = lightningTotal(answers)
    return (
      <p role="status" className="rounded-xl border border-line bg-bg p-3 text-xs text-fg">
        Ronda terminada. {total > 0 ? 'La sala se fue sonriendo.' : total < 0 ? 'Algunas respuestas cayeron mal.' : 'Quedó todo parejo.'} {total !== 0 && <strong>Hinchada {total > 0 ? `+${total}` : total}.</strong>}
      </p>
    )
  }

  return (
    <section aria-label="Ronda relámpago" className="space-y-3 rounded-xl border border-gold/40 bg-gold/5 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gold"><Zap className="size-3.5" aria-hidden="true" />Ronda relámpago</p>
        <span className="font-mono text-[11px] text-fg-subtle">{Math.min(index + 1, round.length)} de {round.length}</span>
      </div>
      {!shown && <Countdown key={index} seconds={7} onExpire={() => pick(LIGHTNING_TIMEOUT)} />}
      <p className="text-sm font-medium text-fg">{current.prompt}</p>
      {shown ? (
        <div className="space-y-3">
          <p role="status" className="rounded-lg border border-line bg-bg p-3 text-xs text-fg">{shown.line}</p>
          <button type="button" onClick={advance} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-xs font-semibold uppercase tracking-wider text-accent-fg hover:bg-accent-strong">
            {index + 1 >= round.length ? 'Terminar la ronda' : 'Otra más'} <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => pick(current.yes)} className="min-h-12 rounded-xl border border-line bg-bg/70 py-3 text-sm font-bold text-fg transition-all hover:border-accent/60 hover:bg-surface active:scale-95" ><ThumbsUp className="mr-1.5 inline size-4" aria-hidden="true" />Sí</button>
          <button type="button" onClick={() => pick(current.no)} className="min-h-12 rounded-xl border border-line bg-bg/70 py-3 text-sm font-bold text-fg transition-all hover:border-accent/60 hover:bg-surface active:scale-95" ><ThumbsDown className="mr-1.5 inline size-4" aria-hidden="true" />No</button>
        </div>
      )}
    </section>
  )
}

/** El periodista con su carácter y la pregunta que va saliendo de a poco */
function ReporterBubble({ question, index }) {
  const reporter = useMemo(() => reporterOf(question.journalist_name, index), [question.journalist_name, index])
  const [text, done, skip] = useTypewriter(question.question_text || '')
  return (
    <div className="flex items-start gap-3">
      <div className="flex shrink-0 flex-col items-center gap-0.5 [@media(max-height:740px)]:hidden">
        <span className="grid size-12 place-items-center rounded-full border border-line bg-bg text-fg-muted" aria-hidden="true"><NamedIcon name={reporter.icon} className="size-6" /></span>
        <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-fg-muted">{reporter.label}</span>
      </div>
      <button type="button" onClick={skip} disabled={done} aria-label="Pregunta del periodista" className="min-w-0 flex-1 rounded-xl rounded-tl-none border border-line bg-bg p-3 text-left disabled:cursor-default">
        <p className="mb-1 text-[11px] text-fg-subtle"><span className="font-semibold text-fg-muted">{question.journalist_name}</span><span> · {question.media_outlet}</span><span className="[@media(max-height:740px)]:hidden"> {reporter.intro}</span></p>
        {done ? (
          <p className="text-sm font-medium italic text-fg [@media(max-height:740px)]:text-xs">“{question.question_text}”</p>
        ) : (
          <>
            <span className="sr-only">{question.question_text}</span>
            <p className="text-sm font-medium italic text-fg" aria-hidden="true">“{text}▍</p>
          </>
        )}
      </button>
    </div>
  )
}

/**
 * Ficha de tono: se toca para responder o se arrastra hasta el micrófono y se suelta ahí.
 * Si se suelta en cualquier otro lado, vuelve a su lugar sin responder.
 */
function ToneTile({ opt, micRef, onPick, onHover, disabled }) {
  const [offset, setOffset] = useState(null)
  const start = useRef(null)
  const moved = useRef(false)
  const over = useRef(false)
  const justDragged = useRef(false)

  const overMic = (e) => {
    const r = micRef.current?.getBoundingClientRect()
    return !!r && e.clientX >= r.left - 14 && e.clientX <= r.right + 14 && e.clientY >= r.top - 14 && e.clientY <= r.bottom + 14
  }
  const reset = () => { start.current = null; moved.current = false; over.current = false; setOffset(null); onHover(null) }

  const down = (e) => {
    if (disabled) return
    start.current = { x: e.clientX, y: e.clientY }
    moved.current = false
    // Si el puntero ya no está activo (pasa con algunos gestos) se sigue sin capturarlo
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* sin captura el arrastre funciona igual dentro de la ficha */ }
  }
  const move = (e) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    if (!moved.current && Math.hypot(dx, dy) > 10) { moved.current = true; feel('tap'); onHover('drag') }
    if (!moved.current) return
    setOffset({ x: dx, y: dy })
    const now = overMic(e)
    if (now !== over.current) { over.current = now; onHover(now ? 'over' : 'drag'); if (now) feel('tap') }
  }
  const up = (e) => {
    if (!start.current) return
    const dropped = moved.current && overMic(e)
    const wasDrag = moved.current
    reset()
    if (wasDrag) { justDragged.current = true; setTimeout(() => { justDragged.current = false }, 0) }
    if (dropped) onPick(opt)
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={reset}
      onClick={() => { if (!justDragged.current) onPick(opt) }}
      style={offset ? { transform: `translate(${offset.x}px, ${offset.y}px) scale(1.06) rotate(${Math.max(-6, Math.min(6, offset.x / 20))}deg)`, zIndex: 30 } : undefined}
      className={`group relative flex min-h-0 touch-none select-none flex-col gap-1.5 overflow-hidden rounded-2xl border-2 p-3 text-left active:scale-[0.97] disabled:opacity-60 ${offset ? 'shadow-overlay transition-none' : 'transition-all'} ${TONE_COLORS[opt.tone] || 'border-line text-fg-muted bg-surface'}`}
    >
      <span className="flex w-full items-center justify-between gap-1">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-bg/50"><NamedIcon name={TONE_ICON[opt.tone] || 'Mic'} className="size-5" /></span>
        <span className="rounded-full bg-bg/50 px-2 py-0.5 text-[10px] font-bold text-fg">Moral {opt.moraleDelta >= 0 ? `+${opt.moraleDelta}` : opt.moraleDelta}</span>
      </span>
      <span className="text-xs font-bold uppercase tracking-wider">{toneLabel(opt.tone, 'Respuesta')}</span>
      <span className="line-clamp-4 text-xs italic leading-snug text-fg">“{opt.text}”</span>
    </button>
  )
}

/**
 * Sala de conferencias: preguntas relámpago con cuenta regresiva, reacción de la sala tras cada respuesta,
 * y al final la ronda de "Completá la frase del DT".
 */
export default function PressRoom({ questions, currentIndex, outcome, finished, delegated, skipResult, conferenceId, bingo = null, headlineContext = null, onAnswer, onNext, onSkip, onDelegate, onFinishEarly, onPhrase, onHeadline }) {
  const [noTimer, setNoTimer] = useState(readNoTimer)
  const [reaction, setReaction] = useState(null) // { line, fans, board, timedOut, tone } tras responder
  const [phrase, setPhrase] = useState(null) // resultado de la frase elegida
  const [mood, setMood] = useState(50) // humor de la sala
  const [sound, setSound] = useState(soundEnabled)
  const [hover, setHover] = useState(null) // null | 'drag' | 'over': estado del arrastre hacia el micrófono
  const [answering, setAnswering] = useState(false)
  const micRef = useRef(null)
  const [lightning, setLightning] = useState(null) // total de la ronda relámpago cuando termina
  const [phraseDone, setPhraseDone] = useState(() => phraseDoneBefore(conferenceId))
  const round = useMemo(() => phraseRound(outcome), [outcome])
  // Titular o fake y Bingo del DT
  const [headline, setHeadline] = useState(null) // resultado del titular elegido
  const [headlineDone, setHeadlineDone] = useState(() => headlineDoneBefore(conferenceId))
  // El contexto llega como objeto nuevo en cada render: los titulares se arman solo cuando cambian sus datos
  const headlineKeyValue = JSON.stringify(headlineContext)
  const headlines = useMemo(() => (headlineContext ? headlineRound(headlineContext) : null), [headlineKeyValue]) // eslint-disable-line react-hooks/exhaustive-deps
  const [bingoState, setBingoState] = useState(bingo)
  const [bingoNote, setBingoNote] = useState('')
  const [showBingoGrid, setShowBingoGrid] = useState(false)
  useEffect(() => { if (bingo) setBingoState(bingo) }, [bingo])

  // M8: Auto-avance de la reacción de la sala tras 2.5s
  useEffect(() => {
    if (!reaction) return
    const id = setTimeout(() => {
      setReaction(null)
      onNext()
    }, 2500)
    return () => clearTimeout(id)
  }, [reaction, onNext])

  // M8: Un solo minijuego por conferencia, rotando entre Frase y Titular
  const activeMinigame = useMemo(() => {
    if (!headlines) return 'PHRASE'
    const code = String(conferenceId || '').charCodeAt(String(conferenceId || '').length - 1) || 0
    const options = headlines ? ['PHRASE', 'HEADLINE', 'LIGHTNING'] : ['PHRASE', 'LIGHTNING']
    return options[code % options.length]
  }, [conferenceId, headlines])

  // M8: Conferencia corta de 2 preguntas máximo
  const activeQuestions = useMemo(() => (questions || []).slice(0, PRESS_MAX_QUESTIONS), [questions])
  const question = activeQuestions[currentIndex]
  // No presentarse y delegar son decisiones de antes de hablar: después de la primera respuesta solo se puede terminar ahí
  const answeredAny = questions.some(q => q.chosen_tone)

  const toggleTimer = () => {
    const next = !noTimer
    setNoTimer(next)
    try { localStorage.setItem(NO_TIMER_KEY, next ? '1' : '0') } catch { /* sin almacenamiento sigue funcionando */ }
  }

  const answer = async (option, timedOut = false) => {
    await onAnswer(question, option, { timedOut })
    const r = roomReaction({ tone: option.tone, outcome })
    // La respuesta se siente: vibra y suena distinto si cayó bien o mal en la sala
    const sign = r.fans + r.board
    feel(timedOut || sign < 0 ? 'bad' : sign > 0 ? 'good' : 'tap')
    setMood(m => nextRoomMood(m, r))
    setReaction({ ...r, timedOut, tone: option.tone, said: option.text })
  }

  const next = () => {
    setReaction(null)
    onNext()
  }

  // Responde una sola vez aunque se toque, se arrastre o se suelte dos veces
  const pick = async (option) => {
    if (answering) return
    setAnswering(true)
    feel('pick')
    try { await answer(option) } finally { setAnswering(false) }
  }

  const toggleSound = () => {
    const next = !sound
    setSound(next)
    setSoundEnabled(next)
    if (next) feel('good')
  }

  const pickPhrase = async (option) => {
    const result = phraseResult(option)
    setPhrase(result)
    setPhraseDone(true)
    try { sessionStorage.setItem(phraseKey(conferenceId), '1') } catch { /* sin almacenamiento sigue funcionando */ }
    const updated = await onPhrase(result)
    if (updated?.marks) {
      setBingoState(prev => ({ ...prev, ...updated }))
      if (updated.full) setBingoNote('¡Cartilla llena! Completaste el Bingo del DT de la temporada.')
      else if (updated.newLines > 0) setBingoNote('¡Línea! Completaste una línea del Bingo del DT.')
      else if (result.cliche) setBingoNote('Tachaste un cliché del Bingo del DT.')
    }
  }

  const finishLightning = async (total) => {
    setLightning(total)
    try { sessionStorage.setItem(phraseKey(conferenceId), '1') } catch { /* sin almacenamiento sigue funcionando */ }
    if (total) await onPhrase?.({ fans: total, line: '', cliche: null })
  }

  const pickHeadline = async (option) => {
    const result = headlineResult(option)
    setHeadline(result)
    setHeadlineDone(true)
    try { sessionStorage.setItem(headlineKey(conferenceId), '1') } catch { /* sin almacenamiento sigue funcionando */ }
    await onHeadline?.(result)
  }

  // Barra superior: avance de la conferencia, humor de la sala y las acciones a mano (faltar, delegar o cortar)
  const showTop = !finished && !skipResult && !delegated && !!question
  const topBar = showTop && (
    <div className="flex shrink-0 items-center gap-2">
      <span className="flex items-center gap-1" role="img" aria-label={`Pregunta ${currentIndex + 1} de ${activeQuestions.length}`}>
        {activeQuestions.map((_, i) => <span key={i} className={`h-2 w-6 rounded-full transition-colors ${i < currentIndex ? 'bg-accent' : i === currentIndex ? 'bg-gold' : 'bg-surface-3'}`} />)}
      </span>
      <div className="min-w-0 flex-1">{(answeredAny || reaction) && <RoomMeter mood={mood} compact />}</div>
      {!reaction && !answeredAny && (
        <>
          <AsyncButton onClick={onSkip} aria-label="No presentarme" title="No presentarme (te multan)" className="grid size-11 place-items-center rounded-xl border border-line bg-bg text-danger transition-colors hover:bg-surface-3">
            <UserX className="size-5" aria-hidden="true" />
          </AsyncButton>
          <AsyncButton onClick={onDelegate} aria-label="Delegar en 2º Entrenador" title="Delegar en el 2º entrenador" className="grid size-11 place-items-center rounded-xl border border-line bg-bg text-fg transition-colors hover:bg-surface-3">
            <UserCheck className="size-5" aria-hidden="true" />
          </AsyncButton>
        </>
      )}
      {!reaction && answeredAny && !finished && (
        <AsyncButton onClick={onFinishEarly} className="flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-bg px-3 text-xs font-semibold text-fg transition-colors hover:bg-surface-3">Terminar acá</AsyncButton>
      )}
      <button type="button" onClick={toggleSound} aria-pressed={sound} aria-label="Sonido" title={sound ? 'Apagar el sonido' : 'Encender el sonido'} className={`grid size-11 place-items-center rounded-xl border transition-colors ${sound ? 'border-accent/60 bg-accent-soft text-accent' : 'border-line bg-bg text-fg-subtle hover:bg-surface-3'}`}>
        {sound ? <Volume2 className="size-5" aria-hidden="true" /> : <VolumeX className="size-5" aria-hidden="true" />}
      </button>
      {!reaction && (
        <label title="Sin cuenta regresiva" className={`grid size-11 cursor-pointer place-items-center rounded-xl border transition-colors ${noTimer ? 'border-gold/60 bg-gold-soft text-gold' : 'border-line bg-bg text-fg-subtle hover:bg-surface-3'}`}>
          <input type="checkbox" className="sr-only" checked={noTimer} onChange={toggleTimer} aria-label="Sin cuenta regresiva" />
          {noTimer ? <TimerOff className="size-5" aria-hidden="true" /> : <Timer className="size-5" aria-hidden="true" />}
        </label>
      )}
    </div>
  )

  let body
  if (skipResult && !skipResult.alreadyClosed) {
    body = (
      <div className="space-y-2 rounded-xl border border-line bg-bg/80 p-6 text-center">
        <Mic className="mx-auto size-8 text-fg-subtle" aria-hidden="true" />
        <p className="text-sm font-bold text-fg">No diste conferencia</p>
        <p className="text-xs text-fg-muted">{skipResult.message}</p>
        <p className="text-xs text-fg-subtle">
          Multa: {formatMoney(skipResult.fine)}
          {skipResult.fans ? ` • Hinchada ${skipResult.fans > 0 ? '+' : ''}${skipResult.fans}` : ''}
          {skipResult.board ? ` • Dirigencia ${skipResult.board > 0 ? '+' : ''}${skipResult.board}` : ''}
        </p>
      </div>
    )
  } else if (delegated) {
    body = (
      <div className="space-y-2 rounded-xl border border-line bg-bg/80 p-6 text-center">
        <UserCheck className="mx-auto size-8 text-accent" aria-hidden="true" />
        <p className="text-sm font-bold text-fg">Conferencia atendida por el Ayudante de Campo</p>
        <p className="text-xs text-fg-muted">Tu segundo entrenador respondió con diplomacia y cautela ante los medios sin generar polémicas. (+1 moral general)</p>
      </div>
    )
  } else if (reaction) {
    body = (
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3" aria-live="polite">
        {reaction.timedOut && <p className="rounded-xl border border-warning/40 bg-warning-soft p-2.5 text-xs font-semibold text-warning">Se te acabó el tiempo: contestaste nervioso.</p>}
        {reaction.said && (
          <div className="ml-6 animate-rise-in rounded-2xl rounded-br-none border border-accent/40 bg-accent-soft p-3">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent"><Mic className="size-3.5" aria-hidden="true" />Vos dijiste</p>
            <p className="text-sm italic leading-snug text-fg">“{reaction.said}”</p>
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl border border-line bg-bg p-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-surface-2 text-accent" aria-hidden="true"><NamedIcon name={roomFace(reaction).icon} className="size-9" /></span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Reacción de la sala · {roomFace(reaction).label}</p>
            <p className="text-sm font-medium leading-snug text-fg">{reaction.line}</p>
            <p className="mt-0.5 text-xs text-fg-muted">Hinchada {signed(reaction.fans)} • Dirigencia {signed(reaction.board)}</p>
          </div>
        </div>
        <button type="button" onClick={next} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-xs font-semibold uppercase tracking-wider text-accent-fg transition-all hover:bg-accent-strong active:scale-95">
          <span>{currentIndex + 1 >= activeQuestions.length ? 'Terminar la conferencia' : 'Siguiente pregunta'}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    )
  } else if (finished) {
    body = (
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent-soft p-3 text-xs font-bold text-accent">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          <span>Rueda de prensa finalizada. Las declaraciones han sido publicadas en los medios.</span>
        </div>

        {/* M8: Un solo minijuego por conferencia, rotando entre Frase y Titular */}
        {activeMinigame === 'PHRASE' && !phraseDone && !headline && (
          <section aria-label="Completá la frase del DT" className="space-y-3 rounded-xl border border-gold/40 bg-gold/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Completá la frase del DT</p>
            <p className="text-sm font-medium text-fg">{round.prompt}</p>
            <ul className="space-y-2">
              {round.options.map(option => (
                <li key={option.key}>
                  <AsyncButton onClick={() => pickPhrase(option)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-bg/70 p-3 text-left text-sm text-fg transition-all hover:border-gold/60 hover:bg-surface active:scale-[0.98]"><PenLine className="size-5 shrink-0 text-gold" aria-hidden="true" /><span>
                    {option.text}</span>
                  </AsyncButton>
                </li>
              ))}
            </ul>
          </section>
        )}
        {activeMinigame === 'LIGHTNING' && !phraseDone && lightning === null && <LightningRound onFinish={finishLightning} />}
        {lightning !== null && (
          <p role="status" className="rounded-xl border border-line bg-bg p-3 text-xs text-fg">
            Ronda relámpago terminada. {lightning !== 0 && <strong>Hinchada {lightning > 0 ? `+${lightning}` : lightning}.</strong>}
          </p>
        )}
        {phrase && (
          <p role="status" className="rounded-xl border border-line bg-bg p-3 text-xs text-fg">
            {phrase.line} {phrase.fans !== 0 && <strong>Hinchada {phrase.fans > 0 ? '+1' : '-1'}.</strong>}
            {bingoNote && <strong className="block pt-1 text-gold">{bingoNote}</strong>}
          </p>
        )}

        {activeMinigame === 'HEADLINE' && headlines && !headlineDone && !phrase && (
          <section aria-label="Titular o fake" className="space-y-3 rounded-xl border border-gold/40 bg-gold/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Titular o fake</p>
            <p className="text-sm font-medium text-fg">{headlines.prompt}</p>
            <ul className="space-y-2">
              {headlines.options.map(option => (
                <li key={option.key}>
                  <AsyncButton onClick={() => pickHeadline(option)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-bg/70 p-3 text-left text-sm font-semibold text-fg transition-all hover:border-gold/60 hover:bg-surface active:scale-[0.98]"><Newspaper className="size-5 shrink-0 text-gold" aria-hidden="true" /><span>
                    {option.text}</span>
                  </AsyncButton>
                </li>
              ))}
            </ul>
          </section>
        )}
        {headline && (
          <p role="status" className="rounded-xl border border-line bg-bg p-3 text-xs text-fg">
            {headline.line} {headline.board > 0 && <strong>Dirigencia +1.</strong>}{headline.fans < 0 && <strong>Hinchada -1.</strong>}
          </p>
        )}

        {/* M8: Bingo como línea de avance con cartilla plegable */}
        {bingoState?.card && (
          <section aria-label="Bingo del DT" className="rounded-xl border border-line bg-bg/70 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-fg-muted">Bingo del DT</p>
                <span className="text-[11px] text-fg-subtle font-mono">
                  {bingoState.card.filter(id => (bingoState.marks || []).includes(id)).length} de 9 · {bingoState.lines || 0} {bingoState.lines === 1 ? 'línea' : 'líneas'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowBingoGrid(s => !s)}
                className="text-[11px] font-medium text-accent hover:underline"
              >
                {showBingoGrid ? 'Plegar cartilla' : 'Ver cartilla'}
              </button>
            </div>
            <div className={showBingoGrid ? 'space-y-2' : 'hidden space-y-2'}>
              <ul className="grid grid-cols-3 gap-1.5">
                {bingoState.card.map(id => {
                  const marked = (bingoState.marks || []).includes(id)
                  return (
                    <li key={id} aria-label={`${clicheText[id]}${marked ? ' (tachado)' : ''}`} className={`flex min-h-14 items-center justify-center rounded-lg border p-1.5 text-center text-[10px] leading-tight ${marked ? 'border-gold/60 bg-gold/15 font-bold text-gold line-through' : 'border-line text-fg-muted'}`}>
                      {clicheText[id]}
                    </li>
                  )
                })}
              </ul>
              <p className="text-[10px] text-fg-subtle">Cada frase de manual que elegís tacha un cliché. Línea: hinchada +2 y dirigencia +1. Cartilla llena: premio grande. Se reinicia cada temporada.</p>
            </div>
          </section>
        )}

        {/* M8: Transcripción plegada */}
        {questions.some(q => q.chosen_tone) && (
          <details className="pt-2 group">
            <summary className="cursor-pointer text-xs font-semibold text-fg-muted hover:text-fg select-none flex items-center justify-between rounded-lg border border-line bg-bg/50 p-2.5">
              <span>Transcripción de declaraciones ({questions.filter(q => q.chosen_tone).length})</span>
              <span className="text-[10px] text-fg-subtle group-open:hidden">Desplegar</span>
              <span className="text-[10px] text-fg-subtle hidden group-open:inline">Plegar</span>
            </summary>
            <div className="space-y-3 pt-3">
              {questions.filter(q => q.chosen_tone).map((q, idx) => (
                <div key={q.id || idx} className="space-y-1.5 rounded-xl border border-line/80 bg-bg/70 p-3.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-fg-subtle">
                    <span className="font-semibold text-fg-muted">{q.media_outlet} • {q.journalist_name}</span>
                    <span className="font-semibold text-accent">{toneLabel(q.chosen_tone)}</span>
                  </div>
                  <p className="font-medium italic text-fg">"{q.question_text}"</p>
                  <p className="border-l-2 border-accent/50 pl-3 text-[11px] text-fg-muted">"{q.manager_answer_text}"</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    )
  } else if (question) {
    const options = question.options || []
    body = (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <ReporterBubble key={question.id || currentIndex} question={question} index={currentIndex} />

        {noTimer ? null : <Countdown key={question.id || currentIndex} seconds={PRESS_SECONDS} onExpire={() => answer(timeoutOption(question.options), true)} />}

        {/* Las cuatro posturas a la vista: tocá la que querés decir */}
        <div role="group" aria-label="Elegí tu postura y respuesta" className={`grid min-h-0 flex-1 grid-cols-2 gap-2.5 ${options.length > 2 ? 'grid-rows-2' : ''}`}>
          {options.map((opt, optIdx) => (
            <ToneTile key={optIdx} opt={opt} micRef={micRef} onPick={pick} onHover={setHover} disabled={answering} />
          ))}
        </div>

        {/* El micrófono: se puede arrastrar una ficha hasta acá para decirla */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div
            ref={micRef}
            aria-hidden="true"
            className={`grid size-16 place-items-center rounded-full border-2 transition-all [@media(max-height:740px)]:size-12 ${hover === 'over' ? 'scale-125 border-accent bg-accent/30 text-accent' : hover === 'drag' ? 'animate-pulse border-gold bg-gold-soft text-gold' : 'border-line-strong bg-surface text-fg-muted'}`}
          >
            <Mic className="size-7 [@media(max-height:740px)]:size-5" />
          </div>
          <p className="text-[11px] text-fg-subtle [@media(max-height:740px)]:hidden" aria-live="polite">{hover === 'over' ? 'Soltá la ficha para decirlo' : 'Tocá una ficha o arrastrala al micrófono'}</p>
        </div>
      </div>
    )
  } else {
    body = <p className="py-6 text-center text-xs text-fg-subtle">Sin preguntas de prensa para este encuentro.</p>
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {topBar}
      {body}
    </div>
  )
}
