/**
 * Avisos antes de una acción riesgosa. Solo aparecen cuando el riesgo es medio o alto, para no cansar.
 * Cada aviso tiene una clave por tipo: el jugador puede silenciarla, y se reactiva sola tras un escándalo
 * o una racha de 5 victorias (ver `shouldReactivateWarnings`).
 */
import { ticketPriceMood, DIFFICULTY } from './consequences'
import { trainingRisk, saleConsequences, purchaseConsequences } from './squadConsequences'

export const WARNING_KEYS = {
  TICKET_PRICE: 'TICKET_PRICE',
  TRAINING_HIGH: 'TRAINING_HIGH',
  SELL_REFERENT: 'SELL_REFERENT',
  EXPENSIVE_SIGNING: 'EXPENSIVE_SIGNING',
  PRESS_SKIP: 'PRESS_SKIP'
}

export const WARNING_LABELS = {
  TICKET_PRICE: 'Entrada cara con el equipo sin ganar',
  TRAINING_HIGH: 'Entrenamiento a máxima intensidad',
  SELL_REFERENT: 'Vender al ídolo o al capitán',
  EXPENSIVE_SIGNING: 'Fichajes que dejan la caja flaca',
  PRESS_SKIP: 'No presentarte a la conferencia'
}

const make = (key, level, title, description, confirmText) => ({
  key,
  level,
  title,
  description,
  confirmText,
  variant: level === 'HIGH' ? 'danger' : 'primary'
})

export function ticketPriceWarning({ price, recommended = 10, streaks = {} }, difficulty = DIFFICULTY.NORMAL) {
  const mood = ticketPriceMood({ price, recommended, streaks }, difficulty)
  if (mood.risk === 'LOW') return null
  return make(
    WARNING_KEYS.TICKET_PRICE,
    mood.risk,
    'La entrada queda cara para este momento',
    `${mood.note} Si la dejás así, la hinchada va a bajar ${Math.abs(mood.fans)} por semana mientras el equipo siga sin ganar.`,
    'Dejar este precio'
  )
}

export function trainingWarning({ intensity, consecutiveHigh = 0, avgFitness = 75, matchInDays = null }) {
  if (intensity !== 'HIGH') return null
  const risk = trainingRisk({ consecutiveHigh, avgFitness, matchInDays })
  if (risk === 'LOW') return null
  const reasons = []
  if (consecutiveHigh >= 2) reasons.push(`ya van ${consecutiveHigh} semanas seguidas a máxima intensidad`)
  else if (consecutiveHigh === 1) reasons.push('la semana pasada también fue a máxima intensidad')
  if (avgFitness < 70) reasons.push(`la condición física del plantel está en ${avgFitness}`)
  if (matchInDays !== null && matchInDays <= 2) reasons.push('hay partido en pocos días')
  return make(
    WARNING_KEYS.TRAINING_HIGH,
    risk,
    'Entrenar a máxima intensidad es riesgoso ahora',
    `Sube el riesgo de lesiones y el vestuario se desgasta: ${reasons.join(', ')}.`,
    'Entrenar fuerte igual'
  )
}

export function saleWarning({ isIdol = false, isCaptain = false, playerName = 'El jugador' }, difficulty = DIFFICULTY.NORMAL) {
  const effects = saleConsequences({ isIdol, isCaptain }, difficulty)
  if (!effects.notes.length) return null
  return make(
    WARNING_KEYS.SELL_REFERENT,
    isIdol ? 'HIGH' : 'MEDIUM',
    `${playerName} es un referente`,
    `${effects.notes.join(' ')} Efecto estimado: hinchada ${effects.fans}, vestuario ${effects.locker}.`,
    'Aceptar la venta'
  )
}

export function purchaseWarning({ fee, marketValue, balance, weeklyExpenses = 0, installments = 1, wageOverBudget = false }, difficulty = DIFFICULTY.NORMAL) {
  const effects = purchaseConsequences({ fee, marketValue, balance, weeklyExpenses, installments, wageOverBudget }, difficulty)
  if (!effects.board) return null
  return make(
    WARNING_KEYS.EXPENSIVE_SIGNING,
    effects.board <= -5 ? 'HIGH' : 'MEDIUM',
    'Este fichaje te complica con la dirigencia',
    `${effects.notes.join(' ')} Efecto estimado: dirigencia ${effects.board}.`,
    'Fichar igual'
  )
}

/** ¿Se silenciaron los avisos de este tipo? `muted` es el mapa guardado en el club */
export const isWarningMuted = (muted, key) => Boolean(muted && muted[key])

/** Los avisos silenciados se reactivan tras un escándalo nuevo o al llegar a 5 victorias seguidas */
export function shouldReactivateWarnings({ previousScandals = 0, scandals = 0, winStreak = 0 }) {
  return scandals > previousScandals || winStreak === 5
}
