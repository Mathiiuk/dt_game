/**
 * Lo que la pizarra cuenta en una línea (para la cinta de resumen del celular): nombre del estilo y su efecto en el partido.
 * Usa las mismas cuentas del motor (`tacticalStyle`), así lo que se lee es lo que pasa.
 */
import { TACTIC_PRESETS, describeEffect, presetOf, tacticMultipliers } from './tacticalStyle'

const MENTALITY_SHORT = { VERY_DEFENSIVE: 'muy defensivo', DEFENSIVE: 'defensivo', BALANCED: 'equilibrado', ATTACKING: 'ofensivo', ALL_OUT_ATTACK: 'ataque total' }

/** "Posesión", "Contraataque"… o "Personalizado · ofensivo" si se tocó una instrucción suelta */
export function styleName(tactic = {}) {
  const id = presetOf(tactic)
  if (id) return TACTIC_PRESETS.find(p => p.id === id).label
  if (!tactic?.mentality && !tactic?.tempo && !tactic?.passing_style && !tactic?.pressing_intensity) return 'Equilibrado'
  return `Personalizado · ${MENTALITY_SHORT[tactic.mentality] || 'equilibrado'}`
}

/** Efecto total en palabras: "+20 % ataque, −15 % defensa" */
export const styleLine = (tactic = {}) => describeEffect(tacticMultipliers(tactic))

/** ¿Hay algo sin guardar? (mientras carga no se avisa) */
export const hasChanges = (snapshot, saved, loading) => !loading && snapshot !== saved
