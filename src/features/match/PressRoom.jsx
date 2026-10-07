import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Mic, Timer, UserCheck } from 'lucide-react'
import { AsyncButton } from '../../components/ui'
import { formatMoney } from '../../lib/format'
import { BINGO_CLICHES, PRESS_SECONDS, headlineResult, headlineRound, phraseResult, phraseRound, roomReaction, timeoutOption } from '../../domain/pressRoom'

const TONE_COLORS = {
  PRAISING: 'border-accent/40 text-accent bg-accent-soft',
  COMBATIVE: 'border-danger/40 text-danger bg-danger-soft',
  SELF_CRITICAL: 'border-line-strong/40 text-fg-muted bg-surface-2',
  PRAGMATIC: 'border-line text-fg bg-surface/40'
}
const TONE_NAMES = {
  PRAISING: 'Elogioso / Motivador',
  COMBATIVE: 'Combativo / Confrontativo',
  SELF_CRITICAL: 'Autocrítico / Exigente',
  PRAGMATIC: 'Cauteloso / Pragmático'
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

/**
 * Sala de conferencias: preguntas relámpago con cuenta regresiva, reacción de la sala tras cada respuesta,
 * y al final la ronda de "Completá la frase del DT".
 */
export default function PressRoom({ questions, currentIndex, outcome, finished, delegated, skipResult, conferenceId, bingo = null, headlineContext = null, onAnswer, onNext, onSkip, onDelegate, onPhrase, onHeadline }) {
  const [noTimer, setNoTimer] = useState(readNoTimer)
  const [reaction, setReaction] = useState(null) // { line, fans, board, timedOut, tone } tras responder
  const [phrase, setPhrase] = useState(null) // resultado de la frase elegida
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
  useEffect(() => { if (bingo) setBingoState(bingo) }, [bingo])
  const question = questions[currentIndex]

  const toggleTimer = () => {
    const next = !noTimer
    setNoTimer(next)
    try { localStorage.setItem(NO_TIMER_KEY, next ? '1' : '0') } catch { /* sin almacenamiento sigue funcionando */ }
  }

  const answer = async (option, timedOut = false) => {
    await onAnswer(question, option, { timedOut })
    setReaction({ ...roomReaction({ tone: option.tone, outcome }), timedOut, tone: option.tone })
  }

  const next = () => {
    setReaction(null)
    onNext()
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

  const pickHeadline = async (option) => {
    const result = headlineResult(option)
    setHeadline(result)
    setHeadlineDone(true)
    try { sessionStorage.setItem(headlineKey(conferenceId), '1') } catch { /* sin almacenamiento sigue funcionando */ }
    await onHeadline?.(result)
  }

  const header = (
    <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <span className="rounded-xl border border-gold/20 bg-gold/10 p-2 text-gold"><Mic className="size-5" aria-hidden="true" /></span>
        <div>
          <h2 className="text-sm font-bold text-fg sm:text-base">Rueda de prensa</h2>
          <p className="text-xs text-fg-muted">Preguntas relámpago: contestá antes de que se acabe el tiempo</p>
        </div>
      </div>
      {!finished && !reaction && (
        <div className="flex flex-wrap gap-2">
          <AsyncButton onClick={onSkip} className="rounded-xl border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-surface-3">No presentarme</AsyncButton>
          <AsyncButton onClick={onDelegate} className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:bg-surface-3">
            <UserCheck className="size-3.5 text-fg-muted" aria-hidden="true" />
            <span>Delegar en 2º Entrenador</span>
          </AsyncButton>
        </div>
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
      <div className="space-y-4" aria-live="polite">
        {reaction.timedOut && <p className="rounded-xl border border-warning/40 bg-warning-soft p-2.5 text-xs font-semibold text-warning">Se te acabó el tiempo: contestaste nervioso.</p>}
        <div className="space-y-2 rounded-xl border border-line bg-bg p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Reacción de la sala</p>
          <p className="text-sm font-medium text-fg">{reaction.line}</p>
          <p className="text-xs text-fg-muted">
            Hinchada {signed(reaction.fans)} • Dirigencia {signed(reaction.board)}
          </p>
        </div>
        <button type="button" onClick={next} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-xs font-semibold uppercase tracking-wider text-accent-fg transition-all hover:bg-accent-strong active:scale-95">
          <span>{currentIndex + 1 >= questions.length ? 'Terminar la conferencia' : 'Siguiente pregunta'}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    )
  } else if (finished) {
    body = (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent-soft p-3 text-xs font-bold text-accent">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          <span>Rueda de prensa finalizada. Las declaraciones han sido publicadas en los medios.</span>
        </div>

        {!phraseDone && (
          <section aria-label="Completá la frase del DT" className="space-y-3 rounded-xl border border-gold/40 bg-gold/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Completá la frase del DT</p>
            <p className="text-sm font-medium text-fg">{round.prompt}</p>
            <ul className="space-y-2">
              {round.options.map(option => (
                <li key={option.key}>
                  <AsyncButton onClick={() => pickPhrase(option)} className="w-full rounded-xl border border-line bg-bg/70 p-3 text-left text-xs text-fg transition-all hover:border-gold/60 hover:bg-surface">
                    {option.text}
                  </AsyncButton>
                </li>
              ))}
            </ul>
          </section>
        )}
        {phrase && (
          <p role="status" className="rounded-xl border border-line bg-bg p-3 text-xs text-fg">
            {phrase.line} {phrase.fans !== 0 && <strong>Hinchada {phrase.fans > 0 ? '+1' : '-1'}.</strong>}
            {bingoNote && <strong className="block pt-1 text-gold">{bingoNote}</strong>}
          </p>
        )}

        {headlines && !headlineDone && (
          <section aria-label="Titular o fake" className="space-y-3 rounded-xl border border-gold/40 bg-gold/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Titular o fake</p>
            <p className="text-sm font-medium text-fg">{headlines.prompt}</p>
            <ul className="space-y-2">
              {headlines.options.map(option => (
                <li key={option.key}>
                  <AsyncButton onClick={() => pickHeadline(option)} className="w-full rounded-xl border border-line bg-bg/70 p-3 text-left text-xs text-fg transition-all hover:border-gold/60 hover:bg-surface">
                    {option.text}
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

        {bingoState?.card && (
          <section aria-label="Bingo del DT" className="space-y-2 rounded-xl border border-line bg-bg/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-fg-muted">Bingo del DT</p>
              <p className="text-[11px] text-fg-subtle">{bingoState.card.filter(id => (bingoState.marks || []).includes(id)).length} de 9 · {bingoState.lines || 0} {bingoState.lines === 1 ? 'línea' : 'líneas'}</p>
            </div>
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
          </section>
        )}

        <div className="space-y-3 pt-2">
          {questions.map((q, idx) => (
            <div key={q.id || idx} className="space-y-1.5 rounded-xl border border-line/80 bg-bg/70 p-3.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-fg-subtle">
                <span className="font-semibold text-fg-muted">{q.media_outlet} • {q.journalist_name}</span>
                <span className="font-mono font-bold uppercase text-accent">{q.chosen_tone || 'RESPONDIDA'}</span>
              </div>
              <p className="font-medium italic text-fg">"{q.question_text}"</p>
              <p className="border-l-2 border-accent/50 pl-3 text-[11px] text-fg-muted">"{q.manager_answer_text}"</p>
            </div>
          ))}
        </div>
      </div>
    )
  } else if (question) {
    body = (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span className="font-semibold text-accent">{question.media_outlet}</span>
          <span className="font-mono text-fg-subtle">Pregunta {currentIndex + 1} de {questions.length}</span>
        </div>

        {noTimer ? null : <Countdown key={question.id || currentIndex} seconds={PRESS_SECONDS} onExpire={() => answer(timeoutOption(question.options), true)} />}

        <div className="rounded-xl border border-line bg-bg p-4">
          <p className="mb-1 text-xs font-semibold text-fg-muted">{question.journalist_name}:</p>
          <p className="text-sm font-medium italic text-fg">"{question.question_text}"</p>
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold text-fg-muted">Elegí tu postura y respuesta:</p>
          {(question.options || []).map((opt, optIdx) => (
            <AsyncButton key={optIdx} onClick={() => answer(opt)} className="group w-full rounded-xl border border-line bg-bg/70 p-3 text-left text-xs transition-all hover:border-accent/60 hover:bg-surface">
              <div className="mb-1 flex items-center justify-between">
                <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${TONE_COLORS[opt.tone] || 'border-line text-fg-muted'}`}>{TONE_NAMES[opt.tone] || opt.tone}</span>
                <span className="text-[10px] text-fg-subtle">Impacto moral: {opt.moraleDelta >= 0 ? `+${opt.moraleDelta}` : opt.moraleDelta}</span>
              </div>
              <p className="leading-snug text-fg">"{opt.text}"</p>
            </AsyncButton>
          ))}
        </div>

        <label className="flex items-center gap-2 pt-1 text-[11px] text-fg-subtle">
          <input type="checkbox" checked={noTimer} onChange={toggleTimer} />
          Sin cuenta regresiva
        </label>
      </div>
    )
  } else {
    body = <p className="py-6 text-center text-xs text-fg-subtle">Sin preguntas de prensa para este encuentro.</p>
  }

  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface/60 p-4 sm:p-6">
      {header}
      {body}
    </div>
  )
}
