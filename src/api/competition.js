import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { FIXTURE_OPEN_STATUSES } from '../domain/fixtureStatus'

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
      const aiClubsData = DEFAULT_REGION_CLUBS.map((c, i) => ({
        name: c.name,
        short_name: c.short_name,
        city: 'Región Deportiva',
        country: country,
        founded_year: 1910 + i,
        colors: '#10B981',
        history_type: 'bot',
        budget: 25000,
        wage_budget: 3500,
        reputation: 15,
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
        form: 'E'
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
   * Generador de fixture Round-Robin canónico (ida y vuelta) para 20 clubes.
   */
  async generateRoundRobinFixtures(competitionId, clubIds) {
    if (!competitionId || !clubIds || clubIds.length < 2) return

    const n = clubIds.length
    const rounds = (n - 1) * 2 // 38 fechas
    const fixtures = []
    const baseDate = new Date('2026-08-01')

    const teams = [...clubIds]

    for (let round = 0; round < n - 1; round++) {
      const matchDate = new Date(baseDate)
      matchDate.setDate(matchDate.getDate() + round * 7)
      const dateStr = matchDate.toISOString().split('T')[0]

      for (let i = 0; i < n / 2; i++) {
        const homeIdx = (round + i) % (n - 1)
        let awayIdx = (n - 1 - i + round) % (n - 1)
        if (i === 0) awayIdx = n - 1

        const isReversed = (round + i) % 2 === 1
        const homeClub = isReversed ? teams[awayIdx] : teams[homeIdx]
        const awayClub = isReversed ? teams[homeIdx] : teams[awayIdx]

        fixtures.push({
          competition_id: competitionId,
          home_team_id: homeClub,
          away_team_id: awayClub,
          home_club_id: homeClub,
          away_club_id: awayClub,
          match_date: dateStr,
          status: 'SCHEDULED',
          round: round + 1
        })
      }
    }

    // Insertar fixtures por lotes de 100 para evitar límites de payload
    for (let i = 0; i < fixtures.length; i += 100) {
      const batch = fixtures.slice(i, i + 100)
      await supabase.from('fixtures').insert(batch)
    }
  },

  /**
   * Actualización autoritativa e idempotente de la tabla tras un partido.
   */
  async _updateStandings(competitionId, homeClubId, awayClubId, homeGoals, awayGoals) {
    if (!competitionId || !homeClubId || !awayClubId) return

    try {
      const { data: standings } = await supabase
        .from('standings')
        .select('*')
        .eq('competition_id', competitionId)
        .in('club_id', [homeClubId, awayClubId])

      if (!standings || standings.length < 2) return

      const homeRow = standings.find(s => s.club_id === homeClubId)
      const awayRow = standings.find(s => s.club_id === awayClubId)

      if (!homeRow || !awayRow) return

      const isHomeWin = homeGoals > awayGoals
      const isDraw = homeGoals === awayGoals

      // Actualizar local
      await supabase.from('standings').update({
        played: (homeRow.played || 0) + 1,
        won: (homeRow.won || 0) + (isHomeWin ? 1 : 0),
        drawn: (homeRow.drawn || 0) + (isDraw ? 1 : 0),
        lost: (homeRow.lost || 0) + (!isHomeWin && !isDraw ? 1 : 0),
        goals_for: (homeRow.goals_for || 0) + homeGoals,
        goals_against: (homeRow.goals_against || 0) + awayGoals,
        points: (homeRow.points || 0) + (isHomeWin ? 3 : (isDraw ? 1 : 0)),
        form: `${isHomeWin ? 'V' : (isDraw ? 'E' : 'D')},${(homeRow.form || '').slice(0, 8)}`,
        updated_at: new Date().toISOString()
      }).eq('id', homeRow.id)

      // Actualizar visitante
      await supabase.from('standings').update({
        played: (awayRow.played || 0) + 1,
        won: (awayRow.won || 0) + (!isHomeWin && !isDraw ? 1 : 0),
        drawn: (awayRow.drawn || 0) + (isDraw ? 1 : 0),
        lost: (awayRow.lost || 0) + (isHomeWin ? 1 : 0),
        goals_for: (awayRow.goals_for || 0) + awayGoals,
        goals_against: (awayRow.goals_against || 0) + homeGoals,
        points: (awayRow.points || 0) + (!isHomeWin && !isDraw ? 3 : (isDraw ? 1 : 0)),
        form: `${!isHomeWin && !isDraw ? 'V' : (isDraw ? 'E' : 'D')},${(awayRow.form || '').slice(0, 8)}`,
        updated_at: new Date().toISOString()
      }).eq('id', awayRow.id)

      queryCache.invalidate(`standings:${homeClubId}`)
      queryCache.invalidate(`standings:${awayClubId}`)
    } catch (e) {
      console.warn('Error actualizando standings post-partido:', e)
    }
  },

  /**
   * Calcula el marcador simulado de un partido de IA (puro, inyectable para tests)
   */
  simulateAiScore(rng = Math.random) {
    const hGoals = Math.floor(rng() * 3) + (rng() < 0.25 ? 1 : 0)
    const aGoals = Math.floor(rng() * 3)
    return { hGoals, aGoals }
  },

  /**
   * Convierte resultados en deltas de tabla por club (puro): un objeto por club y competición
   */
  buildStandingsDeltas(results) {
    const byKey = new Map()
    const touch = (competitionId, clubId) => {
      const key = `${competitionId}:${clubId}`
      if (!byKey.has(key)) {
        byKey.set(key, { competition_id: competitionId, club_id: clubId, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0, formChars: [] })
      }
      return byKey.get(key)
    }
    for (const r of results) {
      const home = touch(r.competitionId, r.homeId)
      const away = touch(r.competitionId, r.awayId)
      const homeWin = r.hGoals > r.aGoals
      const draw = r.hGoals === r.aGoals
      home.played++; away.played++
      home.goals_for += r.hGoals; home.goals_against += r.aGoals
      away.goals_for += r.aGoals; away.goals_against += r.hGoals
      if (draw) { home.drawn++; away.drawn++; home.points += 1; away.points += 1; home.formChars.unshift('E'); away.formChars.unshift('E') }
      else if (homeWin) { home.won++; away.lost++; home.points += 3; home.formChars.unshift('V'); away.formChars.unshift('D') }
      else { away.won++; home.lost++; away.points += 3; away.formChars.unshift('V'); home.formChars.unshift('D') }
    }
    return [...byKey.values()].map(({ formChars, ...d }) => ({ ...d, form: formChars.join(',') }))
  },

  /**
   * Simula los partidos de IA vencidos hasta la fecha de juego (incluida).
   * - La fecha del juego avanza de a 7 días y los fixtures caen en otros días de la semana, por lo que se juega todo
   *   lo que ya venció (<= fecha) y no sólo los de la fecha exacta (antes: la liga de IA nunca avanzaba).
   * - Se excluye el club del usuario: sus partidos los dirige el DT.
   * - Escritura en lote: 2 llamadas RPC en vez de ~3 consultas por partido.
   */
  async simulateMatchDay(dateString, excludeClubId = null) {
    if (!dateString) return 0

    try {
      const { data: fixtures } = await supabase
        .from('fixtures')
        .select('id, competition_id, home_team_id, away_team_id')
        .in('status', FIXTURE_OPEN_STATUSES)
        .lte('match_date', dateString)

      const due = (fixtures || []).filter(f =>
        !excludeClubId || (f.home_team_id !== excludeClubId && f.away_team_id !== excludeClubId))
      if (due.length === 0) return 0

      const results = due.map(f => ({
        id: f.id,
        competitionId: f.competition_id,
        homeId: f.home_team_id,
        awayId: f.away_team_id,
        ...this.simulateAiScore()
      }))

      // 1) Cierra los fixtures (idempotente: sólo los que siguen abiertos) y 2) aplica la tabla
      const { data: closed, error: finishErr } = await supabase.rpc('batch_finish_fixtures', {
        rows: results.map(r => ({ id: r.id, home_score: r.hGoals, away_score: r.aGoals }))
      })
      if (finishErr) throw new Error(finishErr.message)

      // Sólo cuentan en la tabla los partidos que efectivamente se cerraron en esta llamada
      const closedIds = new Set(closed || [])
      const withCompetition = results.filter(r => r.competitionId && closedIds.has(r.id))
      if (withCompetition.length > 0) {
        const { error: standingsErr } = await supabase.rpc('apply_standings_deltas', {
          rows: this.buildStandingsDeltas(withCompetition)
        })
        if (standingsErr) throw new Error(standingsErr.message)
      }

      queryCache.invalidate('standings:')
      return due.length
    } catch (e) {
      console.warn('Error simulando fecha de IA:', e)
      return 0
    }
  }
}
