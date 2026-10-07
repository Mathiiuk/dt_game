import { TIER_RATING_RANGES } from './ratings'
import { POSITION_CODES } from './positions'

export const FREE_AGENT_POOL_MIN = 24
export const FREE_AGENT_POOL_TARGET = 32

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))
const bell = (rng) => (rng() + rng() + rng()) / 1.5 - 1

export const freeAgentsNeeded = (current = 0) => (current < FREE_AGENT_POOL_MIN ? FREE_AGENT_POOL_TARGET - current : 0)

export function freeAgentSpecs(count, tier = 5, rng = Math.random) {
  const ranges = TIER_RATING_RANGES[tier] || TIER_RATING_RANGES[5]
  const minOvr = ranges.prospect[0] - 2
  const maxOvr = ranges.star[1]
  const meanOvr = Math.round((minOvr + maxOvr) / 2)
  const spread = Math.round((maxOvr - minOvr) / 2)

  return Array.from({ length: count }, (_, i) => {
    const overall = clamp(Math.round(meanOvr + bell(rng) * spread), minOvr, maxOvr)
    const age = clamp(Math.round(26 + bell(rng) * 9), 18, 35)
    const upside = age <= 22 ? 4 + Math.floor(rng() * 15) : age <= 26 ? Math.floor(rng() * 6) : 0
    return { position: POSITION_CODES[i % POSITION_CODES.length], overall, potential: Math.min(99, overall + upside), age }
  })
}
