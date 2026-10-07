import { roundRobinSchedule } from '../domain/leagueSchedule'
import { movementOf, tierStrengthRange } from '../domain/pyramid'
import { divisionName } from '../domain/divisions'
import { seededRandom } from '../domain/cupMatch'
import { pickRivalClubs } from '../domain/rivalClubs'
import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

// Lista de clubes regionales para poblar la división Tier 5
export const DEFAULT_REGION_CLUBS = [
  { name: 'Deportivo Central', short_name: 'DCE' },
  { name: 'Atlético Belgrano', short_name: 'ATB' },
  { name: 'Defensores del Valle', short_name: 'DDV' },
  { name: 'Juventud Unida', short_name: 'JUN' },
  { name: 'Social y Deportivo Rivadavia', short_name: 'SDR' },
  { name: 'Estudiantes del Norte', short_name: 'EDN' },
  { name: 'Unión Ferroviaria', short_name: 'UFE' },
  { name: 'Club Náutico Costanera', short_name: 'CNC' },
  { name: 'San Martín Social', short_name: 'SMS' },
  { name: 'Sportivo Balcarce', short_name: 'SPB' },
  { name: 'Club Atlético Mitre', short_name: 'CAM' },
  { name: 'Racing de la Pampa', short_name: 'RLP' },
  { name: 'Tiro Federal Argentino', short_name: 'TFA' },
  { name: 'Huracán del Sur', short_name: 'HDS' },
  { name: 'Almagro Regional', short_name: 'ALM' },
  { name: 'Independiente de la Ribera', short_name: 'IDR' },
  { name: 'Talleres del Parque', short_name: 'TDP' },
  { name: 'Club Barrio Jardín', short_name: 'CBJ' },
  { name: 'Deportivo Sarmiento', short_name: 'DSA' }
]

export const getZoneForPosition = (pos) => {
  if (pos <= 2) return { id: 'PROMOTION', label: 'Ascenso Directo', color: 'emerald' }
  if (pos <= 6) return { id: 'PLAYOFF', label: 'Zona Reducido / Playoff', color: 'cyan' }
  if (pos >= 18) return { id: 'RELEGATION', label: 'Zona Descenso', color: 'red' }
  return { id: 'MID_TABLE', label: 'Zona Media', color: 'zinc' }
}

// Creaciones de liga en vuelo por club (evita carreras entre createClub y getStandings)
const leagueInit = new Map()

