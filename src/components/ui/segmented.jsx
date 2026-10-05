import React, { useRef } from 'react'
import { cn } from '../../lib/utils'

/**
 * Control segmentado (radio group visual) para opciones excluyentes: mentalidad, ritmo, formación...
 * Navegable con flechas; cada opción es un radio real (role=radio) con estado `aria-checked`.
 */
export function Segmented({ value, onChange, options, label, className, size = 'md' }) {
  // Referencias a cada radio para mover el foco de inmediato (sin esperar al re-render)
  const refs = useRef([])

  const handleKeyDown = (event, index) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return
    event.preventDefault()
    const dir = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (index + dir + options.length) % options.length
    onChange(options[nextIndex].value)
    refs.current[nextIndex]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex w-full rounded-md border border-line bg-surface-2 p-0.5', className)}
    >
      {options.map((opt, index) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            ref={(el) => { refs.current[index] = el }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'flex-1 rounded-[0.4rem] px-2 font-semibold transition-colors',
              size === 'sm' ? 'min-h-9 text-xs' : 'min-h-10 text-sm',
              active ? 'bg-surface-3 text-fg shadow-sm' : 'text-fg-subtle hover:text-fg'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
