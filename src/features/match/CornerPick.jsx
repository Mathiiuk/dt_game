import React, { useState } from 'react'
import { Lightbulb, Flag } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Córner a favor: se elige a qué zona del área va el centro. El banco da una pista de por dónde está floja la defensa
 * (acierta casi siempre, no siempre). `options` traen `zone` ('NEAR' | 'MID' | 'FAR') y `hint` es la zona que marca el banco.
 */
export default function CornerPick({ options, hint, onChoose }) {
  const [picked, setPicked] = useState(null)
  const byZone = Object.fromEntries(options.map(o => [o.zone, o]))
  const hintOption = byZone[hint]

  const choose = (zone) => {
    if (picked) return
    setPicked(zone)
    setTimeout(() => onChoose(byZone[zone]), 600)
  }

  return (
    <div className="space-y-3">
      {hintOption && (
        <p className="flex items-start gap-2 rounded-lg border border-gold/40 bg-gold-soft px-3 py-2 text-xs text-fg">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
          <span>Desde el banco te avisan: la defensa rival está floja <strong>{hintOption.label.toLowerCase()}</strong>. Casi siempre aciertan, pero no siempre.</span>
        </p>
      )}
      {/* El área vista desde arriba: el córner se cobra desde abajo a la derecha; el arco está arriba */}
      <div className="relative mx-auto h-40 w-full max-w-xs overflow-hidden rounded-lg border border-line bg-[#14301d]">
        <div className="absolute inset-x-6 top-0 h-3 border-x-2 border-b-2 border-fg/70" aria-hidden="true" />
        <div className="absolute inset-x-3 top-0 h-24 border-x-2 border-b-2 border-fg/30" aria-hidden="true" />
        <Flag className="absolute bottom-1 right-1 size-5 text-gold" aria-hidden="true" />
        <div className="absolute inset-x-3 top-3 grid h-24 grid-cols-3">
          {['NEAR', 'MID', 'FAR'].map(zone => (
            <button
              key={zone}
              type="button"
              disabled={!!picked}
              onClick={() => choose(zone)}
              aria-hidden="true"
              tabIndex={-1}
              className={cn(
                'flex items-end justify-center border-l border-dashed border-fg/20 pb-1 text-[0.6875rem] font-bold uppercase tracking-wider text-fg-muted transition-colors first:border-l-0 disabled:cursor-default',
                picked === zone ? 'bg-accent/40 text-accent' : hint === zone ? 'bg-gold/10' : 'hover:bg-accent-soft active:bg-accent/30'
              )}
            >
              {zone === 'NEAR' ? '1º palo' : zone === 'MID' ? 'Medio' : '2º palo'}
            </button>
          ))}
        </div>
      </div>
      <ul className="space-y-1.5">
        {options.map(o => (
          <li key={o.id}>
            <button type="button" disabled={!!picked} onClick={() => choose(o.zone)} className={cn('w-full rounded-lg border bg-surface p-3 text-left text-sm text-fg transition-colors disabled:opacity-60', picked === o.zone ? 'border-accent' : 'border-line hover:border-accent')}>
              <span className="block font-bold">{o.label}</span>
              <span className="text-xs text-fg-subtle">{o.desc}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
