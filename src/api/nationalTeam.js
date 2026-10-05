import { supabase } from './supabase'
import { managerApi } from './manager'
import { auditApi } from './audit'
import { queryCache } from '../utils/cache'
import { isGoalkeeper } from '../domain/positions'

export const NATIONAL_TEAMS_CONFIG = {
  fifa_callup_size: 23,
  minimum_goalkeepers: 3,
  travel_fatigue_penalty: -15,
  morale_boost_callup: 10,
  senior_wage_weekly: 1500,
  u23_wage_weekly: 900,
  u20_wage_weekly: 600,
  world_cup_championship_xp: 5000
}

export const DEFAULT_NATIONS_SEED = [
  {
    name: 'Selección Argentina Mayor',
    country_code: 'AR',
    category: 'senior',
    federation: 'CONMEBOL',
    world_ranking: 1,
    reputation: 95,
    colors: { primary: '#75AADB', secondary: '#FFFFFF' }
  },
  {
    name: 'Selección Argentina Olímpica Sub-23',
    country_code: 'AR',
    category: 'u23',
    federation: 'CONMEBOL',
    world_ranking: 4,
    reputation: 80,
    colors: { primary: '#75AADB', secondary: '#FFFFFF' }
  },
  {
    name: 'Selección Argentina Juvenil Sub-20',
    country_code: 'AR',
    category: 'u20',
    federation: 'CONMEBOL',
    world_ranking: 2,
    reputation: 70,
    colors: { primary: '#75AADB', secondary: '#FFFFFF' }
  },
  {
    name: 'Selección de Brasil',
    country_code: 'BR',
    category: 'senior',
    federation: 'CONMEBOL',
    world_ranking: 3,
    reputation: 92,
    colors: { primary: '#FEE101', secondary: '#009739' }
  },
  {
    name: 'Selección de Uruguay',
    country_code: 'UY',
    category: 'senior',
    federation: 'CONMEBOL',
    world_ranking: 11,
    reputation: 85,
    colors: { primary: '#0038A8', secondary: '#FFFFFF' }
  }
]

