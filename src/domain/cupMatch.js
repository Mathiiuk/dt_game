/**
 * Resultado de un partido de copa (eliminación directa): determinista por partido, con peso de la fuerza de cada equipo.
 * Mismo partido => mismo resultado (no se puede "recargar" para volver a tirar los dados) y nunca hay empate.
 */

/** PRNG pequeño y reproducible (mulberry32) a partir de un texto */
export const seededRandom = (seed) => {
  let h = 1779033703 ^ String(seed).length
  for (let i = 0; i < String(seed).length; i++) {
    h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Goles esperados: base 1.3 ± 0.04 por punto de diferencia de fuerza, con ventaja de local */
const goalsFor = (rand, mine, theirs, home) => {
  const lambda = Math.max(0.3, 1.3 + (mine - theirs) * 0.04 + (home ? 0.2 : 0))
  // Poisson por inversión
  const limit = Math.exp(-lambda)
  let k = 0
  let p = 1
  do { k++; p *= rand() } while (p > limit && k < 8)
  return k - 1
}

/** @returns {{homeScore:number, awayScore:number}} sin empates (el que más fuerza tiene gana el desempate) */
export const simulateCupScore = ({ fixtureId, homeStrength, awayStrength }) => {
  const rand = seededRandom(`cup:${fixtureId}`)
  let home = goalsFor(rand, homeStrength, awayStrength, true)
  let away = goalsFor(rand, awayStrength, homeStrength, false)
  if (home === away) {
    // Desempate (penales): se decide con la fuerza y un poco de azar determinista
    const homeWins = rand() < 0.5 + (homeStrength - awayStrength) * 0.01
    if (homeWins) home += 1
    else away += 1
  }
  return { homeScore: home, awayScore: away }
}

/** Fuerza de un club: media de los 11 mejores atributos generales */
export const clubStrength = (players) => {
  const top = [...players].map(p => p.attr_overall || p.overall || 50).sort((a, b) => b - a).slice(0, 11)
  return top.length ? top.reduce((s, v) => s + v, 0) / top.length : 50
}
