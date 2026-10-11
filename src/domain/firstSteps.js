/**
 * Primeros pasos del Inicio: la misión inicial de las cuentas nuevas y la tarjeta "Tu próximo paso" que dice qué conviene hacer ahora.
 * Funciones puras; los datos salen del tablero (`Dashboard`) y de lo que la persona ya hizo (`firstStepsStore`).
 */

export const MISSION = [
  { id: 'tactics', title: 'Revisá tu táctica y tus once', hint: 'Abrí la pizarra: elegí la formación y mirá quién juega en cada puesto.', to: '/tactics' },
  { id: 'decision', title: 'Resolvé una decisión del club', hint: 'Las historias cambian la caja, la hinchada, la dirigencia y el vestuario. Leé y elegí.', to: '/dashboard' },
  { id: 'match', title: 'Jugá tu primer partido', hint: 'Cuando llegue el día, tocá “Disputar partido”. Si todavía falta, avanzá la semana.', to: '/calendar' }
]

/** Avance de la misión: los dos primeros pasos los marca lo que hizo la persona; el tercero, haber jugado un partido */
export function missionProgress(flags, played = 0) {
  const f = flags || {}
  const steps = MISSION.map(s => ({ ...s, done: s.id === 'match' ? Number(played) > 0 : Boolean(f[s.id]) }))
  const done = steps.filter(s => s.done).length
  return { steps, done, total: steps.length, complete: done === steps.length }
}

/** La misión se muestra a cuentas nuevas, mientras falten pasos y la persona no la haya ocultado */
export const showMission = ({ isNew, dismissed, complete }) => Boolean(isNew) && !dismissed && !complete

const plural = (n, one, many) => (n === 1 ? one : many)

/**
 * Qué conviene hacer ahora. Devuelve { kind, title, body, cta? }; `cta` solo cuando la acción no está ya en el botón principal del Inicio.
 * Orden: cierre pendiente, fin de temporada, decisiones, plantel sin gente, día de partido y, si no hay nada urgente, avanzar.
 */
export function nextStep({ pendingClose, seasonEnded, pendingEvents = 0, available = 11, matchDue, daysToMatch = 0, hasFixture = true, tacticsVisited = true, played = 0, matchWeekday = '' }) {
  if (pendingClose) return { kind: 'CLOSE', title: 'Terminá el cierre de temporada', body: 'Quedó a medias: hasta que termine no se puede avanzar de semana.' }
  if (seasonEnded) return { kind: 'SEASON_END', title: 'Terminó la temporada', body: 'Cerrala con la gala: se reparten premios, contratos y ascensos.' }
  if (pendingEvents > 0) {
    return {
      kind: 'DECISION',
      title: `Tenés ${pendingEvents} ${plural(pendingEvents, 'decisión pendiente', 'decisiones pendientes')}`,
      body: 'Resolverlas cambia la caja, la hinchada y el vestuario antes de que ruede la pelota.',
      cta: { label: 'Decidir ahora', action: 'decide' }
    }
  }
  if (available < 11) return { kind: 'SQUAD', title: 'Te faltan jugadores aptos', body: 'Con menos de once sanos y habilitados el equipo juega remendado. Mirá el plantel.', cta: { label: 'Ver plantel', to: '/squad' } }
  if (matchDue) {
    if (!tacticsVisited && played === 0) return { kind: 'TACTICS', title: 'Hoy es tu debut: revisá la táctica', body: 'Un minuto en la pizarra y salís a la cancha con los once que querés.', cta: { label: 'Abrir la pizarra', to: '/tactics' } }
    return { kind: 'PLAY', title: 'Hoy se juega', body: 'Tu equipo está listo: tocá “Disputar partido”.' }
  }
  const when = hasFixture && daysToMatch > 0 ? (daysToMatch === 1 ? 'El partido es mañana' : (matchWeekday ? `El partido es el ${matchWeekday}, en ${daysToMatch} días` : `El partido es en ${daysToMatch} días`)) : 'No hay partido a la vista'
  return { kind: 'ADVANCE', title: 'Preparate para el próximo partido', body: `${when}. Entrená, mirá el plantel y avanzá la semana.` }
}
