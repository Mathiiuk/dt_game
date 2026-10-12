import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

const TONE = { good: 'text-accent', bad: 'text-danger', warn: 'text-warning', neutral: 'text-fg' }
const CELL = 'flex min-w-0 flex-col items-center gap-0.5 px-1 py-2.5 text-center'

/**
 * Tira de datos de diario: 2 a 4 cifras grandes entre filetes (filete doble arriba), en vez de tarjetas de estadísticas.
 * `items`: [{ label, value, hint?, tone?: 'good'|'bad'|'warn', to? }]. Con `to` la celda es un enlace a su sección.
 */
export function DataStrip({ items, label, className }) {
  const cols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[items.length] || 'grid-cols-3'
  return (
    <ul aria-label={label} className={cn('grid divide-x divide-line border-y border-b-line-strong border-t-[3px] border-t-fg [border-top-style:double]', cols, className)}>
      {items.map(({ label: name, value, hint, tone = 'neutral', to }) => {
        const body = (
          <>
            <span className={cn('num max-w-full truncate font-display font-bold leading-none', items.length > 3 ? 'text-[1.375rem]' : 'text-[1.625rem]', TONE[tone])}>{value}</span>
            <span className="eyebrow">{name}</span>
            {hint && <span className="text-[0.6875rem] text-fg-subtle">{hint}</span>}
          </>
        )
        return (
          <li key={name} className="min-w-0">
            {to ? <Link to={to} className={cn(CELL, 'transition-colors hover:bg-surface-2')}>{body}</Link> : <div className={CELL}>{body}</div>}
          </li>
        )
      })}
    </ul>
  )
}
