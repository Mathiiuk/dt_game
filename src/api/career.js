import { pickVacancies } from '../domain/vacancies'
import { negotiateJob } from '../domain/jobNegotiation'
import { supabase } from './supabase'
import { auditApi } from './audit'
import { playerApi } from './player'
import { queryCache } from '../utils/cache'
import { seasonYearOf, firstLeagueMatchDate } from '../domain/gameWeek'

/** En pretemporada todavía no se jugó ningún partido de liga: un club puede sumarse a la liga del año */
const isPreseason = (date) => Boolean(date) && date <= firstLeagueMatchDate(seasonYearOf(date))

export const CAREER_PROGRESSION_RULES = {
  reputation_required_tier_5: 10,
  reputation_required_tier_4: 30,
  reputation_required_tier_3: 50,
  reputation_required_tier_2: 70,
  reputation_required_tier_1: 85,
  job_offer_expiry_weeks: 2,
  resignation_reputation_penalty: -5
}

export const TIER_BASE_SALARIES = {
  1: { min: 10000, max: 25000, name: 'Primera División' },
  2: { min: 4500, max: 8000, name: 'Primera B Nacional' },
  3: { min: 2000, max: 4000, name: 'Primera B Metropolitana' },
  4: { min: 1000, max: 1800, name: 'Primera C' },
  5: { min: 400, max: 800, name: 'Torneo Regional Amateur' }
}

const initInFlight = new Map()

async function createFirstStint(managerId, clubId) {
  try {
    const { data: currentClub } = await supabase.from('clubs').select('id, name').eq('id', clubId).maybeSingle()
    if (!currentClub) return null
    const { data: initialStint } = await supabase
      .from('manager_career_stints')
      .insert({
        manager_id: managerId,
        club_id: currentClub.id,
        club_name: currentClub.name,
        started_at: new Date().toISOString(),
        matches_managed: 0,
        matches_won: 0,
        matches_drawn: 0,
        matches_lost: 0,
        trophies_won: []
      })
      .select()
      .single()
    return initialStint || null
  } catch (stintInitErr) {
    console.warn('Aviso: no se pudo auto-inicializar stint de carrera:', stintInitErr)
    return null
  }
}

