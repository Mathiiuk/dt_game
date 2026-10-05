import { FALLBACK_QUOTE } from '../../data/managerQuotes'

// Reglas puras del flash de frases: qué se puede publicar, cuál sigue y cuánto dura cada una.

/** Tiempos de cada estado, en milisegundos (movimiento lento, de cine). */
export const QUOTE_TIMING = { enter: 700, exit: 700, wait: 600, visibleMin: 2500, visibleMax: 4500 }

/** Sólo salen a producción las frases verificadas y aprobadas; si no queda ninguna, la propia de respaldo. */
export function publishableQuotes(quotes) {
  const ok = (quotes || [])
    .filter(q => q.verified === true && q.approvedForProduction === true && q.text)
    // Una histórica sin autor o sin fuente no se publica aunque esté marcada como verificada
    .filter(q => q.type === 'original' || (q.manager && q.sourceUrl && q.sourceName))
    // Una frase propia nunca lleva el nombre de una persona real
    .map(q => (q.type === 'original' ? { ...q, manager: undefined } : q))
  return ok.length ? ok : [FALLBACK_QUOTE]
}

/** Índice de la próxima frase: al azar, pero nunca la misma dos veces seguidas. */
export function nextQuoteIndex(current, total, random = Math.random) {
  if (total <= 1) return 0
  const step = 1 + Math.floor(random() * (total - 1))
  return (current + step) % total
}

/** Tiempo en pantalla según el largo: las cortas se van antes, las largas dan tiempo a leer. */
export function visibleMs(text) {
  const ms = 1800 + (text?.length || 0) * 45
  return Math.min(QUOTE_TIMING.visibleMax, Math.max(QUOTE_TIMING.visibleMin, ms))
}
