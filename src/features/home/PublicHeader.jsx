import React from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { track } from '../../lib/analytics'

// A dónde lleva el botón principal según quién mira
export const careerTarget = (visitor) => (visitor === 'career' ? '/dashboard' : visitor === 'no-career' ? '/create-manager' : '/registro')

/**
 * Encabezado público: la marca a la izquierda y el acceso a la derecha.
 * En móvil los textos se acortan ("Entrar", "Crear") pero el nombre accesible sigue siendo el completo.
 */
export default function PublicHeader({ visitor = 'visitor' }) {
  const primary = cn(buttonVariants({ size: 'md' }), 'px-3.5 sm:px-4')
  return (
    <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-2 sm:px-8 sm:py-4">
      <BrandLogo />
      <nav aria-label="Acceso" className="flex items-center gap-1 sm:gap-3">
        {visitor === 'visitor' ? (
          <>
            <Link
              to="/login"
              aria-label="Iniciar sesión"
              onClick={() => track('login_click', { placement: 'header' })}
              className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
            >
              <span className="sm:hidden">Entrar</span>
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Link>
            <Link to="/registro" aria-label="Crear mi carrera" onClick={() => track('register_click', { placement: 'header' })} className={primary}>
              <span className="sm:hidden">Crear</span>
              <span className="hidden sm:inline">Crear mi carrera</span>
            </Link>
          </>
        ) : (
          <Link to={careerTarget(visitor)} onClick={() => track('continue_click', { placement: 'header' })} className={primary}>
            Continuar
          </Link>
        )}
      </nav>
    </header>
  )
}
