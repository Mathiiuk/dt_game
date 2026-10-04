import { supabase } from './supabase'

export const HISTORIC_LEGENDS = [
  {
    manager_name: 'Sir Alex Ferguson',
    nationality: 'Escocia',
    legacy_score: 10450,
    titles_count: 38,
    national_titles: 28,
    international_titles: 10,
    matches_played: 1500,
    matches_won: 895,
    win_ratio: 59.7,
    clubs_managed: ['Manchester United', 'Aberdeen'],
    national_teams_managed: ['Escocia'],
    era: '1986 - 2013',
    is_human: false
  },
  {
    manager_name: 'Carlos Bianchi',
    nationality: 'Argentina',
    legacy_score: 9850,
    titles_count: 15,
    national_titles: 9,
    international_titles: 6,
    matches_played: 720,
    matches_won: 412,
    win_ratio: 57.2,
    clubs_managed: ['Boca Juniors', 'Vélez Sarsfield'],
    national_teams_managed: [],
    era: '1993 - 2004',
    is_human: false
  },
  {
    manager_name: 'Pep Guardiola',
    nationality: 'España',
    legacy_score: 9780,
    titles_count: 37,
    national_titles: 26,
    international_titles: 11,
    matches_played: 920,
    matches_won: 660,
    win_ratio: 71.7,
    clubs_managed: ['Manchester City', 'FC Barcelona', 'Bayern Múnich'],
    national_teams_managed: [],
    era: '2008 - Actualidad',
    is_human: false
  },
  {
    manager_name: 'Marcelo Gallardo',
    nationality: 'Argentina',
    legacy_score: 8750,
    titles_count: 14,
    national_titles: 7,
    international_titles: 7,
    matches_played: 424,
    matches_won: 228,
    win_ratio: 53.8,
    clubs_managed: ['River Plate', 'Nacional'],
    national_teams_managed: [],
    era: '2014 - 2022',
    is_human: false
  },
  {
    manager_name: 'César Luis Menotti',
    nationality: 'Argentina',
    legacy_score: 8400,
    titles_count: 5,
    national_titles: 2,
    international_titles: 3,
    matches_played: 580,
    matches_won: 310,
    win_ratio: 53.4,
    clubs_managed: ['Huracán', 'FC Barcelona', 'Boca Juniors'],
    national_teams_managed: ['Argentina (Campeón 1978)'],
    era: '1973 - 1982',
    is_human: false
  },
  {
    manager_name: 'Carlos Bilardo',
    nationality: 'Argentina',
    legacy_score: 8350,
    titles_count: 4,
    national_titles: 2,
    international_titles: 2,
    matches_played: 510,
    matches_won: 285,
    win_ratio: 55.9,
    clubs_managed: ['Estudiantes de La Plata', 'Sevilla'],
    national_teams_managed: ['Argentina (Campeón 1986)'],
    era: '1982 - 1990',
    is_human: false
  }
]

