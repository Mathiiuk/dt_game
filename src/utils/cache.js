/**
 * Adaptador de caché sobre TanStack Query (src/lib/queryClient.js).
 *
 * Mantiene la API histórica (get / set / fetch / invalidate / clear) para no tocar los ~140 usos existentes,
 * pero delega en QueryClient: caché con TTL, deduplicación de peticiones en vuelo y recolección de basura.
 * Las claves históricas ('club:123', 'squad:abc'...) se guardan como queryKey ['cache', clave].
 */
import { queryClient } from '../lib/queryClient'

const ROOT = 'cache'
const keyOf = (key) => [ROOT, key]

class MemoryQueryCache {
  /** Valor vigente (no expirado) o null */
  get(key) {
    const state = queryClient.getQueryState(keyOf(key))
    if (!state || state.data === undefined) return null
    // Si el TTL con el que se guardó ya venció, se descarta (compatibilidad con el comportamiento anterior)
    const expiresAt = state.data.expiresAt
    if (expiresAt && Date.now() > expiresAt) {
      queryClient.removeQueries({ queryKey: keyOf(key), exact: true })
      return null
    }
    return state.data.value
  }

  /** Guarda un valor con TTL en milisegundos (por defecto 60 s) */
  set(key, value, ttlMs = 60000) {
    queryClient.setQueryData(keyOf(key), { value, expiresAt: Date.now() + ttlMs })
    return value
  }

  /**
   * Ejecuta o reutiliza una consulta asíncrona:
   * 1. Caché válida -> devuelve de inmediato.
   * 2. Misma petición en vuelo -> comparte la promesa (sin duplicados).
   * 3. Si no, ejecuta fetcher(), cachea (salvo null/undefined) y entrega el resultado.
   */
  async fetch(key, fetcher, ttlMs = 60000) {
    const cached = this.get(key)
    if (cached !== null) return cached

    const result = await queryClient.fetchQuery({
      queryKey: keyOf(key),
      staleTime: 0, // la vigencia la decide `get` con el TTL propio de cada valor
      gcTime: Math.max(ttlMs, 1000),
      queryFn: async () => {
        const value = await fetcher()
        return { value, expiresAt: Date.now() + ttlMs }
      }
    })

    // Los resultados vacíos nunca se cachean (comportamiento histórico)
    if (result.value === undefined || result.value === null) {
      queryClient.removeQueries({ queryKey: keyOf(key), exact: true })
    }
    return result.value
  }

  /** Invalida una clave exacta o todas las que comiencen con el prefijo */
  invalidate(keyOrPrefix) {
    queryClient.removeQueries({
      queryKey: [ROOT],
      predicate: (query) => {
        const k = query.queryKey[1]
        return typeof k === 'string' && (k === keyOrPrefix || k.startsWith(keyOrPrefix))
      }
    })
  }

  /** Limpia toda la caché del adaptador */
  clear() {
    queryClient.removeQueries({ queryKey: [ROOT] })
  }
}

export const queryCache = new MemoryQueryCache()
