// Lectura segura de lo que llega en un aviso push y de a dónde lleva (puro: lo usa el service worker y se prueba aparte).
const text = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')

/** Convierte el cuerpo del push en { title, body, url, tag }; null si no es un aviso válido */
export function parsePushPayload(data) {
  let raw
  try { raw = typeof data?.json === 'function' ? data.json() : data } catch { return null }
  if (!raw || typeof raw !== 'object') return null
  const title = text(raw.title, 80)
  if (!title) return null
  return { title, body: text(raw.body, 200), url: typeof raw.url === 'string' ? raw.url : '/dashboard', tag: text(raw.tag, 60) || 'vestuario' }
}

/** Dirección absoluta a abrir al tocar el aviso: solo rutas del propio sitio (cualquier otra cosa lleva al inicio del juego) */
export function targetUrl(data, origin) {
  const url = data?.url
  if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//')) return `${origin}/dashboard`
  return `${origin}${url}`
}
