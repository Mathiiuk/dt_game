import React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const barVariants = cva('h-full rounded-full transition-[width] duration-500 ease-out', {
  variants: {
    tone: {
      accent: 'bg-accent',
      warning: 'bg-warning',
      danger: 'bg-danger',
      neutral: 'bg-fg-muted'
    }
  },
  defaultVariants: { tone: 'accent' }
})

/** Barra de progreso accesible (role=progressbar). Con `auto` el color depende del valor (verde, ámbar, rojo). */
export function Progress({ value = 0, tone, auto = false, label, className }) {
  const clamped = Math.max(0, Math.min(100, value))
  const autoTone = clamped >= 60 ? 'accent' : clamped >= 35 ? 'warning' : 'danger'

  return (
    <ProgressPrimitive.Root
      value={clamped}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-3', className)}
    >
      <ProgressPrimitive.Indicator
        className={barVariants({ tone: auto ? autoTone : tone })}
        style={{ width: `${clamped}%` }}
      />
    </ProgressPrimitive.Root>
  )
}
