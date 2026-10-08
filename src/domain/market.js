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

export const INSTALLMENT_UPFRONT = 0.4 // en 3 cuotas se paga el 40% hoy y el resto en dos cuotas semanales
export const INSTALLMENT_SURCHARGE = 1.08 // pagar en cuotas suma 8% al precio

/** Lo que se paga hoy por un monto ofertado: todo de contado, o el 40% si es en cuotas */
export const payToday = (amount, installments = 1) => (installments === 3 ? Math.round(amount * INSTALLMENT_UPFRONT) : amount)

/** Monto de cada cuota restante (dos, semanales) de una compra en 3 cuotas */
export const installmentAmounts = (amount) => {
  const rest = amount - payToday(amount, 3)
  const first = Math.round(rest / 2)
  return [first, rest - first]
}

/** Devuelve el mensaje de error de una oferta, o '' si es válida (en cuotas solo se necesita el 40% hoy) */
export const validateOffer = (raw, budget, installments = 1) => {
  const amount = parseInt(raw, 10)
  if (isNaN(amount) || amount <= 0) return 'Ingresá un monto válido para la oferta.'
  if (payToday(amount, installments) > (budget || 0)) return 'No tenés presupuesto suficiente para esta oferta.'
  return ''
}

/** Por qué no se puede ofertar ahora (null si se puede) */
export const offerBlockReason = (player, { isOpen, budget }) => {
  if (!isOpen) return 'Mercado cerrado'
  if (marketPrice(player) > (budget || 0)) return 'Sin presupuesto'
  return null
}

/**
 * Paleta de color arcade por posición (Panini card styling)
 */
export const getPositionColorTheme = (position = '') => {
  const pos = String(position).toUpperCase()
  if (['PO', 'GK'].includes(pos)) {
    return {
      key: 'emerald',
      headerBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      badgeTone: 'emerald',
      glow: 'shadow-emerald-500/20'
    }
  }
  if (['DFC', 'LI', 'LD', 'CB', 'LB', 'RB', 'DF', 'DEF'].includes(pos)) {
    return {
      key: 'sky',
      headerBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      badgeTone: 'sky',
      glow: 'shadow-sky-500/20'
    }
  }
  if (['MCD', 'MC', 'MCO', 'MD', 'MI', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'MED'].includes(pos)) {
    return {
      key: 'amber',
      headerBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      badgeTone: 'amber',
      glow: 'shadow-amber-500/20'
    }
  }
  return {
    key: 'rose',
    headerBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    badgeTone: 'rose',
    glow: 'shadow-rose-500/20'
  }
}

/**
 * Jerarquía de la tarjeta en el mercado actual: Estrella, Joya o Ganga
 */
export const getMarketHierarchyTag = (player, allPlayers = []) => {
  if (!player) return null
  const ovr = Number(player.attr_overall || player.overall || 50)
  const age = Number(player.age || 25)
  const potential = Number(player.attr_potential || player.potential || ovr)
  const price = marketPrice(player)

  const samePos = allPlayers.filter(p => (p.position || '') === (player.position || ''))
  const maxOvrInPos = Math.max(...samePos.map(p => Number(p.attr_overall || p.overall || 0)), ovr)

  if (ovr >= maxOvrInPos && ovr >= 65) {
    return { label: '⭐ Estrella', tone: 'gold', className: 'border-amber-400/80 bg-amber-500/10 text-amber-300' }
  }
  if (age <= 21 && potential >= 75) {
    return { label: '💎 Joya', tone: 'cyan', className: 'border-cyan-400/80 bg-cyan-500/10 text-cyan-300' }
  }
  if (price > 0 && price <= 10000 && ovr >= 55) {
    return { label: '🔥 Ganga', tone: 'orange', className: 'border-orange-400/80 bg-orange-500/10 text-orange-300' }
  }
  return null
}

/**
 * 1 rasgo de personalidad cómico y memorable por jugador (arcade)
 */
