import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Dialog y Sheet (panel lateral) sobre Radix: foco atrapado, Esc para cerrar, aria correctos.
 * Estructura: cabecera fija + cuerpo con scroll + pie fijo, para que nada se corte en pantallas bajas.
 * Pensado para escritorio; en móvil las vistas equivalentes son páginas completas (ver ResponsiveOverlay).
 */
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

const Overlay = React.forwardRef(function Overlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn('fixed inset-0 z-50 bg-bg/80 backdrop-blur-[2px] data-[state=open]:animate-fade-in', className)}
      {...props}
    />
  )
})

const contentVariants = cva(
  'fixed z-50 flex max-h-[min(88vh,52rem)] flex-col border border-line bg-surface shadow-overlay focus-visible:outline-none',
  {
    variants: {
      placement: {
        center: 'left-1/2 top-1/2 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl data-[state=open]:animate-rise-in',
        right: 'inset-y-0 right-0 max-h-none w-full rounded-l-xl border-r-0 data-[state=open]:animate-fade-in'
      },
      size: {
        sm: '',
        md: '',
        lg: ''
      }
    },
    compoundVariants: [
      { placement: 'center', size: 'sm', class: 'max-w-md' },
      { placement: 'center', size: 'md', class: 'max-w-2xl' },
      { placement: 'center', size: 'lg', class: 'max-w-4xl' },
      { placement: 'right', size: 'sm', class: 'max-w-sm' },
      { placement: 'right', size: 'md', class: 'max-w-lg' },
      { placement: 'right', size: 'lg', class: 'max-w-2xl' }
    ],
    defaultVariants: { placement: 'center', size: 'md' }
  }
)

export const DialogContent = React.forwardRef(function DialogContent(
  { className, placement, size, title, description, children, hideClose = false, ...props },
  ref
) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(contentVariants({ placement, size }), className)}
        {...props}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <DialogPrimitive.Title className="font-display text-2xl font-semibold leading-tight text-fg">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1 text-sm text-fg-muted">{description}</DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          {!hideClose && (
            <DialogPrimitive.Close
              className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
              aria-label="Cerrar"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          )}
        </header>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

/** Cuerpo con scroll interno */
export function DialogBody({ className, ...props }) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', className)} {...props} />
}

/** Pie con las acciones; queda fijo al fondo */
export function DialogFooter({ className, ...props }) {
  return (
    <footer
      className={cn('flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}
