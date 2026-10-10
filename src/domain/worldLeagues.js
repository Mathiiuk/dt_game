/**
 * El mundo del fútbol: las cinco divisiones, de la Primera al Torneo Regional (Potrero). El club del usuario juega una; las otras
 * cuatro se arman con rivales de su categoría y se juegan solas junto con la suya (resultados, tablas, goleadores).
 * Funciones puras.
 */
import { BOTTOM_TIER, TOP_TIER, tierStrengthRange } from './pyramid'

/** Las divisiones que el usuario no juega (las que arma y simula el mundo) */
export function worldTiers(userTier) {
  const mine = Number(userTier) || BOTTOM_TIER
  const all = []
  for (let t = TOP_TIER; t <= BOTTOM_TIER; t++) all.push(t)
  return all.filter(t => t !== mine)
}

/** Fila del club rival `c` (de la lista histórica) para la categoría `tier`, con la fuerza que le corresponde (`rand` es el azar de la semilla) */
export function worldClubRow(c, i, tier, rand, country = 'Argentina') {
  const [lo, hi] = tierStrengthRange(tier)
  return {
    name: c.name,
    short_name: c.short_name,
    city: c.city || 'Región Deportiva',
    country,
    founded_year: c.founded_year || (1910 + i),
    colors: c.primary_color || c.colors || '#10B981',
    history_type: 'bot',
    league_tier: tier,
    budget: 25000,
    wage_budget: 3500,
    reputation: 15,
    strength: Math.round(lo + rand() * (hi - lo)),
    stadium_name: c.stadium_name || `Estadio ${c.name}`,
    stadium_capacity: c.stadium_capacity || 1500
  }
}

/** ¿La liga es de la temporada en curso? Las armadas antes de que existiera el año (la del club) cuentan como la actual */
export const isCurrentSeasonLeague = (competition, seasonYear) => competition?.season_year == null || Number(competition.season_year) === Number(seasonYear)

const byGoals = (a, b) => b.goals - a.goals || b.assists - a.assists || a.name.localeCompare(b.name)
const byAssists = (a, b) => b.assists - a.assists || b.goals - a.goals || a.name.localeCompare(b.name)
const byPoints = (a, b) => b.points - a.points || b.goals - a.goals || a.name.localeCompare(b.name)

/**
 * Goleadores, asistentes y figuras de una liga a partir de sus filas de `league_scorers`.
 * La figura es quien más participa en goles (goles + asistencias).
 */
export function leagueBoards(rows = [], { limit = 10 } = {}) {
  const people = (rows || []).map(r => ({
    key: `${r.club_id}:${r.player_name}`,
    name: r.player_name,
    clubId: r.club_id,
    clubName: r.club_name || '',
    goals: Number(r.goals) || 0,
    assists: Number(r.assists) || 0,
    points: (Number(r.goals) || 0) + (Number(r.assists) || 0)
  }))
  return {
    scorers: people.filter(p => p.goals > 0).sort(byGoals).slice(0, limit),
    assisters: people.filter(p => p.assists > 0).sort(byAssists).slice(0, limit),
    best: people.filter(p => p.points > 0).sort(byPoints).slice(0, limit)
  }
}

/**
 * Suma a los líderes de tu liga a los jugadores de tu club (que salen de tus partidos, no de la plantilla derivada).
 * `mine` es lo que devuelve `competitionApi.getClubLeaders`; un jugador que figura en dos listas se cuenta una sola vez.
 */
export function withUserLeaders(boards, mine, clubName = 'Tu club', { limit = 10 } = {}) {
  if (!mine) return boards
  const byId = new Map()
  for (const p of [...(mine.scorers || []), ...(mine.assisters || []), ...(mine.best || [])]) {
    const cur = byId.get(p.player_id)
    const goals = Math.max(cur?.goals || 0, Number(p.goals) || 0)
    const assists = Math.max(cur?.assists || 0, Number(p.assists) || 0)
    byId.set(p.player_id, { key: `mine:${p.player_id}`, name: p.name, clubId: 'mine', clubName, mine: true, goals, assists, points: goals + assists })
  }
  const people = [...byId.values()]
  const merge = (list, pool, cmp, keep) => [...list, ...pool.filter(keep)].sort(cmp).slice(0, limit)
  return {
    scorers: merge(boards.scorers, people, byGoals, p => p.goals > 0),
    assisters: merge(boards.assisters, people, byAssists, p => p.assists > 0),
    best: merge(boards.best, people, byPoints, p => p.points > 0)
  }
}
