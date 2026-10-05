/**
 * Lógica pura de las funciones de servidor (sin Deno ni red) para poder probarla con los tests del proyecto.
 */

export type GoogleVerification = {
  success: boolean
  score?: number
  action?: string
  hostname?: string
  'error-codes'?: string[]
}

export const GATE_ACTIONS = ['signup', 'login', 'reset'] as const
export type GateAction = (typeof GATE_ACTIONS)[number]

export const MIN_SCORE_DEFAULT = 0.5

/**
 * Decide si la respuesta de reCAPTCHA v3 deja pasar: éxito, acción esperada, dominio permitido y puntaje suficiente.
 * Devuelve siempre un motivo interno (para el registro del servidor); al usuario se le muestra un mensaje genérico.
 */
export function decideCaptcha(
  result: GoogleVerification | null,
  opts: { expectedAction: string; minScore?: number; allowedHostnames?: string[] }
): { ok: boolean; reason?: string; score?: number } {
  const minScore = opts.minScore ?? MIN_SCORE_DEFAULT
  if (!result) return { ok: false, reason: 'sin_respuesta' }
  if (!result.success) return { ok: false, reason: `rechazado:${(result['error-codes'] || []).join(',') || 'desconocido'}` }
  if (result.action !== opts.expectedAction) return { ok: false, reason: 'accion_distinta', score: result.score }
  if (opts.allowedHostnames?.length && !opts.allowedHostnames.includes(result.hostname || '')) {
    return { ok: false, reason: 'dominio_no_permitido', score: result.score }
  }
  if ((result.score ?? 0) < minScore) return { ok: false, reason: 'puntaje_bajo', score: result.score }
  return { ok: true, score: result.score }
}

/** Orígenes que pueden llamar a las funciones: los del sitio y el entorno local */
export function parseAllowedOrigins(raw: string | undefined | null): string[] {
  return (raw || '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

export function corsHeadersFor(origin: string | null, allowed: string[]): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin'
  }
  if (origin && allowed.includes(origin.replace(/\/$/, ''))) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const normalizeEmail = (email: unknown): string => String(email || '').toLowerCase().trim()

/** Misma regla de contraseña que el formulario: 8+ caracteres, un número y una mayúscula o símbolo */
export function passwordProblem(password: unknown): string | null {
  const p = String(password || '')
  if (p.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/\d/.test(p)) return 'La contraseña debe contener al menos un número.'
  if (!/[A-Z!@#$%^&*(),.?":{}|<>]/.test(p)) return 'La contraseña debe contener al menos una mayúscula o carácter especial.'
  return null
}

export type GatePayload = {
  action: GateAction
  email: string
  password?: string
  name?: string
  captchaToken: string
}

/** Valida y limpia lo que manda el navegador. Devuelve el error en castellano si no sirve. */
export function validateGatePayload(body: any): { ok: true; data: GatePayload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Pedido inválido.' }
  if (!GATE_ACTIONS.includes(body.action)) return { ok: false, error: 'Acción no permitida.' }
  const email = normalizeEmail(body.email)
  if (!EMAIL_RE.test(email) || email.length > 254) return { ok: false, error: 'Ingresá un correo válido.' }
  if (typeof body.captchaToken !== 'string' || body.captchaToken.length < 20 || body.captchaToken.length > 4096) {
    return { ok: false, error: 'No pudimos verificar que sos una persona. Recargá la página y probá de nuevo.' }
  }
  if (body.action === 'signup') {
    const problem = passwordProblem(body.password)
    if (problem) return { ok: false, error: problem }
  }
  if (body.action === 'login' && !String(body.password || '')) return { ok: false, error: 'Ingresá tu contraseña.' }
  const name = String(body.name || '').trim().slice(0, 60)
  return { ok: true, data: { action: body.action, email, password: body.password, name, captchaToken: body.captchaToken } }
}

/** Plantillas de correo del juego (texto sobrio, sin datos sensibles) */
export const EMAIL_TEMPLATES = {
  welcome: (name: string) => ({
    subject: 'Bienvenido a Vestuario, DT',
    html: `<p>Hola ${escapeHtml(name || 'DT')},</p><p>Tu cuenta en <strong>Vestuario</strong> está lista. Armá tu plantel, bancá tus decisiones y escribí tu historia desde el potrero.</p><p>Si no creaste esta cuenta, ignorá este mensaje.</p><p>— El equipo de Vestuario</p>`,
    text: `Hola ${name || 'DT'},\n\nTu cuenta en Vestuario está lista. Armá tu plantel, bancá tus decisiones y escribí tu historia desde el potrero.\n\nSi no creaste esta cuenta, ignorá este mensaje.\n\n— El equipo de Vestuario`
  })
} as const

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

export const MAIL_FROM = 'Vestuario <no-contestar@vestuario.com.ar>'
export const MAIL_REPLY_TO = 'hola@vestuario.com.ar'
