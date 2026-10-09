/**
 * Dominio de contratos: fechas de vencimiento ancladas al calendario del juego.
 * Convención: los contratos vencen el 30 de junio (cierre de temporada), como en el fútbol real.
 * Funciones puras (sin Supabase ni Date.now) para poder probarlas y reutilizarlas.
 */

// Ventana (en semanas) a partir de la cual se avisa de un contrato por vencer (6 meses)
export const CONTRACT_ALERT_WINDOW_WEEKS = 26
export const URGENT_CONTRACT_WEEKS = 12

// Distribución realista de años de contrato restantes en un plantel recién creado
export const INITIAL_CONTRACT_YEARS_DISTRIBUTION = [
  { years: 1, weight: 20 },
  { years: 2, weight: 30 },
  { years: 3, weight: 30 },
  { years: 4, weight: 15 },
  { years: 5, weight: 5 }
]

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

// Normaliza 'YYYY-MM-DD' (o Date) a una Date en UTC a medianoche
const toUtcDate = (value) => {
  if (value instanceof Date) return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1))
}

const toIso = (date) => date.toISOString().slice(0, 10)

/** Fecha (ISO) del próximo 30 de junio, incluyendo el propio 30 de junio, a partir de una fecha de juego */
export const seasonEndDate = (gameDate) => {
  const d = toUtcDate(gameDate)
  const year = d.getUTCMonth() > 5 || (d.getUTCMonth() === 5 && d.getUTCDate() > 30) ? d.getUTCFullYear() + 1 : d.getUTCFullYear()
  return `${year}-06-30`
}

/** Fecha de vencimiento de un contrato de N temporadas (la actual incluida) firmado en gameDate */
export const contractEndFor = (gameDate, years) => {
  const end = toUtcDate(seasonEndDate(gameDate))
  end.setUTCFullYear(end.getUTCFullYear() + Math.max(1, Math.round(years)) - 1)
  return toIso(end)
}

/** Semanas (enteras, redondeo hacia arriba) que faltan entre dos fechas; negativo si ya pasó */
export const weeksBetween = (fromDate, toDate) =>
  Math.ceil((toUtcDate(toDate) - toUtcDate(fromDate)) / MS_PER_WEEK)

/** Temporadas completas que le quedan a un contrato (mínimo 0) */
export const yearsRemaining = (contractEnd, gameDate) => {
  if (!contractEnd) return 0
  const weeks = weeksBetween(gameDate, contractEnd)
  return weeks <= 0 ? 0 : Math.ceil(weeks / 52)
}

/** true si el contrato vence dentro de la ventana de alerta (y aún no venció) */
export const isContractExpiringSoon = (contractEnd, gameDate, windowWeeks = CONTRACT_ALERT_WINDOW_WEEKS) => {
  if (!contractEnd) return false
  const weeks = weeksBetween(gameDate, contractEnd)
  return weeks > 0 && weeks <= windowWeeks
}

/** Sortea años de contrato restantes con la distribución ponderada. rng() debe devolver [0,1) */
export const pickInitialContractYears = (rng = Math.random) => {
  const total = INITIAL_CONTRACT_YEARS_DISTRIBUTION.reduce((s, x) => s + x.weight, 0)
  let roll = rng() * total
  for (const { years, weight } of INITIAL_CONTRACT_YEARS_DISTRIBUTION) {
    if (roll < weight) return years
    roll -= weight
  }
  return INITIAL_CONTRACT_YEARS_DISTRIBUTION[0].years
}

/** Cuánto le falta a un contrato en palabras ("vence esta semana", "vence en 9 semanas") */
export const weeksLeftLabel = (weeks) => (weeks <= 1 ? 'vence esta semana' : `vence en ${weeks} semanas`)

/**
 * Los jugadores cuyo contrato vence dentro de la ventana de alerta, con las semanas que les faltan, los más urgentes primero.
 * Es la misma regla del aviso del inicio: el Plantel muestra con esto exactamente a quiénes se refiere la alerta.
 * @returns {Array<{ player: object, weeks: number, urgent: boolean, label: string }>}
 */
export const expiringPlayers = (squad = [], gameDate) =>
  squad
    .filter(p => isContractExpiringSoon(p.contract_end, gameDate, CONTRACT_ALERT_WINDOW_WEEKS))
    .map(player => {
      const weeks = weeksBetween(gameDate, player.contract_end)
      return { player, weeks, urgent: weeks <= URGENT_CONTRACT_WEEKS, label: weeksLeftLabel(weeks) }
    })
    .sort((x, y) => x.weeks - y.weeks)

/**
 * Alerta del inicio por contratos que vencen. Aviso suave durante los 6 meses previos; en las últimas 12 semanas es urgente y dice
 * cuántas faltan, porque al cerrar la temporada los que no renovaron quedan libres.
 * @returns {{ id: string, priority: string, title: string, message: string, count: number, actionUrl: string } | null}
 */
// El aviso abre el Plantel ordenado por vencimiento: los que hay que renovar quedan arriba
export const CONTRACTS_ALERT_URL = '/squad?orden=contrato'
export const contractsAlert = (squad = [], gameDate) => {
  const expiring = squad.filter(p => isContractExpiringSoon(p.contract_end, gameDate, CONTRACT_ALERT_WINDOW_WEEKS))
  if (expiring.length === 0) return null
  const weeksLeft = Math.min(...expiring.map(p => weeksBetween(gameDate, p.contract_end)))
  const n = expiring.length
  if (weeksLeft <= URGENT_CONTRACT_WEEKS) {
    return {
      id: 'ALERT_CONTRACTS',
      priority: 'HIGH',
      title: 'Se te vencen contratos',
      message: `${n} ${n === 1 ? 'jugador queda libre' : 'jugadores quedan libres'} en ${weeksLeft} ${weeksLeft === 1 ? 'semana' : 'semanas'} si no renovás. Después del cierre de la temporada no hay vuelta atrás.`,
      count: n,
      actionUrl: CONTRACTS_ALERT_URL
    }
  }
  return {
    id: 'ALERT_CONTRACTS',
    priority: 'LOW',
    title: 'Contratos por Vencer',
    message: `${n} futbolista(s) con contrato que vence en los próximos 6 meses.`,
    count: n,
    actionUrl: CONTRACTS_ALERT_URL
  }
}
