import React from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../../data/site'
import { cn } from '../../lib/utils'

/** Marca del sitio: sólo la palabra, sin dominio ni subtítulos. Lleva siempre a la portada. */
export default function BrandLogo({ className }) {
  return (
    <Link
      to="/"
      aria-label={`${SITE.name}, ir al inicio`}
      className={cn('inline-flex min-h-11 items-center font-display text-2xl font-bold uppercase leading-none tracking-[0.14em] text-fg sm:text-[1.75rem]', className)}
    >
      {SITE.name}
    </Link>
  )
}
