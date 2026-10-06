/**
 * Resumen de historia de la temporada: un texto corto que cuenta cómo se vivió el año, a partir de la posición final y de las
 * consecuencias registradas (barra, favores, escándalos, ventas, combos...). Funciones puras.
 */

/** Cuenta las consecuencias registradas por tipo */
export function countBySource(logs = []) {
  const counts = {}
  for (const row of logs) counts[row.source] = (counts[row.source] || 0) + 1
  return counts
}

const ordinal = (n) => `${n}.º`

export function seasonHeadline({ position, champion = false, promoted = false }) {
  if (champion) return 'Campeones: el año que el club no va a olvidar'
  if (promoted) return 'Ascenso conseguido: el club sube de categoría'
  if (position <= 6) return 'Un año de pelea arriba, con gusto a poco'
  if (position <= 14) return 'Una temporada de mitad de tabla'
  return 'Un año para olvidar, a pura supervivencia'
}

/**
 * @returns {{ headline: string, lines: string[] }}
 */
export function seasonStory({ clubName = 'El club', position = 10, champion = false, promoted = false, prize = 0, cash = 0, state = {}, counts = {}, fansDelta = null, arcs = [] }) {
  const lines = []
  lines.push(`${clubName} terminó ${ordinal(position)}${champion ? ' y se quedó con el título' : promoted ? ' y ascendió' : ''}.`)

  const barra = (counts.BARRA || 0)
  if (barra >= 4) lines.push(`La barra anduvo cerca durante ${barra} semanas y se hizo sentir en el vestuario.`)
  else if (barra > 0) lines.push(`La barra apareció algunas semanas (${barra}), pero no llegó a ser un problema grande.`)
  else lines.push('La barra no te molestó en todo el año.')

  const favors = state.favors || 0
  const scandals = state.scandals || 0
  if (favors > 0) lines.push(`Aceptaste ${favors} favor${favors === 1 ? '' : 'es'} por fuera de los papeles${scandals ? ` y te salieron ${scandals} escándalo${scandals === 1 ? '' : 's'}` : ', y por ahora nadie preguntó'}.`)
  else lines.push('Te mantuviste limpio: ningún favor, ninguna comisión.')

  const sales = counts.SALE || 0
  if (sales > 0) lines.push(`Vendiste ${sales} referente${sales === 1 ? '' : 's'} del club y la tribuna lo notó.`)
  const combos = counts.COMBO || 0
  if (combos > 0) lines.push(`Se encadenaron ${combos} combinaciones de decisiones y resultados que quedaron en la memoria del club.`)

  for (const arc of arcs) lines.push(`${arc.title}: ${arc.ending}`)
  lines.push(`La caja cierra en $${Math.round(cash).toLocaleString('es-AR')}${prize ? ` (incluye $${Math.round(prize).toLocaleString('es-AR')} de premios)` : ''}.`)
  if (fansDelta !== null && fansDelta !== 0) lines.push(`La hinchada terminó ${fansDelta > 0 ? 'más' : 'menos'} contenta que al empezar (${fansDelta > 0 ? '+' : ''}${fansDelta}).`)

  return { headline: seasonHeadline({ position, champion, promoted }), lines }
}
