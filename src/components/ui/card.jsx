import React from 'react'
import { cn } from '../../lib/utils'

/**
 * Superficie base: recorte de diario, plana y con borde fino. Sin sombras decorativas ni degradados.
 * Con `masthead` lleva el filete doble de arriba (para la nota principal de una pantalla).
 */
export const Card = React.forwardRef(function Card({ className, as: Comp = 'section', masthead = false, ...props }, ref) {
  return (
    <Comp
      ref={ref}
      className={cn('rounded-lg border border-line bg-surface shadow-raised', masthead && 'rounded-t-sm border-t-4 border-t-fg [border-top-style:double]', className)}
      {...props}
    />
  )
})

/** Etiqueta chica en rojo sobre un titular ("PRÓXIMO PARTIDO", "DECISIÓN"): el kicker de una nota de diario */
export function Kicker({ className, ...props }) {
  return <p className={cn('font-display text-sm font-bold uppercase tracking-[0.16em] text-danger', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5', className)} {...props} />
}

export function CardTitle({ className, as: Comp = 'h2', ...props }) {
  return <Comp className={cn('font-slab text-lg font-bold leading-tight text-fg', className)} {...props} />
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
