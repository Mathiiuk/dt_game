import { supabase } from './supabase'
import { auditApi } from './audit'

export const careerApi = {
  // Get complete career records for the manager
  async getCareerStats(managerId, clubId) {
    // 1. Get matches played from audit log or match history
    const { data: actions } = await supabase
      .from('audit_log')
      .select('action, state_after')
      .eq('who_id', managerId)
      .eq('action', 'MATCH_INCOME')

    // Count wins, draws, losses based on season_history and audit
    const { data: seasons } = await supabase
      .from('season_history')
      .select('*')
      .eq('manager_id', managerId)

    let totalWon = 0
    let totalDrawn = 0
    let totalLost = 0
    let totalGoalsFor = 0
    let totalGoalsAgainst = 0

    if (seasons && seasons.length > 0) {
      for (const s of seasons) {
        totalWon += s.won || 0
        totalDrawn += s.drawn || 0
        totalLost += s.lost || 0
        totalGoalsFor += s.goals_for || 0
        totalGoalsAgainst += s.goals_against || 0
      }
    } else {
      // Estimate from matches in current season
      const matchesPlayed = actions?.length || 0
      totalWon = Math.floor(matchesPlayed * 0.5)
      totalDrawn = Math.floor(matchesPlayed * 0.2)
      totalLost = matchesPlayed - totalWon - totalDrawn
    }

    const totalMatches = totalWon + totalDrawn + totalLost
    const winRate = totalMatches > 0 ? Math.round((totalWon / totalMatches) * 100) : 0

    // 2. Get trophies
    const { data: trophies } = await supabase
      .from('manager_achievements')
      .select('*')
      .eq('manager_id', managerId)
      .order('year', { ascending: false })

    return {
      totalMatches,
      totalWon,
      totalDrawn,
      totalLost,
      winRate,
      totalGoalsFor,
      totalGoalsAgainst,
      trophies: trophies || [],
      seasons: seasons || []
    }
  },

  // Calculate manager reputation stars (1 to 5)
  calculateReputationStars(reputationScore = 0) {
    if (reputationScore >= 80) return 5
    if (reputationScore >= 60) return 4
    if (reputationScore >= 40) return 3
    if (reputationScore >= 20) return 2
    return 1
  },

  // Generate club job offers for the manager
  async getAvailableJobOffers(managerId, currentClubId, managerReputation = 10) {
    // Search AI clubs in same or adjacent tiers
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('id, name, city, country, budget, reputation, league_tier, stadium_name, colors')
      .neq('id', currentClubId)
      .limit(6)

    if (error || !clubs) return []

    // Map into job offer format
    return clubs.map(c => {
      const baseSalary = 5000 + (c.reputation || 10) * 200
      const tierName = c.league_tier === 1 ? 'Primera División' : c.league_tier === 2 ? 'Segunda División' : 'Torneo Regional'
      return {
        clubId: c.id,
        clubName: c.name,
        city: c.city,
        country: c.country,
        tier: c.league_tier || 3,
        tierName,
        budget: c.budget,
        offeredSalary: baseSalary,
        contractDurationYears: 2,
        reputationReq: Math.max(5, (c.reputation || 10) - 10)
      }
    })
  },

  // Accept job offer and transfer to new club
  async acceptJobOffer(managerId, newClubId, oldClubId) {
    // 1. Unset old club manager
    if (oldClubId) {
      await supabase.from('clubs').update({ manager_id: null }).eq('id', oldClubId)
    }

    // 2. Assign manager to new club
    await supabase.from('clubs').update({ manager_id: managerId }).eq('id', newClubId)

    // 3. Log transfer
    await auditApi.logAction({
      whoId: managerId,
      action: 'CLUB_TRANSFER',
      entityType: 'manager',
      entityId: managerId,
      stateBefore: { oldClubId },
      stateAfter: { newClubId }
    })

    return true
  },

  // Voluntary DT Retirement (Endgame)
  async retireManager(managerId) {
    // 1. Mark as retired
    await supabase.from('managers').update({ is_retired: true }).eq('id', managerId)

    // 2. Calculate final legacy score
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
