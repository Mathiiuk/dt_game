import React, { useEffect } from 'react'
import PublicHeader from './PublicHeader'
import ManagerQuoteFlash from './ManagerQuoteFlash'
import HeroIdentity from './HeroIdentity'
import HeroCTA from './HeroCTA'
import EditionColumn from './EditionColumn'
import PublicFooter from './PublicFooter'
import { useVisitorState } from './useVisitorState'
import { useSeo } from '../../seo/useSeo'
import { HOME_SEO } from '../../seo/homeSeo'
import { homeStructuredData } from '../../seo/structuredData'
import { track } from '../../lib/analytics'

// Alto de una pantalla descontando el notch y la barra de gestos (el body ya deja esos márgenes)
export const FULL_SCREEN = 'min-h-[calc(100svh-env(safe-area-inset-top)-env(safe-area-inset-bottom))]'

/**
 * Portada pública de Vestuario: la primera plana de un diario deportivo.
 * Mástil, titular "Vos sos el DT.", llamado a la acción, "El pensamiento del día" y, en pantallas anchas, "En esta edición".
 * Una sola pantalla: lo que no ayuda a entender, a convertir o a navegar no va.
 */
export default function HomeLanding() {
  const visitor = useVisitorState()
  useSeo({ ...HOME_SEO, jsonLd: homeStructuredData() })
  useEffect(() => { track('landing_view', { path: '/' }) }, [])

  return (
    <div className={`relative isolate flex ${FULL_SCREEN} flex-col bg-bg`}>
      <PublicHeader visitor={visitor} masthead />
      <main className="relative z-10 mx-auto flex w-full max-w-[90rem] flex-1 flex-col gap-4 px-5 pb-3 pt-4 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)_minmax(0,1fr)] lg:items-start lg:gap-0 lg:px-12 lg:pt-6">
        <div className="mt-auto lg:mt-0">
          <ManagerQuoteFlash />
        </div>
        <section className="order-first lg:order-none lg:px-9">
          <HeroIdentity />
          <HeroCTA visitor={visitor} />
        </section>
        <EditionColumn />
      </main>
      <PublicFooter />
    </div>
  )
}
