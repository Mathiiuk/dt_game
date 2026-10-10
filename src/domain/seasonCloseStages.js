// Etapas del cierre de temporada. El cierre se hace en dos partes: la base cierra la temporada de una vez (DB_DONE) y después la app
// evoluciona al plantel, arma la liga del año siguiente y genera los partidos. Si se interrumpe, se retoma desde la última etapa.
// Funciones puras.

export const CLOSE_STAGES = ['DB_DONE', 'EVOLUTION_DONE', 'LEAGUE_READY', 'COMPLETE']

/** Posición de la etapa en el orden del cierre (una desconocida cuenta como la primera) */
export const stageIndex = (stage) => Math.max(0, CLOSE_STAGES.indexOf(stage))

/** ¿Falta completar el cierre? (hay marca de avance y todavía no llegó al final) */
export const isCloseIncomplete = (progress) => Boolean(progress) && progress.stage !== 'COMPLETE'

/** ¿Hay que correr esta etapa? Sí, si el cierre todavía no la pasó */
export const needsStage = (progress, doneStage) => stageIndex(progress?.stage) < stageIndex(doneStage)

/** Qué falta, dicho para el DT */
export function closePendingText(stage) {
  if (stage === 'LEAGUE_READY') return 'Falta generar los partidos del nuevo año.'
  if (stage === 'EVOLUTION_DONE') return 'Falta armar la liga del nuevo año y sus partidos.'
  return 'Falta evolucionar al plantel, armar la liga del nuevo año y sus partidos.'
}

/** Porcentaje del cierre que ya está hecho (para mostrar el avance): la base ya cerró la temporada, así que arranca en 25 */
export const closeProgressPercent = (stage) => Math.round(((stageIndex(stage) + 1) / CLOSE_STAGES.length) * 100)
