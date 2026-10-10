import React, { useEffect, useRef, useState } from 'react'
import { Lightbulb, Megaphone } from 'lucide-react'
import PenaltyGoal, { PenaltyShoot } from './PenaltyGoal'
import SaveReflex from './SaveReflex'
import CornerPick from './CornerPick'
import PowerBar from './PowerBar'
import { NamedIcon } from '../../components/ui/named-icon'

/** Segundo paso de una jugada: frenar la barra para decidir qué tan bien sale. Devuelve la calidad (0 a 1) con la opción elegida. */
function BarStep({ title, text, actionLabel, doneLabel, onDone }) {
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <section aria-label={title} className="space-y-2 rounded-xl border border-accent/50 bg-accent-soft/40 p-3">
      <p className="text-sm font-semibold text-fg">{text}</p>
      <PowerBar actionLabel={actionLabel} doneLabel={doneLabel} onStop={(quality) => { timer.current = setTimeout(() => onDone(quality), 600) }} />
    </section>
  )
}

// Qué dice cada paso de barra según el momento
const BAR_STEPS = {
  CORNER_FOR: { title: 'Centro del córner', text: 'La pelota está lista. Frená la barra en el verde: así sale el centro.', actionLabel: '¡Centrar!', doneLabel: '¡Centró!' },
  CORNER_AGAINST: { title: 'Despejar el córner', text: '¡Ahí viene el centro! Frená la barra en el verde para despejar.', actionLabel: '¡Despejar!', doneLabel: '¡Saltó!' },
  KEYPLAY_FOR: { title: 'Definir el mano a mano', text: 'Estás solo frente al arquero. Frená la barra en el verde para definir.', actionLabel: '¡Definir!', doneLabel: '¡Definió!' }
}

/**
 * Momento de decisión: el partido se pausa solo y el DT elige qué hacer.
 * Cada opción muestra su efecto real sobre el partido.
 */
export default function DecisionCard({ moment, onChoose }) {
  // Penal a favor: primero se elige quién patea y, si es una persona, después apunta y le pega (minijuego)
  const [taker, setTaker] = useState(null)
  // Córner a favor, córner en contra y mano a mano: la opción elegida pasa por la barra antes de mandarse
  const [staged, setStaged] = useState(null)
  const needsBar = (option) => (
    (moment.id === 'CORNER_AGAINST' && option.zone && option.zone !== 'COUNTER') ||
    (moment.id === 'KEYPLAY_FOR' && option.choice === 'SHOOT')
  )
  const pick = (option) => {
    if ((moment.id === 'PENALTY_FOR' || moment.id === 'FREEKICK_FOR') && option.playerId) setTaker(option)
    else if (needsBar(option)) setStaged(option)
    else onChoose(option)
  }
  if (staged && BAR_STEPS[moment.id]) {
    return <BarStep {...BAR_STEPS[moment.id]} onDone={(quality) => onChoose({ ...staged, quality })} />
  }
  if (taker) {
    return (
      <section aria-label="Patear el penal" className="space-y-2 rounded-xl border border-accent/50 bg-accent-soft/40 p-3">
        <PenaltyShoot takerName={taker.label.replace('Que patee ', '')} onDone={({ aim, quality }) => onChoose({ ...taker, aim, quality })} />
      </section>
    )
  }
  return (
    <section aria-label={moment.title} className="space-y-2 rounded-xl border border-accent/50 bg-accent-soft/40 p-3">
      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
        <Megaphone className="size-3.5" aria-hidden="true" />
        {moment.title}
      </h4>
      <p className="text-sm leading-relaxed text-fg">{moment.text}</p>
      {moment.hintText && (
        <p className="flex items-start gap-2 rounded-lg border border-gold/40 bg-gold-soft px-3 py-2 text-xs text-fg"><Lightbulb className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />{moment.hintText}</p>
      )}
      {moment.id === 'CORNER_FOR' ? (
        <CornerPick options={moment.options} hint={moment.hint} onChoose={setStaged} />
      ) : moment.id === 'SHOT_AGAINST' ? (
        <SaveReflex onDone={({ quality, label }) => onChoose({ id: 'SAVE_REACT', label, action: 'SAVE_REACT', quality })} />
      ) : moment.id === 'PENALTY_AGAINST' ? (
        <PenaltyGoal options={moment.options} onChoose={onChoose} />
      ) : (
      <ul className="space-y-1.5">
        {moment.options.map(option => (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => pick(option)}
              className="w-full rounded-lg border border-line bg-surface p-3 text-left text-sm text-fg transition-colors hover:border-accent"
            >
              <span className="flex items-center gap-2 font-bold">{option.icon && <NamedIcon name={option.icon} className="size-4 shrink-0 text-accent" />}{option.label}</span>
              <span className="text-xs text-fg-subtle">{option.desc}</span>
            </button>
          </li>
        ))}
      </ul>
      )}
    </section>
  )
}
