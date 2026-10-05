import React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '../../lib/utils'

/** Interruptor accesible (role=switch) */
export const Switch = React.forwardRef(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full border border-line-strong bg-surface-3 transition-colors',
        'data-[state=checked]:border-accent data-[state=checked]:bg-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className="block size-[1.125rem] translate-x-0.5 rounded-full bg-fg transition-transform data-[state=checked]:translate-x-[1.375rem] data-[state=checked]:bg-accent-fg"
      />
    </SwitchPrimitive.Root>
  )
})

/** Tooltip: el contenido también se expone con aria-label en el disparador (no depende sólo del hover) */
export function Tooltip({ content, children, side = 'top' }) {
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className="z-50 max-w-60 rounded-md border border-line-strong bg-surface-3 px-2.5 py-1.5 text-xs text-fg shadow-overlay animate-fade-in"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

/** Placeholder de carga con la forma del contenido final (evita saltos de layout) */
export function Skeleton({ className, ...props }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-surface-3/70', className)} {...props} />
}

/** Estado vacío: explica qué pasa y ofrece el siguiente paso */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {Icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-surface-2 text-fg-subtle">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="font-display text-xl font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
