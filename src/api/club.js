import { supabase } from './supabase'
import { playerApi } from './player'
import { auditApi } from './audit'

export const TIER_5_STARTING_CONFIG = {
  initialCashBalance: 25000,
  initialWeeklyWageCap: 3500,
  initialTransferBudget: 5000,
  stadiumCapacity: 1500,
  pitchCondition: 60,
  initialClubReputation: 15,
  ticketPrice: 10,
  divisionTier: 5
}

export const clubApi = {
  /**
   * Fundación autoritativa de club según el contrato de Fase 03
   */
  async createClub(managerId, clubData) {
    if (!managerId) {
      throw new Error('No se encontró un Director Técnico activo para vincular el club.')
    }

    // 1. Verificar si el DT ya tiene un club
    const { data: existingClub } = await supabase
      .from('clubs')
      .select('id, name')
      .eq('manager_id', managerId)
      .maybeSingle()

    if (existingClub) {
      throw new Error(`El Director Técnico ya lidera la institución ${existingClub.name}.`)
    }

    const { identity = {}, stadium = {}, colors = {}, badgeId = 'SHIELD' } = clubData

    const cleanName = (identity.name || '').trim()
    if (cleanName.length < 3 || cleanName.length > 40) {
      throw new Error('El nombre del club debe tener entre 3 y 40 caracteres.')
    }

    const cleanShortName = (identity.shortName || cleanName.substring(0, 3)).trim().toUpperCase()
    const cleanCity = (identity.city || 'Buenos Aires').trim()
    const cleanStadiumName = (stadium.name || `Estadio ${cleanName}`).trim()

    // 2. Parámetros económicos e infraestructura autoritativos de Tier 5
    const budget = TIER_5_STARTING_CONFIG.initialCashBalance
    const wageBudget = TIER_5_STARTING_CONFIG.initialWeeklyWageCap
    const reputation = TIER_5_STARTING_CONFIG.initialClubReputation
    const stadiumCapacity = TIER_5_STARTING_CONFIG.stadiumCapacity
    const pitchCondition = TIER_5_STARTING_CONFIG.pitchCondition
    const leagueTier = TIER_5_STARTING_CONFIG.divisionTier

    const primaryColor = colors.primary || '#047857'
    const secondaryColor = colors.secondary || '#FFFFFF'
    const colorDisplay = `${primaryColor} y ${secondaryColor}`

    // 3. Inserción atómica en clubs
    const { data: club, error } = await supabase
      .from('clubs')
      .insert([
        {
          manager_id: managerId,
          name: cleanName,
          short_name: cleanShortName,
          city: cleanCity,
          country: identity.country || 'Argentina',
          founded_year: identity.foundedYear || 2026,
          colors: colorDisplay,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          badge_id: badgeId,
          nickname: identity.nickname || 'El Expreso del Barrio',
          history_type: 'potrero',
          budget,
          wage_budget: wageBudget,
          reputation,
          stadium_name: cleanStadiumName,
          stadium_capacity: stadiumCapacity,
          pitch_condition: pitchCondition,
          league_tier: leagueTier,
          ticket_price: TIER_5_STARTING_CONFIG.ticketPrice,
          is_user_club: true,
          game_date: '2026-07-01'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creando club en base de datos:', error)
      throw new Error(error.message)
    }

    // 4. Actualizar manager vinculando el club
    try {
      await supabase
        .from('managers')
        .update({ club_id: club.id, employment_status: 'EMPLOYED' })
        .eq('id', managerId)
    } catch (e) {
      console.warn('No se pudo vincular club_id en manager:', e)
    }

    // 5. Registrar auditoría de fundación
    try {
      await auditApi.logAction({
        whoId: managerId,
        action: 'CLUB_FOUNDED',
        entityType: 'club',
        entityId: club.id,
        stateAfter: {
          clubId: club.id,
          name: club.name,
          budget,
          wageBudget,
          tier: leagueTier,
          stadiumCapacity
        }
      })
    } catch (e) {
      console.warn('Auditoría de fundación de club no registrada:', e)
    }

    // 5b. Hito de fundación: se crea una sola vez, acá (leer la historia ya no lo crea)
    try {
      const { clubHistoryApi, foundationMilestone } = await import('./clubHistory')
      const { club_id: _ignored, ...milestone } = foundationMilestone(club.id, club)
      await clubHistoryApi.addMilestone(club.id, milestone)
    } catch (e) {
      console.warn('No se pudo registrar el hito de fundación:', e)
    }

    // 6. Generar el primer plantel automáticamente (Fase 04)
    try {
      await playerApi.generateInitialSquad(club.id, club.reputation)
    } catch (e) {
      console.warn('Error generando primer plantel:', e)
    }

    // 7. Inicializar el calendario y rivales de liga (Fase 12)
    try {
      const { competitionApi } = await import('./competition')
      await competitionApi.initializeLeague(club.id, club.country)
    } catch (e) {
      console.warn('Error inicializando liga:', e)
    }

    return club
  },

  async getClubByManager(managerId) {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('manager_id', managerId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data || null
  },

  async updateClub(clubId, updates) {
    const { data, error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', clubId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}
