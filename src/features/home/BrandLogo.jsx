import React from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../../data/site'
import { cn } from '../../lib/utils'

/**
 * Marca del sitio: sólo la palabra, sin dominio ni subtítulos. Lleva siempre a la portada.
 * `masthead` la dibuja como el mástil de un diario (la portada); sin él, es la versión chica de las demás páginas.
 */
export default function BrandLogo({ className, masthead = false }) {
  return (
    <Link
      to="/"
      aria-label={`${SITE.name}, ir al inicio`}
      className={cn(
        'inline-flex items-center font-slab font-extrabold uppercase leading-none text-fg',
        masthead ? 'justify-center text-[2.375rem] tracking-[0.14em] sm:text-6xl lg:text-[4.75rem] lg:tracking-[0.16em]' : 'min-h-11 text-2xl tracking-[0.14em] sm:text-[1.75rem]',
        className
      )}
    >
      {SITE.name}
    </Link>
  )
}
