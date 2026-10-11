import React from 'react'
import { Coins, Crown, Shirt, Users } from 'lucide-react'
import { cn } from '../lib/utils'
import { describeEffect } from '../domain/storyFlavor'

const ICONS = { fans: Users, locker: Shirt, board: Crown, budget: Coins }

/**
 * Qué cambió tras una decisión: una fila por efecto con ícono, barra que se llena según la fuerza y el número con signo.
 * Las filas entran escalonadas; con "menos movimiento" aparecen de golpe (regla global de index.css).
 */
export default function EffectMeters({ chips, className }) {
  if (!chips?.length) return null
  return (
    <ul aria-label="Lo que cambió" className={cn('space-y-2', className)}>
      {chips.map((c, i) => {
        const Icon = ICONS[c.key] || Users
        const up = c.value > 0
        return (
          <li key={c.key} aria-label={describeEffect(c)} className="animate-rise-in" style={{ animationDelay: `${i * 90}ms`, animationFillMode: 'backwards' }}>
            <div className="flex items-center justify-between gap-3 text-sm" aria-hidden="true">
              <span className="flex min-w-0 items-center gap-2 text-fg-muted"><Icon className="size-4 shrink-0" />{c.label}</span>
              <span className={cn('num shrink-0 font-semibold', up ? 'text-accent' : 'text-danger')}>{up ? '▲ +' : '▼ '}{c.value}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
              <div className={cn('h-full rounded-full', up ? 'bg-accent' : 'bg-danger')} style={{ width: `${Math.round(c.fill * 100)}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
