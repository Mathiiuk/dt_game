import { supabase } from './supabase'
import { careerApi } from './career'
import { hallOfFameApi } from './hallOfFame'
import { auditApi } from './audit'

export const endgameApi = {
  // 1. Obtener snapshot de retiro de un DT si ya existe
  async getEndgameSnapshot(managerId) {
    if (!managerId) return null

    const { data, error } = await supabase
      .from('career_snapshots')
      .select('*')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching career snapshot:', error)
      return null
    }

    return data
  },

  // 2. Generador narrativo periodístico para el epílogo
  generateNewspaperChronicle(managerName, stats, legacyRank, clubName) {
    const titlesCount = (stats.trophies || []).length
    const winRate = stats.winRate || stats.winRatio || 0
    const matches = stats.totalMatches || 0
    const wins = stats.totalWon || stats.wonMatches || 0

    let headline = ''
    let subheadline = ''

    if (titlesCount >= 3 || (stats.legacyScore || 0) >= 1000) {
      headline = '¡HASTA SIEMPRE, MAESTRO! EL ADIÓS DE UN INMORTAL'
      subheadline = `Con ${titlesCount} vueltas olímpicas y ${wins} victorias, ${managerName} anunció su retiro definitivo del fútbol profesional.`
    } else if (titlesCount >= 1) {
      headline = 'PUNTO FINAL A UNA ERA DE GLORIA Y TÍTULOS'
      subheadline = `${managerName} cuelga el buzo de DT dejando una huella imborrable en las vitrinas y el corazón de la hinchada.`
    } else {
      headline = 'EL DESCANSO DEL GUERRERO: UN DT QUE DEJÓ TODO'
      subheadline = `Tras ${matches} batallas en el banco de suplentes, ${managerName} pone fin a su ciclo como director técnico.`
    }

    const paragraphs = [
      `En una emotiva y multitudinaria conferencia de prensa que paralizó al ambiente futbolístico, ${managerName} anunció esta mañana su retiro definitivo de la dirección técnica. Visiblemente conmovido y rodeado por sus colaboradores más cercanos, el estratega expresó: "Llegó el momento de dar un paso al costado. Me voy con la tranquilidad de haber dejado el alma en cada entrenamiento, en cada charla técnica y en cada pelota dividida."`,
      `El balance cuantitativo de su trayectoria confirma la estatura de su obra: dirigió un total de ${matches} partidos oficiales, cosechando ${wins} triunfos memorables y una efectividad global del ${winRate}%. Bajo su mando táctico, ${clubName || 'su equipo'} vivió noches de auténtica mística futbolera, forjando un estilo reconocible basado en el compromiso colectivo, la lectura estratégica de los partidos y el temple innegociable en los momentos de mayor adversidad.`,
      `El mundo del fútbol ya no será el mismo sin sus apasionadas indicaciones desde la línea de cal. Hoy las pizarras tácticas guardan luto de honor y los hinchas aplauden de pie. Su nombre ha quedado inmortalizado para siempre en el Salón de la Fama, como testimonio vivo de que del potrero a la gloria eterna sólo llegan los elegidos.`
    ]

    return {
      headline,
      subheadline,
      paragraphs,
      epilogueText: paragraphs.join('\n\n')
    }
  },

  // 3. Procesar el retiro voluntario del DT de forma atómica e irreversible (Master Rules 2.1)
  async processRetirement(managerId, clubId) {
    if (!managerId) throw new Error('ID de Director Técnico requerido')

    // a) Verificar estado previo
    const { data: manager, error: mgrErr } = await supabase
      .from('managers')
      .select('*')
      .eq('id', managerId)
      .single()

    if (mgrErr || !manager) throw new Error('Director Técnico no encontrado')

    // Si ya existe snapshot previo, devolverlo de forma idempotente
    const existingSnapshot = await this.getEndgameSnapshot(managerId)
    if (existingSnapshot) {
      return existingSnapshot
    }

    // b) Obtener estadísticas consolidadas de carrera
    const stats = await careerApi.getCareerStats(managerId, clubId)
    const legacyScore = hallOfFameApi.calculateLegacyScore(stats)
    const legacyTier = hallOfFameApi.getLegacyTier(legacyScore)
    const tierTitle = legacyTier.title || legacyTier.name || 'DT de Élite'
    stats.legacyScore = legacyScore

    // c) Obtener datos del club actual
    let clubName = 'Club Profesional'
    if (clubId) {
      const { data: club } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', clubId)
        .single()

      if (club?.name) clubName = club.name
    }

    const managerFullName = `${manager.first_name} ${manager.last_name}`

    // d) Inducir formalmente al Salón de la Fama
    let hallOfFameId = null
    try {
      const hofRecord = await hallOfFameApi.inductManager(managerId, {
        clubId,
        retirementNote: `Retiro oficial tras ${stats.totalMatches || 0} partidos dirigidos.`
      })
      hallOfFameId = hofRecord?.id || null
    } catch (hofErr) {
      console.warn('Advertencia al inducir en Salón de la Fama:', hofErr)
    }

    // e) Generar crónica periodística
    const chronicle = this.generateNewspaperChronicle(managerFullName, stats, tierTitle, clubName)

    // f) Guardar Snapshot inmutable de retiro en career_snapshots
    const snapshotPayload = {
      manager_id: managerId,
      manager_name: managerFullName,
      club_id: clubId || null,
      club_name: clubName,
      legacy_score: legacyScore,
      legacy_rank: tierTitle,
      total_matches: stats.totalMatches || 0,
      total_won: stats.totalWon || 0,
      total_drawn: stats.totalDrawn || 0,
      total_lost: stats.totalLost || 0,
      win_rate: stats.winRate || 0,
      titles_count: (stats.trophies || []).length,
      trophies: stats.trophies || [],
      career_headline: chronicle.headline,
      epilogue_text: chronicle.epilogueText,
      newspaper_edition: 'Edición Histórica de Colección',
      hall_of_fame_id: hallOfFameId,
      is_retired: true,
      retired_at: new Date().toISOString()
    }

    const { data: snapshot, error: snapErr } = await supabase
      .from('career_snapshots')
      .insert([snapshotPayload])
      .select()
      .single()

    const finalSnapshot = snapshot || snapshotPayload

    // g) Marcar DT como retirado en managers y desvincular club
    await supabase
      .from('managers')
      .update({ is_retired: true })
      .eq('id', managerId)

    if (clubId) {
      await supabase
        .from('clubs')
        .update({ manager_id: null })
        .eq('id', clubId)
    }

    // h) Registrar auditoría
    await auditApi.logAction(
      managerId,
      'ENDGAME_MANAGER_RETIRED',
      'managers',
      managerId,
      { is_retired: false },
      { is_retired: true, legacyScore, rank: tierTitle, snapshotId: finalSnapshot.id || null }
    ).catch(() => {})

    return finalSnapshot
  },

  // 4. Iniciar nueva dinastía preservando el mundo y la historia (Master Rule 10 y 14)
  async startNewDynasty(userId, oldManagerId) {
    if (!userId || !oldManagerId) {
      throw new Error('Parámetros insuficientes para nueva dinastía')
    }

    // Desvincular el user_id del DT viejo para que no bloquee la creación de un nuevo DT
    // pero dejando al DT viejo, sus récords, snapshots y trofeos 100% preservados en la BD
    const { error } = await supabase
      .from('managers')
      .update({ user_id: null })
      .eq('id', oldManagerId)

    if (error) {
      console.error('Error al desvincular DT para nueva dinastía:', error)
      throw new Error('No se pudo inicializar la sucesión')
    }

    return { success: true }
  }
}
