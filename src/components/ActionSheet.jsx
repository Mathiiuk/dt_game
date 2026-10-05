import React, { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

// Variantes heredadas (colores) -> intención del botón de confirmar
const DANGER_VARIANTS = new Set(['red', 'danger'])

/**
 * Confirmación de acciones. Es la única superposición que sigue siendo "hoja inferior" en móvil: una pregunta de sí/no
 * no necesita una página completa. En escritorio se muestra centrada. Sobre Radix: foco atrapado, Esc cancela, ARIA correcto.
 * La API (isOpen / config / onConfirm / onCancel) no cambió.
 */
export default function ActionSheet({ isOpen, config, onConfirm, onCancel }) {
  const [muted, setMuted] = useState(false)
  if (!config) return null

  const {
    title = '¿Confirmar acción?',
    description = '',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'primary',
    icon: CustomIcon,
    muteKey
  } = config

  const danger = DANGER_VARIANTS.has(variant)
  const Icon = CustomIcon || (danger ? AlertTriangle : HelpCircle)

  return (
    <DialogPrimitive.Root open={!!isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-bg/80 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-[70] w-full border border-line bg-surface p-5 shadow-overlay focus-visible:outline-none',
            // Móvil: hoja anclada abajo, respetando la barra de gestos. Escritorio: tarjeta centrada.
            'inset-x-0 bottom-0 rounded-t-xl pb-safe data-[state=open]:animate-rise-in',
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl'
          )}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />

          <div className="flex items-start gap-3.5">
            <span
              className={cn('grid size-10 shrink-0 place-items-center rounded-md', danger ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent')}
              aria-hidden="true"
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="font-display text-xl font-semibold leading-snug text-fg">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm leading-relaxed text-fg-muted">{description}</DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
          </div>

          {muteKey && (
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-fg-muted">
              <input type="checkbox" checked={muted} onChange={(e) => setMuted(e.target.checked)} className="size-4 accent-[var(--color-accent)]" />
              No avisarme más de esto
            </label>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => { setMuted(false); onCancel() }} className="sm:min-w-28">{cancelText}</Button>
            <Button variant={danger ? 'danger' : 'primary'} onClick={() => { const choice = muted; setMuted(false); onConfirm(choice) }} className="sm:min-w-28">{confirmText}</Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
