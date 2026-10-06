/**
 * Lógica pura del mercado de pases: precio, filtros, orden y validación de ofertas.
 * Sin React ni Supabase, para poder probarla.
 */
import { positionGroup } from './squad'

export const SCOUT_COST = 300

export const MARKET_SORT_OPTIONS = [
  { value: 'overall', label: 'Nivel' },
  { value: 'potential', label: 'Potencial' },
  { value: 'price', label: 'Precio' },
  { value: 'age', label: 'Edad' }
]

const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const fullName = (p) => `${p.first_name || ''} ${p.last_name || ''}`.trim()

/** Lo que pide el club por el jugador (si falta, su valor de mercado o una estimación) */
export const marketPrice = (p) => Number(p.asking_price) || Number(p.market_value) || (Number(p.attr_pace) || 50) * 10000

export const isScouted = (p) => (p.scout_level || 0) > 0

/** Rango "35-55" que se muestra mientras el jugador no fue ojeado (±10 sobre el valor real) */
export const hiddenRange = (value) => {
  const v = Number(value) || 50
  return `${Math.max(10, v - 10)}-${Math.min(99, v + 10)}`
}

/** Filtra por línea, texto, ritmo mínimo y sólo los que el club puede pagar */
export const filterMarketPlayers = (players, { group = 'ALL', query = '', minPace = '', budget = null, onlyAffordable = false } = {}) => {
  const q = normalize(query).trim()
  const pace = parseInt(minPace, 10)
  return players.filter(p => {
    if (group !== 'ALL' && positionGroup(p.position) !== group) return false
    if (q && !normalize(`${fullName(p)} ${p.clubs?.name || ''}`).includes(q)) return false
    if (!isNaN(pace) && (p.attr_pace || 0) < pace) return false
    if (onlyAffordable && budget != null && marketPrice(p) > budget) return false
    return true
  })
}

export const sortMarketPlayers = (players, key = 'overall') => {
  const level = (p) => p.attr_overall || p.overall || 0
  const cmp = {
    overall: (a, b) => level(b) - level(a),
    potential: (a, b) => (b.attr_potential || 0) - (a.attr_potential || 0),
    price: (a, b) => marketPrice(a) - marketPrice(b),
    age: (a, b) => (a.age || 0) - (b.age || 0)
  }[key] || (() => 0)
  return [...players].sort((a, b) => cmp(a, b) || fullName(a).localeCompare(fullName(b), 'es'))
}

/** Montos sugeridos para una oferta por un jugador valuado en `value` */
export const offerPresets = (value) => {
  const base = Number(value) || 0
  return [
    { label: 'Mínima', hint: '−15%', amount: Math.round(base * 0.85) },
    { label: 'Precio pedido', hint: '100%', amount: base },
    { label: 'Generosa', hint: '+10%', amount: Math.round(base * 1.1) }
  ]
}

/** Devuelve el mensaje de error de una oferta, o '' si es válida */
export const validateOffer = (raw, budget) => {
  const amount = parseInt(raw, 10)
  if (isNaN(amount) || amount <= 0) return 'Ingresá un monto válido para la oferta.'
  if (amount > (budget || 0)) return 'No tenés presupuesto suficiente para esta oferta.'
  return ''
}

/** Por qué no se puede ofertar ahora (null si se puede) */
export const offerBlockReason = (player, { isOpen, budget }) => {
  if (!isOpen) return 'Mercado cerrado'
  if (marketPrice(player) > (budget || 0)) return 'Sin presupuesto'
  return null
}
