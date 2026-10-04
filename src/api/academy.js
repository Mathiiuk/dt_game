import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { levelsApi } from './levels'

export const academyApi = {
  BALANCE: {
    intake_calendar_week: 35,
    intake_candidates_count_min: 4,
    intake_candidates_count_max: 8,
    base_youth_weekly_wage: 60,
    trial_duration_weeks: 4,
    upgrade_costs: {
      2: 15000,
      3: 45000,
      4: 90000,
      5: 180000
    }
  },

  /**
   * Obtener o inicializar la academia de cantera del club
   */
  async getAcademy(clubId) {
    if (!clubId) return null

    return queryCache.fetch(`academy:${clubId}`, async () => {
      const { data, error } = await supabase
        .from('club_academies')
        .select('*')
        .eq('club_id', clubId)
        .maybeSingle()

      if (error) throw new Error(error.message)

      if (!data) {
        // Inicializar academia en Nivel 1 (Potrero Barrial)
        const { data: created, error: createErr } = await supabase
          .from('club_academies')
          .insert({
            club_id: clubId,
            academy_level: 1,
            scouting_network_tier: 1,
            weekly_maintenance_cost: 100,
            last_intake_year: null
          })
          .select()
          .single()

        if (createErr) throw new Error(createErr.message)
        return created
      }

      return data
    }, 30000)
  },

  /**
   * Obtener aspirantes a prueba de la camada actual
   */
  async getYouthCandidates(clubId) {
    if (!clubId) return []

    return queryCache.fetch(`youth_candidates:${clubId}`, async () => {
      const { data, error } = await supabase
        .from('youth_candidates')
        .select('*')
        .eq('club_id', clubId)
        .eq('status', 'TRIAL')
        .order('potential_stars_perceived', { ascending: false })

      if (error) throw new Error(error.message)
      return data || []
    }, 15000)
  },

  /**
   * Generar la camada anual de juveniles (Youth Intake en Semana 35)
   */
  async generateYouthIntake(clubId, careerId, seasonYear = 1) {
    if (!clubId) return []

    const academy = await this.getAcademy(clubId)
    
    // Idempotencia: Verificar si ya se generó para este año
    if (academy && academy.last_intake_year === seasonYear) {
      return await this.getYouthCandidates(clubId)
    }

    const level = academy?.academy_level || 1
    const count = Math.floor(
      Math.random() * (this.BALANCE.intake_candidates_count_max - this.BALANCE.intake_candidates_count_min + 1)
    ) + this.BALANCE.intake_candidates_count_min

    const firstNames = ['Thiago', 'Mateo', 'Benjamín', 'Tomás', 'Santino', 'Joaquín', 'Bautista', 'Lautaro', 'Valentín', 'Ramiro', 'Nahuel', 'Facundo']
    const lastNames = ['García', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Gómez', 'Díaz', 'Álvarez', 'Romero', 'Sosa', 'Torres', 'Benítez']
    const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'ST', 'RW', 'LW']

    // Configuración según nivel de infraestructura (Regla 18.1)
    const levelStats = {
      1: { minOvr: 38, maxOvr: 44, basePot: 58, gemChance: 0.03 },
      2: { minOvr: 42, maxOvr: 47, basePot: 63, gemChance: 0.06 },
      3: { minOvr: 45, maxOvr: 50, basePot: 68, gemChance: 0.10 },
      4: { minOvr: 48, maxOvr: 54, basePot: 73, gemChance: 0.18 },
      5: { minOvr: 52, maxOvr: 58, basePot: 78, gemChance: 0.25 }
    }

    const statConfig = levelStats[level] || levelStats[1]
    const candidates = []
    let topPotential = 0

    for (let i = 0; i < count; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const pos = positions[Math.floor(Math.random() * positions.length)]
      const age = 15 + Math.floor(Math.random() * 3) // 15 a 17 años
      
      const ovr = Math.floor(Math.random() * (statConfig.maxOvr - statConfig.minOvr + 1)) + statConfig.minOvr
      
      // Tirada para Joya del Potrero
      const isGem = Math.random() < statConfig.gemChance
      const potential = isGem 
        ? Math.floor(81 + Math.random() * 14) // 81 a 94
        : Math.floor(statConfig.basePot + (Math.random() * 16) - 5) // normal

      if (potential > topPotential) topPotential = potential

      // Estrellas visuales percibidas (1.0 a 5.0) con margen de error de ±0.5 (Regla 18.3)
      const starsRaw = (potential / 20) + ((Math.random() * 0.6) - 0.3)
      const stars = Number(Math.max(1.0, Math.min(5.0, Math.round(starsRaw * 2) / 2)).toFixed(1))

      candidates.push({
        career_id: careerId || null,
        club_id: clubId,
        first_name: fName,
        last_name: lName,
        age,
        position: pos,
        overall_rating: ovr,
        potential_rating: potential,
        potential_stars_perceived: stars,
        attributes: {
          pace: ovr + Math.floor(Math.random() * 6) - 3,
          shooting: ovr + Math.floor(Math.random() * 6) - 3,
          passing: ovr + Math.floor(Math.random() * 6) - 3,
          defending: ovr + Math.floor(Math.random() * 6) - 3,
          stamina: 70
        },
        status: 'TRIAL'
      })
    }

    // Insertar candidatos en la base de datos
    const { data: inserted, error: insErr } = await supabase
      .from('youth_candidates')
      .insert(candidates)
      .select()

    if (insErr) throw new Error(insErr.message)

    // Actualizar año de última camada en la academia
    await supabase
      .from('club_academies')
      .update({ last_intake_year: seasonYear, updated_at: new Date().toISOString() })
      .eq('club_id', clubId)

    // Registrar en auditoría
    try {
      await supabase.from('youth_intake_audit_log').insert({
        career_id: careerId || null,
        club_id: clubId,
        season_year: seasonYear,
        candidates_generated_count: count,
        top_potential_rating: topPotential
      })
    } catch {
      // Ignorar si tabla no disponible
    }

    queryCache.invalidate(`academy:${clubId}`)
    queryCache.invalidate(`youth_candidates:${clubId}`)

    return inserted || []
  },

  /**
   * Promocionar un juvenil al primer equipo con contrato protegido
   */
  async promoteCandidate(clubId, candidateId, jerseyNumber = null, managerId = null) {
    if (!clubId || !candidateId) throw new Error('Parámetros de promoción incompletos.')

    // 1. Validar candidato en estado TRIAL
    const { data: candidate, error: candErr } = await supabase
      .from('youth_candidates')
      .select('*')
      .eq('id', candidateId)
      .eq('club_id', clubId)
      .single()

    if (candErr || !candidate) throw new Error('Aspirante no encontrado.')
    if (candidate.status !== 'TRIAL') {
      throw new Error('El aspirante ya fue gestionado anteriormente (idempotencia garantizada).')
    }

    // 2. Validar tamaño del primer plantel (< 30 futbolistas)
    const { count: squadCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)

    if ((squadCount || 0) >= 30) {
      throw new Error('ERR_MAX_SQUAD_SIZE_REACHED: El primer equipo tiene el cupo máximo de 30 futbolistas cubierto.')
    }

    // 3. Determinar dorsal
    let finalJersey = jerseyNumber
    if (!finalJersey) {
      const { data: squad } = await supabase.from('players').select('jersey_number').eq('club_id', clubId)
      const usedJerseys = new Set(squad?.map(p => p.jersey_number) || [])
      for (let j = 21; j <= 99; j++) {
        if (!usedJerseys.has(j)) {
          finalJersey = j
          break
        }
      }
    }

    // 4. Crear jugador en la tabla players
    const { data: newPlayer, error: playerErr } = await supabase
      .from('players')
      .insert({
        club_id: clubId,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        age: candidate.age,
        position: candidate.position,
        jersey_number: finalJersey,
        attr_pace: candidate.attributes?.pace || candidate.overall_rating,
        attr_potential: candidate.potential_rating,
        attr_overall: candidate.overall_rating,
        attr_shooting: candidate.attributes?.shooting || candidate.overall_rating,
        attr_passing: candidate.attributes?.passing || candidate.overall_rating,
        attr_defending: candidate.attributes?.defending || candidate.overall_rating,
        attr_stamina: 75,
        state_fitness: 100,
        morale: 85,
        personality: candidate.potential_rating > 80 ? 'Ambicioso' : 'Disciplinado',
        contract_salary: this.BALANCE.base_youth_weekly_wage,
        contract_role: 'PROSPECT',
        is_transfer_listed: false,
        transfer_status: 'NOT_FOR_SALE'
      })
      .select()
      .single()

    if (playerErr) throw new Error(playerErr.message)

    // 5. Crear contrato profesional juvenil protegido (3 temporadas a $60/sem)
    const now = new Date()
    const expiry = new Date()
    expiry.setFullYear(now.getFullYear() + 3)

    try {
      await supabase.from('contracts').insert({
        player_id: newPlayer.id,
        club_id: clubId,
        wage_weekly: this.BALANCE.base_youth_weekly_wage,
        contract_years_total: 3,
        squad_role: 'PROSPECT',
        release_clause: null, // Protegido sin cláusula
        expires_at: expiry.toISOString().split('T')[0],
        status: 'ACTIVE'
      })
    } catch {
      // Ignorar si tabla no disponible
    }

    // 6. Actualizar estado del candidato
    await supabase
      .from('youth_candidates')
      .update({ status: 'SIGNED_TO_FIRST_TEAM' })
      .eq('id', candidateId)

    // 7. Otorgar +100 XP al DT por promocionar un canterano (Fase 05)
    if (managerId) {
      try {
        await levelsApi.addXp(managerId, 100, 'PROMOTE_YOUTH_PLAYER')
      } catch {
        // Ignorar si falla otorgamiento de XP
      }
    }

    queryCache.invalidate(`squad:${clubId}`)
    queryCache.invalidate(`youth_candidates:${clubId}`)
    queryCache.invalidate(`club:${clubId}`)

    return {
      success: true,
      player: newPlayer,
      jerseyNumber: finalJersey
    }
  },

  /**
   * Descartar un aspirante no seleccionado
   */
  async releaseCandidate(candidateId) {
    if (!candidateId) return

    await supabase
      .from('youth_candidates')
      .update({ status: 'RELEASED' })
      .eq('id', candidateId)

    queryCache.invalidate('youth_candidates:')
    return true
  },

  /**
   * Mejorar nivel de infraestructura de cantera
   */
  async upgradeAcademy(clubId) {
    if (!clubId) throw new Error('Club no especificado.')

    const academy = await this.getAcademy(clubId)
    const currentLevel = academy?.academy_level || 1
    if (currentLevel >= 5) throw new Error('La cantera ya está en el nivel máximo (5 - Centro de Alto Rendimiento).')

    const nextLevel = currentLevel + 1
    const cost = this.BALANCE.upgrade_costs[nextLevel] || 50000

    // Validar presupuesto
    const { data: club } = await supabase.from('clubs').select('budget').eq('id', clubId).single()
    if (!club || (club.budget || 0) < cost) {
      throw new Error(`Presupuesto insuficiente: la mejora a Nivel ${nextLevel} cuesta $${cost.toLocaleString()} y dispones de $${Number(club?.budget || 0).toLocaleString()}.`)
    }

    // Descontar presupuesto
    const newBudget = (club.budget || 0) - cost
    await supabase.from('clubs').update({ budget: newBudget }).eq('id', clubId)

    // Actualizar nivel de cantera
    const { data: updated } = await supabase
      .from('club_academies')
      .update({
        academy_level: nextLevel,
        scouting_network_tier: nextLevel,
        weekly_maintenance_cost: 100 * nextLevel,
        updated_at: new Date().toISOString()
      })
      .eq('club_id', clubId)
      .select()
      .single()

    queryCache.invalidate(`academy:${clubId}`)
    queryCache.invalidate(`club:${clubId}`)
    queryCache.invalidate(`finances:${clubId}`)

    return {
      academy: updated,
      newBudget
    }
  }
}
