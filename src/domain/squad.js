/**
 * Lógica pura de la lista de plantel: grupos de posición, filtros, orden y alertas por jugador.
 * Sin React ni Supabase, para poder probarla.
 */

import { normalizePosition, positionLine } from './positions'

const LINE_TO_GROUP = { ARQ: 'GK', DEF: 'DEF', MED: 'MED', DEL: 'DEL' }

export const POSITION_GROUP_OPTIONS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'GK', label: 'Arqueros' },
  { value: 'DEF', label: 'Defensas' },
  { value: 'MED', label: 'Volantes' },
  { value: 'DEL', label: 'Delanteros' }
]

/** 'DFC' (o el viejo 'LCB') -> 'DEF'; posiciones desconocidas caen en 'MED' (la más neutra) */
export const positionGroup = (position) => LINE_TO_GROUP[positionLine(normalizePosition(position))] || 'MED'

export const SORT_OPTIONS = [
  { value: 'overall', label: 'Nivel' },
  { value: 'age', label: 'Edad' },
  { value: 'salary', label: 'Salario' },
  { value: 'morale', label: 'Moral' },
  { value: 'name', label: 'Nombre' }
]

const level = (p) => p.attr_overall || p.overall || 50
const salary = (p) => Number(p.contract_salary ?? p.contract_wage ?? 0)
const morale = (p) => p.morale ?? p.state_morale ?? 70
const fullName = (p) => `${p.first_name || ''} ${p.last_name || ''}`.trim()

const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Filtra por grupo de posición y por texto (sin tildes ni mayúsculas) */
export const filterPlayers = (players, { group = 'ALL', query = '' } = {}) => {
  const q = normalize(query).trim()
  return players.filter(p => {
    if (group !== 'ALL' && positionGroup(p.position) !== group) return false
    if (q && !normalize(fullName(p)).includes(q)) return false
    return true
  })
}

/** Orden estable; nivel, salario y moral descendente; edad y nombre ascendente */
export const sortPlayers = (players, key = 'overall') => {
  const copy = [...players]
  const cmp = {
    overall: (a, b) => level(b) - level(a),
    age: (a, b) => (a.age || 0) - (b.age || 0),
    salary: (a, b) => salary(b) - salary(a),
    morale: (a, b) => morale(b) - morale(a),
    name: (a, b) => fullName(a).localeCompare(fullName(b), 'es')
  }[key] || (() => 0)
  return copy.sort((a, b) => cmp(a, b) || fullName(a).localeCompare(fullName(b), 'es'))
}

/** Estado de salud/ánimo: tono semántico para un valor 0-100 */
export const meterTone = (value) => (value >= 75 ? 'accent' : value >= 50 ? 'warning' : 'danger')

/** Resumen del plantel para la cabecera: totales, lesionados, transferibles y masa salarial */
export const summarizeSquad = (players) => ({
  total: players.length,
  injured: players.filter(p => p.is_injured).length,
  listed: players.filter(p => p.is_transfer_listed || p.transfer_status === 'TRANSFER_LISTED').length,
  weeklyWages: players.reduce((s, p) => s + salary(p), 0),
  avgLevel: players.length ? Math.round(players.reduce((s, p) => s + level(p), 0) / players.length) : 0
})

export const isListedForSale = (p) => !!(p.is_transfer_listed || p.transfer_status === 'TRANSFER_LISTED')
export const playerLevel = level
export const playerSalary = salary
export const playerMorale = morale
