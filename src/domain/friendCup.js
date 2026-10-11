/**
 * Copa Mundial de la sala: 8 o 16 selecciones en grupos de 4 (todos contra todos, tres fechas) y después llaves de eliminación directa.
 * Los DT juegan con sus clubes; los lugares libres se completan con selecciones bot. Funciones puras: el servidor arma y juega todo
 * (`friend_start_cup`, `friend_play_cup_round`) y este archivo solo describe el formato para validar ajustes y mostrarlo.
 */
import { seededRandom } from './cupMatch'

export const CUP_SIZES = [8, 16]
export const GROUP_ROUNDS = 3

const KNOCKOUT_BY_SIZE = { 8: ['SEMI', 'FINAL'], 16: ['CUARTOS', 'SEMI', 'FINAL'] }
const KNOCKOUT_NAMES = { CUARTOS: 'Cuartos de final', SEMI: 'Semifinales', FINAL: 'Final' }

/** Tamaño de la copa: lo pedido si entran todos los DT y es válido; si no, el siguiente (con más de 8 DT, 16) */
export function cupSizeFor(requested, humans = 2) {
  const want = Number(requested) <= 8 ? 8 : 16
  return want === 8 && humans > 8 ? 16 : want
}

export function cupPlan(teams) {
  const n = teams === 8 ? 8 : 16
  const knockout = KNOCKOUT_BY_SIZE[n]
  return { teams: n, groups: n / 4, qualifiers: n / 2, knockout, rounds: GROUP_ROUNDS + knockout.length }
}

export const groupLetter = (groupNo) => String.fromCharCode(64 + groupNo)

/** Nombre de cada fecha del torneo: tres de grupos y después las llaves */
export function roundLabel(round, teams = 16) {
  if (round <= GROUP_ROUNDS) return `Fecha ${round} de grupos`
  const stage = cupPlan(teams).knockout[round - GROUP_ROUNDS - 1]
  return KNOCKOUT_NAMES[stage] || `Fecha ${round}`
}

export const isKnockoutRound = (round) => round > GROUP_ROUNDS

/** Selecciones que completan la copa (nombres de países, siempre los mismos para la misma sala) */
export const NATIONS = [
  'Argentina', 'Brasil', 'Uruguay', 'Chile', 'Colombia', 'Paraguay', 'Perú', 'Ecuador', 'Bolivia', 'Venezuela', 'México', 'Costa Rica',
  'Estados Unidos', 'Canadá', 'España', 'Francia', 'Alemania', 'Italia', 'Inglaterra', 'Países Bajos', 'Portugal', 'Bélgica', 'Croacia', 'Dinamarca',
  'Suiza', 'Polonia', 'Serbia', 'Suecia', 'Japón', 'Corea del Sur', 'Australia', 'Marruecos', 'Senegal', 'Nigeria', 'Camerún', 'Egipto'
]

export function pickNationNames(seed, count, exclude = []) {
  if (count <= 0) return []
  const rand = seededRandom(`nations:${seed}`)
  const pool = NATIONS.filter(n => !exclude.includes(n))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

/** Partidos de un grupo de cuatro (1 vs 4 y 2 vs 3, después 4 vs 3 y 1 vs 2, y 2 vs 4 y 3 vs 1) */
export function groupFixtures([a, b, c, d]) {
  return [
    { round: 1, home: a, away: d }, { round: 1, home: b, away: c },
    { round: 2, home: d, away: c }, { round: 2, home: a, away: b },
    { round: 3, home: b, away: d }, { round: 3, home: c, away: a }
  ]
}

/** Cruces de la primera llave a partir de los clasificados de cada grupo (primero y segundo): el primero contra el segundo del grupo vecino */
export function knockoutPairs(groups) {
  const pairs = []
  for (let i = 0; i < groups.length; i += 2) pairs.push([groups[i][0].slot, groups[i + 1][1].slot])
  for (let i = 0; i < groups.length; i += 2) pairs.push([groups[i + 1][0].slot, groups[i][1].slot])
  return pairs
}

/** Orden de un grupo: puntos, diferencia de gol, goles a favor y nombre */
export const rankGroup = (rows) => [...rows].sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf || x.name.localeCompare(y.name))
