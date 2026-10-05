import React from 'react'
import { HOME_COPY } from '../../seo/homeSeo'

/**
 * Identidad de la portada: el único H1, la bajada y el contexto que explica qué es Vestuario.
 * El contexto es texto visible (no se oculta): es lo que le dice a la gente y a los buscadores que esto es fútbol.
 */
export default function HeroIdentity() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="font-display text-[clamp(3.75rem,min(19vw,15svh),9.5rem)] font-bold uppercase leading-[0.86] text-fg">
        Vos sos <span className="block sm:inline">el DT.</span>
      </h1>
      <p className="mt-[clamp(0.75rem,2.2svh,1.5rem)] max-w-xl text-balance text-base font-medium leading-snug text-fg sm:text-xl">
        {HOME_COPY.subheadline}
      </p>
      <p className="mt-[clamp(0.5rem,1.4svh,1rem)] max-w-lg text-balance text-[0.8125rem] leading-relaxed text-fg-muted sm:text-sm">
        {HOME_COPY.context}
      </p>
    </div>
  )
}
