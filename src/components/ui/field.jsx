import React, { useId } from 'react'
import { cn } from '../../lib/utils'

const controlBase = [
  'w-full min-h-11 rounded-md border border-line-strong bg-surface-2 px-3 text-sm text-fg',
  'placeholder:text-fg-subtle transition-colors',
  'hover:border-fg-subtle focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/30'
].join(' ')

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(controlBase, className)} {...props} />
})

export const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(controlBase, 'appearance-none bg-no-repeat pr-9', className)} {...props}>
      {children}
    </select>
  )
})

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(controlBase, 'min-h-24 py-2.5', className)} {...props} />
})

/**
 * Campo con etiqueta, ayuda y error asociados por ARIA.
 * Recibe una función hija para inyectar `id`, `aria-describedby` y `aria-invalid` en el control.
 */
export function Field({ label, hint, error, className, children }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-fg">{label}</label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && !error && <p id={hintId} className="text-xs text-fg-subtle">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}
