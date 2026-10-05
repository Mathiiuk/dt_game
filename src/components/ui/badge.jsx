import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

/** Etiqueta de estado. El color sólo comunica significado (acento, aviso, peligro, oro). */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-semibold leading-5',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-3 text-fg-muted',
        accent: 'bg-accent-soft text-accent',
        warning: 'bg-warning-soft text-warning',
        danger: 'bg-danger-soft text-danger',
        gold: 'bg-gold-soft text-gold'
      }
    },
    defaultVariants: { tone: 'neutral' }
  }
)

export function Badge({ className, tone, dot = false, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