export const careerApi = {
  /**
   * Obtiene el perfil curricular completo del DT:
   * Estadísticas acumuladas, stints de trayectoria, finanzas personales y palmarés.
   */
  async getCareerStats(managerId, clubId) {
    if (!managerId) return null

    // 1. Obtener datos del DT (ahorros, sueldo, status laboral)
    const { data: managerData } = await supabase
      .from('managers')
      .select('id, reputation, level, personal_savings, current_contract_wage, employment_status, is_retired')
      .eq('id', managerId)
      .maybeSingle()

    // 2. Obtener historial de stints de carrera (ciclos en cada club)
    let { data: stints } = await supabase
      .from('manager_career_stints')
      .select('*')
      .eq('manager_id', managerId)
      .order('started_at', { ascending: false })

    // Auto-inicialización: si no tiene stints y está en un club, registrar su primer ciclo
    if ((!stints || stints.length === 0) && clubId) {
      // Varias pantallas piden la trayectoria a la vez: comparten un único alta del primer ciclo
      const key = `${managerId}:${clubId}`
      if (!initInFlight.has(key)) initInFlight.set(key, createFirstStint(managerId, clubId).finally(() => initInFlight.delete(key)))
      const initial = await initInFlight.get(key)
      if (initial) stints = [initial]
    }

    // 3. Totales acumulados
    let totalMatches = 0
    let totalWon = 0
    let totalDrawn = 0
    let totalLost = 0

    if (stints && stints.length > 0) {
      for (const s of stints) {
        totalMatches += s.matches_managed || 0
        totalWon += s.matches_won || 0
        totalDrawn += s.matches_drawn || 0
        totalLost += s.matches_lost || 0
      }
    }

    const winRate = totalMatches > 0 ? Math.round((totalWon / totalMatches) * 100) : 0

    // 4. Vitrina de trofeos y logros
    const { data: trophies } = await supabase
      .from('manager_achievements')
      .select('*')
      .eq('manager_id', managerId)
      .order('year', { ascending: false })

    // 5. Historial de temporadas
    const { data: seasons } = await supabase
      .from('season_history')
      .select('*')
      .eq('manager_id', managerId)

    return {
      totalMatches,
      totalWon,
      totalDrawn,
      totalLost,
      winRate,
      stints: stints || [],
      trophies: trophies || [],
      seasons: seasons || [],
      personalSavings: Number(managerData?.personal_savings || 0),
      currentContractWage: Number(managerData?.current_contract_wage || 500),
      employmentStatus: managerData?.employment_status || 'EMPLOYED',
      isRetired: Boolean(managerData?.is_retired)
    }
  },

  /**
   * Registra un resultado de partido en el stint activo del DT
   */
  async recordMatchInStint(managerId, clubId, isWin, isDraw, isLoss) {
    if (!managerId || !clubId) return

    try {
      const { data: activeStint } = await supabase
        .from('manager_career_stints')
        .select('*')
        .eq('manager_id', managerId)
        .eq('club_id', clubId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (activeStint) {
        await supabase
          .from('manager_career_stints')
          .update({
            matches_managed: (activeStint.matches_managed || 0) + 1,
            matches_won: (activeStint.matches_won || 0) + (isWin ? 1 : 0),
            matches_drawn: (activeStint.matches_drawn || 0) + (isDraw ? 1 : 0),
            matches_lost: (activeStint.matches_lost || 0) + (isLoss ? 1 : 0)
          })
          .eq('id', activeStint.id)
      } else {
        // Crear stint activo si no existía
        const { data: club } = await supabase.from('clubs').select('name').eq('id', clubId).maybeSingle()
        await supabase
          .from('manager_career_stints')
          .insert({
            manager_id: managerId,
            club_id: clubId,
            club_name: club?.name || 'Club de Fútbol',
            matches_managed: 1,
            matches_won: isWin ? 1 : 0,
            matches_drawn: isDraw ? 1 : 0,
            matches_lost: isLoss ? 1 : 0,
            trophies_won: []
          })
      }
    } catch (e) {
      console.warn('Error al registrar resultado en stint de DT:', e)
    }
  },

  /**
   * Registra la conquista de un título en el stint activo del DT
   */
  async recordTrophyInStint(managerId, clubId, trophyTitle) {
    if (!managerId || !clubId || !trophyTitle) return

    try {
      const { data: activeStint } = await supabase
        .from('manager_career_stints')
        .select('id, trophies_won')
        .eq('manager_id', managerId)
        .eq('club_id', clubId)
        .is('ended_at', null)
        .limit(1)
        .maybeSingle()

      if (activeStint) {
        const list = Array.isArray(activeStint.trophies_won) ? [...activeStint.trophies_won] : []
        list.push({ title: trophyTitle, date: new Date().toISOString() })
        await supabase
          .from('manager_career_stints')
          .update({ trophies_won: list })
          .eq('id', activeStint.id)
      }
    } catch (e) {
      console.warn('Error al registrar trofeo en stint:', e)
    }
  },

  /**
   * Obtiene ofertas laborales vigentes para el DT (filtrando y expirando las caducas)
   */
  async getAvailableJobOffers(managerId, currentClubId, managerReputation = 10, currentWeek = 1) {
    if (!managerId) return []

    // 1. Marcar como expiradas las ofertas que superaron la semana límite (Regla 31.2)
    try {
      await supabase
        .from('manager_job_offers')
        .update({ status: 'EXPIRED' })
        .eq('manager_id', managerId)
        .eq('status', 'PENDING')
        .lt('expires_at_week', currentWeek)
    } catch (expErr) {
      console.warn('Aviso al expirar ofertas:', expErr)
    }

    // 2. Consultar ofertas en estado PENDING
    const { data: dbOffers, error } = await supabase
      .from('manager_job_offers')
      .select('*')
      .eq('manager_id', managerId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Error consultando manager_job_offers:', error)
    }

    if (dbOffers && dbOffers.length > 0) {
      return dbOffers.map(o => ({
        id: o.id,
        clubId: o.offering_club_id,
        clubName: o.offering_club_name,
        tier: o.offering_club_tier,
        tierName: TIER_BASE_SALARIES[o.offering_club_tier]?.name || `División Tier ${o.offering_club_tier}`,
        budget: Number(o.transfer_budget_promised || 0),
        offeredSalary: Number(o.wage_offered || 0),
        objective: o.season_objective_expected,
        contractDurationYears: o.contract_years || 1,
        expiresAtWeek: o.expires_at_week,
        negotiationRounds: o.negotiation_rounds || 0,
        weeksRemaining: Math.max(0, (o.expires_at_week || currentWeek) - currentWeek + 1)
      }))
    }

    // 3. Si no hay ofertas pendientes en DB, generar procedimentalmente 1 o 2 ofertas iniciales acordes a la reputación
    return await this.generateProceduralJobOffers(managerId, currentClubId, managerReputation, currentWeek)
  },

  /**
   * Fecha de la carrera del DT: la más avanzada entre los clubes que dirigió (y `clubId`). Cada club guarda su propia fecha
   * de juego y un club de la IA conserva la vieja, así que al cambiar de club la fecha sale de acá. Devuelve también el club
   * de esa fecha (sirve de referencia para armar el mundo de la temporada).
   */
  async _careerContext(managerId, clubId = null) {
    const { data: stints } = await supabase.from('manager_career_stints').select('club_id').eq('manager_id', managerId)
    const ids = [...new Set([clubId, ...(stints || []).map(s => s.club_id)].filter(Boolean))]
    if (ids.length === 0) return { careerDate: null, refClub: null }
    const { data: clubs, error } = await supabase.from('clubs').select('id, game_date, league_tier, country').in('id', ids)
    if (error) throw new Error(error.message)
    const refClub = (clubs || []).filter(c => c.game_date).sort((a, b) => String(b.game_date).localeCompare(String(a.game_date)))[0] || null
    return { careerDate: refClub ? String(refClub.game_date).slice(0, 10) : null, refClub }
  },

  /**
   * Clubes que pueden ofrecerle trabajo al DT: solo los que tienen liga en curso en la fecha de su carrera. Antes se arma
   * el mundo de la temporada (las divisiones que faltan), así hay candidatos de todas las categorías. Sin fecha conocida no filtra.
   */
  async _offerableClubs(managerId, currentClubId, clubs = []) {
    if (!managerId || clubs.length === 0) return clubs
    const { careerDate, refClub } = await this._careerContext(managerId, currentClubId)
    if (!careerDate) return clubs
    const { competitionApi } = await import('./competition')
    await competitionApi.ensureWorldLeagues({ clubId: refClub.id, userTier: refClub.league_tier || 5, gameDate: careerDate, country: refClub.country || 'Argentina' })
      .catch(e => console.warn('No se pudo armar el mundo de la temporada:', e))
    const live = await competitionApi.liveClubIds(clubs.map(c => c.id), careerDate)
    return clubs.filter(c => live.has(c.id))
  },

  /**
   * Lleva un club al tiempo de la carrera del DT: le pone la fecha de la carrera y, si su liga ya terminó, lo suma a la liga
   * de su categoría de la temporada (solo en pretemporada). A mitad de temporada un club sin liga en curso no puede recibirlo:
   * tira ERR_JOB_OFFER_STALE. No hace nada si el club ya está al día. Devuelve true si cambió algo.
   */
  async syncClubToCareer(managerId, clubId) {
    const { careerDate } = await this._careerContext(managerId, clubId)
    const { data: club, error } = await supabase.from('clubs').select('id, game_date, league_tier, country').eq('id', clubId).maybeSingle()
    if (error || !club) throw new Error(error?.message || 'ERR_CLUB_NOT_FOUND: El club no existe.')
    if (!careerDate || String(club.game_date || '').slice(0, 10) >= careerDate) return false

    const { competitionApi } = await import('./competition')
    const live = (await competitionApi.liveClubIds([clubId], careerDate)).has(clubId)
    if (!live && !isPreseason(careerDate)) {
      throw new Error('ERR_JOB_OFFER_STALE: La temporada de ese club ya terminó. Buscá otra oferta.')
    }
    const { error: dateErr } = await supabase.from('clubs').update({ game_date: careerDate }).eq('id', clubId)
    if (dateErr) throw new Error(dateErr.message)
    if (!live) {
      await competitionApi.joinSeasonLeague({ clubId, tier: club.league_tier || 5, gameDate: careerDate, country: club.country || 'Argentina' })
    }
    queryCache.invalidate('club:')
    queryCache.invalidate(`standings:${clubId}`)
    return true
  },

  /**
   * Generación procedural y autoritativa de ofertas de trabajo
   */
  async generateProceduralJobOffers(managerId, currentClubId, managerReputation = 10, currentWeek = 1, careerId = null) {
    if (!managerId) return []

    // Determinar tiers accesibles según reputación
    let targetTiers = [5]
    if (managerReputation >= CAREER_PROGRESSION_RULES.reputation_required_tier_1) {
      targetTiers = [1, 2]
    } else if (managerReputation >= CAREER_PROGRESSION_RULES.reputation_required_tier_2) {
      targetTiers = [2, 3]
    } else if (managerReputation >= CAREER_PROGRESSION_RULES.reputation_required_tier_3) {
      targetTiers = [3, 4]
    } else if (managerReputation >= CAREER_PROGRESSION_RULES.reputation_required_tier_4) {
      targetTiers = [4, 5]
    }

    // Buscar clubes rivales en esos tiers
    let query = supabase
      .from('clubs')
      .select('id, name, city, country, budget, reputation, league_tier')
      .in('league_tier', targetTiers)

    if (currentClubId) {
      query = query.neq('id', currentClubId)
    }

    const { data: allCandidates, error } = await query.limit(40)
    if (error || !allCandidates || allCandidates.length === 0) return []
    // Solo clubes con liga en curso: uno que quedó en una temporada terminada llevaría al DT a jugar un año que ya pasó
    const candidateClubs = await this._offerableClubs(managerId, currentClubId, allCandidates)
    if (candidateClubs.length === 0) return []

    // Barajar y tomar hasta 2 clubes
    const shuffled = [...candidateClubs].sort(() => 0.5 - Math.random()).slice(0, 2)
    const createdOffers = []

    const objectivesByTier = {
      1: ['TOP_HALF', 'MID_TABLE', 'AVOID_RELEGATION'],
      2: ['PROMOTION', 'TOP_HALF', 'MID_TABLE'],
      3: ['PROMOTION', 'TOP_HALF'],
      4: ['PROMOTION', 'CHAMPION'],
      5: ['CHAMPION', 'PROMOTION']
    }

    for (const club of shuffled) {
      const tier = club.league_tier || 5
      const salaryCfg = TIER_BASE_SALARIES[tier] || TIER_BASE_SALARIES[5]
      const salaryBonus = Math.floor(Math.random() * (salaryCfg.max - salaryCfg.min))
      const wageOffered = salaryCfg.min + salaryBonus
      const promisedBudget = Math.floor(Number(club.budget || 20000) * 0.4)
      const possibleObjectives = objectivesByTier[tier] || ['MID_TABLE']
      const objective = possibleObjectives[Math.floor(Math.random() * possibleObjectives.length)]
      const contractYears = Math.floor(Math.random() * 2) + 1 // 1 o 2 años
      const expiryWeek = currentWeek + CAREER_PROGRESSION_RULES.job_offer_expiry_weeks

      try {
        const { data: inserted, error: insertErr } = await supabase
          .from('manager_job_offers')
          .insert({
            career_id: careerId,
            manager_id: managerId,
            offering_club_id: club.id,
            offering_club_name: club.name,
            offering_club_tier: tier,
            wage_offered: wageOffered,
            transfer_budget_promised: promisedBudget,
            season_objective_expected: objective,
            contract_years: contractYears,
            status: 'PENDING',
            expires_at_week: expiryWeek
          })
          .select()
          .single()

        if (!insertErr && inserted) {
          createdOffers.push({
            id: inserted.id,
            clubId: club.id,
            clubName: club.name,
            tier,
            tierName: salaryCfg.name,
            budget: promisedBudget,
            offeredSalary: wageOffered,
            objective,
            contractDurationYears: contractYears,
            expiresAtWeek: expiryWeek,
            weeksRemaining: 2
          })

          // Auditoría
          await auditApi.logAction({
            whoId: managerId,
            action: 'JOB_OFFER_RECEIVED',
            entityType: 'manager_job_offers',
            entityId: inserted.id,
            stateAfter: { clubId: club.id, clubName: club.name, wageOffered, tier }
          })
        }
      } catch (insErr) {
        console.warn('Aviso guardando oferta procedural:', insErr)
      }
    }

    return createdOffers
  },

  /**
   * Aceptación atómica de oferta laboral (Firma de Contrato y Cambio de Club)
   */
  async acceptJobOffer(managerId, offerId, oldClubId) {
    if (!managerId) throw new Error('ID de DT no especificado')

    // 1. Obtener la oferta
    let offer = null
    if (offerId) {
      const { data, error } = await supabase
        .from('manager_job_offers')
        .select('*')
        .eq('id', offerId)
        .maybeSingle()

      if (!error && data) offer = data
    }

    // Si no vino por ID formal (ej. desde club directo), armar estructura
    let newClubId = offer?.offering_club_id
    let newWage = offer?.wage_offered || 800

    if (!newClubId && typeof offerId === 'string' && offerId.length > 10) {
      newClubId = offerId
    }

    if (!newClubId) throw new Error('ERR_JOB_OFFER_INVALID: Oferta de trabajo no válida.')

    // 2. Obtener datos del nuevo club
    const { data: newClub, error: newClubErr } = await supabase
      .from('clubs')
      .select('id, name, league_tier')
      .eq('id', newClubId)
      .single()

    if (newClubErr || !newClub) {
      throw new Error('ERR_CLUB_NOT_FOUND: El club ofertante no existe o ha sido disuelto.')
    }

    // 2a. El club nuevo pasa a la fecha de la carrera (los de la IA guardan una vieja) y, si su liga ya terminó, se suma a la
    // de la temporada. Una oferta de un club sin temporada en curso ya no vale: se da por vencida
    try {
      await this.syncClubToCareer(managerId, newClubId)
    } catch (e) {
      if (String(e?.message || '').startsWith('ERR_JOB_OFFER_STALE') && offer?.id) {
        await supabase.from('manager_job_offers').update({ status: 'EXPIRED' }).eq('id', offer.id)
      }
      throw e
    }

    // 2b. Los clubes de la IA no tienen jugadores (juegan con su fuerza): se genera el plantel antes de vincular al DT,
    // así el club nunca aparece dirigido y vacío. Idempotente: si el club ya tiene jugadores no se toca
    await playerApi.generateInitialSquad(newClubId)

    // 3. Si estaba dirigiendo un club previo: cerrar ciclo en manager_career_stints
    if (oldClubId && oldClubId !== newClubId) {
      await supabase
        .from('manager_career_stints')
        .update({
          ended_at: new Date().toISOString(),
          departure_reason: 'MOVED_TO_ANOTHER_CLUB'
        })
        .eq('manager_id', managerId)
        .eq('club_id', oldClubId)
        .is('ended_at', null)

      // Desvincular DT del club antiguo
      await supabase
        .from('clubs')
        .update({ manager_id: null })
        .eq('id', oldClubId)
    }

    // 4. Vincular al DT al nuevo club
    await supabase
      .from('clubs')
      .update({ manager_id: managerId })
      .eq('id', newClubId)

    // 5. Iniciar nuevo stint en manager_career_stints
    await supabase
      .from('manager_career_stints')
      .insert({
        manager_id: managerId,
        club_id: newClubId,
        club_name: newClub.name,
        started_at: new Date().toISOString(),
        matches_managed: 0,
        matches_won: 0,
        matches_drawn: 0,
        matches_lost: 0,
        trophies_won: []
      })

    // 6. Actualizar contrato y estado en managers
    await supabase
      .from('managers')
      .update({
        employment_status: 'EMPLOYED',
        current_contract_wage: newWage,
        is_retired: false
      })
      .eq('id', managerId)

    // 7. Si existía la oferta en manager_job_offers, marcarla ACCEPTED y rechazar las demás
    if (offer?.id) {
      await supabase
        .from('manager_job_offers')
        .update({ status: 'ACCEPTED' })
        .eq('id', offer.id)

      await supabase
        .from('manager_job_offers')
        .update({ status: 'REJECTED' })
        .eq('manager_id', managerId)
        .eq('status', 'PENDING')
    }

    // 8. Registrar auditoría autoritativa
    await auditApi.logAction({
      whoId: managerId,
      action: 'MANAGER_SIGNED_WITH_NEW_CLUB',
      entityType: 'manager',
      entityId: managerId,
      stateBefore: { oldClubId },
      stateAfter: { newClubId, newClubName: newClub.name, newWage }
    })

    // Invalidar cachés
    queryCache.invalidate('club:')
    queryCache.invalidate('manager:')
    queryCache.invalidate('dashboard:')

    return { success: true, newClubId, clubName: newClub.name }
  },

  /**
   * Rechazar una oferta formal de trabajo
   */
  /**
   * Negocia el sueldo de una oferta de trabajo (domain/jobNegotiation.js): el club acepta, contraoferta, cierra o retira la oferta.
   * Cuenta las rondas en la propia oferta, así reabrir la pantalla no permite negociar de nuevo.
   */
  async negotiateJobOffer(managerId, offerId, askWage, reputation) {
    const { data: offer } = await supabase.from('manager_job_offers').select('*').eq('id', offerId).maybeSingle()
    if (!offer || offer.manager_id !== managerId || offer.status !== 'PENDING') {
      throw new Error('ERR_JOB_OFFER_INVALID: La oferta de trabajo ya no está disponible.')
    }
    const tier = offer.offering_club_tier || 5
    const required = CAREER_PROGRESSION_RULES[`reputation_required_tier_${tier}`] ?? 10
    const round = (offer.negotiation_rounds || 0) + 1
    const result = negotiateJob({ offered: Number(offer.wage_offered), ask: Number(askWage), reputation: Number(reputation || 0), requiredReputation: required, round })

    if (result.status === 'ACCEPTED' || result.status === 'COUNTER' || result.status === 'FINAL') {
      await supabase.from('manager_job_offers').update({ wage_offered: result.wage, negotiation_rounds: round }).eq('id', offerId)
    } else if (result.status === 'WITHDRAWN') {
      await supabase.from('manager_job_offers').update({ status: 'EXPIRED', negotiation_rounds: round }).eq('id', offerId)
    }
    return result
  },

  async rejectJobOffer(managerId, offerId) {
    if (!offerId) return

    await supabase
      .from('manager_job_offers')
      .update({ status: 'REJECTED' })
      .eq('id', offerId)

    await auditApi.logAction({
      whoId: managerId,
      action: 'JOB_OFFER_REJECTED',
      entityType: 'manager_job_offers',
      entityId: offerId
    })

    return true
  },

  /**
   * Postulación voluntaria a un banquillo vacante (Job Application)
   */
  async applyForJob(managerId, targetClubId, managerReputation = 10, currentWeek = 1) {
    if (!managerId || !targetClubId) throw new Error('Datos de postulación incompletos.')

    const { data: targetClub, error: clubErr } = await supabase
      .from('clubs')
      .select('id, name, league_tier, budget, reputation')
      .eq('id', targetClubId)
      .single()

    if (clubErr || !targetClub) throw new Error('El club seleccionado no existe.')

    const tier = targetClub.league_tier || 5
    const reqReputation = 
      tier === 1 ? CAREER_PROGRESSION_RULES.reputation_required_tier_1 :
      tier === 2 ? CAREER_PROGRESSION_RULES.reputation_required_tier_2 :
      tier === 3 ? CAREER_PROGRESSION_RULES.reputation_required_tier_3 :
      tier === 4 ? CAREER_PROGRESSION_RULES.reputation_required_tier_4 :
      CAREER_PROGRESSION_RULES.reputation_required_tier_5

    if (managerReputation < reqReputation) {
      return {
        accepted: false,
        message: `La directiva de ${targetClub.name} ha desestimado tu postulación. Para competir en ${TIER_BASE_SALARIES[tier]?.name || 'esta categoría'} exigen un DT con al menos ${reqReputation} puntos de reputación (tienes ${managerReputation}).`
      }
    }

    // Si cumple los requisitos, la directiva genera una oferta formal inmediata
    const salaryCfg = TIER_BASE_SALARIES[tier] || TIER_BASE_SALARIES[5]
    const wageOffered = salaryCfg.min + Math.floor(Math.random() * (salaryCfg.max - salaryCfg.min))
    const promisedBudget = Math.floor(Number(targetClub.budget || 30000) * 0.35)

    const { data: newOffer, error: offerErr } = await supabase
      .from('manager_job_offers')
      .insert({
        manager_id: managerId,
        offering_club_id: targetClub.id,
        offering_club_name: targetClub.name,
        offering_club_tier: tier,
        wage_offered: wageOffered,
        transfer_budget_promised: promisedBudget,
        season_objective_expected: 'MID_TABLE',
        contract_years: 1,
        status: 'PENDING',
        expires_at_week: currentWeek + CAREER_PROGRESSION_RULES.job_offer_expiry_weeks
      })
      .select()
      .single()

    if (offerErr) throw new Error('Error al formalizar la propuesta laboral.')

    return {
      accepted: true,
      offer: newOffer,
      message: `¡La directiva de ${targetClub.name} ha visto con agrado tu trayectoria y te ha presentado una propuesta de contratación formal!`
    }
  },

  /**
   * Consulta las vacantes disponibles en la pirámide de ligas para postulación
   */
  async getAvailableVacancies(currentClubId, managerReputation = 10, managerId = null) {
    let query = supabase
      .from('clubs')
      .select('id, name, city, country, budget, reputation, league_tier')
      .order('league_tier', { ascending: true })

    if (currentClubId) {
      query = query.neq('id', currentClubId)
    }

    const { data: allClubs, error } = await query.limit(80)
    if (error || !allClubs) return []
    // Solo clubes con liga en curso en la fecha de la carrera
    const clubs = await this._offerableClubs(managerId, currentClubId, allClubs)

    const all = clubs.map(c => {
      const tier = c.league_tier || 5
      const reqRep = 
        tier === 1 ? CAREER_PROGRESSION_RULES.reputation_required_tier_1 :
        tier === 2 ? CAREER_PROGRESSION_RULES.reputation_required_tier_2 :
        tier === 3 ? CAREER_PROGRESSION_RULES.reputation_required_tier_3 :
        tier === 4 ? CAREER_PROGRESSION_RULES.reputation_required_tier_4 :
        CAREER_PROGRESSION_RULES.reputation_required_tier_5

      let chance = 'CASI IMPOSIBLE'
      if (managerReputation >= reqRep + 10) chance = 'MUY ALTA'
      else if (managerReputation >= reqRep) chance = 'CANDIDATO FIRME'
      else if (managerReputation >= reqRep - 10) chance = 'POCAS OPCIONES'

      return {
        id: c.id,
        name: c.name,
        city: c.city,
        tier,
        tierName: TIER_BASE_SALARIES[tier]?.name || `Tier ${tier}`,
        requiredReputation: reqRep,
        chance,
        budget: Number(c.budget || 0)
      }
    })
    return pickVacancies(all)
  },

  /**
   * Renuncia Voluntaria del DT (Regla 31.4)
   * Desvinculación unilateral sin indemnización, pasa a UNEMPLOYED y sufre penalización de -5 reputación.
   */
  async resignFromClub(managerId, currentClubId) {
    if (!managerId) throw new Error('ID de DT no especificado')

    // 1. Cerrar stint actual con motivo RESIGNED
    if (currentClubId) {
      await supabase
        .from('manager_career_stints')
        .update({
          ended_at: new Date().toISOString(),
          departure_reason: 'RESIGNED'
        })
        .eq('manager_id', managerId)
        .eq('club_id', currentClubId)
        .is('ended_at', null)

      // Liberar al club
      await supabase
        .from('clubs')
        .update({ manager_id: null })
        .eq('id', currentClubId)
    }

    // 2. Penalización de reputación (-5 puntos)
    const { data: mgr } = await supabase
      .from('managers')
      .select('reputation')
      .eq('id', managerId)
      .single()

    const currentRep = mgr?.reputation || 10
    const newRep = Math.max(5, currentRep + CAREER_PROGRESSION_RULES.resignation_reputation_penalty)

    // 3. Actualizar estado del DT a UNEMPLOYED
    await supabase
      .from('managers')
      .update({
        employment_status: 'UNEMPLOYED',
        current_contract_wage: 0,
        reputation: newRep
      })
      .eq('id', managerId)

    // 4. Auditoría
    await auditApi.logAction({
      whoId: managerId,
      action: 'MANAGER_RESIGNED',
      entityType: 'manager',
      entityId: managerId,
      stateBefore: { clubId: currentClubId, reputation: currentRep },
      stateAfter: { employment_status: 'UNEMPLOYED', reputation: newRep }
    })

    // Limpiar cachés
    queryCache.invalidate('club:')
    queryCache.invalidate('manager:')
    queryCache.invalidate('dashboard:')

    return {
      success: true,
      newReputation: newRep,
      penalty: CAREER_PROGRESSION_RULES.resignation_reputation_penalty
    }
  },

  /**
   * Avance semanal del motor de carrera:
   * - Depósito de salario pactado en cuenta de ahorros personales (Regla 31.3)
   * - Expiración de ofertas no respondidas tras 2 semanas (Regla 31.2)
   */
  async processWeeklyManagerProgression(managerId, currentWeek, currentClubId = null, careerId = null) {
    if (!managerId) return

    try {
      // 1. Obtener salario y ahorros
      const { data: mgr } = await supabase
        .from('managers')
        .select('personal_savings, current_contract_wage, employment_status, reputation')
        .eq('id', managerId)
        .maybeSingle()

      if (mgr && mgr.employment_status !== 'UNEMPLOYED' && Number(mgr.current_contract_wage) > 0) {
        const weeklyWage = Number(mgr.current_contract_wage)
        const updatedSavings = Number(mgr.personal_savings || 0) + weeklyWage

        await supabase
          .from('managers')
          .update({ personal_savings: updatedSavings })
          .eq('id', managerId)
      }

      // 2. Expirar ofertas pasadas de fecha (Regla 31.2)
      await supabase
        .from('manager_job_offers')
        .update({ status: 'EXPIRED' })
        .eq('manager_id', managerId)
        .eq('status', 'PENDING')
        .lt('expires_at_week', currentWeek)

      // 3. Ocasional nueva oferta si el DT tiene reputación destacada (15% de probabilidad semanal)
      const rep = mgr?.reputation || 10
      if (Math.random() < 0.15 && rep >= 25) {
        await this.generateProceduralJobOffers(managerId, currentClubId, rep, currentWeek, careerId)
      }
    } catch (e) {
      console.warn('Aviso en avance semanal de carrera del DT:', e)
    }
  },

  /**
   * Cálculo de estrellas de reputación (1 a 5)
   */
  calculateReputationStars(reputationScore = 0) {
    if (reputationScore >= 80) return 5
    if (reputationScore >= 60) return 4
    if (reputationScore >= 40) return 3
    if (reputationScore >= 20) return 2
    return 1
  },

  /**
   * Retiro Voluntario del DT (Endgame / Fase 40)
   */
  async retireManager(managerId) {
    await supabase.from('managers').update({ is_retired: true, employment_status: 'RETIRED' }).eq('id', managerId)

    const stats = await this.getCareerStats(managerId)
    const trophyCount = stats.trophies?.length || 0
    const legacyScore = (stats.totalMatches * 15) + (stats.totalWon * 60) + (trophyCount * 600)

    let legacyRank = 'Director Técnico de Potrero'
    if (legacyScore >= 5000) legacyRank = 'Inmortal del Fútbol Mundial'
    else if (legacyScore >= 3000) legacyRank = 'Estratega Legendario'
    else if (legacyScore >= 1500) legacyRank = 'DT Consagrado de Primera'
    else if (legacyScore >= 600) legacyRank = 'Entrenador Reconocido'

    await auditApi.logAction({
      whoId: managerId,
      action: 'MANAGER_RETIREMENT',
      entityType: 'manager',
      entityId: managerId,
      stateBefore: { is_retired: false },
      stateAfter: { is_retired: true, legacyScore, legacyRank }
    })

    return {
      legacyScore,
      legacyRank,
      stats,
      trophyCount
    }
  }
}
