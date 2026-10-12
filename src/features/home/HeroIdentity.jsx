import React from 'react'
import { HOME_COPY } from '../../seo/homeSeo'

/**
 * Titular de la portada: el único H1, la bajada y el contexto que explica qué es Vestuario.
 * El contexto es texto visible (no se oculta): es lo que le dice a la gente y a los buscadores que esto es fútbol.
 */
export default function HeroIdentity() {
  return (
    <div className="flex flex-col lg:items-center lg:text-center">
      <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-danger lg:text-[0.9375rem] lg:tracking-[0.2em]">Portada · Fútbol</p>
      <h1 className="mt-1.5 font-slab text-[clamp(3.25rem,min(16vw,8.5svh),4.25rem)] font-extrabold leading-[0.98] tracking-[-0.02em] text-fg lg:text-[clamp(3.75rem,min(6.5vw,11svh),5.75rem)]">
        Vos sos <span className="block">el DT.</span>
      </h1>
      <p className="mt-3 max-w-xl text-balance text-[1.0625rem] font-semibold leading-snug text-fg lg:text-xl">
        {HOME_COPY.subheadline}
      </p>
      <p className="mt-2 max-w-lg text-balance text-[0.8125rem] leading-relaxed text-fg-muted lg:text-[0.9375rem]">
        {HOME_COPY.context}
      </p>
    </div>
  )
}
