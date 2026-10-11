// Envío de notificaciones push (Web Push). Dos usos:
//  - { action: 'dispatch' }: lo llama pg_cron cada 15 minutos con la cabecera `x-internal-key` (clave guardada en `push_config`; no está en el navegador).
//    Pide a la base qué avisar (`push_due`), lo manda a cada dispositivo suscripto y limpia los dispositivos que ya no existen.
//  - { action: 'test' }: la persona con sesión iniciada se manda un aviso de prueba A SÍ MISMA (la identidad sale del JWT, nunca del cuerpo).
// Las claves VAPID se generan solas la primera vez y se guardan en `push_config` (tabla sin políticas: solo se lee con permisos de servicio).
// Se despliega SIN verificación de JWT: cada acción se autentica sola como se describe arriba.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'
import { buildPush, type PushKind } from '../_shared/pushCopy.ts'

const DEFAULT_ORIGINS = ['https://dt-game.vercel.app', 'https://vestuario.com.ar', 'https://www.vestuario.com.ar', 'http://localhost:5173']

const corsFor = (origin: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin'
  }
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(o => o.trim().replace(/\/$/, '')).filter(Boolean)
  if (origin && (allowed.length ? allowed : DEFAULT_ORIGINS).includes(origin.replace(/\/$/, ''))) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })

// Comparación en tiempo constante para la clave interna
const sameKey = (a: string, b: string) => {
  if (a.length !== b.length || !a) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

type Sub = { id: string; endpoint: string; p256dh: string; auth: string }

Deno.serve(async (req) => {
  const cors = corsFor(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return json({ ok: false, message: 'Método no permitido.' }, 405, cors)

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  let body: { action?: string } = {}
  try { body = await req.json() } catch { /* sin cuerpo: se toma como dispatch */ }
  const action = body.action || 'dispatch'

  const { data: cfg, error: cfgErr } = await admin.from('push_config').select('internal_key, vapid_public, vapid_private').eq('id', 1).single()
  if (cfgErr || !cfg) return json({ ok: false, message: 'Falta la configuración de avisos.' }, 503, cors)

  // Primera vez: se genera el par de claves VAPID y se guarda
  let pub = cfg.vapid_public as string | null
  let priv = cfg.vapid_private as string | null
  if (!pub || !priv) {
    const keys = webpush.generateVAPIDKeys()
    await admin.from('push_config').update({ vapid_public: keys.publicKey, vapid_private: keys.privateKey }).eq('id', 1)
    pub = keys.publicKey
    priv = keys.privateKey
  }
  webpush.setVapidDetails('mailto:contacto@vestuario.com.ar', pub!, priv!)

  const sendTo = async (subs: Sub[], payload: string) => {
    let sent = 0
    for (const s of subs) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600, urgency: 'normal' })
        sent++
        await admin.from('push_subscriptions').update({ last_ok_at: new Date().toISOString() }).eq('id', s.id)
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        // 404/410: el dispositivo ya no existe (se desinstaló o se quitó el permiso): se borra
        if (status === 404 || status === 410) await admin.from('push_subscriptions').delete().eq('id', s.id)
        else console.error('push-dispatch: error de envío', status ?? String(err))
      }
    }
    return sent
  }

  if (action === 'test') {
    const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    if (!jwt) return json({ ok: false, message: 'Necesitás iniciar sesión.' }, 401, cors)
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } })
    const { data: userData, error: userErr } = await userClient.auth.getUser(jwt)
    if (userErr || !userData.user) return json({ ok: false, message: 'Sesión inválida.' }, 401, cors)
    const { data: subs } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userData.user.id)
    if (!subs?.length) return json({ ok: false, message: 'Este dispositivo no tiene los avisos activados.' }, 404, cors)
    const sent = await sendTo(subs as Sub[], JSON.stringify(buildPush('test')))
    return json({ ok: sent > 0, sent }, sent > 0 ? 200 : 502, cors)
  }

  if (action !== 'dispatch') return json({ ok: false, message: 'Acción desconocida.' }, 400, cors)
  if (!sameKey(req.headers.get('x-internal-key') || '', cfg.internal_key as string)) return json({ ok: false, message: 'No autorizado.' }, 401, cors)

  const { data: due, error: dueErr } = await admin.rpc('push_due')
  if (dueErr) {
    console.error('push-dispatch: push_due falló', dueErr.message)
    return json({ ok: false, message: 'No se pudo calcular qué avisar.' }, 500, cors)
  }

  let delivered = 0
  for (const row of (due || []) as { user_id: string; kind: PushKind; data: Record<string, unknown> }[]) {
    const message = buildPush(row.kind, row.data)
    if (!message) continue
    const { data: subs } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', row.user_id)
    if (subs?.length) delivered += await sendTo(subs as Sub[], JSON.stringify(message))
  }
  return json({ ok: true, due: due?.length ?? 0, delivered }, 200, cors)
})
