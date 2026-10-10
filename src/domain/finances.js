/**
 * Reglas puras de la pantalla de Finanzas: instalaciones, costos de mejora, precios de entrada y salud financiera.
 */

import { tierIncomeFactor } from './pyramid'
import { formatMoney } from '../lib/format'

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
  const tier = tierIncomeFactor(club.league_tier)
  const income = {
    members: Math.round(Math.round(ECONOMY.members * ECONOMY.memberDue) * tier),
    sponsors: Math.round((ECONOMY.sponsorBase + (club.reputation ?? 15) * ECONOMY.sponsorPerReputation) * tier),
    tv: Math.round(ECONOMY.tvRights * tier),
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

/**
 * Retorno de inversión estimado (ROI) para la mejora de infraestructura
 */
export function getFacilityROI(facilityKey, _currentLevel = 1, cost = 10000) {
  if (facilityKey === 'stadium_level') {
    const estimatedExtraGate = 700
    const paybackMatches = Math.max(1, Math.ceil(cost / estimatedExtraGate))
    return {
      gainText: '+1.000 lugares de capacidad y +$700 potenciales por partido',
      paybackText: `Recuperás la inversión en aprox. ~${paybackMatches} partidos de local`
    }
  }

  if (facilityKey === 'store_level') {
    const extraPerWeek = ECONOMY.storePerLevel
    const paybackWeeks = Math.max(1, Math.ceil(cost / extraPerWeek))
    return {
      gainText: `+$${extraPerWeek}/sem en ventas de camisetas y merchandising`,
      paybackText: `Recuperás la inversión en aprox. ~${paybackWeeks} semanas`
    }
  }

  return {
    gainText: 'Reduce recaídas y baja un 30% los tiempos de recuperación médica',
    paybackText: 'Retorno deportivo directo: tenés a tus mejores titulares siempre listos'
  }
}

/**
 * Semáforo dinámico y lema arcade de salud financiera
 */
export function getTycoonHealth(status, balance = 0, expensesTotal = 3000) {
  const runway = expensesTotal > 0 ? Math.floor(Number(balance || 0) / expensesTotal) : 52
  const baseHealth = healthInfo(status)

  if (status === 'HEALTHY' || runway >= 16) {
    return {
      ...baseHealth,
      slogan: 'Estamos dulces',
      runwayWeeks: `${runway} semanas de margen`,
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    }
  }

  if (status === 'CAUTION' || runway >= 5) {
    return {
      ...baseHealth,
      slogan: 'Cuidá los gastos',
      runwayWeeks: `${runway} semanas de margen`,
      badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    }
  }

  return {
    ...baseHealth,
    slogan: 'Hay que levantarla',
    runwayWeeks: `${Math.max(1, runway)} semanas de margen`,
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  }
}



/** Tope de sueldos semanales que autoriza la dirigencia cuando el club no tiene uno propio */
export const DEFAULT_WAGE_CAP = 3500
export const wageCapOf = (club) => Number(club?.wage_budget) || DEFAULT_WAGE_CAP

/** Masa salarial semanal: lo que cobran los jugadores (contract_salary) más el cuerpo técnico. Es la misma cuenta del cierre semanal. */
export function payroll({ players = [], staff = [] } = {}) {
  const sum = (list, f) => list.reduce((t, x) => t + Number(f(x) || 0), 0)
  const playerWages = Math.round(sum(players, p => p.contract_salary ?? 500))
  const staffWages = Math.round(sum(staff, s => s.wage_weekly ?? s.salary ?? 120))
  return { playerWages, staffWages, total: playerWages + staffWages }
}

/**
 * Cómo viene la masa salarial contra el tope de la dirigencia.
 * `percent` puede pasar de 100 (para decirlo); `barValue` es para dibujar la barra (nunca más de 100).
 */
export function wageCapStatus(bill, cap) {
  const limit = Number(cap) > 0 ? Number(cap) : DEFAULT_WAGE_CAP
  const used = Math.max(0, Number(bill) || 0)
  const percent = Math.round((used / limit) * 100)
  const over = used > limit
  return {
    bill: used,
    cap: limit,
    percent,
    barValue: Math.min(100, percent),
    tone: over ? 'danger' : percent > 85 ? 'warning' : 'accent',
    over,
    margin: limit - used,
    overBy: over ? used - limit : 0
  }
}

/** Qué significa el tope, en tres líneas para el explicador */
export const WAGE_CAP_EXPLAINER = [
  'Es lo que cobran por semana todos tus jugadores y el cuerpo técnico, contra el máximo que autoriza la dirigencia.',
  'Pasarse no te frena: te deja fichar y renovar, pero la dirigencia se enoja y baja la satisfacción financiera.',
  'El tope sube al cerrar la temporada: un poco si te quedás en la categoría y bastante si ascendés.'
]

/**
 * Compara la caja del club con el último saldo del libro de movimientos.
 * Algunas operaciones (fichajes, premios, bonos) mueven la caja sin dejar asiento, así que una diferencia no es un error:
 * se explica en lugar de "corregirla".
 */
export function balanceCheck(budget, lastLedgerBalance) {
  if (lastLedgerBalance === null || lastLedgerBalance === undefined || Number.isNaN(Number(lastLedgerBalance))) {
    return { status: 'EMPTY', drift: 0, message: 'Todavía no hay movimientos registrados para comparar con la caja.' }
  }
  const drift = Math.round(Number(budget || 0) - Number(lastLedgerBalance))
  if (Math.abs(drift) < 1) return { status: 'OK', drift: 0, message: 'Todo cuadra: la caja es igual al último saldo del libro.' }
  const side = drift > 0 ? 'más' : 'menos'
  return {
    status: 'DRIFT',
    drift,
    message: `La caja tiene ${formatMoney(Math.abs(drift))} ${side} que el último saldo del libro. Pasa cuando hay movimientos que no se anotan uno por uno, como fichajes, premios o primas.`
  }
}
