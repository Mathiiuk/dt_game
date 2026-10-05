// Puerta de entrada de la cuenta: alta, ingreso y recuperar clave pasan por acá, con reCAPTCHA v3 verificado
// en el servidor con la clave secreta (nunca viaja al navegador).
//
// Variables (Supabase > Edge Functions > Secrets): RECAPTCHA_SECRET (obligatoria), ALLOWED_ORIGINS (opcional, separadas por coma),
// RECAPTCHA_MIN_SCORE (opcional, 0.5 por defecto). SUPABASE_URL y SUPABASE_ANON_KEY las pone Supabase solas.
// Esta función se despliega SIN verificación de JWT: la llaman personas que todavía no iniciaron sesión.
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  corsHeadersFor, decideCaptcha, parseAllowedOrigins, validateGatePayload, MIN_SCORE_DEFAULT, type GoogleVerification
} from '../_shared/gate.ts'

const DEFAULT_ORIGINS = ['https://dt-game.vercel.app', 'https://vestuario.com.ar', 'https://www.vestuario.com.ar', 'http://localhost:5173']

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })

async function verifyWithGoogle(token: string, secret: string, ip: string | null): Promise<GoogleVerification | null> {
  try {
    const form = new URLSearchParams({ secret, response: token })
    if (ip) form.set('remoteip', ip)
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body: form })
    return await res.json()
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  const configured = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'))
  const origins = configured.length ? configured : DEFAULT_ORIGINS
  const origin = req.headers.get('origin')
  const cors = corsHeadersFor(origin, origins)

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return json({ ok: false, code: 'METHOD', message: 'Método no permitido.' }, 405, cors)
  if (!origin || !cors['Access-Control-Allow-Origin']) return json({ ok: false, code: 'ORIGIN', message: 'Origen no permitido.' }, 403, cors)

  const secret = Deno.env.get('RECAPTCHA_SECRET')
  if (!secret) {
    console.error('auth-gate: falta el secreto RECAPTCHA_SECRET')
    return json({ ok: false, code: 'CONFIG', message: 'El servicio no está disponible. Probá de nuevo más tarde.' }, 503, cors)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, code: 'BAD_REQUEST', message: 'Pedido inválido.' }, 400, cors)
  }

  const parsed = validateGatePayload(body)
  if (!parsed.ok) return json({ ok: false, code: 'BAD_REQUEST', message: parsed.error }, 400, cors)
  const { action, email, password, name, captchaToken } = parsed.data

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const verdict = decideCaptcha(await verifyWithGoogle(captchaToken, secret, ip), {
    expectedAction: action,
    minScore: Number(Deno.env.get('RECAPTCHA_MIN_SCORE')) || MIN_SCORE_DEFAULT,
    allowedHostnames: origins.map(o => { try { return new URL(o).hostname } catch { return '' } }).filter(Boolean)
  })
  if (!verdict.ok) {
    // El motivo queda en el registro del servidor; la persona ve un mensaje genérico
    console.warn(`auth-gate: captcha rechazado (${action}): ${verdict.reason} score=${verdict.score ?? 'n/a'}`)
    return json({ ok: false, code: 'CAPTCHA', message: 'No pudimos verificar que sos una persona. Recargá la página y probá de nuevo.' }, 403, cors)
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  const redirectTo = `${origin}/auth`

  if (action === 'signup') {
    const { data, error } = await supabase.auth.signUp({
      email, password: password!, options: { data: { display_name: name }, emailRedirectTo: redirectTo }
    })
    if (error) return json({ ok: false, code: 'AUTH', message: error.message }, 400, cors)
    return json({
      ok: true,
      user: data.user ? { id: data.user.id, email: data.user.email, user_metadata: data.user.user_metadata } : null,
      session: data.session ? { access_token: data.session.access_token, refresh_token: data.session.refresh_token } : null,
      needsConfirmation: !data.session
    }, 200, cors)
  }

  if (action === 'login') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: password! })
    if (error || !data.session) return json({ ok: false, code: 'INVALID_CREDENTIALS', message: 'Credenciales incorrectas.' }, 401, cors)
    return json({
      ok: true,
      user: { id: data.user.id, email: data.user.email, user_metadata: data.user.user_metadata },
      session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token }
    }, 200, cors)
  }

  // Recuperar clave: siempre la misma respuesta, exista o no la cuenta (no se puede averiguar quién está registrado)
  await supabase.auth.resetPasswordForEmail(email, { redirectTo }).catch(() => {})
  return json({ ok: true }, 200, cors)
})
