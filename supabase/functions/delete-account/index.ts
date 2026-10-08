// Eliminar la propia cuenta con todos sus datos (correo o Google).
// Solo borra la cuenta de quien manda el pedido: la identidad sale del JWT de la sesión, nunca del cuerpo del pedido.
// Pasos: 1) verifica la sesión y la confirmación escrita, 2) borra los datos del juego (`purge_user_data`),
// 3) borra el usuario de acceso (Supabase Auth), lo que también cierra todas sus sesiones.
//
// SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY las pone Supabase solas.
// Variable opcional: ALLOWED_ORIGINS (orígenes separados por coma). Se despliega CON verificación de JWT.
import { createClient } from 'npm:@supabase/supabase-js@2'

const DEFAULT_ORIGINS = ['https://dt-game.vercel.app', 'https://vestuario.com.ar', 'https://www.vestuario.com.ar', 'http://localhost:5173']
const CONFIRM_WORD = 'ELIMINAR'

const parseOrigins = (raw: string | undefined | null): string[] =>
  (raw || '').split(',').map(o => o.trim().replace(/\/$/, '')).filter(Boolean)

const corsFor = (origin: string | null, allowed: string[]): Record<string, string> => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin'
  }
  if (origin && allowed.includes(origin.replace(/\/$/, ''))) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  const configured = parseOrigins(Deno.env.get('ALLOWED_ORIGINS'))
  const cors = corsFor(req.headers.get('origin'), configured.length ? configured : DEFAULT_ORIGINS)

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return json({ ok: false, message: 'Método no permitido.' }, 405, cors)

  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!jwt) return json({ ok: false, message: 'Necesitás iniciar sesión.' }, 401, cors)

  const url = Deno.env.get('SUPABASE_URL')!
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } })
  const { data: userData, error: userErr } = await userClient.auth.getUser(jwt)
  if (userErr || !userData.user?.id) return json({ ok: false, message: 'Sesión inválida.' }, 401, cors)
  const uid = userData.user.id

  let body: { confirm?: string } = {}
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, message: 'Pedido inválido.' }, 400, cors)
  }
  if (String(body.confirm || '').trim().toUpperCase() !== CONFIRM_WORD) {
    return json({ ok: false, message: `Para confirmar escribí ${CONFIRM_WORD}.` }, 400, cors)
  }

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  // 1) Datos del juego
  const { data: purge, error: purgeErr } = await admin.rpc('purge_user_data', { p_uid: uid, p_dry: false })
  if (purgeErr) return json({ ok: false, message: 'No pudimos borrar tus datos. Probá de nuevo en un rato.' }, 500, cors)
  const pending = Array.isArray(purge?.pending_errors) ? purge.pending_errors : []
  if (pending.length > 0) return json({ ok: false, message: 'Quedaron datos sin borrar. No se eliminó la cuenta: probá de nuevo.' }, 500, cors)

  // 2) Usuario de acceso (correo o Google): también cierra todas las sesiones
  const { error: delErr } = await admin.auth.admin.deleteUser(uid)
  if (delErr) return json({ ok: false, message: 'Se borraron tus datos pero no pudimos cerrar la cuenta de acceso. Probá de nuevo.' }, 500, cors)

  return json({ ok: true, deleted: purge?.total ?? 0 }, 200, cors)
})
