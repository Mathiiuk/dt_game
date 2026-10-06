/**
 * Nivel del rival, para que el DT sepa a qué se enfrenta antes de salir a la cancha.
 * `strength` es la fuerza del club (46 a 66 entre los rivales; el plantel inicial del usuario ronda los 58).
 */
export function rivalLevel(strength) {
  if (strength === null || strength === undefined || strength === '') return null
  const level = Math.round(Number(strength))
  if (!Number.isFinite(level)) return null
  if (level >= 63) return { level, label: 'Candidato', tone: 'danger', hint: 'Uno de los más fuertes de la liga: con un empate te vas contento.' }
  if (level >= 59) return { level, label: 'Fuerte', tone: 'warning', hint: 'Juega de igual a igual con vos o un poco mejor.' }
  if (level >= 53) return { level, label: 'Parejo', tone: 'neutral', hint: 'Partido abierto: se decide por detalles.' }
  return { level, label: 'Accesible', tone: 'accent', hint: 'Tenés con qué ganarle, pero no te confíes.' }
}

/** Fuerza del rival en un partido: el club que no es el tuyo */
export const rivalOf = (fixture, clubId) => (fixture?.home_team_id === clubId ? fixture?.away : fixture?.home) || null
