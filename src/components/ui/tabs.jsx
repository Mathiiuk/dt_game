import React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'

/**
 * Pestañas con subrayado. En móvil la lista se desplaza horizontalmente sin barra visible
 * (nada de pestañas que se cortan o se apilan).
 */
export const Tabs = TabsPrimitive.Root

export const TabsList = React.forwardRef(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
      {...props}
    />
  )
})

export const TabsTrigger = React.forwardRef(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'relative min-h-11 shrink-0 px-3.5 text-sm font-semibold text-fg-subtle transition-colors',
        'hover:text-fg data-[state=active]:text-fg',
        'after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent',
        'data-[state=active]:after:bg-accent',
        className
      )}
      {...props}
    />
  )
})

export const TabsContent = React.forwardRef(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cn('pt-5 animate-rise-in focus-visible:outline-none', className)} {...props} />
})
