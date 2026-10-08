import React from 'react'
import { Megaphone } from 'lucide-react'
import PenaltyGoal from './PenaltyGoal'

/**
 * Momento de decisión: el partido se pausa solo y el DT elige qué hacer.
 * Cada opción muestra su efecto real sobre el partido.
 */
export default function DecisionCard({ moment, onChoose }) {
  return (
    <section aria-label={moment.title} className="space-y-2 rounded-xl border border-accent/50 bg-accent-soft/40 p-3">
      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
        <Megaphone className="size-3.5" aria-hidden="true" />
        {moment.title}
      </h4>
      <p className="text-sm leading-relaxed text-fg">{moment.text}</p>
      {moment.id === 'PENALTY_AGAINST' ? (
        <PenaltyGoal options={moment.options} onChoose={onChoose} />
      ) : (
      <ul className="space-y-1.5">
        {moment.options.map(option => (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => onChoose(option)}
              className="w-full rounded-lg border border-line bg-surface p-3 text-left text-sm text-fg transition-colors hover:border-accent"
            >
              <span className="block font-bold">{option.label}</span>
              <span className="text-xs text-fg-subtle">{option.desc}</span>
            </button>
          </li>
        ))}
      </ul>
      )}
    </section>
  )
}
