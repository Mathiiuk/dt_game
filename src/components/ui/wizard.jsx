import React, { useRef } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { usePageLock } from '../../hooks/usePageLock'

/** Indicador de pasos: lista ordenada con `aria-current="step"`; en móvil sólo muestra el paso actual con su nombre */
export function Stepper({ steps, step }) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium text-fg-muted sm:hidden" aria-hidden="true">
        Paso {step} de {steps.length} · <span className="text-fg">{steps[step - 1]}</span>
      </p>
      <ol className="flex items-center gap-1.5" aria-label="Progreso del asistente">
        {steps.map((label, i) => {
          const n = i + 1
          const done = step > n
          const current = step === n
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5" aria-current={current ? 'step' : undefined}>
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold',
                  current && 'bg-accent text-accent-fg',
                  done && 'bg-accent-soft text-accent',
                  !current && !done && 'border border-line text-fg-subtle'
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden="true" /> : n}
                <span className="sr-only">{done ? ' (completado)' : current ? ' (actual)' : ''}</span>
              </span>
              <span className={cn('hidden truncate text-xs font-medium sm:block', current ? 'text-fg' : 'text-fg-subtle')}>{label}</span>
              {n < steps.length && <span className={cn('h-px flex-1', done ? 'bg-accent' : 'bg-line')} aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/**
 * Marco del asistente: encabezado, pasos, contenido y barra de navegación.
 * En el celular es un marco fijo (`fixed inset-0`): el contenido scrollea adentro y la barra de pasos queda en el flujo, abajo,
 * sin `position: fixed` propio (en iOS las barras fijas se descolocan al scrollear). En escritorio es una página normal.
 */
export function Wizard({ eyebrow, title, steps, step, onBack, onNext, nextLabel, finalLabel, isLast, loading, nextDisabled, children }) {
  const isLg = useMediaQuery('(min-width: 1024px)')
  usePageLock(!isLg)

  const bar = (
    <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
      {step > 1 ? <Button variant="outline" onClick={onBack}><ChevronLeft />Atrás</Button> : <span />}
      {isLast ? (
        <Button size="lg" loading={loading} disabled={nextDisabled} onClick={onNext}>{finalLabel}</Button>
      ) : (
        <Button disabled={nextDisabled} onClick={onNext}>{nextLabel || 'Siguiente'}<ChevronRight /></Button>
      )}
    </div>
  )

  return (
    <main className="fixed inset-0 flex flex-col bg-bg lg:static lg:block lg:min-h-dvh">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-[max(2rem,env(safe-area-inset-top))] lg:overflow-visible lg:pb-10 lg:pt-8">
        <div className="mx-auto w-full max-w-2xl">
          <header className="mb-6">
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h1 className="font-display text-3xl font-semibold leading-none text-fg sm:text-4xl break-words">{title}</h1>
          </header>
          <div className="mb-6"><Stepper steps={steps} step={step} /></div>

          <section aria-label={steps[step - 1]} className="rounded-xl border border-line bg-surface p-5 shadow-raised sm:p-7">
            {children}
          </section>

          {isLg && <div className="mt-5">{bar}</div>}
        </div>
      </div>
      {!isLg && <div className="shrink-0 border-t border-line bg-bg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">{bar}</div>}
    </main>
  )
}

/** Grupo de tarjetas excluyentes (radiogroup) con navegación por flechas */
export function OptionCards({ value, onChange, options, label, columns = 'sm:grid-cols-2', renderOption }) {
  const refs = useRef([])
  const onKeyDown = (event, index) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return
    event.preventDefault()
    const dir = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    const next = (index + dir + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} className={cn('grid grid-cols-1 gap-2.5', columns)}>
      {options.map((opt, index) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            ref={(el) => { refs.current[index] = el }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (value === undefined && index === 0) ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'rounded-lg border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              active ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2 hover:border-line-strong'
            )}
          >
            {renderOption ? renderOption(opt, active) : (
              <>
                <span className={cn('block text-sm font-semibold', active ? 'text-accent' : 'text-fg')}>{opt.title}</span>
                {opt.description && <span className="mt-0.5 block text-xs text-fg-muted">{opt.description}</span>}
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
