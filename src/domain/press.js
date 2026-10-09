/**
 * Rueda de prensa después del partido: es obligatoria (la federación multa a quien no se presenta) pero se puede omitir.
 * Quien habla mueve a la hinchada y a la dirigencia según el tono; quien no se presenta paga multa y deja un hueco que
 * la prensa llena: tras una derrota casi siempre sale mal, tras una victoria suena a soberbia.
 */
import { scaleEffect, DIFFICULTY } from './consequences'

/** Resultado del club: 'W', 'D' o 'L' a partir del marcador */
export function outcomeOf({ isHome = true, homeScore = 0, awayScore = 0 } = {}) {
  const mine = isHome ? homeScore : awayScore
  const theirs = isHome ? awayScore : homeScore
  return mine > theirs ? 'W' : mine < theirs ? 'L' : 'D'
}

/** Nombre a la vista de cada tono de respuesta: los códigos internos (PRAISING...) nunca se muestran */
// La rueda de prensa tiene como máximo 2 preguntas: lo que muestra la sala y lo que cuenta la base tienen que coincidir
export const PRESS_MAX_QUESTIONS = 2

export const TONE_LABELS = {
  PRAISING: 'Elogioso',
  COMBATIVE: 'Combativo',
  SELF_CRITICAL: 'Autocrítico',
  PRAGMATIC: 'Cauteloso'
}
export const toneLabel = (tone, fallback = 'Respondida') => TONE_LABELS[tone] || fallback

/**
 * Efecto sobre hinchada y dirigencia de cada respuesta, según el tono y el resultado.
 * Se suma a la moral del plantel que ya traía cada respuesta.
 */
export function answerConsequences({ tone, outcome }, difficulty = DIFFICULTY.NORMAL) {
  const win = { PRAISING: [1, 1], COMBATIVE: [1, -1], SELF_CRITICAL: [0, 1], PRAGMATIC: [0, 0] }
  const draw = { PRAISING: [0, 0], COMBATIVE: [0, -1], SELF_CRITICAL: [1, 1], PRAGMATIC: [0, 0] }
  const loss = { PRAISING: [1, 0], COMBATIVE: [0, -2], SELF_CRITICAL: [1, 2], PRAGMATIC: [0, -1] }
  const table = outcome === 'W' ? win : outcome === 'D' ? draw : loss
  const [fans, board] = table[tone] || [0, 0]
  return { fans: scaleEffect(fans, difficulty), board: scaleEffect(board, difficulty) }
}

/** Multa por no presentarse; mitad si la dirigencia te respalda (más de 70) */
export function pressFine({ outcome, goalDiff = 0, boardConfidence = 50 }) {
  const base = outcome === 'L' ? 200 + 100 * Math.min(3, Math.max(0, -goalDiff)) : outcome === 'D' ? 100 : 300
  const covered = boardConfidence > 70
  return { fine: covered ? Math.round(base / 2) : base, covered }
}

/**
 * Lo que pasa cuando el DT no da la conferencia. `rng` devuelve un número entre 0 y 1.
 * Probabilidades: derrota 55% rumor / 35% nada / 10% la hinchada lo entiende; empate 35% molestia / 65% nada;
 * victoria 50% soberbia / 50% nada.
 */
export function skipPress({ outcome, goalDiff = 0, boardConfidence = 50, rumorBoost = 0 }, difficulty = DIFFICULTY.NORMAL, rng = Math.random) {
  const { fine, covered } = pressFine({ outcome, goalDiff, boardConfidence })
  const roll = rng()
  let kind = 'NOTHING'
  let fans = 0
  let board = 0
  let message = 'La noticia del partido absorbió todo: nadie habló de tu silencio.'

  if (outcome === 'L') {
    fans -= 1
    // Con rencor del periodista el rumor es más probable; la chance de que la hinchada lo entienda no cambia (10%)
    const rumorLimit = Math.min(0.9, 0.55 + rumorBoost)
    if (roll < rumorLimit) {
      kind = 'RUMOR'
      fans -= 2
      board -= 3
      message = 'Sin tu voz, la prensa llenó el vacío: se habla de tensión con los jugadores y de un posible cambio de técnico.'
    } else if (roll < 0.9) {
      message = 'Se notó que no diste la cara, pero el partido siguiente tapó el tema.'
    } else {
      kind = 'UNDERSTOOD'
      fans += 3
      message = 'La hinchada entiende que no tenías ganas de hablar después de una derrota así.'
    }
  } else if (outcome === 'D') {
    if (roll < 0.35) {
      kind = 'ANNOYED'
      fans -= 1
      message = 'Los cronistas se quedaron esperando y lo anotaron.'
    }
  } else if (roll < 0.5) {
    kind = 'ARROGANCE'
    fans -= 2
    board -= 1
    message = 'No hablar después de ganar se lee como soberbia: la prensa te lo hace notar.'
  }

  return {
    kind,
    fine,
    covered,
    fans: scaleEffect(fans, difficulty),
    board: scaleEffect(board, difficulty),
    message: covered ? `${message} El presidente te cubre la multa a medias.` : message
  }
}
