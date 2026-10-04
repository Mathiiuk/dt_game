import { supabase } from './supabase'
import { clubHistoryApi } from './clubHistory'
import { reputationApi } from './reputation'

/**
 * Servicio de Ídolos, Leyendas y Retiro de Camisetas
 * Cumple con las especificaciones de Fase 37 (Ídolos y Leyendas).
 */
export const legendsApi = {
  /**
   * Obtiene todas las figuras activas y leyendas históricas del club
   */
  async getClubFigures(clubId) {
    if (!clubId) return { activeFigures: [], historicalLegends: [], retiredNumbers: [], bonuses: {} }

    const [activeFigures, { data: historicalLegends }, { data: retiredNumbers }] = await Promise.all([
      clubHistoryApi.getIdolsAndLegends(clubId),
      supabase.from('club_legends').select('*').eq('club_id', clubId).order('induction_year', { ascending: false }),
      supabase.from('retired_shirt_numbers').select('*').eq('club_id', clubId).order('shirt_number', { ascending: true })
    ])

    const bonuses = this.calculateIdolBonuses(activeFigures || [])

    return {
      activeFigures: activeFigures || [],
      historicalLegends: historicalLegends || [],
      retiredNumbers: retiredNumbers || [],
      bonuses
    }
  },

  /**
   * Obtiene los dorsales retirados del club
   */
  async getRetiredShirtNumbers(clubId) {
    if (!clubId) return []
    const { data, error } = await supabase
      .from('retired_shirt_numbers')
      .select('*')
      .eq('club_id', clubId)
      .order('shirt_number', { ascending: true })

    if (error) {
      console.error('Error fetching retired shirt numbers:', error)
      return []
    }
    return data || []
  },

  /**
   * Retira oficialmente un número de camiseta en honor a una figura
   */
  async retireShirtNumber(clubId, { playerId = null, playerName, shirtNumber, reason, managerId = null }) {
    if (!clubId || !playerName || !shirtNumber) {
      throw new Error('Datos insuficientes para retirar la camiseta.')
    }

    const num = parseInt(shirtNumber, 10)
    if (isNaN(num) || num < 1 || num > 99) {
      throw new Error('El dorsal debe ser un número válido entre 1 y 99.')
    }

    // Verificar si ya está retirado
    const { data: existing } = await supabase
      .from('retired_shirt_numbers')
      .select('id')
      .eq('club_id', clubId)
      .eq('shirt_number', num)
      .maybeSingle()

    if (existing) {
      throw new Error(`La camiseta número ${num} ya ha sido retirada previamente en este club.`)
    }

    const currentYear = 2026

    // 1. Insertar en retired_shirt_numbers
    const { data: retiredEntry, error: retErr } = await supabase
      .from('retired_shirt_numbers')
      .insert({
        club_id: clubId,
        shirt_number: num,
        player_name: playerName,
        retired_year: currentYear,
        reason: reason || `Homenaje institucional a la trayectoria de ${playerName}.`
      })
      .select()
      .single()

    if (retErr) throw retErr

    // 2. Inmortalizar en club_legends
    await supabase.from('club_legends').insert({
      club_id: clubId,
      player_id: playerId,
      player_name: playerName,
      status_level: 'LEGEND',
      honors_summary: `Dorsal #${num} retirado oficialmente de por vida.`,
      induction_year: currentYear,
      is_retired: true,
      retired_number: num
    })

    // 3. Registrar hito en la historia del club
    await clubHistoryApi.addMilestone(clubId, {
      year: currentYear,
      title: `Retiro de Camiseta: Dorsal #${num}`,
      description: `El club retira para siempre el dorsal #${num} en honor a ${playerName}, inmortalizando su devoción por la camiseta.`,
      category: 'legend',
      importance: 5
    })

    // 4. Agregar a la hemeroteca
    await clubHistoryApi.addHemerotecaArticle(clubId, {
      season_year: currentYear,
      headline: `Dorsal sagrado: Nunca más nadie vestirá la #${num} de ${playerName}`,
      snippet: `En una emotiva ceremonia institucional respaldada por la hinchada, la institución resolvió retirar definitivamente el dorsal en tributo eterno.`,
      media_source: 'El Gráfico del Potrero',
      tag: 'HOMENAJE'
    })

    // 5. Impacto en afición y reputación del DT
    if (managerId) {
      await reputationApi.applyReputationDelta({
        managerId,
        eventType: 'CLUB_TRIBUTE',
        sourceEntityId: `${clubId}:shirt-${num}`,
        delta: 2.5,
        description: `Homenaje y retiro de dorsal #${num} de ${playerName}`
      })
    }

    return retiredEntry
  },

  /**
   * Calcula bonificaciones pasivas de ídolos y leyendas
   */
  calculateIdolBonuses(figures = []) {
    let referentesCount = 0
    let idolsCount = 0
    let legendsCount = 0

    for (const f of figures) {
      if (f.club_status === 'legend') legendsCount++
      else if (f.club_status === 'idol') idolsCount++
      else if (f.club_status === 'referent') referentesCount++
    }

    return {
      referentesCount,
      idolsCount,
      legendsCount,
      // +3 cohesión por referente (máx +12)
      cohesionBonus: Math.min(12, referentesCount * 3),
      // +5 moral colectiva por ídolo (máx +15)
      moraleBonus: Math.min(15, idolsCount * 5),
      // +10% ingresos de merchandising por leyenda/ídolo (máx +35%)
      merchandiseBonusPercent: Math.min(35, (idolsCount * 8) + (legendsCount * 12)),
      // +5 confianza de afición por leyenda presente
      fanConfidenceSupport: Math.min(15, legendsCount * 5)
    }
  }
}
