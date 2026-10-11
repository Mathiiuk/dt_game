// `fetch` para hablar con la base en redes malas: las LECTURAS se cortan si no responden y se reintentan con espera creciente;
// las ESCRITURAS nunca se cortan ni se repiten solas (podrían haberse guardado: repetirlas duplicaría un fichaje o un partido).
// Además avisa cuando algún pedido tarda demasiado, para mostrar "conexión lenta" en vez de un giro mudo.
const READ_METHODS = new Set(['GET', 'HEAD'])
const RETRY_STATUS = new Set([502, 503, 504])
const MAX_WAIT_MS = 5000
const STALE_MAX_AGE_MS = 24 * 3600 * 1000
const MAX_STORED_BYTES = 400 * 1024
export const STALE_HEADER = 'x-vestuario-stale'

const methodOf = (input, init) => String(init?.method || (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')).toUpperCase()
const defaultSleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const retryAfterMs = (response) => {
  const raw = Number(response?.headers?.get?.('Retry-After'))
  return Number.isFinite(raw) && raw > 0 ? Math.min(raw * 1000, MAX_WAIT_MS) : null
}

const urlOf = (input) => String(typeof input === 'string' ? input : input?.url || input)
const headerOf = (input, init, name) => {
  const h = init?.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : null)
  if (!h) return ''
  if (typeof h.get === 'function') return h.get(name) || ''
  const found = Object.entries(h).find(([k]) => k.toLowerCase() === name.toLowerCase())
  return found ? String(found[1]) : ''
}
// Solo se guarda copia de las lecturas de datos del juego (nunca sesión, funciones ni otros sitios)
const isStorable = (url) => /\/rest\/v1\//.test(url) && !/\/rest\/v1\/rpc\//.test(url)
const storeKey = (input, init) => `${urlOf(input)}|${headerOf(input, init, 'accept')}`

export function createNetFetch({ fetchImpl, timeoutMs = 15000, retries = 2, baseDelayMs = 500, slowAfterMs = 4000, onSlowChange, sleep = defaultSleep, store, isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false } = {}) {
  /** Guarda la última respuesta buena de una lectura para poder mostrarla si después no hay red */
  const remember = (key, response) => {
    if (!store || !response.ok) return
    response.clone().text().then((body) => {
      if (body.length > MAX_STORED_BYTES) return
      return store.put(key, { body, status: response.status, headers: { 'content-type': response.headers.get('content-type') || 'application/json' }, savedAt: Date.now() })
    }).catch(() => {})
  }
  /** Última copia (de menos de un día) como respuesta marcada como "vieja", o null */
  const recall = async (key) => {
    if (!store) return null
    try {
      const entry = await store.get(key)
      if (!entry || Date.now() - entry.savedAt > STALE_MAX_AGE_MS) return null
      return new Response(entry.body, { status: entry.status, headers: { ...entry.headers, [STALE_HEADER]: '1' } })
    } catch { return null }
  }

  let slow = 0
  const slowStarted = () => { slow += 1; if (slow === 1) onSlowChange?.(true) }
  const slowEnded = () => { slow -= 1; if (slow === 0) onSlowChange?.(false) }

  return async function netFetch(input, init) {
    const impl = fetchImpl || globalThis.fetch.bind(globalThis)
    const isRead = READ_METHODS.has(methodOf(input, init))

    let isSlow = false
    const slowTimer = setTimeout(() => { isSlow = true; slowStarted() }, slowAfterMs)
    const done = () => { clearTimeout(slowTimer); if (isSlow) { isSlow = false; slowEnded() } }

    try {
      if (!isRead) return await impl(input, init)

      const key = storeKey(input, init)
      const canStore = isStorable(urlOf(input))
      for (let attempt = 0; ; attempt++) {
        const ctrl = new AbortController()
        const outer = init?.signal
        const onOuterAbort = () => ctrl.abort()
        if (outer) { if (outer.aborted) ctrl.abort(); else outer.addEventListener('abort', onOuterAbort) }
        const timer = setTimeout(() => ctrl.abort(), timeoutMs)
        try {
          const response = await impl(input, { ...init, signal: ctrl.signal })
          if (RETRY_STATUS.has(response.status) && attempt < retries) {
            await sleep(retryAfterMs(response) ?? baseDelayMs * 2 ** attempt)
            continue
          }
          if (RETRY_STATUS.has(response.status) && canStore) return (await recall(key)) || response
          if (canStore) remember(key, response)
          return response
        } catch (error) {
          if (outer?.aborted) throw error
          // Sin conexión no tiene sentido esperar y reintentar: se usa la copia (si hay) enseguida
          if (attempt >= retries || !isOnline()) {
            const stale = canStore ? await recall(key) : null
            if (stale) return stale
            throw error
          }
          await sleep(baseDelayMs * 2 ** attempt)
        } finally {
          clearTimeout(timer)
          outer?.removeEventListener('abort', onOuterAbort)
        }
      }
    } finally {
      done()
    }
  }
}
