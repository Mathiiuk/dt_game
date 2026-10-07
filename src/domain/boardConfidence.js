// Confianza de la comisión directiva tras un partido oficial: la parte numérica, sin base de datos.
// Deportiva 50%, financiera 30% y plantel 20%. Con la confianza en 40 o menos hay un ultimátum (4 puntos en 3 partidos); fallarlo es la
// destitución. Siempre hay una oportunidad antes: no existe un despido sin ultimátum previo. El umbral era 35, que con las cuentas sanas
// exige que lo deportivo llegue a cero (financiera y plantel aportan 35 puntos fijos) y casi nunca saltaba; con 40 un equipo promedio
// tiene ~1% de ultimátum por temporada, uno flojo ~67% y ~38% de despido (los tests incluyen la simulación que lo fija).
export const ULTIMATUM_TRIGGER = 40
export const ULTIMATUM_POINTS = 4
export const ULTIMATUM_MATCHES = 3

const clamp100 = (n) => Math.min(100, Math.max(0, n))

/**
 * @param board estado actual (sports_satisfaction, financial_satisfaction, squad_satisfaction y los campos del ultimátum)
 * @param outcome { isWin, isDraw }
 * @returns {{ sports, globalConfidence, isUnderUltimatum, pointsRequired, matchesRemaining, pointsGathered,
 *   event: 'SURVIVED'|'FAILED'|'ISSUED'|null, dismissal: 'ULTIMATUM_FAILED'|null }}
 */
export function evaluateBoardAfterMatch(board, { isWin = false, isDraw = false } = {}) {
  const pointsWon = isWin ? 3 : isDraw ? 1 : 0
  const sportDelta = isWin ? 4 : isDraw ? -1 : -6

  let sports = clamp100((board.sports_satisfaction ?? 70) + sportDelta)
  const fin = board.financial_satisfaction || 70
  const squad = board.squad_satisfaction || 70
  let globalConfidence = Math.round(sports * 0.5 + fin * 0.3 + squad * 0.2)

  let isUnderUltimatum = Boolean(board.is_under_ultimatum)
  let pointsRequired = board.ultimatum_points_required || 0
  let matchesRemaining = board.ultimatum_matches_remaining || 0
  let pointsGathered = board.ultimatum_points_gathered || 0
  let event = null
  let dismissal = null

  if (isUnderUltimatum) {
    pointsGathered += pointsWon
    matchesRemaining -= 1
    if (pointsGathered >= pointsRequired) {
      isUnderUltimatum = false
      pointsRequired = 0
      matchesRemaining = 0
      pointsGathered = 0
      globalConfidence = Math.min(100, globalConfidence + 20)
      sports = Math.min(100, sports + 15)
      event = 'SURVIVED'
    } else if (matchesRemaining <= 0) {
      event = 'FAILED'
      dismissal = 'ULTIMATUM_FAILED'
    }
  } else if (globalConfidence <= ULTIMATUM_TRIGGER) {
    isUnderUltimatum = true
    pointsRequired = ULTIMATUM_POINTS
    matchesRemaining = ULTIMATUM_MATCHES
    pointsGathered = 0
    event = 'ISSUED'
  }

  return { sports, globalConfidence, isUnderUltimatum, pointsRequired, matchesRemaining, pointsGathered, event, dismissal }
}
