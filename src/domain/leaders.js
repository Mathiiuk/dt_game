/**
 * Líderes de un club a partir de las estadísticas por partido: goleadores, asistidores y mejor jugador (promedio de nota).
 * Solo hay estadísticas de los jugadores del club del usuario: los rivales de la IA no tienen plantel. Funciones puras.
 */
const round1 = (n) => Math.round(n * 10) / 10

/**
 * @param {Array<{player_id:string, goals?:number, assists?:number, rating?:number|null}>} statRows una fila por jugador y partido
 * @param {Array<{id:string, first_name?:string, last_name?:string, position?:string}>} players
 */
export function clubLeaders(statRows = [], players = [], { limit = 5, minMatchesForRating = 3 } = {}) {
  const byId = new Map((players || []).map(p => [p.id, p]))
  const acc = new Map()
  for (const r of statRows || []) {
    const p = byId.get(r.player_id)
    if (!p) continue
    const cur = acc.get(r.player_id) || { player_id: r.player_id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim(), position: p.position || null, matches: 0, goals: 0, assists: 0, ratingSum: 0, rated: 0 }
    cur.matches += 1
    cur.goals += Number(r.goals) || 0
    cur.assists += Number(r.assists) || 0
    if (r.rating !== null && r.rating !== undefined && !Number.isNaN(Number(r.rating))) { cur.ratingSum += Number(r.rating); cur.rated += 1 }
    acc.set(r.player_id, cur)
  }
  const all = [...acc.values()].map(({ ratingSum, rated, ...p }) => ({ ...p, rating: rated ? round1(ratingSum / rated) : null }))

  const by = (key) => all
    .filter(p => p[key] > 0)
    .sort((a, b) => b[key] - a[key] || a.matches - b.matches || a.name.localeCompare(b.name))
    .slice(0, limit)

  const rated = all.filter(p => p.rating !== null)
  const enough = rated.filter(p => p.matches >= minMatchesForRating)
  const best = (enough.length ? enough : rated)
    .sort((a, b) => b.rating - a.rating || b.matches - a.matches || a.name.localeCompare(b.name))
    .slice(0, limit)

  return { scorers: by('goals'), assisters: by('assists'), best }
}
