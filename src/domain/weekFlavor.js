// "La semana pasa": frases, días y resumen que se muestran mientras se procesa el avance de semana (todo puro, sin red).
import { formatMoney, formatLongDate, daysBetween } from '../lib/format'

/** Si la espera es más corta que esto no se muestra nada (evita el parpadeo) */
export const SHOW_AFTER_MS = 600
/** Una vez visible, se queda al menos este tiempo para que se lea */
export const MIN_VISIBLE_MS = 1100
/** Cada cuánto cambia la frase */
export const PHRASE_EVERY_MS = 1200

const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_COUNT = 7

// Qué pasa cada día de la semana (el sábado juegan los rivales; el domingo se descansa)
const DAY_PHRASES = {
  Dom: 'Domingo: el plantel descansa y arma el chimento',
  Lun: 'El cuerpo médico revisa tobillos',
  Mar: 'El plantel entrena en la canchita',
  'Mié': 'El utilero cuenta las pelotas',
  Jue: 'La plata entra y sale de la caja',
  Vie: 'En el vestuario hay chimento',
  'Sáb': 'Sábado: los rivales juegan su fecha'
}
export const dayPhrase = (weekday) => DAY_PHRASES[weekday] || 'Se arma la semana que viene'

const parseIso = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''))
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null
}

/** Los 7 días reales que pasan al avanzar, empezando por la fecha de juego actual (sin desfase de zona horaria) */
export function weekDays(fromIso) {
  const start = parseIso(fromIso) || new Date(Date.UTC(2026, 0, 5))
  return Array.from({ length: DAY_COUNT }, (_, i) => {
    const d = new Date(start.getTime() + i * 86_400_000)
    return { date: d.toISOString().slice(0, 10), weekday: WEEKDAY_SHORT[d.getUTCDay()], day: d.getUTCDate() }
  })
}

/** Día resaltado según el tiempo transcurrido (se queda en el último) */
export const dayAt = (tick) => Math.min(Math.max(Math.trunc(tick) || 0, 0), DAY_COUNT - 1)

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

/** Cierre: qué cambió en la semana, qué día es hoy y cuándo es el próximo partido (solo lo que se sabe) */
export function weekSummary({ budgetBefore, budgetAfter, injuriesRecovered, week, today, nextMatchDate } = {}) {
  const lines = []
  if (isNum(week)) lines.push({ id: 'week', text: `Empezó la semana ${week}.`, tone: 'neutral' })
  if (today) {
    lines.push({ id: 'today', text: `Hoy es ${formatLongDate(today)}.`, tone: 'neutral' })
    if (nextMatchDate === null || nextMatchDate === undefined) {
      if (nextMatchDate === null) lines.push({ id: 'match', text: 'No hay partido a la vista.', tone: 'neutral' })
    } else {
      const days = daysBetween(today, nextMatchDate)
      const text = days <= 0 ? 'Hoy se juega tu partido.' : `Próximo partido: ${formatLongDate(nextMatchDate)} (${days === 1 ? 'mañana' : `en ${days} días`}).`
      lines.push({ id: 'match', text, tone: 'neutral' })
    }
  }
  if (isNum(budgetBefore) && isNum(budgetAfter) && budgetAfter !== budgetBefore) {
    const diff = budgetAfter - budgetBefore
    lines.push({ id: 'money', text: `La caja ${diff > 0 ? 'subió' : 'bajó'} ${formatMoney(Math.abs(diff))}.`, tone: diff > 0 ? 'accent' : 'danger' })
  }
  if (isNum(injuriesRecovered) && injuriesRecovered > 0) {
    lines.push({ id: 'medical', text: injuriesRecovered === 1 ? 'Un jugador recibió el alta médica.' : `${injuriesRecovered} jugadores recibieron el alta médica.`, tone: 'accent' })
  }
  return lines
}
