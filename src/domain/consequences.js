/**
 * Consecuencias de las decisiones y los resultados (reglas puras, sin acceso a datos).
 * Los medidores van de 0 a 100: Hinchada (fans), Dirigencia (board) y Vestuario (locker).
 */

export const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))

/** Dificultad: los efectos negativos se escalan, los positivos casi no. */
export const DIFFICULTY = {
  RELAXED: { key: 'RELAXED', label: 'Relajado', negative: 0.7, positive: 1.0 },
  NORMAL: { key: 'NORMAL', label: 'Normal', negative: 1.0, positive: 1.0 },
  REALISTIC: { key: 'REALISTIC', label: 'Realista', negative: 1.3, positive: 0.9 }
}

export const scaleEffect = (delta, difficulty = DIFFICULTY.NORMAL) =>
  Math.round(delta * (delta < 0 ? difficulty.negative : difficulty.positive))

/**
 * Efectos de un partido sobre los tres medidores, ADEMÁS de los básicos que ya aplican la hinchada local
 * y la dirigencia (victoria +4, derrota -6...). Acá van las rachas, las goleadas, los clásicos y la hinchada de visitante.
 * `streaks` es la racha INCLUYENDO este partido (win/loss).
 */
export function matchConsequences({ result, isHome, isDerby = false, goalDiff = 0, streaks = {} }, difficulty = DIFFICULTY.NORMAL) {
  const fans = []
  const board = []
  const locker = []
  const notes = []
  const win = result === 'W' ? (streaks.win || 0) : 0
  const loss = result === 'L' ? (streaks.loss || 0) : 0

  // La hinchada local ya se mueve en recordMatchAtmosphere; de visitante lo hacemos acá, más suave
  if (!isHome) fans.push(result === 'W' ? 2 : result === 'L' ? -2 : 0)

  if (result === 'W') {
    locker.push(goalDiff >= 3 ? 10 : 8)
    if (win >= 3) {
      fans.push(2)
      board.push(2)
      notes.push(`${win} victorias seguidas: el clima mejora en la tribuna y en el palco.`)
    }
    if (win === 5) {
      fans.push(3)
      board.push(2)
      notes.push('Racha de 5 victorias: la hinchada ya habla de pelear arriba.')
    }
  } else if (result === 'L') {
    locker.push(goalDiff <= -3 ? -15 : -8)
    if (loss >= 2) {
      fans.push(-2)
      notes.push('Segunda derrota al hilo: empiezan los murmullos.')
    }
    if (loss >= 3) {
      fans.push(-3)
      board.push(-3)
      locker.push(-4)
      notes.push(`${loss} derrotas seguidas: la dirigencia se reúne y en la prensa ya piden un cambio.`)
    }
    if (goalDiff <= -3) {
      fans.push(-2)
      board.push(-2)
      notes.push('Goleada en contra: el reproche es público.')
    }
    if (isDerby) {
      fans.push(-4)
      notes.push('Perder el clásico duele el doble.')
    }
  } else {
    locker.push(0)
  }

  const sum = (list) => scaleEffect(list.reduce((t, x) => t + x, 0), difficulty)
  return { fans: sum(fans), board: sum(board), locker: sum(locker), notes, streak: { win, loss } }
}

/**
 * Humor semanal por el precio de la entrada. Cobrar por encima de lo razonable se tolera si el equipo gana,
 * y enoja cuando no gana. Bajar el precio con el equipo bien suma simpatía.
 */
export function ticketPriceMood({ price, recommended = 10, streaks = {} }, difficulty = DIFFICULTY.NORMAL) {
  const over = price / recommended - 1
  const failing = (streaks.winless || 0) >= 2
  const winning = (streaks.win || 0) >= 2
  if (over >= 0.5 && failing) {
    return { fans: scaleEffect(-6, difficulty), risk: 'HIGH', note: 'La entrada está carísima para lo que rinde el equipo: la hinchada se queja y se arma un banderazo.' }
  }
  if (over >= 0.2 && failing) {
    return { fans: scaleEffect(-Math.round(over * 10), difficulty), risk: 'MEDIUM', note: 'Con el equipo sin ganar, la gente siente que la entrada está cara.' }
  }
  if (over <= -0.3 && winning) {
    return { fans: scaleEffect(1, difficulty), risk: 'LOW', note: 'Entradas accesibles y equipo ganando: la gente se acerca a la cancha.' }
  }
  return { fans: 0, risk: 'LOW', note: null }
}

/** Satisfacción financiera de la dirigencia (0-100) según la caja, el flujo esperado y el tope salarial */
export function financialSatisfaction({ balance = 0, expectedWeeklyFlow = 0, wageOverBudget = false } = {}) {
  let score = 70
  if (balance < 0) score = 15
  else if (balance < 5000) score = 40
  else if (balance > 30000) score = 85
  if (expectedWeeklyFlow < 0) score -= Math.min(25, Math.round(Math.abs(expectedWeeklyFlow) / 60))
  else score += Math.min(10, Math.round(expectedWeeklyFlow / 150))
  if (wageOverBudget) score -= 10
  return clamp(score)
}

/** Ventaja de local según el humor de la hinchada: de 1,02 (hostil) a 1,10 (caldera) */
export function homeAdvantage(fanSupport = 65) {
  return Number((1.06 + (clamp(fanSupport) - 50) * 0.0008).toFixed(3))
}

/**
 * Índice de presión (0-100): resume qué tan mal van las cosas. Con más de 55 empiezan las apretadas.
 * `objectiveGap` va de 0 (cumpliendo el objetivo) a 1 (muy lejos).
 */
export function pressureIndex({ lossStreak = 0, winlessStreak = 0, objectiveGap = 0, fans = 65, balance = 20000, openScandals = 0 } = {}) {
  const streakPart = Math.min(1, Math.max(lossStreak / 4, winlessStreak / 6))
  const cashPart = balance < 0 ? 1 : balance < 5000 ? 0.5 : 0
  const value = 35 * streakPart + 25 * clamp(objectiveGap, 0, 1) + 20 * ((100 - clamp(fans)) / 100) + 10 * cashPart + 10 * Math.min(1, openScandals / 2)
  return Math.round(value)
}

export const CLIMATE = {
  FLOWS: { key: 'FLOWS', label: 'Fluye', tone: 'accent' },
  TENSION: { key: 'TENSION', label: 'Tensión', tone: 'warning' },
  CRISIS: { key: 'CRISIS', label: 'Crisis', tone: 'danger' },
  CHAOS: { key: 'CHAOS', label: 'Caos', tone: 'danger' }
}

export function climateState(pressure) {
  if (pressure < 30) return CLIMATE.FLOWS
  if (pressure < 55) return CLIMATE.TENSION
  if (pressure <= 80) return CLIMATE.CRISIS
  return CLIMATE.CHAOS
}

/**
 * Qué medidores se muestran según la semana de la carrera (arranque gradual para no abrumar):
 * semanas 1-4 hinchada y dirigencia; 5-8 suma caja y vestuario; desde la 9 presión, clima y barra.
 */
export function climateVisibility(week = 1) {
  return { fans: true, board: true, cash: week >= 5, locker: week >= 5, pressure: week >= 9, barra: week >= 9 }
}
