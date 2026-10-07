const fs = require('fs')

const content = `import React, { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ratingAtSlot } from '../../domain/ratings'
import { slotBase } from '../../domain/positions'

const nameOf = (p) => \`\${p.first_name || ''} \${p.last_name || ''}\`.trim()
const ovr = (p) => p.attr_overall || p.overall || '-'

/**
 * Cambios durante la pausa: se elige quién sale de la cancha y quién entra del banco.
 * El que entra ocupa el puesto del que sale (la media que se muestra es la que tiene en ese puesto).
 */
export default function SubstitutionsPanel({ onField, bench, subsLeft, onSubstitute, preselectOutId = null }) {
  const [pickedId, setOutId] = useState(null)
  // El lesionado queda marcado para salir hasta que el DT elija a otro
  const outId = pickedId ?? (onField.some(p => p.id === preselectOutId) ? preselectOutId : null)
  const out = onField.find(p => p.id === outId)

  const confirm = (inId) => {
    onSubstitute(outId, inId)
    setOutId(null)
  }

  let sortedBench = bench
  if (out) {
    const targetSlot = out.slot_base || slotBase(out.position)
    sortedBench = [...bench].sort((a, b) => {
      const aRating = ratingAtSlot(a, targetSlot)
      const bRating = ratingAtSlot(b, targetSlot)
      return bRating - aRating
    })
  }

  return (
    <section aria-label="Cambios" className="space-y-3 rounded-xl border border-line bg-bg/60 p-4">
      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg-muted">
        <ArrowLeftRight className="size-4 text-accent" aria-hidden="true" />
        Cambios ({subsLeft} {subsLeft === 1 ? 'disponible' : 'disponibles'})
      </h4>

      {subsLeft === 0 ? (
        <p className="text-sm text-fg-subtle">Ya hiciste todos los cambios permitidos.</p>
      ) : !out ? (
        <>
          <p className="text-sm text-fg-muted">¿Quién sale?</p>
          <ul className="grid grid-cols-2 gap-2">
            {onField.map(p => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setOutId(p.id)}
                  className={cn(
                    "flex flex-col w-full rounded-lg border bg-surface px-3 py-2 text-left text-sm text-fg transition-colors",
                    p.id === preselectOutId ? "border-red-500/50 bg-red-500/10" : "border-line hover:border-accent"
                  )}
                >
                  <span className="truncate font-semibold">{nameOf(p)}</span>
                  <span className={cn("text-xs font-medium", p.id === preselectOutId ? "text-red-400" : "text-fg-subtle")}>
                    {p.slot_base || p.position} · {Math.round(p.slot_rating ?? 0) || ovr(p)}
                    {p.id === preselectOutId && " (Lesionado)"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="text-sm text-fg-muted flex items-center justify-between">
            <span>Sale <strong className="text-fg">{nameOf(out)}</strong>. ¿Quién entra?</span>
            <button type="button" onClick={() => setOutId(null)} className="text-xs underline text-accent">Elegir otro</button>
          </p>
          {sortedBench.length === 0 ? (
            <p className="text-sm text-fg-subtle">No quedan suplentes aptos.</p>
          ) : (
            <ul className="space-y-2">
              {sortedBench.map(p => {
                const targetSlot = out.slot_base || slotBase(out.position)
                const isNatural = p.position === targetSlot
                const newRating = Math.round(ratingAtSlot(p, targetSlot))
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => confirm(p.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border bg-surface px-3 py-3 text-left text-sm text-fg transition-colors hover:border-accent',
                        isNatural ? 'border-accent/40 bg-accent/10' : 'border-line'
                      )}
                    >
                      <span className="truncate font-semibold">{nameOf(p)}</span>
                      <span className={cn("text-xs font-medium", isNatural ? "text-accent" : "text-fg-subtle")}>
                        como {targetSlot}: {newRating} · fís. {Math.round(p.state_fitness ?? 0)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
`

fs.writeFileSync('src/features/match/SubstitutionsPanel.jsx', content, 'utf8')
