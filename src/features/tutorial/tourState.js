// Cuándo corresponde mostrar el tutorial: solo la primera vez que una cuenta nueva entra al juego.
// Se recuerda en la cuenta (metadatos de usuario) para que no vuelva a salir en otro dispositivo, y en este navegador como respaldo.
import { TOUR_VERSION } from './tourSteps'

/** Las cuentas creadas antes de esta fecha ya conocen el juego: para ellas el tutorial es opcional (desde "Más") */
export const TOUR_SINCE = '2026-10-11T00:00:00Z'

export const EVENT_START_TOUR = 'vestuario:start-tour'

export const tourKey = (userId) => `vestuario-tour-v${TOUR_VERSION}:${userId}`

export const isNewAccount = (createdAt, since = TOUR_SINCE) => Boolean(createdAt) && new Date(createdAt).getTime() >= new Date(since).getTime()

const readLocal = (userId) => {
  try { return window.localStorage.getItem(tourKey(userId)) === 'done' } catch { return false }
}

/** ¿Esta cuenta ya terminó o salteó el tutorial? */
export const tourDone = (user) => {
  if (!user) return true
  if (Number(user.user_metadata?.tour_version || 0) >= TOUR_VERSION) return true
  return readLocal(user.id)
}

/** El tutorial arranca solo si la cuenta es nueva, no lo vio y está en el inicio */
export const shouldAutoStart = (user, pathname) => Boolean(user) && pathname === '/dashboard' && isNewAccount(user.created_at) && !tourDone(user)

/** Lo deja anotado en este navegador y en la cuenta (si la cuenta falla, igual no vuelve a salir acá) */
export async function markTourDone(user, updateUser) {
  if (!user) return
  try { window.localStorage.setItem(tourKey(user.id), 'done') } catch { /* sin almacenamiento: queda solo en la cuenta */ }
  try { await updateUser?.({ data: { tour_version: TOUR_VERSION } }) } catch { /* se reintenta en otra sesión; en este navegador ya quedó */ }
}
