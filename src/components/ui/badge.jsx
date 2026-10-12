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
        primary: 'bg-primary-soft text-primary',
        warning: 'bg-warning-soft text-warning',
        danger: 'bg-danger-soft text-danger',
        gold: 'bg-gold-soft text-gold'
      }
    },
    defaultVariants: { tone: 'neutral' }
  }
)

// Sello de goma (Lesionado, Expulsado, 5 amarillas): borde grueso del color del estado, versalitas y apenas inclinado
const STAMP_TONE = { danger: 'border-danger text-danger', warning: 'border-warning text-warning', gold: 'border-gold text-gold', accent: 'border-accent text-accent', neutral: 'border-fg-muted text-fg-muted' }

export function Badge({ className, tone, dot = false, stamp = false, children, ...props }) {
  if (stamp) {
    return (
      <span className={cn('inline-flex -rotate-2 items-center gap-1.5 rounded-[3px] border-2 bg-transparent px-1.5 font-display text-sm font-bold uppercase leading-5 tracking-[0.1em]', STAMP_TONE[tone || 'neutral'], className)} {...props}>
        {children}
      </span>
    )
  }
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
