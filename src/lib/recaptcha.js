/**
 * reCAPTCHA v3 (invisible). La clave del sitio es pública y viene de VITE_RECAPTCHA_SITE_KEY; la secreta vive solo en el
 * servidor (función `auth-gate`). Sin clave configurada (desarrollo, tests) todo sigue por el camino directo.
 */
const SCRIPT_ID = 'recaptcha-v3-script'

export const recaptchaSiteKey = () => {
  try {
    return import.meta.env?.VITE_RECAPTCHA_SITE_KEY || ''
  } catch {
    return ''
  }
}

export const isRecaptchaEnabled = () => Boolean(recaptchaSiteKey())

let loading = null

/** Carga el script de Google una sola vez */
export function loadRecaptcha() {
  const key = recaptchaSiteKey()
  if (!key || typeof document === 'undefined') return Promise.resolve(null)
  if (window.grecaptcha?.execute) return Promise.resolve(window.grecaptcha)
  if (loading) return loading

  loading = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    const script = existing || document.createElement('script')
    const done = () => (window.grecaptcha?.ready ? window.grecaptcha.ready(() => resolve(window.grecaptcha)) : reject(new Error('RECAPTCHA_UNAVAILABLE')))
    script.addEventListener('load', done, { once: true })
    script.addEventListener('error', () => { loading = null; reject(new Error('RECAPTCHA_UNAVAILABLE')) }, { once: true })
    if (!existing) {
      script.id = SCRIPT_ID
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(key)}`
      script.async = true
      document.head.appendChild(script)
    }
  })
  return loading
}

/** Token para una acción (signup, login, reset). Vence a los 2 minutos: se pide justo antes de usarlo. */
export async function getRecaptchaToken(action) {
  const key = recaptchaSiteKey()
  if (!key) return null
  const grecaptcha = await loadRecaptcha()
  return grecaptcha.execute(key, { action })
}
