import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

/**
 * Cabecera de página: título de revista, descripción corta y acciones a la derecha.
 * Con `actionsFill` las acciones ocupan todo el ancho en el celular (para repartirlo entre botones parecidos, ver `QuickActions`).
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
  actionsFill = false,
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
      {actions && <div className={cn('flex flex-wrap items-center gap-2', actionsFill && 'w-full sm:w-auto')}>{actions}</div>}
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

/**
 * Atajos de la cabecera de una página (varios botones parecidos): siempre en una sola fila.
 * En el celular cada botón ocupa lo mismo, con el icono arriba y el texto abajo; desde `sm`, icono y texto en línea.
 * Para distinguirlos, cada icono lleva su color (`quickIconClass`).
 */
export function QuickActions({ children, className }) {
  return <div className={cn('flex w-full items-stretch gap-2 sm:w-auto', className)}>{children}</div>
}

/** Clase para los botones dentro de `QuickActions` */
export const QUICK_ACTION = 'h-auto min-h-14 min-w-0 flex-1 flex-col gap-1 px-1 py-2 text-xs sm:min-h-9 sm:flex-none sm:flex-row sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm'
