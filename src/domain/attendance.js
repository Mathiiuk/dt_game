// Asistencia a un partido de local y liquidación de la taquilla. Es la misma fórmula que `settle_gate` en la base, que es quien
// acredita la taquilla (los tests comparan ambas con valores fijos). La usa también la pantalla del partido para la ventaja de local.
export const RECOMMENDED_TICKET_PRICE = 10
export const DERBY_MULTIPLIER = 1.45
export const GATE_OPERATING_SHARE = 0.4
export const MAX_RECENT_WINS = 5

export function matchAttendance({ loyal = 350, casual = 2500, support = 65, price = 10, isDerby = false, recentWins = 2, capacity = 1500 } = {}) {
  const wins = Math.min(MAX_RECENT_WINS, Math.max(0, recentWins))
  const priceRatio = Math.max(0.1, RECOMMENDED_TICKET_PRICE / Math.max(1, price))
  const elasticity = Math.min(1.2, Math.pow(priceRatio, 1.6))
  const form = Math.max(0.7, 0.9 + wins * 0.08)
  const derby = isDerby ? DERBY_MULTIPLIER : 1
  const totalDemand = loyal + casual * (support / 100) * form * derby * elasticity
  const attendance = Math.min(capacity, Math.max(loyal, Math.round(totalDemand)))
  return { attendance, totalDemand: Math.round(totalDemand), fillPct: Number(((attendance / Math.max(1, capacity)) * 100).toFixed(1)) }
}

export function gateFromAttendance(attendance, price) {
  const gross = Math.round(Math.max(0, attendance) * Number(price || 0))
  const operating = Math.round(gross * GATE_OPERATING_SHARE)
  return { gross, operating, net: gross - operating }
}
