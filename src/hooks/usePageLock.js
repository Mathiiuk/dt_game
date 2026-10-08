import { useEffect } from 'react'

/**
 * Bloquea el scroll y el rebote de la página mientras la pantalla está montada.
 * Las pantallas de alto fijo (partido, resumen, menú del juego en el celular) no scrollean la página: en iOS, igual dejan
 * "tirar" del documento y se mueve todo. Con esto el documento queda quieto y sólo scrollean los contenedores internos.
 */
export function usePageLock(active = true) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined
    const html = document.documentElement
    const body = document.body
    const before = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior
    }
    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    return () => {
      html.style.overflow = before.htmlOverflow
      html.style.overscrollBehavior = before.htmlOverscroll
      body.style.overflow = before.bodyOverflow
      body.style.overscrollBehavior = before.bodyOverscroll
    }
  }, [active])
}
