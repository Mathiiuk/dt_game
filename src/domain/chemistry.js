/**
 * Química del equipo al estilo FIFA: enlaces entre jugadores vecinos en la cancha, con un valor de 0 a 3 cada uno.
 * Como el juego tiene una sola liga, la química sale de: misma nacionalidad, tiempo jugando juntos en el club,
 * mentorías activas, personalidades compatibles y jugar en el puesto natural. Funciones puras.
 */
import { fitLabel } from './positions'

export const ESTABLISHED_MATCHES = 15
export const NEWCOMER_MATCHES = 3

/** Pares de personalidades que se llevan bien (+1) o mal (-1). Los pares son simétricos. */
const GOOD = [
  ['NATURAL_LEADER', 'AMBITIOUS'], ['NATURAL_LEADER', 'STREET_RESILIENT'], ['NATURAL_LEADER', 'FRAGILE'],
  ['MODEL_PROFESSIONAL', 'SLACKER'], ['MODEL_PROFESSIONAL', 'AMBITIOUS'], ['MODEL_PROFESSIONAL', 'MODEL_PROFESSIONAL'],
  ['STREET_RESILIENT', 'STREET_RESILIENT'], ['NATURAL_LEADER', 'MODEL_PROFESSIONAL']
]
const BAD = [
  ['TEMPERAMENTAL', 'TEMPERAMENTAL'], ['TEMPERAMENTAL', 'AMBITIOUS'], ['SLACKER', 'SLACKER'],
  ['FRAGILE', 'TEMPERAMENTAL'], ['NATURAL_LEADER', 'TEMPERAMENTAL'], ['AMBITIOUS', 'AMBITIOUS']
]

const pairKey = (a, b) => [a, b].sort().join('|')
const GOOD_SET = new Set(GOOD.map(([a, b]) => pairKey(a, b)))
const BAD_SET = new Set(BAD.map(([a, b]) => pairKey(a, b)))

/** +1 si las personalidades se complementan, -1 si chocan, 0 si no hay dato o es neutro */
export function personalityFit(a, b) {
  if (!a || !b) return 0
  const key = pairKey(a, b)
  return GOOD_SET.has(key) ? 1 : BAD_SET.has(key) ? -1 : 0
}

const NATURALNESS = { NATURAL: 0.5, COMPATIBLE: 0, ADAPTED: -0.5, OUT_OF_POSITION: -1 }

/**
 * Enlace entre dos jugadores ubicados en `slotA` y `slotB`. `ctx.mentorPairs` es un Set de "idA|idB" (en cualquier orden)
 * con las mentorías activas. Devuelve { strength 0-3, tone, reasons[] }.
 */
export function linkStrength(a, slotA, b, slotB, ctx = {}) {
  let score = 1
  const reasons = []

  if (a.nationality && a.nationality === b.nationality) {
    score += 0.5
    reasons.push('misma nacionalidad')
  }

  const matchesA = a.matches_played ?? 0
  const matchesB = b.matches_played ?? 0
  if (matchesA >= ESTABLISHED_MATCHES && matchesB >= ESTABLISHED_MATCHES) {
    score += 0.5
    reasons.push('mucho tiempo juntos en el club')
  } else if (matchesA < NEWCOMER_MATCHES || matchesB < NEWCOMER_MATCHES) {
    score -= 0.5
    reasons.push('todavía no se conocen')
  }

  if (ctx.mentorPairs?.has(pairKey(a.id, b.id))) {
    score += 1.5
    reasons.push('mentoría en marcha')
  }

  const fit = personalityFit(a.archetype || a.personality, b.archetype || b.personality)
  if (fit > 0) {
    score += 1
    reasons.push('personalidades que se complementan')
  } else if (fit < 0) {
    score -= 1
    reasons.push('personalidades que chocan')
  }

  const natA = NATURALNESS[fitLabel(a.position, slotA).code] ?? 0
  const natB = NATURALNESS[fitLabel(b.position, slotB).code] ?? 0
  score += natA + natB
  if (Math.min(natA, natB) <= -0.5) reasons.push('alguno juega fuera de puesto')
  else if (natA + natB >= 1) reasons.push('los dos en su puesto')

  const strength = Math.min(3, Math.max(0, Math.round(score * 10) / 10))
  return { strength, tone: strength >= 2 ? 'GOOD' : strength >= 1 ? 'OK' : 'BAD', reasons }
}

/** Distancia entre dos puntos de la cancha, en unidades comparables (el ancho mide 68 y el largo 100) */
const distance = (p, q) => Math.hypot((p.x - q.x) * 0.68, p.y - q.y)

/**
 * Pares de jugadores vecinos: cada ficha se une con las `perPlayer` más cercanas (sin repetir pares),
 * siempre que estén a menos de `maxDistance`.
 */
export function neighborPairs(layout, perPlayer = 3, maxDistance = 38) {
  const pairs = new Map()
  for (const p of layout) {
    const near = layout
      .filter(q => q.slot !== p.slot)
      .map(q => ({ q, d: distance(p, q) }))
      .filter(({ d }) => d <= maxDistance)
      .sort((x, y) => x.d - y.d)
      .slice(0, perPlayer)
    for (const { q } of near) pairs.set([p.slot, q.slot].sort().join('|'), [p.slot, q.slot])
  }
  return [...pairs.values()]
}

/** Química del once: enlaces, valor por ficha y total (0-100) */
export function teamChemistry(layout, lineup, players, ctx = {}) {
  const byId = new Map(players.map(p => [p.id, p]))
  const links = []
  for (const [slotA, slotB] of neighborPairs(layout)) {
    const a = byId.get(lineup[slotA])
    const b = byId.get(lineup[slotB])
    if (!a || !b) continue
    const l = linkStrength(a, slotA, b, slotB, ctx)
    links.push({ a: slotA, b: slotB, ...l })
  }

  const perSlot = {}
  for (const l of links) {
    for (const s of [l.a, l.b]) (perSlot[s] ||= []).push(l.strength)
  }
  const slotChemistry = Object.fromEntries(Object.entries(perSlot).map(([s, v]) => [s, Math.round((v.reduce((x, y) => x + y, 0) / v.length) * 10) / 10]))

  const mean = links.length ? links.reduce((t, l) => t + l.strength, 0) / links.length : 1.5
  return {
    links,
    slotChemistry,
    score: Math.round((mean / 3) * 100),
    factor: chemistryFactor(mean)
  }
}

/** Efecto en el rendimiento: de -3% (química pésima) a +3% (química perfecta); 1,5 de media no cambia nada */
export const chemistryFactor = (meanStrength) =>
  Number((1 + Math.max(-1, Math.min(1, (meanStrength - 1.5) / 1.5)) * 0.03).toFixed(4))

/** Los enlaces más débiles con su explicación, para ayudar a mejorar la química */
export function weakestLinks(links, count = 2) {
  return [...links].sort((x, y) => x.strength - y.strength).slice(0, count)
}
