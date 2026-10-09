import React, { useMemo, useState } from 'react'
import { Flame, Brain, Handshake, Swords } from 'lucide-react'
import { buildDuel, scoreAnswer, duelOutcome, DUEL_MORALE } from '../../domain/derbyDuel'

const TONE_ICON = { BRAVE: Flame, COOL: Brain, RESPECT: Handshake }
const TONE_STYLE = {
  BRAVE: 'border-danger/60 bg-danger-soft text-danger',
  COOL: 'border-accent/50 bg-accent-soft text-accent',
  RESPECT: 'border-gold/50 bg-gold-soft text-gold'
}
const ROUND_NOTE = {
  1: 'Ganaste la ronda: el rival se quedó sin respuesta.',
  0: 'Ronda pareja: nadie sacó ventaja.',
  '-1': 'Caíste en la trampa: el rival se llevó la ronda.'
}
const RESULT_TEXT = {
  WIN: { title: 'Ganaste el duelo', note: 'El plantel sale con el pecho inflado.' },
  DRAW: { title: 'Duelo parejo', note: 'Ahora habla la pelota.' },
  LOSE: { title: 'Perdiste el duelo', note: 'En el vestuario se nota la bronca.' }
}

/**
 * Duelo de bocones antes del clásico: tres declaraciones del DT rival y tres maneras de contestar.
 * Cada tipo de provocación tiene su respuesta justa; al final el resultado mueve un poco la moral del plantel.
 */
export default function DerbyDuel({ rivalName, onFinish, rng = Math.random }) {
  const rounds = useMemo(() => buildDuel(rivalName, rng), [rivalName]) // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0)
  const [scores, setScores] = useState([])
  const [shown, setShown] = useState(null) // { score, said } de la ronda recién jugada
  const round = rounds[index]
  const finished = index >= rounds.length

  const pick = (option) => {
    if (shown) return
    const score = scoreAnswer(round.type, option.tone)
    setShown({ score, said: option.text })
    setScores(prev => [...prev, score])
  }
  const next = () => { setShown(null); setIndex(i => i + 1) }

  if (finished) {
    const { result, total } = duelOutcome(scores)
    const text = RESULT_TEXT[result]
    const morale = DUEL_MORALE[result]
    return (
      <section aria-label="Resultado del duelo" className="space-y-3 rounded-2xl border border-line bg-surface p-4 text-center">
        <Swords className="mx-auto size-8 text-gold" aria-hidden="true" />
        <p className="text-base font-black text-fg">{text.title}</p>
        <p className="text-xs text-fg-muted">{text.note}</p>
        <p className="text-xs font-semibold text-fg-subtle">Puntaje {total > 0 ? `+${total}` : total} · Moral del plantel {morale > 0 ? `+${morale}` : morale}</p>
        <button type="button" onClick={() => onFinish({ result, total })} className="min-h-11 w-full rounded-xl bg-accent px-4 text-sm font-bold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-strong">A la cancha</button>
      </section>
    )
  }

  return (
    <section aria-label="Duelo de declaraciones" className="space-y-3 rounded-2xl border border-gold/40 bg-surface p-4">
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gold"><Swords className="size-4" aria-hidden="true" />Duelo de declaraciones</span>
        <span className="flex gap-1" role="img" aria-label={`Ronda ${index + 1} de ${rounds.length}`}>
          {rounds.map((_, i) => <span key={i} className={`h-2 w-6 rounded-full ${i < index ? 'bg-accent' : i === index ? 'bg-gold' : 'bg-surface-3'}`} />)}
        </span>
      </header>
      <p className="rounded-xl rounded-tl-none border border-line bg-bg p-3 text-sm font-medium italic text-fg">{round.jab}</p>
      {shown ? (
        <div className="space-y-2" aria-live="polite">
          <p className="rounded-xl border border-accent/40 bg-accent-soft p-2.5 text-xs italic text-fg">“{shown.said}”</p>
          <p className={`text-xs font-semibold ${shown.score > 0 ? 'text-accent' : shown.score < 0 ? 'text-danger' : 'text-fg-muted'}`}>{ROUND_NOTE[shown.score]}</p>
          <button type="button" onClick={next} className="min-h-11 w-full rounded-xl border border-line bg-bg px-4 text-sm font-bold text-fg transition-colors hover:bg-surface-3">{index + 1 >= rounds.length ? 'Ver resultado' : 'Siguiente'}</button>
        </div>
      ) : (
        <div role="group" aria-label="Cómo contestás" className="grid gap-2">
          {round.options.map(option => {
            const Icon = TONE_ICON[option.tone]
            return (
              <button key={option.tone} type="button" onClick={() => pick(option)} className={`flex min-h-14 items-center gap-3 rounded-xl border-2 p-3 text-left transition-transform active:scale-[0.98] ${TONE_STYLE[option.tone]}`}>
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[11px] font-black uppercase tracking-wider">{option.label}</span>
                  <span className="block text-xs italic leading-snug text-fg">“{option.text}”</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
