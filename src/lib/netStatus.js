// Estado de la red de este dispositivo (en línea / conexión lenta), compartido por todo el juego.
// Lo alimentan los eventos del navegador y el cliente de red (`netFetch`, cuando un pedido tarda de más).
let state = { online: typeof navigator === 'undefined' ? true : navigator.onLine !== false, slow: false, lastOnlineAt: null }
const listeners = new Set()

const set = (patch) => {
  const next = { ...state, ...patch }
  if (next.online === state.online && next.slow === state.slow && next.lastOnlineAt === state.lastOnlineAt) return
  state = next
  listeners.forEach(fn => fn())
}

export const getNetStatus = () => state
export const subscribeNet = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }
export const setSlow = (slow) => set({ slow: state.online ? Boolean(slow) : false })
export const resetNetStatus = () => { state = { online: true, slow: false, lastOnlineAt: null }; listeners.forEach(fn => fn()) }

if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => set({ online: false, slow: false, lastOnlineAt: Date.now() }))
  window.addEventListener('online', () => set({ online: true }))
}
