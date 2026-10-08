import React, { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Trash2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '../../api/auth'
import { friendlyError } from '../../lib/errors'
import { hardRedirect } from '../../lib/redirect'
import { Button, Input } from '../ui'

export const CONFIRM_WORD = 'ELIMINAR'

/**
 * Eliminar la cuenta con todos sus datos (sirve para cuentas con correo y con Google).
 * Pide escribir ELIMINAR; al terminar cierra la sesión y vuelve a la portada. No se puede deshacer.
 */
export default function DeleteAccountDialog({ open, onClose }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const ready = text.trim().toUpperCase() === CONFIRM_WORD

  const close = () => { if (!busy) { setText(''); onClose() } }

  const remove = async () => {
    if (!ready || busy) return
    setBusy(true)
    try {
      await authApi.deleteAccount(text.trim())
      hardRedirect('/')
    } catch (e) {
      toast.error(friendlyError(e, 'No pudimos eliminar la cuenta. Probá de nuevo.'))
      setBusy(false)
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) close() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-bg/80 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-[70] w-full rounded-t-xl border border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-overlay focus-visible:outline-none data-[state=open]:animate-rise-in sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
          <div className="flex items-start gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-danger-soft text-danger" aria-hidden="true"><TriangleAlert className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="font-display text-xl font-semibold leading-snug text-fg">Eliminar mi cuenta</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm leading-relaxed text-fg-muted">
                Se borran tu cuenta (correo o Google) y toda tu carrera: club, plantel, finanzas, historias, logros y partidos. No se puede deshacer.
              </DialogPrimitive.Description>
            </div>
          </div>

          <label className="mt-4 block text-sm text-fg-muted">
            Para confirmar, escribí <strong className="text-fg">{CONFIRM_WORD}</strong>
            <Input
              className="mt-2"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              aria-label="Confirmación"
              placeholder={CONFIRM_WORD}
              disabled={busy}
            />
          </label>

          <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={close} disabled={busy} className="sm:min-w-28">Cancelar</Button>
            <Button variant="danger" onClick={remove} disabled={!ready} loading={busy} className="sm:min-w-28">
              {!busy && <Trash2 />}Eliminar todo
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
