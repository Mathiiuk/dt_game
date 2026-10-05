import React from 'react'
import { cn } from '../../lib/utils'

/** Superficie base: plana, con borde fino. Sin sombras decorativas ni degradados. */
export const Card = React.forwardRef(function Card({ className, as: Comp = 'section', ...props }, ref) {
  return (
    <Comp
      ref={ref}
      className={cn('rounded-lg border border-line bg-surface shadow-raised', className)}
      {...props}
    />
  )
})

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5', className)} {...props} />
}

export function CardTitle({ className, as: Comp = 'h2', ...props }) {
  return <Comp className={cn('font-display text-xl font-semibold leading-tight text-fg', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('mt-1 text-sm text-fg-muted', className)} {...props} />
}

export function CardBody({ className, ...props }) {
  return <div className={cn('px-4 py-4 sm:px-5', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center gap-3 border-t border-line px-4 py-3 sm:px-5', className)} {...props} />
}
