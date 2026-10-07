import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const scoutingApi = {
  BALANCE: {
    scout_mission_cost_quick: 100, // $100 viáticos informe rápido
    scout_mission_cost_full: 300,  // $300 viáticos informe completo
    quick_scout_weeks: 1,
    full_scout_weeks: 3,
    scout_report_expiry_weeks: 52,
    base_error_margin: 12
  },

  /**
   * Obtener el cuerpo de ojeadores del club
   */
  async getClubScouts(clubId) {
    if (!clubId) return []

    return queryCache.fetch(`scouts:${clubId}`, async () => {
      const { data, error } = await supabase
        .from('club_scouts')
        .select('*')
        .eq('club_id', clubId)

      if (error) throw new Error(error.message)

      // Si el club no tiene ningún ojeador aún, creamos el ojeador institucional base
      if (!data || data.length === 0) {
        const defaultScout = {
          club_id: clubId,
          name: 'Don Carmelo (Ojeador Regional)',
          judging_ability: 11,
          judging_potential: 10,
          wage_weekly: 150,
          weeks_remaining_on_task: 0
        }
        const { data: created } = await supabase
          .from('club_scouts')
          .insert(defaultScout)
          .select()
          .single()
        return created ? [created] : []
      }

      return data
    }, 30000)
  },

  /**
   * Generar enmascaramiento estricto por Niebla de Guerra (Regla 17.1)
   */
  maskPlayerData(player, scoutReport = null, isOwnPlayer = false) {
    if (!player) return null

    // Si es jugador propio, conocimiento 100% total (Nivel 3)
    if (isOwnPlayer) {
      return {
        ...player,
        knowledge_level: 3,
        is_fully_scouted: true,
        display_pace: player.attr_pace,
        display_potential: player.attr_potential || 70,
        ovr_display: player.attr_pace,
        pros: ['Futbolista perteneciente a tu plantilla'],
        cons: [],
        recommendation: 'PROPIO'
      }
    }

    const level = scoutReport ? (scoutReport.knowledge_level ?? scoutReport.level ?? 0) : 0
    const pace = player.attr_pace || 60
    const potential = player.attr_potential || 70

    // NIVEL 0: Niebla Total (0%)
    if (level === 0) {
      const minOvr = Math.max(10, pace - 14)
      const maxOvr = Math.min(99, pace + 14)
      return {
        ...player,
        knowledge_level: 0,
        is_fully_scouted: false,
        display_pace: `${minOvr}-${maxOvr}`,
        display_potential: '?',
        ovr_display: `${minOvr}-${maxOvr}`,
        pros: [],
        cons: [],
        recommendation: 'DESCONOCIDO'
      }
    }

    // NIVEL 1: Ojeo Básico (25%)
    if (level === 1) {
      const minOvr = Math.max(10, pace - 8)
      const maxOvr = Math.min(99, pace + 8)
      return {
        ...player,
        knowledge_level: 1,
        is_fully_scouted: false,
        display_pace: `${minOvr}-${maxOvr}`,
        display_potential: potential >= 75 ? 'Prometedor' : 'Discreto',
        ovr_display: `${minOvr}-${maxOvr}`,
        pros: scoutReport?.pros || ['Informe superficial completado'],
        cons: scoutReport?.cons || [],
        recommendation: 'EVALUAR'
      }
    }

    // NIVEL 2: Ojeo Avanzado (70%)
    if (level === 2) {
      const minOvr = Math.max(10, pace - 3)
      const maxOvr = Math.min(99, pace + 3)
      return {
        ...player,
        knowledge_level: 2,
        is_fully_scouted: false,
        display_pace: `${minOvr}-${maxOvr}`,
        display_potential: potential >= 80 ? 'Futura Estrella' : potential >= 70 ? 'Nivel de Categoría' : 'Limitado',
        ovr_display: `${minOvr}-${maxOvr}`,
        pros: scoutReport?.pros || ['Atributos principales analizados'],
        cons: scoutReport?.cons || [],
        recommendation: scoutReport?.recommended_action || 'CONSIDER'
      }
    }

    // NIVEL 3: Ojeo Completo (100%)
    return {
      ...player,
      knowledge_level: 3,
      is_fully_scouted: true,
      display_pace: pace,
      display_potential: potential,
      ovr_display: pace,
      pros: scoutReport?.pros || ['Velocidad y despliegue físico verificado', 'Lectura de juego táctica'],
      cons: scoutReport?.cons || ['Puede requerir adaptación al esquema'],
      recommendation: scoutReport?.recommended_action || (pace >= 68 ? 'SIGN_URGENTLY' : 'CONSIDER')
    }
  },

  /**
   * Obtener el informe de scout de un jugador para el club
   */
  async getScoutReport(clubId, playerId) {
    if (!clubId || !playerId) return null

    const { data } = await supabase
      .from('scout_reports')
      .select('*')
      .eq('club_id', clubId)
      .eq('player_id', playerId)
      .maybeSingle()

    return data
  },

  /**
   * Enviar un ojeador a elaborar informe de un futbolista
   */
  async scoutPlayer(clubId, playerId, depth = 'FULL') {
    if (!clubId || !playerId) throw new Error('Parámetros de ojeo incompletos.')

    const cost = depth === 'FULL' 
      ? this.BALANCE.scout_mission_cost_full 
      : this.BALANCE.scout_mission_cost_quick
    const targetLevel = depth === 'FULL' ? 3 : 1

    // 1. Validar fondos del club
    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .select('id, budget')
      .eq('id', clubId)
      .single()

    if (clubErr || !club) throw new Error('Club no encontrado.')
    if ((club.budget || 0) < cost) {
      throw new Error(`Fondos insuficientes: el informe cuesta $${cost} y tu caja tiene $${Number(club.budget).toLocaleString()}.`)
    }

    // 2. Obtener datos del jugador a ojear
    const { data: player, error: playerErr } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    if (playerErr || !player) throw new Error('Jugador no encontrado en la base de datos.')

    // 4. Generar pros y contras sintéticos según atributos
    const pace = player.attr_pace || 60
    const pros = []
    const cons = []

    if (pace >= 70) pros.push('Gran aceleración y velocidad punta')
    else if (pace < 50) cons.push('Ritmo lento para la división')

    if ((player.age || 25) <= 21) pros.push('Joven con margen de progresión física')
    else if (player.age >= 32) cons.push('Veterano, resistencia física en declive')

    if (pros.length === 0) pros.push('Futbolista equilibrado en sus fundamentos')
    if (cons.length === 0) cons.push('Sin debilidades críticas detectadas')

    const recommendedAction = pace >= 68 ? 'SIGN_URGENTLY' : pace >= 55 ? 'CONSIDER' : 'DISCARD'

    // 5. Upsert atómico en scout_reports
    const { data: report, error: reportErr } = await supabase
      .from('scout_reports')
      .upsert({
        club_id: clubId,
        player_id: playerId,
        level: targetLevel,
        knowledge_level: targetLevel,
        perceived_ovr_min: targetLevel === 3 ? pace : Math.max(10, pace - 8),
        perceived_ovr_max: targetLevel === 3 ? pace : Math.min(99, pace + 8),
        perceived_potential_tier: (player.attr_potential || 70) >= 80 ? 'EXCELLENT' : 'DECENT',
        pros,
        cons,
        recommended_action: recommendedAction,
        updated_at: new Date().toISOString()
      }, { onConflict: 'club_id,player_id' })
      .select()
      .single()

    if (reportErr) throw new Error(reportErr.message)

    // 6. Descontar los viáticos recién cuando el informe quedó guardado (si falla antes, no se cobra nada)
    const { financesApi } = await import('./finances')
    const { newBudget } = await financesApi.moveCash({ clubId, amount: -cost, category: 'SCOUTING', description: 'Viáticos de ojeo' })

    // 7. Registrar en auditoría de misiones
    try {
      await supabase.from('scouting_missions_log').insert({
        club_id: clubId,
        player_id: playerId,
        cost_incurred: cost,
        status: 'COMPLETED'
      })
    } catch {
      // Ignorar si tabla no disponible
    }

    queryCache.invalidate('market:')
    queryCache.invalidate('club:')
    queryCache.invalidate('scout:')

    return {
      report,
      costIncurred: cost,
      newBudget
    }
  }
}
