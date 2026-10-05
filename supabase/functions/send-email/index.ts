// Correos del juego con Resend. Solo para personas con sesión iniciada y siempre a SU propio correo:
// no se puede usar para mandar mensajes a otras direcciones.
//
// Variables (Supabase > Edge Functions > Secrets): RESEND_API_KEY (obligatoria), ALLOWED_ORIGINS (opcional).
// SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY las pone Supabase solas.
// Se despliega CON verificación de JWT.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeadersFor, EMAIL_TEMPLATES, MAIL_FROM, MAIL_REPLY_TO, parseAllowedOrigins } from '../_shared/gate.ts'

const DEFAULT_ORIGINS = ['https://dt-game.vercel.app', 'https://vestuario.com.ar', 'https://www.vestuario.com.ar', 'http://localhost:5173']

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  const configured = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'))
  const origins = configured.length ? configured : DEFAULT_ORIGINS
  const cors = corsHeadersFor(req.headers.get('origin'), origins)

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return json({ ok: false, message: 'Método no permitido.' }, 405, cors)

  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!jwt) return json({ ok: false, message: 'Necesitás iniciar sesión.' }, 401, cors)

  const url = Deno.env.get('SUPABASE_URL')!
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } })
  const { data: userData, error: userErr } = await userClient.auth.getUser(jwt)
  if (userErr || !userData.user?.email) return json({ ok: false, message: 'Sesión inválida.' }, 401, cors)
  const user = userData.user

  let body: { template?: string } = {}
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, message: 'Pedido inválido.' }, 400, cors)
  }
  if (body.template !== 'welcome') return json({ ok: false, message: 'Plantilla no permitida.' }, 400, cors)

  // El correo de bienvenida sale una sola vez por cuenta
  if (user.user_metadata?.welcome_email_sent) return json({ ok: true, skipped: true }, 200, cors)

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.error('send-email: falta el secreto RESEND_API_KEY')
    return json({ ok: false, message: 'El servicio de correo no está disponible.' }, 503, cors)
  }

  const name = String(user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || '')
  const mail = EMAIL_TEMPLATES.welcome(name)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: MAIL_FROM, to: [user.email], reply_to: MAIL_REPLY_TO, subject: mail.subject, html: mail.html, text: mail.text })
  })
  if (!res.ok) {
    console.error(`send-email: Resend respondió ${res.status}`)
    return json({ ok: false, message: 'No pudimos enviar el correo.' }, 502, cors)
  }

  // Marca de envío en la cuenta (con permisos de administrador, solo para esto)
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, welcome_email_sent: true } })

  return json({ ok: true }, 200, cors)
})
