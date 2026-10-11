/**
 * Con qué frecuencia se lesiona alguien en un partido. Una sola fuente para las dos tiradas del juego:
 * la del partido (minuto a minuto, en `matchEngine`) y la de cada jugador al terminar (`injuriesApi.calculateInjuryRisk`).
 * Objetivo de diseño: con un plantel descansado, a tu equipo se le lesiona alguien en alrededor de 1 de cada 5 partidos; el cansancio, el ritmo
 * rápido, la presión alta y la cancha mala la hacen más probable, así que es un riesgo que el DT puede manejar rotando.
 */
export const MATCH_BASE_PER_MINUTE = 0.0026 // entre los dos equipos (a cada uno le toca la mitad)
export const POST_MATCH_BASE = 0.009
export const POST_MATCH_CAP = 0.25
const MINUTES = 90

const MENTALITY = { ATTACKING: 1.1, ALL_OUT_ATTACK: 1.2, DEFENSIVE: 0.95, VERY_DEFENSIVE: 0.9 }
const TEMPO = { FAST: 1.25, SLOW: 0.85 }
const PRESSING = { AGGRESSIVE: 1.25, STAND_OFF: 0.9 }

/** Cuánto agrava el cansancio (estado físico medio del equipo en cancha) */
const fatigueFactor = (fitness) => (fitness >= 90 ? 0.85 : fitness >= 80 ? 1 : fitness >= 65 ? 1.25 : fitness >= 50 ? 1.8 : 2.5)

/** Probabilidad de que haya una lesión en un minuto del partido (entre los dos equipos), según la táctica y el físico del equipo propio */
export function matchMinuteRisk(tactic = {}, fitness = 80) {
  const t = tactic || {}
  const style = (MENTALITY[t.mentality] ?? 1) * (TEMPO[t.tempo] ?? 1) * (PRESSING[t.pressing_intensity] ?? 1)
  return MATCH_BASE_PER_MINUTE * style * fatigueFactor(fitness)
}

/** Probabilidad de que un jugador salga lesionado al terminar el partido: sube con el cansancio y con la cancha en mal estado */
export function postMatchRisk(player, pitchQuality = 70) {
  const fitness = player?.state_fitness ?? 70
  let risk = POST_MATCH_BASE
  if (fitness < 50) risk *= 5
  else if (fitness < 65) risk *= 3
  else if (fitness < 80) risk *= 1.5
  if (pitchQuality < 40) risk *= 1.9
  else if (pitchQuality < 60) risk *= 1.4
  return Math.min(POST_MATCH_CAP, risk)
}

/** Probabilidad de que en un partido se lesione al menos un jugador de TU equipo (las dos tiradas juntas): sirve para calibrar y explicar */
export function chanceOfInjuryInMatch({ tactic, fitness = 80, starters = 11, pitchQuality = 70 }) {
  const live = 1 - (1 - matchMinuteRisk(tactic, fitness) / 2) ** MINUTES
  const after = 1 - (1 - postMatchRisk({ state_fitness: fitness }, pitchQuality)) ** starters
  return 1 - (1 - live) * (1 - after)
}
