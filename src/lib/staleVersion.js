// Después de un deploy, una pestaña abierta con la versión vieja puede pedir un archivo que ya no existe. Vite avisa con `vite:preloadError`:
// acá se convierte en un evento del juego para que el aviso de actualización lo muestre (la recarga la decide el aviso, en un momento seguro).
export const STALE_EVENT = 'vestuario:stale-version'

export function installStaleListener(target = typeof window !== 'undefined' ? window : null) {
  if (!target) return () => {}
  const onError = () => { target.dispatchEvent(new Event(STALE_EVENT)) }
  target.addEventListener('vite:preloadError', onError)
  return () => target.removeEventListener('vite:preloadError', onError)
}
