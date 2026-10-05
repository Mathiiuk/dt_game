import React, { useEffect, useId, useRef } from 'react'
import { Dialog, DialogContent, DialogBody, DialogFooter } from './dialog'
import { useIsDesktop } from '../../hooks/useMediaQuery'

// Identificadores de las superposiciones actualmente montadas (a nivel de módulo)
const activeOverlays = new Set()

/**
 * Superposición adaptable:
 * - Escritorio/tablet (>= 768 px): diálogo centrado o panel lateral (`placement`), mejor distribuido.
 * - Móvil: PÁGINA COMPLETA con flecha "volver". Además registra una entrada en el historial para que el
 *   botón/gesto "atrás" del teléfono cierre la página en vez de salir de la pantalla anterior.
 *
 * Se monta cuando se necesita (`{abierto && <ResponsiveOverlay .../>}`), igual que los modales anteriores,
 * o se controla con `open`.
 */
export function ResponsiveOverlay({
  open = true,
  onClose,
  title,
  description,
  size = 'md',
  placement = 'center',
  footer,
  children
}) {
  const isDesktop = useIsDesktop()
  const id = useId()
  const closedByHistory = useRef(false)

  // Móvil: una entrada de historial por apertura; "atrás" la consume y cierra.
  // `activeOverlays` evita que el doble montaje de StrictMode (montar, desmontar, montar) quite y vuelva a poner la entrada:
  // el retiro del historial se decide en el siguiente tick, sólo si la superposición realmente dejó de estar montada.
  useEffect(() => {
    if (!open || isDesktop) return undefined

    activeOverlays.add(id)
    if (window.history.state?.__overlay !== id) {
      window.history.pushState({ ...(window.history.state || {}), __overlay: id }, '')
    }
    closedByHistory.current = false

    const onPopState = () => {
      if (window.history.state?.__overlay !== id) {
        closedByHistory.current = true
        onClose?.()
      }
    }
    window.addEventListener('popstate', onPopState)

    return () => {
      window.removeEventListener('popstate', onPopState)
      activeOverlays.delete(id)
      setTimeout(() => {
        // Cierre por botón/prop (no por "atrás"): retirar la entrada que agregamos
        if (!activeOverlays.has(id) && !closedByHistory.current && window.history.state?.__overlay === id) {
          window.history.back()
        }
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isDesktop, id])

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose?.() }}>
      <DialogContent
        title={title}
        description={description}
        placement={isDesktop ? placement : 'page'}
        size={size}
      >
        <DialogBody className={isDesktop ? undefined : 'px-4 py-4'}>{children}</DialogBody>
        {footer && <DialogFooter className={isDesktop ? undefined : 'px-4'}>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
