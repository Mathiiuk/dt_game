/**
 * Copa continental de 8 clubes (cuartos, semifinales y final) con fechas fijas del calendario, como en la vida real:
 * los cuartos y semifinales son de ida y vuelta, a mitad de semana (miércoles), y la final es un único partido en sábado.
 * Todo es lógica pura: dado el estado del torneo y la fecha de juego, decide qué hay que simular y qué cruces crear.
 */
import { toDay } from './fixtureStatus'

export const CUP_SIZE = 8
export const STAGES = ['quarter_finals', 'semi_finals', 'final']
export const STAGE_LABEL = { quarter_finals: 'Cuartos de final', semi_finals: 'Semifinales', final: 'Gran final' }
/** Partidos por cruce: ida y vuelta en cuartos y semifinales, partido único en la final */
export const LEGS_PER_STAGE = { quarter_finals: 2, semi_finals: 2, final: 1 }

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
    quarter_finals_leg2: iso(new Date(toUtc(quarter).getTime() + 7 * DAY)),
    semi_finals: semi,
    semi_finals_leg2: iso(new Date(toUtc(semi).getTime() + 7 * DAY)),
    final
  }
}

/** Fecha de un partido: la vuelta se juega una semana después de la ida */
export const matchDateOf = (schedule, stage, leg = 1) => (leg === 2 ? schedule[`${stage}_leg2`] : schedule[stage])

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

/** Ganador de un partido o de un cruce: lo decide el servidor (`winner_club_id`); sin dato, por el marcador */
export const winnerOf = (fixture) => fixture.winner_club_id || ((fixture.home_score || 0) >= (fixture.away_score || 0) ? fixture.home_club_id : fixture.away_club_id)

/** Cruces de una fase: agrupa la ida y la vuelta por número de partido, en orden */
export const tiesOf = (fixtures, stage) => {
  const byNumber = new Map()
  for (const f of fixtures.filter(x => x.stage === stage)) byNumber.set(f.match_number, [...(byNumber.get(f.match_number) || []), f])
  return [...byNumber.entries()]
    .sort(([a], [b]) => a - b)
    .map(([matchNumber, legs]) => ({ matchNumber, legs: [...legs].sort((x, y) => (x.leg || 1) - (y.leg || 1)) }))
}

/** Global de un cruce: goles de cada club sumando los partidos jugados */
export const tieAggregate = (legs) => {
  const totals = {}
  for (const f of legs.filter(x => x.played)) {
    totals[f.home_club_id] = (totals[f.home_club_id] || 0) + (f.home_score || 0)
    totals[f.away_club_id] = (totals[f.away_club_id] || 0) + (f.away_score || 0)
  }
  return totals
}

/** Ganador del cruce una vez jugados todos sus partidos; null mientras falte alguno */
export const tieWinner = (legs) => {
  if (legs.length === 0 || !legs.every(f => f.played)) return null
  return winnerOf(legs[legs.length - 1])
}

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
    const ties = tiesOf(fixtures, stage)
    const next = nextStageOf(stage)
    const nextExists = fixtures.some(f => f.stage === next)
    if (ties.length > 0 && ties.every(t => tieWinner(t.legs)) && !nextExists) {
      const winners = ties.map(t => tieWinner(t.legs))
      for (let i = 0; i < winners.length; i += 2) {
        if (!winners[i + 1]) continue
        const matchNumber = i / 2 + 1
        // Ida: el primer clasificado de local; vuelta: al revés (si la fase es de ida y vuelta)
        for (let leg = 1; leg <= LEGS_PER_STAGE[next]; leg++) {
          const [home, away] = leg === 1 ? [winners[i], winners[i + 1]] : [winners[i + 1], winners[i]]
          toCreate.push({ stage: next, match_number: matchNumber, leg, home_club_id: home, away_club_id: away, match_date: matchDateOf(schedule, next, leg) })
        }
      }
    }
  }

  const final = fixtures.find(f => f.stage === 'final' && f.played)
  return { toSimulate, toCreate, championId: final ? winnerOf(final) : null }
}

/** Partido propio todavía sin jugar que ya llegó a su fecha (frena el avance de semana) */
export const dueUserFixture = (fixtures, gameDate, userClubId) =>
  fixtures
    .filter(f => isDue(f, gameDate) && (f.home_club_id === userClubId || f.away_club_id === userClubId))
    .sort((a, b) => toDay(a.match_date).localeCompare(toDay(b.match_date)) || (a.leg || 1) - (b.leg || 1))[0] || null
