// Reparar una versión vieja atrapada: tras un deploy, el service worker viejo sigue sirviendo el `index.html` viejo (con los nombres de
// archivo viejos) y las pantallas que no se habían abierto ya no existen en el servidor → "Se pinchó la pelota" al tocar una sección.
// Una recarga común no alcanza (el service worker vuelve a servir lo mismo): hay que desregistrarlo y vaciar las cachés antes de recargar.
// La carrera no se toca: vive en la cuenta, no en estas cachés.

export const REPAIR_FLAG = 'vestuario-repair-done'

const safe = async (fn) => { try { await fn() } catch { /* se sigue igual: lo importante es recargar */ } }

const defaults = () => ({
  nav: typeof navigator === 'undefined' ? {} : navigator,
  cacheStorage: typeof caches === 'undefined' ? undefined : caches,
  reload: () => window.location.reload(),
  storage: (() => { try { return window.sessionStorage } catch { return null } })()
})

/**
 * Desregistra los service workers, borra las cachés y recarga. Automático: una sola vez por sesión (evita bucles si el error es otro);
 * con `force` (la persona tocó "Reparar" o "Actualizar ahora") siempre. Devuelve true si recargó.
 */
export async function repairAndReload({ force = false, ...overrides } = {}) {
  const { nav, cacheStorage, reload, storage } = { ...defaults(), ...overrides }
  if (!force) {
    let done
    try { done = storage?.getItem(REPAIR_FLAG) === '1' } catch { done = false }
    if (done) return false
  }
  try { storage?.setItem(REPAIR_FLAG, '1') } catch { /* sin almacenamiento: vale para esta vez */ }

  await safe(async () => {
    const regs = (await nav.serviceWorker?.getRegistrations?.()) || []
    await Promise.all(regs.map(r => safe(() => r.unregister())))
  })
  await safe(async () => {
    const keys = (await cacheStorage?.keys?.()) || []
    await Promise.all(keys.map(k => safe(() => cacheStorage.delete(k))))
  })
  reload()
  return true
}
