/**
 * High-Performance In-Memory Query Cache with In-Flight Deduplication (SWR-ready)
 * Soluciona la latencia de navegación entre secciones y las peticiones duplicadas.
 */

class MemoryQueryCache {
  constructor() {
    this.store = new Map() // key -> { value, expiresAt }
    this.inFlight = new Map() // key -> Promise
  }

  /**
   * Obtiene un valor de caché si no ha expirado
   */
  get(key) {
    const item = this.store.get(key)
    if (!item) return null
    if (Date.now() > item.expiresAt) {
      this.store.delete(key)
      return null
    }
    return item.value
  }

  /**
   * Almacena un valor en caché con TTL en milisegundos (por defecto 60 segundos)
   */
  set(key, value, ttlMs = 60000) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    })
    return value
  }

  /**
   * Ejecuta o reutiliza una consulta asíncrona:
   * 1. Si existe en caché válida, la devuelve inmediatamente (0 ms).
   * 2. Si ya hay una petición idéntica en vuelo (in-flight), reutiliza esa misma Promise (evita duplicados).
   * 3. Si no, ejecuta fetcher(), la cachea y la entrega.
   */
  async fetch(key, fetcher, ttlMs = 60000) {
    // 1. Hit de caché
    const cached = this.get(key)
    if (cached !== null) {
      return cached
    }

    // 2. Reutilización de petición en vuelo (Deduplicación concurrente)
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key)
    }

    // 3. Nueva ejecución
    const promise = (async () => {
      try {
        const result = await fetcher()
        if (result !== undefined && result !== null) {
          this.set(key, result, ttlMs)
        }
        return result
      } finally {
        this.inFlight.delete(key)
      }
    })()

    this.inFlight.set(key, promise)
    return promise
  }

  /**
   * Invalida una clave exacta o todas las claves que comiencen con el prefijo dado
   * Ej: cache.invalidate('squad:'), cache.invalidate('fixtures:')
   */
  invalidate(keyOrPrefix) {
    for (const key of this.store.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.store.delete(key)
      }
    }
    for (const key of this.inFlight.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.inFlight.delete(key)
      }
    }
  }

  /**
   * Limpia toda la caché
   */
  clear() {
    this.store.clear()
    this.inFlight.clear()
  }
}

export const queryCache = new MemoryQueryCache()
