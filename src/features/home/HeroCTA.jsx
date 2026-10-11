import React from 'react'
import { Link } from 'react-router-dom'
import { HOME_COPY } from '../../seo/homeSeo'
import { careerTarget } from './PublicHeader'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { track } from '../../lib/analytics'

/**
 * Llamados a la acción. Un solo botón principal: "Probar la demo gratis" para quien llega por primera vez (sin registro) y
 * "Continuar carrera" para quien ya tiene una. "Crear mi carrera" queda como botón secundario. Son enlaces reales, no botones con navegación por código.
 */
export default function HeroCTA({ visitor = 'visitor' }) {
  const hasCareer = visitor === 'career'
  const primary = 'min-h-14 w-full text-lg shadow-[0_0_48px_-12px_var(--color-accent)]'
  const info = (
    <Link
      to="/juego"
      onClick={() => track('game_info_click', { placement: 'hero' })}
      className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
    >
      {HOME_COPY.secondaryCta}
    </Link>
  )
  // Quien ya tiene carrera la continúa; quien llega por primera vez prueba la demo (sin cuenta) y, si le gusta, crea la carrera
  if (hasCareer) {
    return (
      <div className="mt-[clamp(1rem,3svh,2rem)] flex w-full max-w-xs flex-col items-center gap-1">
        <Link
          to={careerTarget(visitor)}
          onClick={() => track('continue_click', { placement: 'hero' })}
          className={cn(buttonVariants({ size: 'lg' }), primary)}
        >
          {HOME_COPY.continueCta}
        </Link>
        {info}
        <Link
          to="/demo"
          onClick={() => track('game_info_click', { placement: 'hero-demo' })}
          className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-accent underline-offset-4 transition-colors hover:underline"
        >
          {HOME_COPY.demoCta}
        </Link>
      </div>
    )
  }
  return (
    <div className="mt-[clamp(1rem,3svh,2rem)] flex w-full max-w-xs flex-col items-center gap-2">
      <Link
        to="/demo"
        onClick={() => track('game_info_click', { placement: 'hero-demo' })}
        className={cn(buttonVariants({ size: 'lg' }), primary)}
      >
        {HOME_COPY.demoCta}
      </Link>
      <Link
        to={careerTarget(visitor)}
        onClick={() => track('register_click', { placement: 'hero' })}
        className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'min-h-12 w-full')}
      >
        {HOME_COPY.primaryCta}
      </Link>
      {info}
    </div>
  )
}