export const hallOfFameApi = {
  /**
   * Obtiene la lista completa de directores técnicos en el Salón de la Fama,
   * ordenada por puntuación de legado descendente. Si está vacía, la inicializa con próceres históricos.
   */
  async getRanking() {
    const { data, error } = await supabase
      .from('hall_of_fame')
      .select('*')
      .order('legacy_score', { ascending: false })

    if (error) {
      console.error('Error fetching hall_of_fame:', error)
      return HISTORIC_LEGENDS
    }

    if (!data || data.length === 0) {
      try {
        await supabase.from('hall_of_fame').insert(HISTORIC_LEGENDS)
        return HISTORIC_LEGENDS
      } catch (insertErr) {
        console.warn('Could not seed hall of fame in database, returning in-memory:', insertErr)
        return HISTORIC_LEGENDS
      }
    }

    return data
  },

  /**
   * Calcula el puntaje de legado (*Legacy Score*) conforme a las reglas maestras de la Fase 2.1:
   * Score = (Títulos Locales * 400) + (Títulos Internacionales * 800) + (Partidos Ganados * 15) + (Efectividad % * 20) + (Reputación * 10)
   */
  calculateLegacyScore({
    nationalTitles = 0,
    internationalTitles = 0,
    matchesWon = 0,
    winRatio = 0,
    reputation = 0
  }) {
    const score = Math.round(
      (nationalTitles * 400) +
      (internationalTitles * 800) +
      (matchesWon * 15) +
      (winRatio * 20) +
      (reputation * 10)
    )
    return Math.max(0, score)
  },

  /**
   * Determina la categoría o rango de legado alcanzado por el DT.
   */
  getLegacyTier(score) {
    if (score >= 9000) return { title: 'Mito Universal del Fútbol', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' }
    if (score >= 8000) return { title: 'Leyenda Histórica', color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' }
    if (score >= 5000) return { title: 'Estratega Consagrado', color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' }
    if (score >= 2500) return { title: 'DT de Élite', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' }
    if (score >= 1000) return { title: 'Técnico de Primera', color: 'text-teal-400 border-teal-500/40 bg-teal-500/10' }
    return { title: 'DT en Ascenso', color: 'text-zinc-400 border-zinc-700 bg-zinc-800/50' }
  },

  /**
   * Consulta el estado de proyección hacia el Salón de la Fama del DT actual en activo.
   */
  async getLiveManagerProjection(managerId) {
    if (!managerId) return null

    // 1. Obtener datos del DT
    const { data: manager } = await supabase
      .from('managers')
      .select('*')
      .eq('id', managerId)
      .single()

    if (!manager) return null

    // El vínculo vive en clubs.manager_id (managers no tiene club_id)
    const { data: managerClub } = await supabase
      .from('clubs')
      .select('*')
      .eq('manager_id', managerId)
      .maybeSingle()
    manager.club = managerClub
    manager.club_id = managerClub?.id || null

    // 2. Obtener historial de partidos
    const { data: matches } = await supabase
      .from('match_history')
      .select('*')
      .eq('club_id', manager.club_id || '')

    const totalMatches = matches?.length || 0
    const wonMatches = matches?.filter(m => (m.is_home && m.home_score > m.away_score) || (!m.is_home && m.away_score > m.home_score))?.length || 0
    const winRatio = totalMatches > 0 ? Number(((wonMatches / totalMatches) * 100).toFixed(1)) : 0

    // 3. Obtener títulos acumulados
    const { data: achievements } = await supabase
      .from('manager_achievements')
      .select('*')
      .eq('manager_id', managerId)

    const nationalTitles = achievements?.filter(a => a.achievement_type === 'league_champion')?.length || 0
    const intlTitles = achievements?.filter(a => a.achievement_type === 'continental_champion')?.length || 0
    const totalTitles = nationalTitles + intlTitles

    const estimatedScore = this.calculateLegacyScore({
      nationalTitles,
      internationalTitles: intlTitles,
      matchesWon: wonMatches,
      winRatio,
      reputation: manager.reputation || 0
    })

    const tier = this.getLegacyTier(estimatedScore)

    // 4. Verificar si ya fue inducido formalmente
    const { data: inducted } = await supabase
      .from('hall_of_fame')
      .select('*')
      .eq('manager_id', managerId)
      .maybeSingle()

    return {
      manager,
      stats: {
        totalMatches,
        wonMatches,
        winRatio,
        nationalTitles,
        intlTitles,
        totalTitles
      },
      estimatedScore,
      tier,
      isInducted: !!inducted,
      inductedRecord: inducted
    }
  },

  /**
   * Induce formalmente a un mánager al Salón de la Fama con su snapshot inmutable.
   */
  async inductManager(managerId, snapshotPayload = {}) {
    const projection = await this.getLiveManagerProjection(managerId)
    if (!projection) throw new Error('No se encontró el mánager para inmortalizar.')

    const { manager, stats, estimatedScore } = projection

    const clubsList = manager.club?.name ? [manager.club.name] : ['Club Profesional']
    const nationalTeamsList = manager.national_team_id ? ['Selección Nacional'] : []

    const { data, error } = await supabase
      .from('hall_of_fame')
      .upsert({
        manager_id: managerId,
        manager_name: `${manager.first_name} ${manager.last_name}`,
        nationality: manager.nationality || 'Argentina',
        legacy_score: estimatedScore,
        titles_count: stats.totalTitles,
        national_titles: stats.nationalTitles,
        international_titles: stats.intlTitles,
        matches_played: stats.totalMatches,
        matches_won: stats.wonMatches,
        win_ratio: stats.winRatio,
        clubs_managed: clubsList,
        national_teams_managed: nationalTeamsList,
        era: 'Generación Actual',
        is_human: true,
        snapshot_data: {
          ...snapshotPayload,
          inducted_level: manager.level,
          total_xp: manager.xp,
          reputation: manager.reputation,
          final_stats: stats
        }
      }, { onConflict: 'manager_id' })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}
