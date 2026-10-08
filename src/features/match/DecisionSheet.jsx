import React from 'react'
import { Dialog, DialogContent, DialogBody } from '../../components/ui/dialog'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import DecisionCard from './DecisionCard'

/**
 * Momento crítico: el partido queda pausado y el DT decide.
 * Móvil: hoja compacta desde abajo (el partido se sigue viendo arriba). Escritorio: diálogo centrado y angosto.
 * No se cierra tocando afuera ni con Esc: hay que elegir una opción.
 */
export default function DecisionSheet({ open, moment, onChoose }) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  if (!moment) return null

  return (
    <Dialog open={open}>
      <DialogContent
        placement={isDesktop ? 'center' : 'bottom'}
        size="sm"
        hideClose
        title="¡Momento crítico!"
        className="max-h-[75dvh]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogBody className="px-4 py-3">
          <DecisionCard moment={moment} onChoose={onChoose} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
