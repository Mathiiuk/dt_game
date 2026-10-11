// Avisos push del lado del navegador: ver si el dispositivo los permite, activarlos (pide permiso, suscribe y lo guarda en la cuenta),
// apagarlos, elegir qué tipos recibir y mandarse uno de prueba. El permiso se pide SOLO después de un toque de la persona.
import { supabase } from '../api/supabase'

/** ¿Este navegador puede recibir avisos? (en iPhone hace falta tener el juego instalado en la pantalla de inicio) */
export function pushSupport(env = typeof window !== 'undefined' ? window : null) {
  if (!env) return { supported: false, reason: 'no-window' }
  const hasApis = 'serviceWorker' in env.navigator && 'PushManager' in env && 'Notification' in env
  if (hasApis) return { supported: true }
  const ua = env.navigator.userAgent || ''
  const isIos = /iPhone|iPad|iPod/.test(ua)
  const standalone = env.navigator.standalone === true || env.matchMedia?.('(display-mode: standalone)')?.matches
  // En iOS (16.4 o más) las APIs aparecen solo con el juego instalado en la pantalla de inicio
  return { supported: false, reason: isIos && !standalone ? 'ios-install' : 'unsupported' }
}

/** Clave pública VAPID (base64url) a los bytes que pide `subscribe` */
export function urlBase64ToUint8Array(base64) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

const registration = async () => (await navigator.serviceWorker.ready)

/** Estado actual de este dispositivo: 'unsupported' | 'blocked' | 'off' | 'on' */
export async function pushStatus(env) {
  const s = pushSupport(env)
  if (!s.supported) return { state: 'unsupported', reason: s.reason }
  if (Notification.permission === 'denied') return { state: 'blocked' }
  try {
    const sub = await (await registration()).pushManager.getSubscription()
    return { state: sub && Notification.permission === 'granted' ? 'on' : 'off' }
  } catch {
    return { state: 'off' }
  }
}

/** Activa los avisos: permiso + suscripción + guardado en la cuenta. Devuelve 'on', 'blocked' o 'unavailable'. */
export async function enablePush() {
  if (!pushSupport().supported) return 'unavailable'
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off'
  const key = unwrap(await supabase.rpc('push_public_key'))
  if (!key) return 'unavailable'
  const reg = await registration()
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
  const json = sub.toJSON()
  unwrap(await supabase.rpc('push_subscribe', { p_endpoint: json.endpoint, p_p256dh: json.keys?.p256dh, p_auth: json.keys?.auth, p_user_agent: navigator.userAgent }))
  return 'on'
}

/** Apaga los avisos en este dispositivo (se borra la suscripción de la cuenta y del navegador) */
export async function disablePush() {
  const sub = await (await registration()).pushManager.getSubscription()
  if (!sub) return
  try { unwrap(await supabase.rpc('push_unsubscribe', { p_endpoint: sub.endpoint })) } finally { await sub.unsubscribe() }
}

/** Preferencias por tipo: { friends, club, news } (todo encendido si todavía no hay) */
export async function getPrefs(userId) {
  const rows = unwrap(await supabase.from('push_prefs').select('friends, club, news').eq('user_id', userId)) || []
  return rows[0] || { friends: true, club: true, news: true }
}

export async function setPrefs({ friends, club, news }) {
  unwrap(await supabase.rpc('push_set_prefs', { p_friends: friends, p_club: club, p_news: news }))
}

/** Aviso de prueba a mis propios dispositivos */
export async function sendTestPush() {
  const { data, error } = await supabase.functions.invoke('push-dispatch', { body: { action: 'test' } })
  if (error) throw new Error('No pudimos mandar el aviso de prueba.')
  return Boolean(data?.ok)
}
