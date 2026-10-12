// Microsoft Clarity (mapas de calor y grabaciones de sesión). Se carga SOLO si la persona aceptó las cookies: es el mismo código
// que entrega el fabricante, pero sin ejecutarse antes del consentimiento (`vestuario-consent`, ver src/lib/consent.js).

export const CLARITY_ID = 'ywsirniaxt'

const consentArgs = (granted) => ({ ad_Storage: granted ? 'granted' : 'denied', analytics_Storage: granted ? 'granted' : 'denied' })

const env = () => ({ doc: typeof document === 'undefined' ? null : document, win: typeof window === 'undefined' ? null : window })

/** Inyecta el script de Clarity una sola vez (código oficial: función `clarity` con cola + script asíncrono) */
export function loadClarity({ doc, win } = env()) {
  if (!doc || !win) return false
  if (win.clarity && win.clarity.loaded) return false
  win.clarity = win.clarity || function () { (win.clarity.q = win.clarity.q || []).push(arguments) }
  win.clarity.loaded = true
  const tag = doc.createElement('script')
  tag.async = true
  tag.src = `https://www.clarity.ms/tag/${CLARITY_ID}`
  const first = doc.getElementsByTagName('script')[0]
  if (first && first.parentNode) first.parentNode.insertBefore(tag, first)
  else doc.head.appendChild(tag)
  return true
}

/** Aplica la elección de cookies: aceptar carga Clarity; rechazar nunca lo carga y, si ya estaba, le avisa que quedó denegado */
export function syncClarityConsent(choice, deps = env()) {
  const { doc, win } = deps
  if (!doc || !win) return
  if (choice === 'granted') {
    loadClarity(deps)
    win.clarity('consentv2', consentArgs(true))
  } else if (choice === 'denied' && typeof win.clarity === 'function') {
    win.clarity('consentv2', consentArgs(false))
  }
}
