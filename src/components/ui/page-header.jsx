import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

/**
 * Cabecera de página: título de revista, descripción corta y acciones a la derecha.
 * Con `backTo` muestra un botón de volver con área táctil de 44 px (útil en páginas que reemplazan modales en móvil).
 */
export function PageHeader({ title, description, eyebrow, backTo, actions, className }) {
  const navigate = useNavigate()

  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-5', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {backTo && (
          <button
            type="button"
            onClick={() => (backTo === true ? navigate(-1) : navigate(backTo))}
            className="-ml-2 grid size-11 shrink-0 place-items-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label="Volver"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h1 className="font-display text-3xl font-semibold leading-none text-fg sm:text-4xl truncate">{title}</h1>
          {description && <p className="mt-2 max-w-prose text-sm text-fg-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Título de sección dentro de una página */
export function SectionTitle({ children, action, className }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="font-display text-xl font-semibold text-fg truncate">{children}</h2>
      {action}
    </div>
  )
}
