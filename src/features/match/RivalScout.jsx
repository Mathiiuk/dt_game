import React from 'react'
import { CircleDot, ChevronsUp, Eye, Flag, Target } from 'lucide-react'
import { ROLE_LABELS, aerialOf, specialistsOf } from '../../domain/specialists'

const ICONS = { PENALTY: CircleDot, FREE_KICK: Target, CORNER: Flag, HEADER: ChevronsUp }

/** Ficha de scouting antes del pitazo: quiénes son los especialistas de pelota parada del rival (para saber a quién marcar) */
export default function RivalScout({ lineup, rivalName }) {
  const specialists = specialistsOf(lineup)
  return (
    <section aria-label="Especialistas del rival" className="flex min-h-0 flex-1 flex-col justify-center gap-3 rounded-xl border border-line bg-surface-2 p-4">
      <div className="space-y-1 text-center">
        <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gold"><Eye className="size-4" aria-hidden="true" />Scouting</p>
        <p className="text-sm text-fg-muted">Equipos en vestuarios finalizando la charla táctica. Mirá a quién tenés que marcar de {rivalName || 'el rival'}.</p>
      </div>
      <ul className="space-y-2">
        {Object.entries(ICONS).map(([role, Icon]) => {
          const sp = specialists[role]
          return (
            <li key={role} className="flex items-center gap-3 rounded-lg border border-line bg-bg/60 px-3 py-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-3 text-accent"><Icon className="size-4" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-fg-subtle">{ROLE_LABELS[role]}</span>
                <span className="block truncate text-sm font-semibold text-fg">{sp ? sp.name : 'Sin datos'}</span>
              </span>
              {sp && <span className="num font-mono text-sm font-bold text-accent">{role === 'HEADER' ? Math.round(aerialOf(sp.player)) : sp.score}</span>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