export const competitionApi = {
  /**
   * Obtiene la tabla oficial de posiciones con criterios canónicos de desempate y zonas deportivas.
   */
  async getStandings(clubId) {
    if (!clubId) return []

    return queryCache.fetch(`standings:${clubId}`, async () => {
      try {
        // 1. Buscar la fila del club en standings
        let { data: myStanding, error } = await supabase
          .from('standings')
          .select('id, competition_id, club_id')
          .eq('club_id', clubId)
          .limit(1)
          .maybeSingle()

        let competitionId = myStanding?.competition_id

        // 2. Si no existe, inicializar la liga
        if (!competitionId) {
          competitionId = await this.initializeLeague(clubId)
        }

        // 3. Consultar todos los clubes de la competición con ordenamiento canónico
        if (competitionId) {
          const { data: allStandings, error: allErr } = await supabase
            .from('standings')
            .select('*, clubs(name, short_name, primary_color)')
            .eq('competition_id', competitionId)

          if (!allErr && allStandings && allStandings.length > 0) {
            // Aplicar criterios de desempate en memoria autoritativos:
            // 1. Puntos DESC, 2. Diferencia de Gol DESC, 3. Goles a Favor DESC, 4. Nombre ASC
            const sorted = allStandings.map(s => ({
              ...s,
              goal_difference: (s.goals_for || 0) - (s.goals_against || 0),
              club_name: s.clubs?.name || 'Club de Liga',
              club_short: s.clubs?.short_name || 'CLB'
            })).sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points
              if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference
              if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for
              return (a.club_name || '').localeCompare(b.club_name || '')
            })

            return sorted.map((s, idx) => ({
              ...s,
              position: idx + 1,
              zone: getZoneForPosition(idx + 1)
            }))
          }
        }
      } catch (err) {
        console.warn('Aviso: error obteniendo standings desde DB, generando vista segura:', err)
      }

      // Fallback seguro: Nunca mostrar pantalla en negro
      return this.generateFallbackStandings(clubId)
    }, 30000)
  },

  /**
   * Genera una tabla de 20 clubes con el club del usuario para garantizar 0ms de carga sin pantallas negras.
   */
  generateFallbackStandings(clubId) {
    const list = [
      { id: clubId, name: 'Tu Club', short_name: 'CLUB', points: 3, played: 1, won: 1, drawn: 0, lost: 0, goals_for: 2, goals_against: 0, goal_difference: 2, form: 'V' },
      ...DEFAULT_REGION_CLUBS.map((c, i) => ({
        id: `bot_club_${i}`,
        name: c.name,
        short_name: c.short_name,
        points: Math.max(0, 3 - Math.floor(i / 6)),
        played: 1,
        won: i < 5 ? 1 : 0,
        drawn: i >= 5 && i < 12 ? 1 : 0,
        lost: i >= 12 ? 1 : 0,
        goals_for: Math.max(0, 2 - (i % 3)),
        goals_against: Math.max(0, i % 2),
        goal_difference: Math.max(-2, 2 - (i % 3) - (i % 2)),
        form: i < 5 ? 'V' : (i < 12 ? 'E' : 'D')
      }))
    ]

    list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference
      return b.goals_for - a.goals_for
    })

    return list.map((s, idx) => ({
      ...s,
      club_id: s.id,
      position: idx + 1,
      zone: getZoneForPosition(idx + 1),
      clubs: { name: s.name, short_name: s.short_name }
    }))
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
      // Los rivales se sortean por carrera (no son siempre los mismos 19 clubes)
      // Cada rival tiene su fuerza (46 a 66, media 56): el plantel del usuario (~58) pelea arriba sin ganar siempre
      const strengthRand = seededRandom(`strength:${playerClubId}`)
      const aiClubsData = pickRivalClubs(playerClubId, 19).map((c, i) => ({
        name: c.name,
        short_name: c.short_name,
        city: 'Región Deportiva',
        country: country,
        founded_year: 1910 + i,
        colors: '#10B981',
        history_type: 'bot',
        league_tier: 5,
        budget: 25000,
        wage_budget: 3500,
        reputation: 15,
        strength: Math.round(46 + strengthRand() * 20),
        stadium_name: `Estadio ${c.name}`,
        stadium_capacity: 1500
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
   */
  async prepareNextLeague({ clubId, competitionId, standings, oldTier, newTier, seasonYear, country = 'Argentina' }) {
    const seed = `${clubId}:${seasonYear}`
    const strengthRand = seededRandom(`strength:${seed}`)
    const rivalRow = (c, i, [lo, hi], tier) => ({
      name: c.name,
      short_name: c.short_name,
      city: 'Región Deportiva',
      country,
      founded_year: 1910 + i,
      colors: '#10B981',
      history_type: 'bot',
      league_tier: tier,
      budget: 25000,
      wage_budget: 3500,
      reputation: 15,
      strength: Math.round(lo + strengthRand() * (hi - lo)),
      stadium_name: `Estadio ${c.name}`,
      stadium_capacity: 1500
    })

    if (newTier !== oldTier) {
      const { data: comp, error: compErr } = await supabase
        .from('competitions')
        .insert([{ name: `${divisionName(newTier)} (${country})`, level: newTier, teams_count: 20 }])
        .select()
        .single()
      if (compErr || !comp) throw new Error(compErr?.message || 'No se pudo crear la liga de la nueva categoría.')

      const rows = pickRivalClubs(seed, 19).map((c, i) => rivalRow(c, i, tierStrengthRange(newTier), newTier))
      const { data: aiClubs, error: clubsErr } = await supabase.from('clubs').insert(rows).select('id')
      if (clubsErr) throw new Error(clubsErr.message)

      const aiIds = (aiClubs || []).map(c => c.id)
      const mine = standings.find(s => s.club_id === clubId)
      if (mine) await supabase.from('standings').update({ competition_id: comp.id }).eq('id', mine.id)
      const zero = { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, form: '' }
      await supabase.from('standings').insert(aiIds.map(id => ({ competition_id: comp.id, club_id: id, ...zero })))
      queryCache.invalidate(`standings:${clubId}`)
      return { competitionId: comp.id, clubIds: [clubId, ...aiIds] }
    }

    const movers = standings
      .map((s, i) => ({ ...s, position: i + 1 }))
      .filter(s => s.club_id !== clubId && movementOf(s.position, oldTier) !== 'STAY')
    const keep = standings.map(s => s.club_id).filter(id => !movers.some(m => m.club_id === id))
    if (movers.length === 0) return { competitionId, clubIds: keep }

    const names = standings.map(s => s.club?.name).filter(Boolean)
    const [lo, hi] = tierStrengthRange(oldTier)
    const mid = Math.round((lo + hi) / 2)
    const picks = pickRivalClubs(seed, movers.length, names)
    const rows = movers.map((m, i) => rivalRow(picks[i], i, movementOf(m.position, oldTier) === 'PROMOTED' ? [lo, mid] : [mid, hi], oldTier))
    const { data: newClubs, error: newErr } = await supabase.from('clubs').insert(rows).select('id')
    if (newErr) throw new Error(newErr.message)

    await supabase.from('standings').delete().in('club_id', movers.map(m => m.club_id))
    const zero = { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, form: '' }
    const newIds = (newClubs || []).map(c => c.id)
    await supabase.from('standings').insert(newIds.map(id => ({ competition_id: competitionId, club_id: id, ...zero })))
    queryCache.invalidate(`standings:${clubId}`)
    return { competitionId, clubIds: [...keep, ...newIds] }
  },

  /**
   * Generador de fixture todos contra todos (una rueda, 19 fechas para 20 clubes) con la localía repartida (domain/leagueSchedule).
   */
  async generateRoundRobinFixtures(competitionId, clubIds, startDate = '2026-08-01') {
    if (!competitionId || !clubIds || clubIds.length < 2) return

    const fixtures = []
    const baseDate = new Date(`${startDate}T00:00:00Z`)

    roundRobinSchedule(clubIds).forEach((matches, round) => {
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
      await supabase.from('fixtures').insert(batch)
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