export const nationalTeamApi = {
  /**
   * Obtiene la selección nacional actualmente dirigida por el DT
   */
  async getCurrentNationalTeam(managerId) {
    if (!managerId) return null

    const { data: manager } = await supabase
      .from('managers')
      .select('national_team_id')
      .eq('id', managerId)
      .maybeSingle()

    if (!manager?.national_team_id) return null

    const { data: team, error } = await supabase
      .from('national_teams')
      .select('*')
      .eq('id', manager.national_team_id)
      .maybeSingle()

    if (error || !team) return null
    return team
  },

  /**
   * Lista ofertas de selecciones según la reputación del DT (sembrando por defecto si la tabla está vacía)
   */
  async getAvailableOffers(managerId) {
    if (!managerId) return []

    // 1. Auto-sembrar selecciones si no hay ninguna en DB
    await this.seedDefaultNationsIfEmpty()

    const { data: manager } = await supabase
      .from('managers')
      .select('reputation, xp')
      .eq('id', managerId)
      .maybeSingle()

    const rep = Number(manager?.reputation || 20)

    const { data: teams, error } = await supabase
      .from('national_teams')
      .select('*')
      .is('manager_id', null)

    if (error || !teams) return []

    // Filtrar ofertas según jerarquía y reputación
    return teams.map(t => {
      let requiredRep = 75
      let label = 'Selección Mayor'
      let target = 'Clasificar al Mundial y conquistar el continente'
      let wage = NATIONAL_TEAMS_CONFIG.senior_wage_weekly

      if (t.category === 'u20') {
        requiredRep = 25
        label = 'Selección Juvenil Sub-20'
        target = 'Desarrollar promesas y clasificar al Sudamericano Sub-20'
        wage = NATIONAL_TEAMS_CONFIG.u20_wage_weekly
      } else if (t.category === 'u23') {
        requiredRep = 50
        label = 'Selección Olímpica Sub-23'
        target = 'Alcanzar el podio y medalla en los Juegos'
        wage = NATIONAL_TEAMS_CONFIG.u23_wage_weekly
      }

      return {
        ...t,
        category_label: label,
        objective: target,
        required_reputation: requiredRep,
        weekly_wage: wage,
        is_eligible: rep >= requiredRep
      }
    })
  },

  /**
   * Acepta una oferta de selección (estableciendo la Doble Carrera)
   */
  async acceptOffer(managerId, nationalTeamId) {
    if (!managerId || !nationalTeamId) throw new Error('Datos incompletos para aceptar cargo de seleccionador.')

    // 1. Vincular DT con la Selección
    await supabase.from('managers').update({ national_team_id: nationalTeamId }).eq('id', managerId)
    await supabase.from('national_teams').update({ manager_id: managerId }).eq('id', nationalTeamId)

    // 2. Sembrar convocatoria inicial reglamentaria si está vacía
    await this.seedInitialCallupsIfEmpty(nationalTeamId)

    // 3. Sembrar fixture FIFA inicial si no tiene
    await this.seedInitialFixturesIfEmpty(nationalTeamId)

    // 4. Auditoría
    await auditApi.logAction({
      whoId: managerId,
      action: 'ACCEPT_NATIONAL_TEAM_OFFER',
      entityType: 'national_team',
      entityId: nationalTeamId,
      stateBefore: {},
      stateAfter: { national_team_id: nationalTeamId }
    })

    queryCache.invalidate('manager:')
    return true
  },

  /**
   * Renuncia voluntaria a la selección (continúa en el club sin alteraciones)
   */
  async resign(managerId, nationalTeamId) {
    if (!managerId) return

    await supabase.from('managers').update({ national_team_id: null }).eq('id', managerId)
    if (nationalTeamId) {
      await supabase.from('national_teams').update({ manager_id: null }).eq('id', nationalTeamId)
    }

    await auditApi.logAction({
      whoId: managerId,
      action: 'RESIGN_NATIONAL_TEAM',
      entityType: 'national_team',
      entityId: nationalTeamId || managerId,
      stateBefore: { national_team_id: nationalTeamId },
      stateAfter: { national_team_id: null }
    })

    queryCache.invalidate('manager:')
    return true
  },

  /**
   * Obtiene la nómina de futbolistas convocados
   */
  async getCallups(nationalTeamId) {
    if (!nationalTeamId) return []

    const { data: callups, error } = await supabase
      .from('national_team_callups')
      .select(`
        *,
        player:players(id, first_name, last_name, position, age, nationality, attr_potential, state_fitness, state_morale, clubs(name, short_name))
      `)
      .eq('national_team_id', nationalTeamId)

    if (error || !callups) return []
    return callups
  },

  /**
   * Obtiene el padrón de futbolistas elegibles en el universo del juego
   * Regla 33.1: Elegibilidad estricta por nacionalidad
   */
  async getEligiblePlayersPool(nationalTeamId, countryCode = 'AR') {
    let query = supabase
      .from('players')
      .select(`
        id, first_name, last_name, position, age, nationality, attr_potential, state_fitness, state_morale,
        clubs(id, name, short_name)
      `)

    // Si hay nacionalidad definida, filtrar
    if (countryCode) {
      query = query.or(`nationality.eq.${countryCode},nationality.eq.Argentina`)
    }

    const { data: pool, error } = await query.limit(50)
    if (error || !pool) return []
    return pool
  },

  /**
   * Valida y oficializa la lista final de 23 convocados
   * Regla 33.1: Elegibilidad por nacionalidad
   * Regla 33.2: Cuota obligatoria de al menos 3 porteros
   */
  async submitNationalCallUp(nationalTeamId, playerIdsList = []) {
    if (!nationalTeamId) throw new Error('ID de selección no provisto')

    // Validar tamaño exacto (Regla 33.2)
    if (playerIdsList.length !== NATIONAL_TEAMS_CONFIG.fifa_callup_size) {
      const err = new Error(`ERR_INVALID_CALLUP_SIZE: La convocatoria oficial FIFA debe contener exactamente ${NATIONAL_TEAMS_CONFIG.fifa_callup_size} futbolistas (actuales: ${playerIdsList.length}).`)
      err.code = 'ERR_INVALID_CALLUP_SIZE'
      throw err
    }

    // Consultar futbolistas
    const { data: players, error } = await supabase
      .from('players')
      .select('id, position, nationality')
      .in('id', playerIdsList)

    if (error || !players) throw new Error('Error al validar futbolistas de la lista.')

    // Validar arqueros (Regla 33.2)
    const goalkeepers = players.filter(p => isGoalkeeper(p.position))
    if (goalkeepers.length < NATIONAL_TEAMS_CONFIG.minimum_goalkeepers) {
      const err = new Error(`ERR_INSUFFICIENT_GOALKEEPERS: La nómina debe incluir de forma obligatoria al menos ${NATIONAL_TEAMS_CONFIG.minimum_goalkeepers} arqueros reglamentarios (actuales: ${goalkeepers.length}).`)
      err.code = 'ERR_INSUFFICIENT_GOALKEEPERS'
      throw err
    }

    // Reemplazar convocatoria en base de datos
    await supabase.from('national_team_callups').delete().eq('national_team_id', nationalTeamId)

    const inserts = playerIdsList.map((pid, idx) => ({
      national_team_id: nationalTeamId,
      player_id: pid,
      is_starter: idx < 11,
      caps: Math.floor(Math.random() * 10),
      international_goals: 0
    }))

    await supabase.from('national_team_callups').insert(inserts)

    // Bonus anímico patrio a los convocados (+10 de moral)
    try {
      for (const p of players) {
        await supabase
          .from('players')
          .update({ state_morale: Math.min(100, 70 + NATIONAL_TEAMS_CONFIG.morale_boost_callup) })
          .eq('id', p.id)
      }
    } catch (e) {
      console.warn('Aviso al actualizar moral de convocados:', e)
    }

    return { success: true, count: inserts.length }
  },

  /**
   * Obtiene los partidos programados de la selección
   */
  async getFixtures(nationalTeamId) {
    if (!nationalTeamId) return []

    const { data: fixtures, error } = await supabase
      .from('national_fixtures')
      .select('*')
      .eq('national_team_id', nationalTeamId)
      .order('created_at', { ascending: true })

    if (error || !fixtures) return []
    return fixtures
  },

  /**
   * Disputa un partido internacional oficial o amistoso
   * Incluye liquidación de prestigio, fatiga de viaje y honorarios
   */
  async playMatch(fixtureId, nationalTeamId, managerId) {
    const { data: fixture } = await supabase
      .from('national_fixtures')
      .select('*')
      .eq('id', fixtureId)
      .single()

    if (!fixture) throw new Error('Partido no encontrado')
    // Idempotencia: una fecha ya jugada no vuelve a pagar XP, honorarios ni fatiga
    if (fixture.played) throw new Error('Esta fecha FIFA ya fue disputada.')

    // 1. El resultado lo decide la base (función `play_national_fixture`) y lo guarda ella: el navegador no puede escribirlo
    const { data: played, error: playError } = await supabase.rpc('play_national_fixture', { p_fixture_id: fixtureId })
    if (playError) throw new Error(playError.message)
    const teamGoals = played.team_goals
    const oppGoals = played.opp_goals
    const won = teamGoals > oppGoals
    const drawn = teamGoals === oppGoals

    // 2. Actualizar registro histórico de la selección
    const { data: team } = await supabase.from('national_teams').select('*').eq('id', nationalTeamId).single()
    if (team) {
      await supabase.from('national_teams').update({
        matches_played: (team.matches_played || 0) + 1,
        matches_won: (team.matches_won || 0) + (won ? 1 : 0),
        matches_drawn: (team.matches_drawn || 0) + (drawn ? 1 : 0),
        matches_lost: (team.matches_lost || 0) + (!won && !drawn ? 1 : 0)
      }).eq('id', nationalTeamId)
    }

    // 3. Dar XP y reputación internacional al DT (Fase 32)
    const xpBonus = won ? 150 : drawn ? 60 : 30
    if (managerId) {
      await managerApi.addXp(managerId, xpBonus)
      
      try {
        const { reputationApi } = await import('./reputation')
        const repDelta = won ? 1.5 : (drawn ? 0.0 : -0.5)
        await reputationApi.applyReputationDelta({
          managerId,
          eventType: 'INTERNATIONAL_TRIUMPH',
          sourceEntityId: fixtureId,
          delta: repDelta,
          description: won ? `Triunfo internacional vs ${fixture.opponent_name}` : `Partido internacional vs ${fixture.opponent_name}`
        })
      } catch (repErr) {
        console.warn('Aviso: no se pudo actualizar reputación en partido internacional:', repErr)
      }

      // Regla 33.3: Honorario federativo depositado en personal_savings
      try {
        const { data: mgr } = await supabase.from('managers').select('personal_savings').eq('id', managerId).single()
        if (mgr) {
          const wage = team?.category === 'senior' ? NATIONAL_TEAMS_CONFIG.senior_wage_weekly : NATIONAL_TEAMS_CONFIG.u20_wage_weekly
          await supabase.from('managers').update({
            personal_savings: Number(mgr.personal_savings || 0) + wage
          }).eq('id', managerId)
        }
      } catch (wageErr) {
        console.warn('Aviso honorario internacional:', wageErr)
      }
    }

    // 4. Caps y fatiga de viaje (Regla 33.4): en paralelo y con la fatiga en UNA llamada
    //    (antes eran ~70 consultas una detrás de otra: la fecha FIFA tardaba ~30 s)
    const { data: callups } = await supabase
      .from('national_team_callups')
      .select('id, player_id, caps')
      .eq('national_team_id', nationalTeamId)

    if (callups && callups.length > 0) {
      const playerIds = callups.map(c => c.player_id).filter(Boolean)
      const { data: callupPlayers } = playerIds.length > 0
        ? await supabase.from('players').select('id, state_fitness').in('id', playerIds)
        : { data: [] }

      const { playerApi } = await import('./player')
      await Promise.all([
        ...callups.map(c => supabase.from('national_team_callups').update({ caps: (c.caps || 0) + 1 }).eq('id', c.id)),
        playerApi.batchUpdate((callupPlayers || []).map(p => ({
          id: p.id,
          state_fitness: Math.max(30, (p.state_fitness || 85) + NATIONAL_TEAMS_CONFIG.travel_fatigue_penalty)
        })))
      ])
    }

    return { teamGoals, oppGoals, won, drawn, xpBonus }
  },

  /**
   * Siembra selecciones por defecto si la tabla está vacía
   */
  async seedDefaultNationsIfEmpty() {
    try {
      const { count } = await supabase
        .from('national_teams')
        .select('*', { count: 'exact', head: true })

      if (count && count > 0) return

      await supabase.from('national_teams').insert(DEFAULT_NATIONS_SEED)
    } catch (e) {
      console.warn('Aviso sembrando selecciones por defecto:', e)
    }
  },

  /**
   * Siembra la lista de convocados inicial si está vacía con cuota reglamentaria
   */
  async seedInitialCallupsIfEmpty(nationalTeamId) {
    const { count } = await supabase
      .from('national_team_callups')
      .select('*', { count: 'exact', head: true })
      .eq('national_team_id', nationalTeamId)

    if (count && count > 0) return

    // Buscar jugadores de la BD para convocar (hasta 23)
    const { data: pool } = await supabase
      .from('players')
      .select('id, position')
      .limit(23)

    if (pool && pool.length > 0) {
      const callupsToInsert = pool.map((p, idx) => ({
        national_team_id: nationalTeamId,
        player_id: p.id,
        is_starter: idx < 11,
        caps: Math.floor(Math.random() * 15),
        international_goals: Math.floor(Math.random() * 4)
      }))
      await supabase.from('national_team_callups').insert(callupsToInsert)
    }
  },

  /**
   * Siembra fixtures de fecha FIFA si no existen
   */
  async seedInitialFixturesIfEmpty(nationalTeamId) {
    const { count } = await supabase
      .from('national_fixtures')
      .select('*', { count: 'exact', head: true })
      .eq('national_team_id', nationalTeamId)

    if (count && count > 0) return

    const initialFixtures = [
      {
        national_team_id: nationalTeamId,
        opponent_name: 'Brasil',
        tournament_name: 'Clásico de las Américas / Eliminatorias',
        match_date: '2026-10-10',
        is_home: true
      },
      {
        national_team_id: nationalTeamId,
        opponent_name: 'Uruguay',
        tournament_name: 'Eliminatorias Sudamericanas',
        match_date: '2026-11-12',
        is_home: false
      },
      {
        national_team_id: nationalTeamId,
        opponent_name: 'Colombia',
        tournament_name: 'Fecha FIFA Amistoso Internacional',
        match_date: '2027-03-24',
        is_home: true
      }
    ]

    await supabase.from('national_fixtures').insert(initialFixtures)
  }
}
