/**
 * La barra, la corrupción y los escándalos (reglas puras).
 * La barra solo se mueve cuando el clima del club es de crisis; con resultados vuelve a la calma.
 */
import { scaleEffect, DIFFICULTY } from './consequences'

export const BARRA_STAGES = ['CALM', 'ASKS', 'PRESSURES', 'SQUEEZES', 'INVASION']

export const BARRA_LABELS = {
  CALM: 'Tranquila',
  ASKS: 'Pide',
  PRESSURES: 'Presiona',
  SQUEEZES: 'Aprieta',
  INVASION: 'Invasión'
}

const clampIndex = (i) => Math.min(BARRA_STAGES.length - 1, Math.max(0, i))

/** Mueve la etapa de la barra `steps` escalones (positivo sube, negativo baja) */
export const shiftBarra = (stage, steps) => BARRA_STAGES[clampIndex(BARRA_STAGES.indexOf(stage) + steps)]

/**
 * Evolución semanal. En crisis sube un escalón por semana (dos en el caos con dificultad realista);
 * con el clima en calma baja un escalón, y con un resultado a favor también baja en la tensión.
 */
export function nextBarraStage({ stage = 'CALM', climate = 'FLOWS', recentWin = false }, difficulty = DIFFICULTY.NORMAL) {
  if (climate === 'CRISIS') return shiftBarra(stage, 1)
  if (climate === 'CHAOS') return shiftBarra(stage, difficulty.key === 'REALISTIC' ? 2 : 1)
  if (climate === 'TENSION') return recentWin ? shiftBarra(stage, -1) : stage
  return shiftBarra(stage, -1)
}

/** Efecto semanal de la barra sobre el vestuario según la etapa */
export function barraWeeklyEffect(stage, difficulty = DIFFICULTY.NORMAL) {
  const locker = { CALM: 0, ASKS: 0, PRESSURES: -2, SQUEEZES: -5, INVASION: -10 }[stage] || 0
  return { locker: scaleEffect(locker, difficulty) }
}

/** Probabilidad semanal de auditoría: 0 sin favores aceptados, desde 3% y hasta 40% con muchos */
export function auditChance(favors = 0) {
  if (favors <= 0) return 0
  return Math.min(0.4, 0.03 + (favors - 1) * 0.037)
}

/** Qué le pasa al DT en cada escándalo: multa, suspensión de un partido, despido */
export function scandalOutcome(scandalNumber) {
  if (scandalNumber <= 1) {
    return { kind: 'FINE', fine: 1500, reputation: -2, board: -15, suspendMatches: 0, dismissal: false, note: 'La auditoría encontró irregularidades: multa para el club y la dirigencia te quita su respaldo.' }
  }
  if (scandalNumber === 2) {
    return { kind: 'SUSPENSION', fine: 1500, reputation: -3, board: -10, suspendMatches: 1, dismissal: false, note: 'Segundo escándalo: te suspenden un partido y dirige el ayudante. El equipo se resiente.' }
  }
  return { kind: 'DISMISSAL', fine: 0, reputation: -5, board: -20, suspendMatches: 0, dismissal: true, note: 'Tercer escándalo: la comisión directiva rescinde tu contrato.' }
}

/** Factor de rendimiento del equipo con el DT suspendido (dirige el ayudante) */
export const SUSPENSION_POWER_FACTOR = 0.95

/** Probabilidad de que aparezca un evento esta semana según el clima, con la dificultad aplicada a los climas malos */
export function eventProbability(climate, difficulty = DIFFICULTY.NORMAL) {
  const base = { FLOWS: 0.2, TENSION: 0.3, CRISIS: 0.45, CHAOS: 0.6 }[climate] ?? 0.25
  if (climate === 'FLOWS') return base
  const shift = difficulty.key === 'RELAXED' ? -0.1 : difficulty.key === 'REALISTIC' ? 0.1 : 0
  return Math.min(0.9, Math.max(0.05, base + shift))
}

/**
 * Elige un evento del catálogo según el clima y el estado. Cada plantilla puede declarar `climates` (en cuáles
 * puede aparecer), `weight` y `when(estado)` para condiciones extra. Devuelve null si no hay candidatos.
 */
export function pickEvent(catalog, { climate, state = {}, pendingCodes = new Set() }, rng = Math.random) {
  const candidates = catalog.filter(t => {
    if (pendingCodes.has(t.template_code)) return false
    if (t.climates && !t.climates.includes(climate)) return false
    if (t.when && !t.when(state)) return false
    return true
  })
  if (!candidates.length) return null
  const total = candidates.reduce((sum, t) => sum + (t.weight ?? 1), 0)
  let roll = rng() * total
  for (const t of candidates) {
    roll -= t.weight ?? 1
    if (roll <= 0) return t
  }
  return candidates[candidates.length - 1]
}

/** Frase corta para la tarjeta de clima: cómo se siente el club esta semana */
export function climateHeadline(climate, stage = 'CALM') {
  if (stage === 'INVASION') return 'La barra entró al vestuario. La dirigencia mira en silencio.'
  if (stage === 'SQUEEZES') return 'La barra aprieta en los entrenamientos. Los jugadores trabajan sin mirar a nadie.'
  if (stage === 'PRESSURES') return 'Hay banderas en el alambrado y un grupo que mira las prácticas.'
  if (stage === 'ASKS') return 'Los referentes de la barra se acercan a pedir entradas y plata.'
  if (climate === 'CHAOS') return 'Todo se está yendo de las manos: hay que ordenar el club ya.'
  if (climate === 'CRISIS') return 'Se nota la presión en el palco y en la tribuna.'
  if (climate === 'TENSION') return 'Primeros murmullos: conviene sumar puntos pronto.'
  return 'Todo fluye: la tribuna y el palco están de tu lado.'
}
