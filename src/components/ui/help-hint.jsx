import React from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogBody, DialogFooter, DialogClose } from './dialog'
import { Button } from './button'
import { cn } from '../../lib/utils'

/**
 * Botón "?" que explica algo sin ocupar lugar: al tocarlo abre un cuadro chico con la información.
 * (El Tooltip de hover no sirve en el celular.) El área táctil es de 44 px aunque el círculo se vea chico.
 */
export function HelpHint({ topic, title, children, className }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Ayuda: ${topic}`}
          onClick={(e) => e.stopPropagation()}
          className={cn('group inline-grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-none', className)}
        >
          <span className="grid size-5 place-items-center rounded-full border border-line-strong bg-surface-2 text-xs font-bold leading-none text-fg-muted transition-colors group-hover:text-fg group-focus-visible:ring-2 group-focus-visible:ring-accent">?</span>
        </button>
      </DialogTrigger>
      <DialogContent placement="center" size="sm" title={title}>
        <DialogBody className="space-y-3 text-sm text-fg-muted">{children}</DialogBody>
        <DialogFooter>
          <DialogClose asChild><Button className="w-full sm:w-auto">Entendido</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
