import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAsyncClick } from '../../hooks/useAsyncClick'

/**
 * Botón base. Áreas táctiles de al menos 44 px de alto en móvil (48 px en `lg`),
 * estados hover / active / focus-visible / disabled y variante de carga.
 */
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold',
    'transition-[background-color,border-color,color,transform] duration-150',
    'active:translate-y-px disabled:pointer-events-none disabled:opacity-45',
    '[&_svg]:size-4 [&_svg]:shrink-0'
  ],
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg hover:bg-accent-strong',
        secondary: 'bg-surface-3 text-fg hover:bg-line-strong',
        outline: 'border border-line-strong bg-transparent text-fg hover:bg-surface-2',
        ghost: 'bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg',
        danger: 'bg-danger text-bg hover:brightness-110',
        link: 'h-auto min-h-0 px-0 text-accent underline-offset-4 hover:underline'
      },
      size: {
        sm: 'min-h-9 px-3 text-sm',
        md: 'min-h-11 px-4 text-sm',
        lg: 'min-h-12 px-6 text-base',
        icon: 'size-11 p-0'
      }
    },
    defaultVariants: { variant: 'primary', size: 'md' }
  }
)

/**
 * Botón del sistema de diseño. Si `onClick` devuelve una promesa el botón se bloquea solo y muestra el spinner
 * hasta que termina (sin que la pantalla maneje el estado) y un doble clic ejecuta la acción una sola vez.
 * `loading` sigue sirviendo para estados de carga que controla la pantalla.
 */
export const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, loading = false, disabled, children, onClick, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button'
  const [handleClick, pending] = useAsyncClick(onClick)
  const busy = loading || pending
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      onClick={handleClick}
      {...props}
    >
      {asChild ? children : (
        <>
          {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
          {children}
        </>
      )}
    </Comp>
  )
})

/**
 * Botón sin estilos propios (conserva las clases que se le pasen) con el mismo bloqueo y spinner que `Button`.
 * Sirve para reemplazar `<button>` sueltos que disparan acciones asíncronas sin tocar su diseño.
 */
export const AsyncButton = React.forwardRef(function AsyncButton({ children, onClick, disabled, type = 'button', ...props }, ref) {
  const [handleClick, pending] = useAsyncClick(onClick)
  return (
    <button ref={ref} type={type} disabled={disabled || pending} aria-busy={pending || undefined} onClick={handleClick} {...props}>
      {pending && <Loader2 className="mr-1.5 inline size-4 animate-spin align-[-0.15em]" aria-hidden="true" />}
      {children}
    </button>
  )
})
