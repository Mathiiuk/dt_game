import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

/**
 * Cabecera de página: título de revista, descripción corta y acciones a la derecha.
 * Con `backTo` muestra un botón de volver con área táctil de 44 px (útil en páginas que reemplazan modales en móvil).
 * En móvil (< lg) el título ya vive en la barra superior (MobileTopBar), por lo que se ocultan el h1,
 * la volanta y la bajada para no duplicar y aprovechar todo el alto de pantalla.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  backTo,
  actions,
  className,
  showMobileTitle = false
}) {
  const navigate = useNavigate()
  const hasMobileContent = Boolean(backTo || actions || showMobileTitle)

  return (
    <header
      className={cn(
        'items-center justify-between gap-x-6 gap-y-3 pb-4 lg:items-end lg:pb-5',
        hasMobileContent ? 'flex flex-wrap' : 'hidden lg:flex',
        className
      )}
    >
      <div className={cn('items-start gap-3', (backTo || showMobileTitle) ? 'flex min-w-0' : 'hidden lg:flex lg:min-w-0')}>
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
        <div className={cn('min-w-0', !showMobileTitle && 'hidden lg:block')}>
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h1 className="truncate font-display text-3xl font-semibold leading-none text-fg sm:text-4xl">{title}</h1>
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
