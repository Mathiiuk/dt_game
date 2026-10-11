// "La semana pasa": frases, días y resumen que se muestran mientras se procesa el avance de semana (todo puro, sin red).
import { formatMoney } from '../lib/format'

/** Si la espera es más corta que esto no se muestra nada (evita el parpadeo) */
export const SHOW_AFTER_MS = 600
/** Una vez visible, se queda al menos este tiempo para que se lea */
export const MIN_VISIBLE_MS = 1100
/** Cada cuánto cambia la frase */
export const PHRASE_EVERY_MS = 1200

export const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// En el orden en que el avance procesa de verdad cada cosa
export const WEEK_PHRASES = [
  'El plantel entrena en la canchita',
  'El cuerpo médico revisa tobillos',
  'El utilero cuenta las pelotas',
  'La plata entra y sale de la caja',
  'Los rivales juegan sus partidos',
  'En el vestuario hay chimento',
  'Se arma la semana que viene'
]

const wrap = (n, len) => ((n % len) + len) % len
export const phraseAt = (tick) => WEEK_PHRASES[wrap(Math.trunc(tick) || 0, WEEK_PHRASES.length)]
export const dayAt = (tick) => Math.min(Math.max(Math.trunc(tick) || 0, 0), WEEK_DAYS.length - 1)

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

/** Renglones del cierre: qué cambió en la semana (solo lo que cambió) */
export function weekSummary({ budgetBefore, budgetAfter, injuriesRecovered, week } = {}) {
  const lines = []
  if (isNum(week)) lines.push({ id: 'week', text: `Empezó la semana ${week}.`, tone: 'neutral' })
  if (isNum(budgetBefore) && isNum(budgetAfter) && budgetAfter !== budgetBefore) {
    const diff = budgetAfter - budgetBefore
    lines.push({ id: 'money', text: `La caja ${diff > 0 ? 'subió' : 'bajó'} ${formatMoney(Math.abs(diff))}.`, tone: diff > 0 ? 'accent' : 'danger' })
  }
  if (isNum(injuriesRecovered) && injuriesRecovered > 0) {
    lines.push({ id: 'medical', text: injuriesRecovered === 1 ? 'Un jugador recibió el alta médica.' : `${injuriesRecovered} jugadores recibieron el alta médica.`, tone: 'accent' })
  }
  return lines
}
