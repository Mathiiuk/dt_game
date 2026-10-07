import { supabase } from './supabase'
import { matchAttendance } from '../domain/attendance'
import { ensureRow } from '../utils/ensureRow'
import { queryCache } from '../utils/cache'

export const FANBASE_BALANCE = {
  RECOMMENDED_TICKET_PRICE: 10.0,
  SUPPORT_GAIN_PER_WIN: 4,
  SUPPORT_LOSS_PER_LOSS: 5,
  DERBY_BONUS_MULTIPLIER: 1.45,
  MAX_HOME_ADVANTAGE_BONUS: 1.08,
  PROTEST_TRIGGER_SCORE: 25,
  EUPHORIA_TRIGGER_SCORE: 80
}

export const fanbaseApi = {
  /**
   * Obtiene o inicializa el estado de la afición y masa de socios del club
   */
  async getClubFanbase(clubId) {
    if (!clubId) return null

    const { data: fanbase, error } = await supabase
      .from('club_fanbase')
      .select('*')
      .eq('club_id', clubId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('Error consultando club_fanbase:', error)
    }

    if (fanbase) return fanbase

    // Si no existe, inicializar autoritativamente con el humor actual de la hinchada del club
    const { data: clubRow } = await supabase.from('clubs').select('fans_confidence').eq('id', clubId).maybeSingle()
    const initialFanbase = {
      club_id: clubId,
      loyal_members_count: 350,
      casual_fanbase_potential: 2500,
      fan_support_score: clubRow?.fans_confidence ?? 65,
      stadium_atmosphere_status: 'PASSIONATE',
      chants: [
        '¡Vamos vamos los pibes!',
        '¡Esta tarde cueste lo que cueste!',
        '¡Desde el potrero al corazón!'
      ]
    }

    const { data: created, error: insertErr } = await ensureRow(supabase, 'club_fanbase', initialFanbase, 'club_id')

    if (insertErr) {
      console.warn('Error al insertar club_fanbase:', insertErr)
      return { id: 'temp', ...initialFanbase }
    }

    return created
  },

  /**
   * Algoritmo de cálculo autoritativo de asistencia para partidos de local
   */
  async computeMatchAttendance({ 
    clubId, 
    stadiumCapacity = 1500, 
    ticketPrice = 10.0, 
    isDerby = false, 
    recentWins = 2 
  }) {
    const fanbase = await this.getClubFanbase(clubId)
    const loyalMembers = fanbase?.loyal_members_count || 350
    const casualPotential = fanbase?.casual_fanbase_potential || 2500
    const supportScore = fanbase?.fan_support_score || 65

    // Asistencia: fórmula pura compartida con la base (domain/attendance.js)
    const { attendance, totalDemand, fillPct: capacityFillPercentage } = matchAttendance({
      loyal: loyalMembers, casual: casualPotential, support: supportScore, price: ticketPrice, isDerby, recentWins, capacity: stadiumCapacity
    })

    // Factor Caldera (+0% a +8% ventaja en el campo)
    const fillFactor = (capacityFillPercentage / 100) * 0.05
    const supportFactor = supportScore >= 75 ? 0.03 : supportScore <= 35 ? -0.02 : 0.0
    const homeAdvantageBonus = Number((1.0 + Math.max(-0.02, Math.min(0.08, fillFactor + supportFactor))).toFixed(2))

    return {
      attendance,
      capacityFillPercentage,
      homeAdvantageBonus,
      totalDemand,
      loyalMembers,
      isSoldOut: attendance >= stadiumCapacity
    }
  },

  /**
   * Registra el impacto en la afición luego de un partido
   */
  async recordMatchAtmosphere({
    fixtureId = null,
    homeClubId,
    attendance,
    capacityFillPercentage,
    homeAdvantageBonus,
    ticketPriceApplied,
    isWin,
    isDraw,
    isDerby = false
  }) {
    if (!homeClubId) return null

    const fanbase = await this.getClubFanbase(homeClubId)
    let score = fanbase?.fan_support_score || 65

    // Variación según resultado
    let delta = 0
    if (isWin) {
      delta = isDerby ? 8 : FANBASE_BALANCE.SUPPORT_GAIN_PER_WIN
    } else if (isDraw) {
      delta = isDerby ? -2 : 0
    } else {
      delta = isDerby ? -10 : -FANBASE_BALANCE.SUPPORT_LOSS_PER_LOSS
    }

    const newScore = Math.min(100, Math.max(0, score + delta))

    // Estado del clima en tribunas
    let status = 'NEUTRAL'
    if (newScore >= FANBASE_BALANCE.EUPHORIA_TRIGGER_SCORE) {
      status = 'EUPHORIC_FORTRESS'
    } else if (newScore >= 60) {
      status = 'PASSIONATE'
    } else if (newScore >= 40) {
      status = 'NEUTRAL'
    } else if (newScore >= FANBASE_BALANCE.PROTEST_TRIGGER_SCORE) {
      status = 'DISAPPOINTED'
    } else {
      status = 'HOSTILE_PROTEST'
    }

    // Actualizar estado de afición
    await supabase
      .from('club_fanbase')
      .update({
        fan_support_score: newScore,
        stadium_atmosphere_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('club_id', homeClubId)

    // Guardar registro de concurrencia
    await supabase
      .from('match_attendance_records')
      .insert({
        fixture_id: fixtureId,
        home_club_id: homeClubId,
        attendance,
        capacity_fill_percentage: capacityFillPercentage,
        home_advantage_bonus: homeAdvantageBonus,
        ticket_price_applied: ticketPriceApplied,
        fan_mood_after_match: newScore
      })

    // Registrar eventos populares significativos
    if (status === 'HOSTILE_PROTEST' && fanbase?.stadium_atmosphere_status !== 'HOSTILE_PROTEST') {
      await supabase.from('fanbase_events_log').insert({
        club_id: homeClubId,
        event_type: 'FAN_PROTEST',
        impact_on_morale: -10,
        details: 'Banderazo de repudio en la sede social exigiendo la renuncia del cuerpo técnico.'
      })
    } else if (isWin && isDerby) {
      await supabase.from('fanbase_events_log').insert({
        club_id: homeClubId,
        event_type: 'STANDING_OVATION',
        impact_on_morale: 12,
        details: 'Ovación histórica de pie tras imponerse en el clásico barrial.'
      })
    }

    queryCache.invalidate(`fanbase:${homeClubId}`)
    queryCache.invalidate(`club:screen:${homeClubId}`)

    return {
      newScore,
      status,
      delta
    }
  },

  /**
   * Obtiene el historial de concurrencia reciente
   */
  async getRecentAttendance(clubId) {
    if (!clubId) return []
    const { data, error } = await supabase
      .from('match_attendance_records')
      .select('*')
      .eq('home_club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.warn('Error consultando match_attendance_records:', error)
      return []
    }
    return data || []
  },

  /**
   * Obtiene los eventos populares históricos
   */
  async getFanbaseEvents(clubId) {
    if (!clubId) return []
    const { data, error } = await supabase
      .from('fanbase_events_log')
      .select('*')
      .eq('club_id', clubId)
      .order('timestamp', { ascending: false })
      .limit(10)

    if (error) {
      console.warn('Error consultando fanbase_events_log:', error)
      return []
    }
    return data || []
  },

  /**
   * Agrega un nuevo cántico de la hinchada
   */
  async addCustomChant(clubId, chant) {
    if (!clubId || !chant?.trim()) return

    const fanbase = await this.getClubFanbase(clubId)
    const existingChants = fanbase?.chants || []
    const updatedChants = [...existingChants, chant.trim()]

    await supabase
      .from('club_fanbase')
      .update({ chants: updatedChants, updated_at: new Date().toISOString() })
      .eq('club_id', clubId)

    queryCache.invalidate(`fanbase:${clubId}`)
    return updatedChants
  },

  /**
   * Metadatos para feedback de atmósfera de estadio
   */
  getAtmosphereMetadata(status = 'PASSIONATE') {
    switch (status) {
      case 'EUPHORIC_FORTRESS':
        return {
          title: 'Fortaleza Inexpugnable (Euforia)',
          description: 'Las tribunas cantan los 90 minutos. Máxima ventaja ambiental (+8% duelos).',
          badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
          textColor: 'text-emerald-400'
        }
      case 'PASSIONATE':
        return {
          title: 'Apoyo Incondicional (Pasión)',
          description: 'Clima fervoroso de local. Aliento constante (+4% ventaja local).',
          badgeColor: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
          textColor: 'text-blue-400'
        }
      case 'NEUTRAL':
        return {
          title: 'Expectativa Moderada (Calma)',
          description: 'El público asiste y acompaña sin mayor fervor ni hostilidad.',
          badgeColor: 'text-zinc-300 bg-zinc-800/50 border-zinc-700/60',
          textColor: 'text-zinc-300'
        }
      case 'DISAPPOINTED':
        return {
          title: 'Murmullos e Inquietud (Tensión)',
          description: 'Impaciencia general. Los fallos generan abucheos en el entretiempo.',
          badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
          textColor: 'text-amber-400'
        }
      case 'HOSTILE_PROTEST':
      default:
        return {
          title: 'Clima Hostil (Bronca y Protesta)',
          description: 'Banderas al revés y cánticos pidiendo renuncias. Presión extrema al equipo.',
          badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
          textColor: 'text-rose-400'
        }
    }
  }
}
