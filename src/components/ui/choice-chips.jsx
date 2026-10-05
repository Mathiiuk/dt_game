import React, { useRef } from 'react'
import { cn } from '../../lib/utils'

/**
 * Grupo de opciones excluyentes en forma de chips que se acomodan en varias filas.
 * Alternativa a `Segmented` cuando hay 4-5 opciones con etiquetas largas (no caben en una fila en móvil).
 * Es un radiogroup real: flechas para moverse, `aria-checked` para el estado.
 */
export function ChoiceChips({ value, onChange, options, label, className }) {
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
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-1.5', className)}>
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
              'min-h-10 rounded-md border px-3 text-sm font-semibold transition-colors',
              active
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line-strong bg-surface-2 text-fg-muted hover:border-fg-subtle hover:text-fg'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
