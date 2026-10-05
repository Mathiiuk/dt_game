import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

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

export const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? children : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {children}
        </>
      )}
    </Comp>
  )
})
