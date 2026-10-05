/**
 * Medición de tiempos por acción. Cada medición se guarda en `window.__perf` (útil para mirar en la consola de
 * desarrollo) y se muestra con console.debug solo en desarrollo. No cambia el comportamiento de lo que mide.
 */
const isDev = () => {
  try {
    return Boolean(import.meta.env?.DEV) && import.meta.env?.MODE !== 'test'
  } catch {
    return false
  }
}

const record = (label, ms, ok) => {
  if (typeof window === 'undefined') return
  const log = (window.__perf ||= [])
  log.push({ label, ms: Math.round(ms), ok, at: Date.now() })
  if (log.length > 200) log.shift()
  if (isDev()) console.debug(`[perf] ${label}: ${Math.round(ms)} ms${ok ? '' : ' (con error)'}`)
}

/** Ejecuta `fn`, mide cuánto tarda y devuelve su resultado (o relanza su error) */
export async function timed(label, fn, sink) {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now()
  let ok = true
  try {
    return await fn()
  } catch (e) {
    ok = false
    throw e
  } finally {
    const ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
    record(label, ms, ok)
    if (sink) sink[label] = Math.round(ms)
  }
}
