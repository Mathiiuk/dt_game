/**
 * Consecuencias de las decisiones sobre el plantel: carga de entrenamiento, ventas de referentes,
 * fichajes caros, referentes en el banco y sueldos desparejos (reglas puras).
 */
import { scaleEffect, DIFFICULTY } from './consequences'

const isHigh = (intensity) => intensity === 'HIGH'

/**
 * Carga acumulada del entrenamiento. `recent` son las intensidades de las semanas anteriores, la más nueva primero
 * (una semana regenerativa corta la racha). `current` es la intensidad de esta semana.
 */
export function trainingLoad({ recent = [], current = 'MEDIUM', age = 25 }) {
  let consecutiveHigh = isHigh(current) ? 1 : 0
  if (consecutiveHigh) {
    for (const intensity of recent) {
      if (!isHigh(intensity)) break
      consecutiveHigh++
    }
  }
  const ageExtra = consecutiveHigh && (age > 29 || age < 20) ? 0.3 : 0
  return {
    consecutiveHigh,
    injuryMultiplier: Number((1 + 0.2 * Math.max(0, consecutiveHigh - 1) + ageExtra).toFixed(2)),
    exhausted: consecutiveHigh >= 3
  }
}

/** Efecto sobre el vestuario de esta semana de entrenamiento, según cuántas semanas seguidas fue intensa */
export function trainingLoadConsequence(consecutiveHigh, difficulty = DIFFICULTY.NORMAL) {
  if (consecutiveHigh >= 3) {
    return { locker: scaleEffect(-6, difficulty), note: `${consecutiveHigh} semanas seguidas de entrenamiento durísimo: el plantel está reventado y las lesiones se cuentan de a varias.` }
  }
  if (consecutiveHigh === 2) {
    return { locker: scaleEffect(-3, difficulty), note: 'Segunda semana a máxima intensidad: los jugadores arrastran la fatiga.' }
  }
  return { locker: 0, note: null }
}

/** Nivel de riesgo para avisar antes de elegir intensidad alta */
export function trainingRisk({ consecutiveHigh = 0, avgFitness = 75, matchInDays = null }) {
  if (consecutiveHigh >= 2 || avgFitness < 60) return 'HIGH'
  if (consecutiveHigh === 1 || avgFitness < 70 || (matchInDays !== null && matchInDays <= 2)) return 'MEDIUM'
  return 'LOW'
}

/** Vender al ídolo o al capitán cae mal en la tribuna y en el vestuario */
export function saleConsequences({ isIdol = false, isCaptain = false, fee = 0, balance = null, weeklyExpenses = 0 }, difficulty = DIFFICULTY.NORMAL) {
  let fans = 0
  let locker = 0
  let board = 0
  const notes = []
  // Vender con la caja en apuros alivia a la dirigencia, pero la tribuna lo vive como una venta de urgencia
  if (fee > 0 && balance !== null && weeklyExpenses > 0 && balance < weeklyExpenses * 6) {
    board += 2
    fans -= 1
    notes.push('Vendiste con la caja en apuros: la dirigencia respira y la tribuna lo ve como una venta de urgencia.')
  }
  if (isIdol) {
    fans -= 8
    locker -= 6
    notes.push('Vendiste al ídolo del club: la tribuna lo vive como una traición.')
  }
  if (isCaptain) {
    locker -= 6
    fans -= isIdol ? 0 : 1
    notes.push('El capitán se fue y el vestuario se queda sin referente.')
  }
  return { fans: scaleEffect(fans, difficulty), locker: scaleEffect(locker, difficulty), board: scaleEffect(board, difficulty), notes }
}

/**
 * Fichaje: pagar mucho más que el valor molesta a la dirigencia, y quedar sin caja para sostener los sueldos
 * es peor. `weeklyExpenses` es el gasto semanal fijo del club.
 */
export function purchaseConsequences({ fee, marketValue, balance, weeklyExpenses = 0, installments = 1, wageOverBudget = false }, difficulty = DIFFICULTY.NORMAL) {
  let board = 0
  const notes = []
  // En cuotas hoy se paga el 40%; lo que se debe después también pesa si la caja no lo cubre
  const paidToday = installments === 3 ? fee * 0.4 : fee
  if (installments === 3 && balance - paidToday < fee * 0.6) {
    board -= 1
    notes.push('Fichás en cuotas con una caja que no cubre lo que queda por pagar.')
  }
  if (wageOverBudget) {
    board -= 2
    notes.push('El sueldo del nuevo jugador te pasa del presupuesto salarial.')
  }
  if (marketValue > 0 && fee > marketValue * 1.2) {
    board -= 3
    notes.push('Pagaste muy por encima del valor del jugador: en el palco no cayó bien.')
  }
  const remaining = balance - paidToday
  if (balance > 0 && paidToday > balance * 0.4 && remaining < weeklyExpenses * 6) {
    board -= 5
    notes.push('El fichaje te dejó con la caja flaca: no alcanza para sostener seis semanas de gastos.')
  }
  return { board: scaleEffect(board, difficulty), notes }
}

/** Referentes en el banco: el capitán o el ídolo que no juegan molestan al vestuario y a la tribuna */
export function benchConsequences({ captainBenched = false, idolBenched = false }, difficulty = DIFFICULTY.NORMAL) {
  const notes = []
  let locker = 0
  let fans = 0
  if (captainBenched) {
    locker -= 3
    notes.push('Dejaste al capitán en el banco y en el vestuario se nota.')
  }
  if (idolBenched) {
    fans -= 2
    locker -= 1
    notes.push('El ídolo mira desde el banco: la gente lo pregunta.')
  }
  return { locker: scaleEffect(locker, difficulty), fans: scaleEffect(fans, difficulty), notes }
}

/** Cuántos partidos seguidos sin jugar hacen que un suplente reclame minutos */
export const BENCH_COMPLAINT_GAMES = 4
/** Máximo de reclamos por semana: no todo el banco a la vez */
export const MAX_BENCH_COMPLAINTS = 3

/**
 * Suplentes que no jugaron ni un minuto en los últimos partidos y reclaman minutos. `playedIds` son los jugadores que
 * tuvieron minutos en esos partidos. Se quejan primero los de mejor nivel (los que más se sienten postergados).
 */
export function benchComplainers({ players = [], playedIds = [], games = 0 }) {
  if (games < BENCH_COMPLAINT_GAMES) return []
  const played = new Set(playedIds)
  return players
    .filter(p => !p.is_injured && !p.is_retired && !played.has(p.id))
    .sort((a, b) => Number(b.attr_overall ?? b.overall ?? 0) - Number(a.attr_overall ?? a.overall ?? 0))
    .slice(0, MAX_BENCH_COMPLAINTS)
    .map(p => p.id)
}

/**
 * Inequidad salarial: un jugador cobra al menos 25% menos que un compañero de nivel parecido (±3 de media).
 * Devuelve los ids de los perjudicados.
 */
export function wageInequities(players = []) {
  const ids = []
  for (const p of players) {
    const pay = Number(p.contract_salary || 0)
    const level = Number(p.attr_overall ?? p.overall ?? 0)
    if (!pay || !level) continue
    const unfair = players.some(q => q.id !== p.id
      && Math.abs(Number(q.attr_overall ?? q.overall ?? 0) - level) <= 3
      && Number(q.contract_salary || 0) >= pay * 1.25)
    if (unfair) ids.push(p.id)
  }
  return ids
}
