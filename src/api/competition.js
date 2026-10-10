import { roundRobinSchedule } from '../domain/leagueSchedule'
import { movementOf, tierStrengthRange, TEAMS_PER_LEAGUE } from '../domain/pyramid'
import { normalizeRules } from '../domain/leagueRules'
import { leagueVoteApi } from './leagueVote'
import { divisionName } from '../domain/divisions'
import { seededRandom } from '../domain/cupMatch'
import { pickRivalClubs } from '../domain/rivalClubs'
import { clubLeaders } from '../domain/leaders'
import { worldTiers, worldClubRow, leagueBoards, isCurrentSeasonLeague } from '../domain/worldLeagues'
import { seasonYearOf } from '../domain/gameWeek'
import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

// Creaciones de liga en vuelo por club (evita carreras entre createClub y getStandings)
const leagueInit = new Map()
// Armado del mundo en vuelo por club
const worldInit = new Map()

export const competitionApi = {
  /**
   * El mundo del fútbol: arma las divisiones que el club no juega (de la Primera al Torneo Regional) para la temporada de la fecha de
   * juego, cada una con 20 clubes de su categoría, su tabla y sus 380 partidos. Las juega sola `play_league_ai_fixtures` junto con la
   * liga del club. Se arma una sola vez por temporada y es determinista por club y año. Si algo falla se borra la competición a
   * medias para poder reintentar. Devuelve `{ created }`.
   */
  async ensureWorldLeagues({ clubId, userTier = 5, gameDate, country = 'Argentina' }) {
    if (!clubId) return { created: 0 }
    const key = `${clubId}:${seasonYearOf(gameDate || '2026-07-01')}:${userTier}`
    if (worldInit.has(key)) return worldInit.get(key)
    const task = this._ensureWorldLeagues({ clubId, userTier, gameDate: gameDate || '2026-07-01', country }).finally(() => worldInit.delete(key))
    worldInit.set(key, task)
    return task
  },

  async _ensureWorldLeagues({ clubId, userTier, gameDate, country }) {
    const seasonYear = seasonYearOf(gameDate)
    const { data: existing, error: readErr } = await supabase.from('competitions').select('id, level, season_year').eq('season_year', seasonYear)
    if (readErr) throw new Error(readErr.message)
    const have = new Set((existing || []).map(c => c.level))
    const missing = worldTiers(userTier).filter(t => !have.has(t))
    let created = 0
    // El reglamento que votó la Asamblea para este año rige también en las otras divisiones
    const rules = missing.length > 0 ? await leagueVoteApi.getRules(clubId, seasonYear).catch(() => normalizeRules(null)) : normalizeRules(null)

    for (const tier of missing) {
      const { data: comp, error: compErr } = await supabase
        .from('competitions')
        .insert([{ name: `${divisionName(tier)} (${country})`, level: tier, teams_count: TEAMS_PER_LEAGUE, season_year: seasonYear, rules }])
        .select()
        .single()
      if (compErr) throw new Error(compErr.message)
      try {
        const seed = `${clubId}:world:${tier}:${seasonYear}`
        const rand = seededRandom(`strength:${seed}`)
        const rows = pickRivalClubs(seed, TEAMS_PER_LEAGUE, { tier }).map((c, i) => worldClubRow(c, i, tier, rand, country))
        const { data: clubs, error: clubsErr } = await supabase.from('clubs').insert(rows).select('id')
        if (clubsErr) throw new Error(clubsErr.message)
        const ids = (clubs || []).map(c => c.id)
        const zero = { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, form: '' }
        const { error: standErr } = await supabase.from('standings').insert(ids.map(id => ({ competition_id: comp.id, club_id: id, ...zero })))
        if (standErr) throw new Error(standErr.message)
        await this.generateRoundRobinFixtures(comp.id, ids, `${seasonYear}-08-01`, rules)
        created++
      } catch (e) {
        // Sin tabla ni partidos la competición no sirve: se borra para que el próximo intento la arme de nuevo
        await supabase.from('competitions').delete().eq('id', comp.id)
        throw e
      }
    }

    if (created > 0) {
      // Si la temporada ya está avanzada, los partidos vencidos se juegan ahora
      await this.simulateMatchDay(gameDate, clubId)
      queryCache.invalidate('leagues:')
    }
    return { created }
  },

  /** Últimos partidos jugados de una liga (los más nuevos primero), con los nombres de los clubes. Solo lectura. */
  async getLeagueResults(competitionId, limit = 12) {
    if (!competitionId) return []
    const { data, error } = await supabase
      .from('fixtures')
      .select('id, match_date, round, home_score, away_score, home:clubs!home_team_id(name, short_name), away:clubs!away_team_id(name, short_name)')
      .eq('competition_id', competitionId)
      .eq('status', 'PLAYED')
      .order('match_date', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return (data || []).map(f => ({
      id: f.id,
      date: String(f.match_date).slice(0, 10),
      round: f.round,
      homeName: f.home?.name || 'Local',
      awayName: f.away?.name || 'Visitante',
      homeScore: f.home_score,
      awayScore: f.away_score
    }))
  },

  /**
   * Goleadores, asistentes y figuras de cada liga (por id de competición). Las plantillas de la IA salen de `league_scorers`.
   * Una consulta por liga, con tope, para no pasar el límite de filas.
   */
  async getLeagueLeaders(competitionIds = []) {
    const ids = (competitionIds || []).filter(Boolean)
    if (ids.length === 0) return {}
    const entries = await Promise.all(ids.map(async (id) => {
      const { data, error } = await supabase
        .from('league_scorers')
        .select('club_id, player_name, goals, assists, clubs(name)')
        .eq('competition_id', id)
        .order('goals', { ascending: false })
        .limit(150)
      if (error) throw new Error(error.message)
      const rows = (data || []).map(r => ({ ...r, club_name: r.clubs?.name || '' }))
      return [id, leagueBoards(rows)]
    }))
    return Object.fromEntries(entries)
  },

  /**
   * Todas las ligas de la cuenta (la actual primero, después las de otras categorías por las que pasó el club), cada una con su tabla
   * ordenada. Solo lectura. Las competiciones vacías (donde ya no queda ningún club) no se listan.
   */
  async getAllLeagues(clubId, gameDate = null) {
    if (!clubId) return []
    const seasonYear = seasonYearOf(gameDate || '2026-07-01')
    return queryCache.fetch(`leagues:${clubId}:${seasonYear}`, async () => {
      const { data: comps, error } = await supabase.from('competitions').select('id, name, level, season_year').order('level', { ascending: true })
      if (error) throw new Error(error.message)
      const ids = (comps || []).map(c => c.id)
      if (ids.length === 0) return []
      const { data: rows, error: rowsErr } = await supabase
        .from('standings')
        .select('competition_id, club_id, points, played, won, drawn, lost, goals_for, goals_against, clubs(name, short_name, primary_color)')
        .in('competition_id', ids)
      if (rowsErr) throw new Error(rowsErr.message)

      const diff = (r) => (r.goals_for || 0) - (r.goals_against || 0)
      const leagues = (comps || []).map(competition => {
        const table = (rows || [])
          .filter(r => r.competition_id === competition.id)
          .sort((a, b) => (b.points || 0) - (a.points || 0) || diff(b) - diff(a) || (b.goals_for || 0) - (a.goals_for || 0) || String(a.clubs?.name || '').localeCompare(String(b.clubs?.name || '')))
          .map((r, i) => ({ ...r, position: i + 1 }))
        return { competition, rows: table, current: table.some(r => r.club_id === clubId), past: !isCurrentSeasonLeague(competition, seasonYear) }
      }).filter(l => l.rows.length > 0)
      // Las de esta temporada de la Primera al Potrero (la tuya marcada) y las de temporadas anteriores al final
      return leagues.sort((a, b) =>
        Number(a.past) - Number(b.past) ||
        (a.past ? (b.competition.season_year || 0) - (a.competition.season_year || 0) : 0) ||
        a.competition.level - b.competition.level)
    }, 30000)
  },

  /**
   * Goleadores, asistidores y mejores notas del club en la temporada de la fecha de juego. Solo hay datos de los jugadores
   * propios: los rivales de la IA no tienen plantel. Solo lectura.
   */
  async getClubLeaders(clubId, gameDate) {
    const empty = { scorers: [], assisters: [], best: [] }
    if (!clubId) return empty
    const seasonStart = `${seasonYearOf(gameDate || '2026-07-01')}-07-01`
    const { data: stats, error } = await supabase
      .from('player_match_stats')
      .select('player_id, goals, assists, rating, fixtures!inner(match_date)')
      .eq('club_id', clubId)
      .gte('fixtures.match_date', seasonStart)
    if (error) throw new Error(error.message)
    const ids = [...new Set((stats || []).map(r => r.player_id))]
    if (ids.length === 0) return empty
    const { data: players, error: playersErr } = await supabase.from('players').select('id, first_name, last_name, position').in('id', ids)
    if (playersErr) throw new Error(playersErr.message)
    return clubLeaders(stats, players || [])
  },

  /** Reglamento vigente de la liga del club (las reglas de puntos, calendario, ascensos y descensos que votó la Asamblea) */
  async getLeagueRules(clubId) {
    if (!clubId) return normalizeRules(null)
    const { data: mine } = await supabase.from('standings').select('competition_id').eq('club_id', clubId).limit(1).maybeSingle()
    if (!mine?.competition_id) return normalizeRules(null)
    const { data: comp } = await supabase.from('competitions').select('rules').eq('id', mine.competition_id).maybeSingle()
    return normalizeRules(comp?.rules)
  },

  /**
   * Obtiene la tabla oficial de posiciones con criterios canónicos de desempate y zonas deportivas.
   */
  async getStandings(clubId) {
    if (!clubId) return []

    return queryCache.fetch(`standings:${clubId}`, async () => {
      // 1. Buscar la fila del club en standings
      const { data: myStanding, error } = await supabase
        .from('standings')
        .select('id, competition_id, club_id')
        .eq('club_id', clubId)
        .limit(1)
        .maybeSingle()

      // Si la lectura falla no se sabe si ya hay liga: crear otra la duplicaría. El error llega a la pantalla,
      // que ofrece reintentar (antes se mostraba una tabla inventada)
      if (error) throw new Error(error.message)

      // 2. Si no existe, inicializar la liga
      const competitionId = myStanding?.competition_id || await this.initializeLeague(clubId)
      if (!competitionId) return []

      // 3. Consultar todos los clubes de la competición
      const { data: allStandings, error: allErr } = await supabase
        .from('standings')
        .select('*, clubs(name, short_name, primary_color)')
        .eq('competition_id', competitionId)
      if (allErr) throw new Error(allErr.message)

      // Criterios de desempate: 1. Puntos, 2. Diferencia de gol, 3. Goles a favor, 4. Nombre
      return (allStandings || []).map(s => ({
        ...s,
        goal_difference: (s.goals_for || 0) - (s.goals_against || 0),
        club_name: s.clubs?.name || 'Club de Liga',
        club_short: s.clubs?.short_name || 'CLB'
      })).sort((x, y) => {
        if (y.points !== x.points) return y.points - x.points
        if (y.goal_difference !== x.goal_difference) return y.goal_difference - x.goal_difference
        if (y.goals_for !== x.goals_for) return y.goals_for - x.goals_for
        return (x.club_name || '').localeCompare(y.club_name || '')
      }).map((s, idx) => ({ ...s, position: idx + 1 }))
    }, 30000)
  },

  /**
   * Inicializa la competición y los 19 clubes rivales con fixture de 38 jornadas Round-Robin.
   */
  async initializeLeague(playerClubId, country = 'Argentina') {
    if (!playerClubId) return null

    // Una sola creación en vuelo por club: createClub y getStandings la disparaban a la vez y duplicaban los rivales (x3)
    if (leagueInit.has(playerClubId)) return leagueInit.get(playerClubId)
    const task = this._initializeLeague(playerClubId, country).finally(() => leagueInit.delete(playerClubId))
    leagueInit.set(playerClubId, task)
    return task
  },

  async _initializeLeague(playerClubId, country) {
    try {
      // 0. Verificar si ya existe liga para este club (idempotencia estricta)
      const { data: existing } = await supabase
        .from('standings')
        .select('competition_id')
        .eq('club_id', playerClubId)
        .limit(1)
        .maybeSingle()

      if (existing?.competition_id) {
        return existing.competition_id
      }

      // 1. Crear competición
      const { data: comp, error: compErr } = await supabase
        .from('competitions')
        .insert([{
          name: `Torneo Regional - División 5 (${country})`,
          level: 5,
          teams_count: 20
        }])
        .select()
        .single()

      if (compErr) {
        console.warn('Error al crear competition:', compErr)
        return null
      }

      // 2. Crear 19 clubes IA
      // Los rivales se sortean por carrera desde la división 5 (Potrero / Torneo Regional Amateur)
      // Cada rival tiene su fuerza (46 a 66, media 56): el plantel del usuario (~58) pelea arriba sin ganar siempre
      const { data: myClub } = await supabase.from('clubs').select('name').eq('id', playerClubId).maybeSingle()
      const exclude = myClub?.name ? [myClub.name] : []
      const strengthRand = seededRandom(`strength:${playerClubId}`)
      const aiClubsData = pickRivalClubs(playerClubId, 19, { tier: 5, exclude }).map((c, i) => ({
        name: c.name,
        short_name: c.short_name,
        city: c.city || 'Región Deportiva',
        country: country,
        founded_year: c.founded_year || (1910 + i),
        colors: c.primary_color || c.colors || '#10B981',
        history_type: 'bot',
        league_tier: 5,
        budget: 25000,
        wage_budget: 3500,
        reputation: 15,
        strength: Math.round(46 + strengthRand() * 20),
        stadium_name: c.stadium_name || `Estadio ${c.name}`,
        stadium_capacity: c.stadium_capacity || 1500
      }))

      const { data: aiClubs, error: clubsErr } = await supabase
        .from('clubs')
        .insert(aiClubsData)
        .select('id')

      if (clubsErr) {
        console.warn('Error insertando AI clubs:', clubsErr)
        return comp.id
      }

      const allClubIds = [playerClubId, ...(aiClubs || []).map(c => c.id)]

      // 3. Insertar exactamente 20 filas en standings
      const standingsData = allClubIds.map(id => ({
        competition_id: comp.id,
        club_id: id,
        points: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        form: ''
      }))

      await supabase.from('standings').insert(standingsData)

      // 4. Generar Fixture Round-Robin canónico de 38 fechas
      await this.generateRoundRobinFixtures(comp.id, allClubIds)

      queryCache.invalidate(`standings:${playerClubId}`)
      return comp.id
    } catch (e) {
      console.warn('Error en initializeLeague:', e)
      return null
    }
  },

  /**
   * Arma la liga de la temporada siguiente al cerrar el año. `standings`: tabla final ordenada (club_id e id de cada fila).
   * - Si el club cambió de categoría: liga nueva con 19 rivales de la fuerza de esa división; el club pasa a ella.
   * - Si se queda: los clubes de la IA que subieron o bajaron (según la pirámide) se reemplazan por recién llegados
   *   (los que suben dejan su lugar a equipos más débiles de la categoría, los que bajan a equipos más fuertes).
   * Devuelve la competición y los clubes que la juegan; los partidos los arma quien llama.
   * Se puede retomar: si un intento anterior ya dejó la liga armada se la reconoce y se devuelve tal cual, sin crear clubes ni
   * competiciones repetidos. Los errores de la base cortan el proceso (no se ignoran).
   */
  async prepareNextLeague({ clubId, competitionId, standings, oldTier, newTier, seasonYear, country = 'Argentina' }) {
    const seed = `${clubId}:${seasonYear}`
    const strengthRand = seededRandom(`strength:${seed}`)
    const rivalRow = (c, i, [lo, hi], tier) => ({
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
      strength: Math.round(lo + strengthRand() * (hi - lo)),
      stadium_name: c.stadium_name || `Estadio ${c.name}`,
      stadium_capacity: c.stadium_capacity || 1500
    })

    const mine = standings.find(s => s.club_id === clubId)

    if (newTier !== oldTier) {
      // ¿Ya se armó en un intento anterior? Entonces el club ya está en otra competición con sus rivales
      if (mine?.id) {
        const { data: current } = await supabase.from('standings').select('competition_id').eq('id', mine.id).maybeSingle()
        if (current?.competition_id && current.competition_id !== competitionId) {
          const { data: rows } = await supabase.from('standings').select('club_id').eq('competition_id', current.competition_id)
          const ids = (rows || []).map(r => r.club_id)
          if (ids.length >= 2) return { competitionId: current.competition_id, clubIds: [clubId, ...ids.filter(id => id !== clubId)] }
        }
      }
      const { data: comp, error: compErr } = await supabase
        .from('competitions')
        .insert([{ name: `${divisionName(newTier)} (${country})`, level: newTier, teams_count: 20 }])
        .select()
        .single()
      if (compErr || !comp) throw new Error(compErr?.message || 'No se pudo crear la liga de la nueva categoría.')

      const myClubName = standings.find(s => s.club_id === clubId)?.club?.name
      const exclude = myClubName ? [myClubName] : []
      const rows = pickRivalClubs(seed, 19, { tier: newTier, exclude }).map((c, i) => rivalRow(c, i, tierStrengthRange(newTier), newTier))
      const { data: aiClubs, error: clubsErr } = await supabase.from('clubs').insert(rows).select('id')
      if (clubsErr) throw new Error(clubsErr.message)

      const aiIds = (aiClubs || []).map(c => c.id)
      const zero = { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, form: '' }
      // Primero la tabla de los rivales y recién después se muda el club: si se corta en el medio, el club sigue en su liga y se puede retomar
      const { error: aiStandErr } = await supabase.from('standings').insert(aiIds.map(id => ({ competition_id: comp.id, club_id: id, ...zero })))
      if (aiStandErr) throw new Error(aiStandErr.message)
      if (mine) {
        const { error: moveErr } = await supabase.from('standings').update({ competition_id: comp.id }).eq('id', mine.id)
        if (moveErr) throw new Error(moveErr.message)
      }
      queryCache.invalidate(`standings:${clubId}`)
      return { competitionId: comp.id, clubIds: [clubId, ...aiIds] }
    }

    // Suben y bajan tantos como decía el reglamento de la temporada que terminó
    const { data: oldComp } = await supabase.from('competitions').select('rules').eq('id', competitionId).maybeSingle()
    const oldRules = normalizeRules(oldComp?.rules)
    const movers = standings
      .map((s, i) => ({ ...s, position: i + 1 }))
      .filter(s => s.club_id !== clubId && movementOf(s.position, oldTier, oldRules) !== 'STAY')
    const keep = standings.map(s => s.club_id).filter(id => !movers.some(m => m.club_id === id))
    if (movers.length === 0) return { competitionId, clubIds: keep }

    // ¿Ya se reemplazaron en un intento anterior? Si los que se iban ya no están y la tabla está completa, no se repite
    const { data: stillThere } = await supabase.from('standings').select('club_id').eq('competition_id', competitionId).in('club_id', movers.map(m => m.club_id))
    if ((stillThere || []).length === 0) {
      const { data: rows } = await supabase.from('standings').select('club_id').eq('competition_id', competitionId)
      if ((rows || []).length >= standings.length) return { competitionId, clubIds: rows.map(r => r.club_id) }
    }

    const names = standings.map(s => s.club?.name).filter(Boolean)
    const [lo, hi] = tierStrengthRange(oldTier)
    const mid = Math.round((lo + hi) / 2)
    const picks = pickRivalClubs(seed, movers.length, { tier: oldTier, exclude: names })
    const rows = movers.map((m, i) => rivalRow(picks[i], i, movementOf(m.position, oldTier, oldRules) === 'PROMOTED' ? [lo, mid] : [mid, hi], oldTier))
    const { data: newClubs, error: newErr } = await supabase.from('clubs').insert(rows).select('id')
    if (newErr) throw new Error(newErr.message)

    const { error: delErr } = await supabase.from('standings').delete().in('club_id', movers.map(m => m.club_id))
    if (delErr) throw new Error(delErr.message)
    const zero = { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, form: '' }
    const newIds = (newClubs || []).map(c => c.id)
    const { error: insErr } = await supabase.from('standings').insert(newIds.map(id => ({ competition_id: competitionId, club_id: id, ...zero })))
    if (insErr) throw new Error(insErr.message)
    queryCache.invalidate(`standings:${clubId}`)
    return { competitionId, clubIds: [...keep, ...newIds] }
  },

  /**
   * Generador de fixture todos contra todos (ida y vuelta, 38 fechas para 20 clubes; con el reglamento `legs: 1`, solo ida) con la localía repartida (domain/leagueSchedule).
   * Se puede repetir: antes de generar se borran los partidos de esa competición que ya estaban programados desde esa fecha (por un
   * intento anterior), así nunca quedan partidos duplicados. Los errores de la base cortan el proceso.
   */
  async generateRoundRobinFixtures(competitionId, clubIds, startDate = '2026-08-01', rules = null) {
    if (!competitionId || !clubIds || clubIds.length < 2) return

    const { error: clearErr } = await supabase.from('fixtures').delete().eq('competition_id', competitionId).eq('status', 'SCHEDULED').gte('match_date', startDate)
    if (clearErr) throw new Error(clearErr.message)

    const fixtures = []
    const baseDate = new Date(`${startDate}T00:00:00Z`)

    roundRobinSchedule(clubIds, { legs: normalizeRules(rules).legs }).forEach((matches, round) => {
      const matchDate = new Date(baseDate)
      matchDate.setUTCDate(matchDate.getUTCDate() + round * 7)
      const dateStr = matchDate.toISOString().split('T')[0]
      for (const m of matches) {
        fixtures.push({
          competition_id: competitionId,
          home_team_id: m.home,
          away_team_id: m.away,
          home_club_id: m.home,
          away_club_id: m.away,
          match_date: dateStr,
          status: 'SCHEDULED',
          round: round + 1
        })
      }
    })

    // Insertar fixtures por lotes de 100 para evitar límites de payload
    for (let i = 0; i < fixtures.length; i += 100) {
      const batch = fixtures.slice(i, i + 100)
      const { error: fxErr } = await supabase.from('fixtures').insert(batch)
      if (fxErr) throw new Error(fxErr.message)
    }
  },

  /**
   * Juega los partidos de liga de la IA que ya llegaron a su fecha. Los resuelve la base (`play_league_ai_fixtures`):
   * cada club tiene su fuerza, los resultados salen de la misma fórmula y semilla que la copa y la tabla se actualiza en la
   * misma transacción. El navegador ya no escribe resultados ni puntos: dos disparadores lo impiden.
   */
  async simulateMatchDay(dateString, userClubId = null) {
    if (!dateString || !userClubId) return 0
    try {
      const { data, error } = await supabase.rpc('play_league_ai_fixtures', { p_user_club_id: userClubId, p_date: String(dateString).slice(0, 10) })
      if (error) throw new Error(error.message)
      queryCache.invalidate('standings:')
      return data || 0
    } catch (e) {
      console.warn('Error simulando fecha de IA:', e)
      return 0
    }
  }
}
