import React, { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { cn } from '../../lib/utils'

const nameOf = (p) => `${p.first_name || ''} ${p.last_name || ''}`.trim()
const ovr = (p) => p.attr_overall || p.overall || '-'

/**
 * Cambios durante la pausa: se elige quién sale de la cancha y quién entra del banco.
 * El que entra ocupa el puesto del que sale (la media que se muestra es la que tiene en ese puesto).
 */
export default function SubstitutionsPanel({ onField, bench, subsLeft, onSubstitute }) {
  const [outId, setOutId] = useState(null)
  const out = onField.find(p => p.id === outId)

  const confirm = (inId) => {
    onSubstitute(outId, inId)
    setOutId(null)
  }

  return (
    <section aria-label="Cambios" className="space-y-2 rounded-xl border border-line bg-bg/60 p-3">
      <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-fg-muted">
        <ArrowLeftRight className="size-3.5 text-accent" aria-hidden="true" />
        Cambios ({subsLeft} {subsLeft === 1 ? 'disponible' : 'disponibles'})
      </h4>

      {subsLeft === 0 ? (
        <p className="text-[11px] text-fg-subtle">Ya hiciste todos los cambios permitidos.</p>
      ) : !out ? (
        <>
          <p className="text-[11px] text-fg-muted">¿Quién sale?</p>
          <ul className="grid grid-cols-2 gap-1">
            {onField.map(p => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setOutId(p.id)}
                  className="w-full rounded-lg border border-line bg-surface px-2 py-1 text-left text-[11px] text-fg hover:border-accent"
                >
                  <span className="block truncate font-semibold">{nameOf(p)}</span>
                  <span className="text-fg-subtle">{p.slot_base || p.position} · {Math.round(p.slot_rating ?? 0) || ovr(p)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="text-[11px] text-fg-muted">
            Sale <strong className="text-fg">{nameOf(out)}</strong>. ¿Quién entra?
            <button type="button" onClick={() => setOutId(null)} className="ml-2 underline">Elegir otro</button>
          </p>
          {bench.length === 0 ? (
            <p className="text-[11px] text-fg-subtle">No quedan suplentes aptos.</p>
          ) : (
            <ul className="space-y-1">
              {bench.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => confirm(p.id)}
                    className={cn('flex w-full items-center justify-between rounded-lg border border-line bg-surface px-2 py-1 text-left text-[11px] text-fg hover:border-accent')}
                  >
                    <span className="truncate font-semibold">{nameOf(p)}</span>
                    <span className="text-fg-subtle">{p.position} · {ovr(p)} · fís. {Math.round(p.state_fitness ?? 0)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
