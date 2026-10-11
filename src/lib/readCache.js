// Copia local (Cache Storage) de las últimas lecturas de datos del juego, para poder mirar el club sin conexión.
// Es del dispositivo y de UNA persona: se borra al cerrar sesión, al eliminar la cuenta y al entrar otra persona.
const NAME = 'vestuario-reads-v1'
const OWNER_KEY = 'vestuario-reads-owner'
const ORIGIN = 'https://reads.invalid/'

const defaultOwnerStore = {
  get: () => { try { return window.localStorage.getItem(OWNER_KEY) } catch { return null } },
  set: (v) => { try { window.localStorage.setItem(OWNER_KEY, v) } catch { /* sin almacenamiento */ } }
}

export function createReadCache({ cachesImpl = typeof caches === 'undefined' ? null : caches, maxEntries = 150, ownerStore = defaultOwnerStore } = {}) {
  const requestOf = (key) => new Request(ORIGIN + encodeURIComponent(key))

  const api = {
    async get(key) {
      if (!cachesImpl) return null
      try {
        const cache = await cachesImpl.open(NAME)
        const res = await cache.match(requestOf(key))
        return res ? await res.json() : null
      } catch { return null }
    },
    async put(key, entry) {
      if (!cachesImpl) return undefined
      try {
        const cache = await cachesImpl.open(NAME)
        await cache.put(requestOf(key), new Response(JSON.stringify(entry), { headers: { 'content-type': 'application/json' } }))
        const keys = await cache.keys()
        for (const old of keys.slice(0, Math.max(0, keys.length - maxEntries))) await cache.delete(old)
      } catch { /* sin espacio o sin permiso: no pasa nada, solo no hay copia */ }
      return undefined
    },
    async clear() {
      if (!cachesImpl) return undefined
      try { await cachesImpl.delete(NAME) } catch { /* nada que borrar */ }
      return undefined
    },
    /** Si entra una persona distinta de la que dejó las copias, se borran antes de guardar nada */
    async bindOwner(userId) {
      if (!userId) return undefined
      if (ownerStore.get() !== userId) {
        await api.clear()
        ownerStore.set(userId)
      }
      return undefined
    }
  }
  return api
}

export const readCache = createReadCache()
