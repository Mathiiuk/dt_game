import React, { useEffect } from 'react'
import Atmosphere from './Atmosphere'
import PublicHeader from './PublicHeader'
import ManagerQuoteFlash from './ManagerQuoteFlash'
import HeroIdentity from './HeroIdentity'
import HeroCTA from './HeroCTA'
import PublicFooter from './PublicFooter'
import { useVisitorState } from './useVisitorState'
import { useSeo } from '../../seo/useSeo'
import { HOME_SEO } from '../../seo/homeSeo'
import { homeStructuredData } from '../../seo/structuredData'
import { track } from '../../lib/analytics'

// Alto de una pantalla descontando el notch y la barra de gestos (el body ya deja esos márgenes)
export const FULL_SCREEN = 'min-h-[calc(100svh-env(safe-area-inset-top)-env(safe-area-inset-bottom))]'

/**
 * Portada pública de Vestuario. Una sola pantalla: encabezado, frase, "Vos sos el DT.", llamado a la acción y pie.
 * Es la tapa de un videojuego, no un catálogo: lo que no ayuda a entender, a convertir o a navegar no va.
 */
export default function HomeLanding() {
  const visitor = useVisitorState()
  useSeo({ ...HOME_SEO, jsonLd: homeStructuredData() })
  useEffect(() => { track('landing_view', { path: '/' }) }, [])

  return (
    <div className={`relative isolate grid ${FULL_SCREEN} grid-rows-[auto_1fr_auto]`}>
      <Atmosphere />
      <PublicHeader visitor={visitor} />
      <main className="relative z-10 flex flex-col items-center justify-center px-5 pb-3 text-center">
        <ManagerQuoteFlash />
        <div className="h-[clamp(0.75rem,3svh,2.25rem)]" />
        <HeroIdentity />
        <HeroCTA visitor={visitor} />
      </main>
      <PublicFooter />
    </div>
  )
}
