import { supabase } from './supabase'
import { managerApi } from './manager'
import { auditApi } from './audit'

/**
 * Servicio de Selecciones Nacionales y Doble Carrera (Fase 33)
 */
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
      .single()

    if (!manager?.national_team_id) return null

    const { data: team, error } = await supabase
      .from('national_teams')
      .select('*')
      .eq('id', manager.national_team_id)
      .single()

    if (error || !team) return null
    return team
  },

  /**
   * Lista ofertas de selecciones según la reputación del DT
   */
  async getAvailableOffers(managerId) {
    if (!managerId) return []

    const { data: manager } = await supabase
      .from('managers')
      .select('reputation, xp')
      .eq('id', managerId)
      .single()

    const rep = manager?.reputation || 40

    const { data: teams } = await supabase
      .from('national_teams')
      .select('*')
      .is('manager_id', null)

    if (!teams) return []

    // Filtrar ofertas según jerarquía y reputación
    return teams.map(t => {
      let requiredRep = 40
      let label = 'Selección Mayor'
      let target = 'Clasificar al Mundial y ganar la Copa América'

      if (t.category === 'u20') {
        requiredRep = 25
        label = 'Selección Sub-20'
        target = 'Desarrollar promesas y clasificar al Sudamericano Sub-20'
      } else if (t.category === 'u23') {
        requiredRep = 45
        label = 'Selección Olímpica Sub-23'
        target = 'Alcanzar el podio y medalla en los Juegos'
      }

      return {
        ...t,
        category_label: label,
        objective: target,
        required_reputation: requiredRep,
        is_eligible: rep >= requiredRep
      }
    })
  },

  /**
   * Acepta una oferta de selección (estableciendo la Doble Carrera)
   */
  async acceptOffer(managerId, nationalTeamId) {
    if (!managerId || !nationalTeamId) throw new Error('Datos incompletos')

    // 1. Vincular DT con la Selección
    await supabase.from('managers').update({ national_team_id: nationalTeamId }).eq('id', managerId)
    await supabase.from('national_teams').update({ manager_id: managerId }).eq('id', nationalTeamId)

    // 2. Sembrar convocatoria inicial si no tiene
    await this.seedInitialCallupsIfEmpty(nationalTeamId)

    // 3. Sembrar fixture FIFA inicial si no tiene
    await this.seedInitialFixturesIfEmpty(nationalTeamId)

    await auditApi.logAction({
      whoId: managerId,
      action: 'ACCEPT_NATIONAL_TEAM_OFFER',
      entityType: 'national_team',
      entityId: nationalTeamId,
      stateBefore: {},
      stateAfter: { national_team_id: nationalTeamId }
    })

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
        player:players(id, first_name, last_name, position, age, attr_potential, state_fitness, state_form, clubs(name, short_name))
      `)
      .eq('national_team_id', nationalTeamId)

    if (error || !callups) return []
    return callups
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
   */
  async playMatch(fixtureId, nationalTeamId, managerId) {
    const { data: fixture } = await supabase
      .from('national_fixtures')
      .select('*')
      .eq('id', fixtureId)
      .single()

    if (!fixture) throw new Error('Partido no encontrado')

    // Generar resultado internacional
    const teamGoals = Math.floor(Math.random() * 4) + 1
    const oppGoals = Math.floor(Math.random() * 3)
    const won = teamGoals > oppGoals
    const drawn = teamGoals === oppGoals

    // 1. Guardar resultado del partido
    await supabase.from('national_fixtures').update({
      home_score: fixture.is_home ? teamGoals : oppGoals,
      away_score: fixture.is_home ? oppGoals : teamGoals,
      played: true
    }).eq('id', fixtureId)

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

    // 3. Dar XP y reputación internacional al DT
    const xpBonus = won ? 120 : drawn ? 50 : 20
    if (managerId) {
      await managerApi.addXp(managerId, xpBonus)
      const { data: mgr } = await supabase.from('managers').select('reputation').eq('id', managerId).single()
      if (mgr && won) {
        await supabase.from('managers').update({
          reputation: Math.min(100, (mgr.reputation || 50) + 3)
        }).eq('id', managerId)
      }
    }

    // 4. Actualizar caps (presencias internacionales) de los convocados
    const { data: callups } = await supabase.from('national_team_callups').select('id, caps').eq('national_team_id', nationalTeamId)
    if (callups) {
      for (const c of callups) {
        await supabase.from('national_team_callups').update({ caps: (c.caps || 0) + 1 }).eq('id', c.id)
      }
    }

    return { teamGoals, oppGoals, won, drawn, xpBonus }
  },

  /**
   * Siembra la lista de convocados inicial si está vacía
   */
  async seedInitialCallupsIfEmpty(nationalTeamId) {
    const { count } = await supabase
      .from('national_team_callups')
      .select('*', { count: 'exact', head: true })
      .eq('national_team_id', nationalTeamId)

    if (count && count > 0) return

    // Buscar jugadores de la BD para convocar
    const { data: pool } = await supabase
      .from('players')
      .select('id')
      .limit(18)

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
