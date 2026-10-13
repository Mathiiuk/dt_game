import React, { useState } from 'react'
import { ArrowLeftRight, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogBody } from '../../components/ui/dialog'
import { benchOf, substitutionsLeft } from '../../domain/substitutions'
import { ratingAtSlot } from '../../domain/ratings'
import { slotBase, positionInfo } from '../../domain/positions'
import { cn } from '../../lib/utils'

const nameOf = (p) => `${p.first_name || ''} ${p.last_name || ''}`.trim()
const LINES = [['ARQ', 'Arquero'], ['DEF', 'Defensa'], ['MED', 'Mediocampo'], ['DEL', 'Ataque']]

/**
 * Cambios en escritorio: a la izquierda los titulares por línea, a la derecha los suplentes ordenados por cuánto rinden en el puesto
 * del que sale. Un clic en el titular y otro en el suplente alcanzan; el partido ya está en pausa mientras esto está abierto.
 */
export default function DesktopSubstitutions({ open, onClose, onField = [], players = [], subsMade = [], onSubstitute, preselectOutId = null, statusById = {} }) {
  const [pickedId, setPickedId] = useState(null)
  const outId = pickedId ?? (onField.some(p => p.id === preselectOutId) ? preselectOutId : null)
  const out = onField.find(p => p.id === outId)
  const left = substitutionsLeft(subsMade)
  const bench = benchOf(players, onField, subsMade)
  const target = out ? (out.slot_base || slotBase(out.position)) : null
  const sorted = out ? [...bench].sort((a, b) => ratingAtSlot(b, target) - ratingAtSlot(a, target)) : bench

  const confirm = (inId) => {
    onSubstitute(outId, inId)
    setPickedId(null)
    onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) { setPickedId(null); onClose?.() } }}>
      <DialogContent placement="center" size="lg" title="Cambios" description={`${left} ${left === 1 ? 'cambio disponible' : 'cambios disponibles'} · el partido está en pausa`}>
        <DialogBody>
          {left === 0 ? (
            <p className="rounded-xl border border-line bg-surface-2 p-6 text-center text-sm text-fg-muted">Ya hiciste todos los cambios permitidos en este partido.</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 py-1">
              <div className="space-y-4">
                <h4 className="eyebrow">Titulares</h4>
                {LINES.map(([line, label]) => {
                  const group = onField.filter(p => positionInfo(p.slot_base || p.position).line === line)
                  if (group.length === 0) return null
                  return (
                    <div key={line} className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">{label}</p>
                      <ul className="space-y-1.5">
                        {group.map(p => {
                          const st = statusById[p.id] || {}
                          const hurt = st.hurt || p.id === preselectOutId
                          return (
                            <li key={p.id}>
                              <button
                                type="button"
                                aria-pressed={p.id === outId}
                                onClick={() => setPickedId(p.id === outId ? null : p.id)}
                                className={cn(
                                  'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                                  p.id === outId ? 'border-primary bg-primary-soft' : hurt ? 'border-danger/40 bg-danger-soft' : 'border-line bg-surface hover:border-primary'
                                )}
                              >
                                <span className="min-w-0 truncate font-semibold text-fg">{nameOf(p)}</span>
                                <span className={cn('shrink-0 text-xs font-medium', hurt ? 'text-danger' : 'text-fg-subtle')}>
                                  {p.slot_base || p.position} · {Math.round(p.slot_rating ?? 0) || p.attr_overall || '-'}
                                  {hurt && ' · Lesionado'}
                                  {!hurt && st.yellow > 0 && ' · Amarilla'}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2">
                <h4 className="eyebrow flex items-center gap-1.5"><ArrowLeftRight className="size-3.5 text-accent" aria-hidden="true" />Suplentes ({bench.length})</h4>
                {!out ? (
                  <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-fg-muted">Elegí a quién sacar y te mostramos quién rinde mejor en su puesto.</p>
                ) : sorted.length === 0 ? (
                  <p className="rounded-xl border border-line p-4 text-sm text-fg-subtle">No quedan suplentes aptos.</p>
                ) : (
                  <>
                    <p className="flex items-center gap-1.5 text-sm text-fg-muted">Sale <strong className="text-fg">{nameOf(out)}</strong><ArrowRight className="size-3.5" aria-hidden="true" />¿quién entra como {target}?</p>
                    <ul aria-label="Suplentes" className="space-y-1.5">
                      {sorted.map(p => {
                        const natural = p.position === target
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => confirm(p.id)}
                              className={cn('flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:border-primary', natural ? 'border-accent/40 bg-accent/10' : 'border-line bg-surface')}
                            >
                              <span className="min-w-0 truncate font-semibold text-fg">{nameOf(p)}</span>
                              <span className={cn('shrink-0 text-xs font-medium', natural ? 'text-accent' : 'text-fg-subtle')}>
                                {p.position} · como {target}: {Math.round(ratingAtSlot(p, target))} · fís. {Math.round(p.state_fitness ?? 0)}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
