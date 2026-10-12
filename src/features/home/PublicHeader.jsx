import React from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import EditionDate from './EditionDate'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { track } from '../../lib/analytics'

// A dónde lleva el botón principal según quién mira
export const careerTarget = (visitor) => (visitor === 'career' ? '/dashboard' : visitor === 'no-career' ? '/create-manager' : '/registro')

/**
 * Encabezado público: la marca y el acceso. En móvil los textos se acortan ("Entrar", "Crear") pero el nombre accesible sigue siendo el completo.
 * Con `masthead` (la portada) la marca es el mástil de un diario: filete doble, "El diario del DT" y la fecha.
 */
export default function PublicHeader({ visitor = 'visitor', masthead = false }) {
  const primary = cn(buttonVariants({ size: 'md' }), 'px-3.5 sm:px-4')
  const nav = (
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
  )

  if (!masthead) {
    return (
      <header className="relative z-10 flex items-center justify-between gap-3 border-b border-line-strong px-4 py-2 sm:px-8 sm:py-3">
        <BrandLogo />
        {nav}
      </header>
    )
  }
  return (
    <header className="relative z-10 mx-auto w-full max-w-[90rem] px-5 pt-2 sm:px-8 lg:px-12 lg:pt-4">
      <div className="flex justify-end">{nav}</div>
      <div className="border-y border-b-fg border-t-[4px] border-t-fg py-2 text-center [border-top-style:double] lg:border-t-[5px] lg:py-3">
        <BrandLogo masthead />
        <p className="mt-1 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-fg-muted lg:text-base lg:tracking-[0.22em]">El diario del DT · Edición de hoy</p>
      </div>
      <div className="flex items-center justify-between border-b border-line-strong py-1 font-display text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-fg-muted lg:text-sm">
        <EditionDate />
        <span>Juego gratis · sin descargas</span>
      </div>
    </header>
  )
}
