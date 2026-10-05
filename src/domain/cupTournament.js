/**
 * Copa continental de 8 clubes (cuartos, semifinales y final) con fechas fijas del calendario, como en la vida real:
 * los cuartos y semifinales se juegan a mitad de semana (miércoles) y la final es un sábado.
 * Todo es lógica pura: dado el estado del torneo y la fecha de juego, decide qué hay que simular y qué cruces crear.
 */
import { toDay } from './fixtureStatus'

export const CUP_SIZE = 8
export const STAGES = ['quarter_finals', 'semi_finals', 'final']
export const STAGE_LABEL = { quarter_finals: 'Cuartos de final', semi_finals: 'Semifinales', final: 'Gran final' }

const DAY = 86400000
const toUtc = (iso) => new Date(`${toDay(iso)}T00:00:00Z`)
const iso = (d) => d.toISOString().slice(0, 10)

/** Primer miércoles en o después de la fecha */
export const firstWednesdayOnOrAfter = (dateIso) => {
  const d = toUtc(dateIso)
  const shift = (3 - d.getUTCDay() + 7) % 7 // 3 = miércoles
  return iso(new Date(d.getTime() + shift * DAY))
}

/**
 * Calendario de la copa de una temporada (que empieza en julio de `seasonYear`):
 * se sortea el 1 de septiembre con la tabla de la liga, cuartos el primer miércoles desde el 15 de septiembre,
 * semifinales 5 semanas después y la final el sábado de 4 semanas y 3 días más tarde.
 */
export const cupSchedule = (seasonYear) => {
  const quarter = firstWednesdayOnOrAfter(`${seasonYear}-09-15`)
  const semi = iso(new Date(toUtc(quarter).getTime() + 35 * DAY))
  const final = iso(new Date(toUtc(semi).getTime() + 31 * DAY))
  return {
    seedDate: `${seasonYear}-09-01`,
    quarter_finals: quarter,
    semi_finals: semi,
    final
  }
}

/** Año de la temporada a la que pertenece la fecha (la temporada arranca el 1 de julio) */
export const cupSeasonYear = (dateIso) => {
  const d = toUtc(dateIso)
  return d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1
}

export const isDue = (fixture, gameDate) => !fixture.played && toDay(fixture.match_date) <= toDay(gameDate)

/** Los 8 mejores de la tabla de la liga (por puntos, diferencia de gol y goles a favor) */
export const qualifiedClubIds = (standings, size = CUP_SIZE) =>
  [...standings]
    .sort((a, b) =>
      (b.points || 0) - (a.points || 0) ||
      ((b.goals_for || 0) - (b.goals_against || 0)) - ((a.goals_for || 0) - (a.goals_against || 0)) ||
      (b.goals_for || 0) - (a.goals_for || 0))
    .slice(0, size)
    .map(s => s.club_id)

/** Cruces de cuartos: 1º-8º, 4º-5º, 3º-6º, 2º-7º (los mejor ubicados juegan de local y se cruzan tarde) */
export const quarterPairs = (qualified) => {
  const [a, b, c, d, e, f, g, h] = qualified
  return [[a, h], [d, e], [c, f], [b, g]]
}

export const winnerOf = (fixture) => ((fixture.home_score || 0) >= (fixture.away_score || 0) ? fixture.home_club_id : fixture.away_club_id)

const nextStageOf = (stage) => STAGES[STAGES.indexOf(stage) + 1] || null

/**
 * Un paso del torneo según la fecha de juego.
 * - toSimulate: partidos vencidos entre clubes de IA (el del usuario espera a que lo juegue él),
 * - toCreate: cruces de la fase siguiente cuando la actual terminó y todavía no existen,
 * - championId: campeón si la final ya se jugó.
 * Se llama en bucle (simular -> volver a planear) hasta que no haya nada más para hacer.
 */
export const planTournamentStep = ({ fixtures, gameDate, userClubId, schedule }) => {
  const toSimulate = fixtures.filter(f => isDue(f, gameDate) && f.home_club_id !== userClubId && f.away_club_id !== userClubId)

  const toCreate = []
  for (const stage of STAGES.slice(0, -1)) {
    const inStage = fixtures.filter(f => f.stage === stage)
    const next = nextStageOf(stage)
    const nextExists = fixtures.some(f => f.stage === next)
    if (inStage.length > 0 && inStage.every(f => f.played) && !nextExists) {
      const winners = [...inStage].sort((a, b) => a.match_number - b.match_number).map(winnerOf)
      for (let i = 0; i < winners.length; i += 2) {
        if (winners[i + 1]) toCreate.push({ stage: next, match_number: i / 2 + 1, home_club_id: winners[i], away_club_id: winners[i + 1], match_date: schedule[next] })
      }
    }
  }

  const final = fixtures.find(f => f.stage === 'final' && f.played)
  return { toSimulate, toCreate, championId: final ? winnerOf(final) : null }
}

/** Partido propio todavía sin jugar que ya llegó a su fecha (frena el avance de semana) */
export const dueUserFixture = (fixtures, gameDate, userClubId) =>
  fixtures.find(f => isDue(f, gameDate) && (f.home_club_id === userClubId || f.away_club_id === userClubId)) || null