export const getMarketPlayerTrait = (player) => {
  if (!player) return { label: 'Cumplidor', desc: 'Rinde 6 puntos sin fisuras', icon: '⚙️' }
  const pace = Number(player.attr_pace || 50)
  const age = Number(player.age || 24)
  const ovr = Number(player.attr_overall || player.overall || 50)

  if (pace >= 75) return { label: 'Correcaminos', desc: 'Imparable en velocidad y contraataques', icon: '⚡' }
  if (age >= 32) return { label: 'Líder de Vestuario', desc: 'Voz de mando y experiencia de mil batallas', icon: '🦁' }
  if (age <= 20) return { label: 'Pibe con Hambre', desc: 'Presiona y muerde cada pelota', icon: '🔥' }
  if (ovr >= 70) return { label: 'Distinto', desc: 'Tiene pinceladas de potrero y jerarquía', icon: '🎩' }
  if (player.position === 'GK' || player.position === 'PO') return { label: 'Muralla', desc: 'Vuela de palo a palo', icon: '🧤' }
  return { label: 'Especialista', desc: 'Cumplidor táctico y disciplinado', icon: '🎯' }
}

/**
 * Compara al candidato con el titular actual del plantel en su puesto
 */
export const compareWithStarter = (candidate, ownSquad = []) => {
  if (!candidate) return { status: 'uncovered', diff: 0, text: 'Sin datos', starterName: null }
  const pos = candidate.position
  const candidateOvr = Number(candidate.attr_overall || candidate.overall || 50)

  const peers = ownSquad.filter(p => p.position === pos)
  if (peers.length === 0) {
    return {
      status: 'uncovered',
      diff: 0,
      text: '🟢 Cubre un puesto sin titular',
      starterName: null
    }
  }

  const starter = peers.reduce((best, cur) => {
    const curOvr = Number(cur.attr_overall || cur.overall || 0)
    const bestOvr = Number(best.attr_overall || best.overall || 0)
    return curOvr > bestOvr ? cur : best
  }, peers[0])

  const starterOvr = Number(starter.attr_overall || starter.overall || 50)
  const diff = candidateOvr - starterOvr
  const starterName = starter.last_name || starter.first_name || 'titular'

  if (diff > 0) {
    return {
      status: 'improves',
      diff,
      text: `🟢 Mejora el puesto (+${diff} vs ${starterName})`,
      starterName
    }
  }
  if (diff === 0 || diff === -1) {
    return {
      status: 'rotates',
      diff,
      text: `🟡 Rota el puesto (a la par de ${starterName})`,
      starterName
    }
  }
  return {
    status: 'below',
    diff,
    text: `🔴 Suplente (${diff} vs ${starterName})`,
    starterName
  }
}

/**
 * Calcula el impacto financiero de un fichaje en caja y presupuesto salarial
 */
export const calculateSigningImpact = ({
  fee = 0,
  budget = 0,
  weeklyWage = 0,
  currentPayroll = 0,
  wageBudgetWeekly = 0
} = {}) => {
  const numFee = Number(fee || 0)
  const numBudget = Number(budget || 0)
  const numWage = Number(weeklyWage || 0)
  const numPayroll = Number(currentPayroll || 0)
  const numWageBudget = Number(wageBudgetWeekly || 0)

  const cashLeft = numBudget - numFee
  const newPayroll = numPayroll + numWage
  const wageMarginLeft = numWageBudget > 0 ? numWageBudget - newPayroll : 999999
  const isAffordable = cashLeft >= 0 && (numWageBudget === 0 || wageMarginLeft >= 0)
  const isTight = cashLeft >= 0 && (cashLeft < (numWage * 3) || cashLeft < 2000)

  return {
    cashLeft,
    newPayroll,
    wageMarginLeft,
    isAffordable,
    isTight
  }
}

const AGENTS = [
  { name: 'Coco Martínez', avatar: '👔', quote: 'Mirá que tengo tres clubes preguntando por él... pero me caés bien, DT.' },
  { name: 'Paco Casal', avatar: '💼', quote: 'El muchacho quiere gloria y minutos. Si la propuesta es seria, cerramos hoy.' },
  { name: 'Guille Cóppola', avatar: '🕶️', quote: '¡Piedra libre para los talentos! Este pibe te llena la cancha él solo.' },
  { name: 'Mino Bertoni', avatar: '🎩', quote: 'Calidad asegurada de primera línea. Hablemos de números y firmamos.' },
  { name: 'El Turco Mohamed', avatar: '🚬', quote: 'Te traigo una máquina. Ponele la camiseta el domingo que no te deja a pata.' }
]

/**
 * Genera el perfil de representante para la negociación conversacional
 */
export const getRepresentativeProfile = (player = {}) => {
  const seed = (String(player.id || player.last_name || '1').charCodeAt(0) || 0) % AGENTS.length
  const rep = AGENTS[seed]
  return {
    name: rep.name,
    avatar: rep.avatar,
    openingQuote: rep.quote
  }
}

