import React from 'react'
import { Link } from 'react-router-dom'
import { HOME_COPY } from '../../seo/homeSeo'
import { careerTarget } from './PublicHeader'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { track } from '../../lib/analytics'

/**
 * Llamados a la acción. El principal vende la carrera ("Crear mi carrera", o "Continuar carrera" si ya hay una);
 * el secundario lleva a conocer el juego. Son enlaces reales, no botones con navegación por código.
 */
export default function HeroCTA({ visitor = 'visitor' }) {
  const hasCareer = visitor === 'career'
  return (
    <div className="mt-[clamp(1rem,3svh,2rem)] flex w-full max-w-xs flex-col items-center gap-1">
      <Link
        to={careerTarget(visitor)}
        onClick={() => track(hasCareer ? 'continue_click' : 'register_click', { placement: 'hero' })}
        className={cn(buttonVariants({ size: 'lg' }), 'min-h-14 w-full text-lg shadow-[0_0_48px_-12px_var(--color-accent)]')}
      >
        {hasCareer ? HOME_COPY.continueCta : HOME_COPY.primaryCta}
      </Link>
      <Link
        to="/juego"
        onClick={() => track('game_info_click', { placement: 'hero' })}
        className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
      >
        {HOME_COPY.secondaryCta}
      </Link>
    </div>
  )
}
