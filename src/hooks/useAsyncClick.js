import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hace seguro un manejador de clic que puede devolver una promesa:
 * - mientras la promesa corre, `pending` es true (para mostrar spinner) y los clics nuevos se IGNORAN
 *   (el bloqueo es inmediato, con un ref, sin esperar al siguiente render: un doble clic ejecuta una sola vez);
 * - al terminar (bien o mal) el botón vuelve a estar disponible; el error se vuelve a lanzar para que lo trate quien llama.
 * Si el manejador no devuelve una promesa, no cambia nada.
 */
export function useAsyncClick(onClick) {
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const handle = useCallback((event) => {
    if (busy.current) {
      event?.preventDefault?.()
      return undefined
    }
    const result = onClick?.(event)
    if (result && typeof result.then === 'function') {
      busy.current = true
      setPending(true)
      const done = () => {
        busy.current = false
        if (mounted.current) setPending(false)
      }
      result.then(done, done)
    }
    return result
  }, [onClick])

  return [handle, pending]
}
