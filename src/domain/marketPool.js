/**
 * Agentes libres del mercado: los clubes rivales no tienen plantel propio, así que el mercado se nutre de jugadores sin club
 * (los que se rescinden y un grupo que se renueva solo). Funciones puras.
 */
import { POSITION_CODES } from './positions'

export const FREE_AGENT_POOL_MIN = 24 // por debajo de esto se repone
export const FREE_AGENT_POOL_TARGET = 32

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

/** Número aproximadamente normal (suma de tres uniformes), de -1 a 1 */
const bell = (rng) => (rng() + rng() + rng()) / 1.5 - 1

/** Cuántos agentes libres hay que sumar para volver al objetivo (0 si el pozo alcanza) */
export const freeAgentsNeeded = (current = 0) => (current < FREE_AGENT_POOL_MIN ? FREE_AGENT_POOL_TARGET - current : 0)

/**
 * Perfiles de agentes libres: medias de 44 a 68 (la mayoría cerca de 56, como un plantel de este nivel), edades de 18 a 35,
 * con potencial de sobra en los jóvenes. Las posiciones se reparten parejas.
 * @returns {Array<{ position: string, overall: number, potential: number, age: number }>}
 */
export function freeAgentSpecs(count, rng = Math.random) {
  return Array.from({ length: count }, (_, i) => {
    const overall = clamp(Math.round(56 + bell(rng) * 12), 44, 68)
    const age = clamp(Math.round(26 + bell(rng) * 9), 18, 35)
    const upside = age <= 22 ? 4 + Math.floor(rng() * 15) : age <= 26 ? Math.floor(rng() * 6) : 0
    return { position: POSITION_CODES[i % POSITION_CODES.length], overall, potential: Math.min(99, overall + upside), age }
  })
}
