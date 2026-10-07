/**
 * Reglas puras de la pantalla de Finanzas: instalaciones, costos de mejora, precios de entrada y salud financiera.
 */

export const TICKET_PRICES = [6, 8, 10, 14, 18]

/**
 * Economía de un club de la división 5 (todo en $ por semana salvo aclaración).
 * Calibrada para que un plantel inicial (sueldos ~2.400) deje un margen chico: +300 a +900 si se gestiona bien
 * y negativo si se ficha de más, se baja la entrada o se pierde la taquilla.
 */
export const ECONOMY = {
  members: 350,
  memberDue: 0.8,
  sponsorBase: 400,
  sponsorPerReputation: 8,
  tvRights: 330,
  storePerLevel: 150,
  stadiumMaintBase: 200,
  stadiumMaintPerLevel: 60,
  academyMaintPerLevel: 100,
  /** Porción de la taquilla bruta que se va en seguridad, árbitros y logística */
  gateOperatingShare: 0.4,
  /** Caja a la que se normalizan las carreras existentes y desde la que arrancan las nuevas */
  normalizedCash: 20000
}

/**
 * Líneas de ingresos y gastos de una semana (sin taquilla, que se liquida por partido de local).
 * `club`: { reputation, stadium_level, academy_level, store_level }, `players`: contract_salary semanal,
 * `staff`: wage_weekly (o salary). Devuelve importes positivos por concepto y los totales.
 */
export function weeklyBudget({ club = {}, players = [], staff = [] } = {}) {
  const sum = (list, f) => list.reduce((t, x) => t + Number(f(x) || 0), 0)
  const income = {
    members: Math.round(ECONOMY.members * ECONOMY.memberDue),
    sponsors: ECONOMY.sponsorBase + (club.reputation ?? 15) * ECONOMY.sponsorPerReputation,
    tv: ECONOMY.tvRights,
    store: storeWeeklyIncome(club.store_level)
  }
  const expenses = {
    playerWages: Math.round(sum(players, p => p.contract_salary ?? 500)),
    staffWages: Math.round(sum(staff, s => s.wage_weekly ?? s.salary ?? 120)),
    stadiumMaint: ECONOMY.stadiumMaintBase + (club.stadium_level || 1) * ECONOMY.stadiumMaintPerLevel,
    academyMaint: (club.academy_level || 1) * ECONOMY.academyMaintPerLevel
  }
  const totalIncome = sum(Object.values(income), x => x)
  const totalExpenses = sum(Object.values(expenses), x => x)
  return { income, expenses, totalIncome, totalExpenses, net: totalIncome - totalExpenses }
}

/** Taquilla de un partido de local: bruta, costo operativo y neta */
export function gateSettlement(attendance, ticketPrice) {
  const gross = Math.round(Math.max(0, attendance) * Number(ticketPrice || 0))
  const operating = Math.round(gross * ECONOMY.gateOperatingShare)
  return { gross, operating, net: gross - operating }
}

/** Semanas de sueldos y gastos que cubre la caja (null si el flujo no es negativo) */
export function runwayWeeks(cash, net) {
  if (net >= 0) return null
  return Math.max(0, Number(cash || 0)) / Math.abs(net)
}

/** Instalaciones mejorables: costo por nivel (costo = nivel actual × costPerLevel) */
export const FACILITIES = [
  {
    key: 'stadium_level',
    name: 'Tribunas del estadio',
    description: 'Más tribunas populares: sube la taquilla en los partidos de local.',
    costPerLevel: 35000,
    action: 'Ampliar tribunas'
  },
  {
    key: 'medical_level',
    name: 'Centro médico y kinesiología',
    description: 'Rehabilitación que reduce recaídas y acorta el tiempo de baja por lesión.',
    costPerLevel: 20000,
    action: 'Mejorar equipamiento'
  },
  {
    key: 'store_level',
    name: 'Tienda oficial y merchandising',
    description: 'Camisetas, bufandas y accesorios: más ingresos comerciales por semana.',
    costPerLevel: 12000,
    action: 'Expandir tienda'
  }
]

export const levelOf = (club, key) => club?.[key] || 1

export const upgradeCost = (facility, level) => (level || 1) * facility.costPerLevel

/** Ingreso semanal de la tienda por nivel */
export const storeWeeklyIncome = (level) => (level || 1) * ECONOMY.storePerLevel

/** Etiqueta y tono de la salud financiera */
export const healthInfo = (status) => {
  if (status === 'HEALTHY') return { label: 'Finanzas saludables', tone: 'accent' }
  if (status === 'CAUTION') return { label: 'Alerta de liquidez', tone: 'warning' }
  return { label: 'Déficit crítico', tone: 'danger' }
}

export const canAfford = (budget, cost) => Number(budget || 0) >= cost
