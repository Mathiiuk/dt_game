import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const LEAGUE_TIERS = {
  1: {
    level: 1,
    name: 'Liga Profesional',
    shortName: 'Primera',
    badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
    description: 'Elite nacional, 20 clubes de primer nivel, estadios de 30,000+ personas, televisación internacional y cupos a copas.'
  },
  2: {
    level: 2,
    name: 'Primera Nacional',
    shortName: 'B Nacional',
    badgeColor: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
    description: 'Segunda categoría federal, paridad extrema y viajes por todo el país.'
  },
  3: {
    level: 3,
    name: 'Primera B Metropolitana / Federal A',
    shortName: 'Tercera',
    badgeColor: 'text-purple-400 bg-purple-950/40 border-purple-800/60',
    description: 'Clubes históricos de barrio y provincias luchando por el salto al profesionalismo mayor.'
  },
  4: {
    level: 4,
    name: 'Primera C Metropolitana',
    shortName: 'Cuarta',
    badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
    description: 'Fútbol áspero y apasionado de gran fervor popular y tribunas de tablón.'
  },
  5: {
    level: 5,
    name: 'Torneo Promocional Regional / Potrero',
    shortName: 'Regional',
    badgeColor: 'text-orange-400 bg-orange-950/40 border-orange-800/60',
    description: 'División inaugural del usuario. Canchas de tierra, sueños intactos y potrero puro.'
  }
}

export const competitionTiersApi = {
  /**
   * Obtiene la estructura piramidal oficial de 5 divisiones
   */
  async getLeaguePyramid() {
    const cached = queryCache.get('league:pyramid')
    if (cached) return cached

    const { data } = await supabase
      .from('league_tiers_config')
      .select('*')
      .order('tier_level', { ascending: true })

    const list = (data && data.length > 0) ? data : Object.values(LEAGUE_TIERS).map(t => ({
      tier_level: t.level,
      tier_name: t.name,
      total_teams: 20,
      automatic_promotions: t.level > 1 ? 2 : 0,
      playoff_promotions: t.level > 1 ? 1 : 0,
      relegations_count: t.level < 5 ? 3 : 0,
      base_tv_revenue_weekly: t.level === 1 ? 12000 : t.level === 2 ? 5000 : t.level === 3 ? 2000 : t.level === 4 ? 900 : 400,
      base_wage_cap_weekly: t.level === 1 ? 150000 : t.level === 2 ? 60000 : t.level === 3 ? 28000 : t.level === 4 ? 14000 : 7000
    }))

    queryCache.set('league:pyramid', list, 120000)
    return list
  },

  /**
   * Simula el Torneo Reducido / Playoffs entre los puestos 3°, 4°, 5° y 6° por el 3er boleto de ascenso
   */
  async simulatePlayoffs(careerId, seasonYear, divisionTier = 5, standings = []) {
    if (!standings || standings.length < 6) {
      return null
    }

    const t3 = standings[2]?.club || { id: standings[2]?.club_id, name: 'Tercero' }
    const t4 = standings[3]?.club || { id: standings[3]?.club_id, name: 'Cuarto' }
    const t5 = standings[4]?.club || { id: standings[4]?.club_id, name: 'Quinto' }
    const t6 = standings[5]?.club || { id: standings[5]?.club_id, name: 'Sexto' }

    // Semifinal 1: 3° vs 6° (3° hace de local)
    const semi1HomeGoals = Math.floor(Math.random() * 3) + 1
    const semi1AwayGoals = Math.floor(Math.random() * 2)
    const semi1Winner = semi1HomeGoals >= semi1AwayGoals ? t3 : t6

    // Semifinal 2: 4° vs 5° (4° hace de local)
    const semi2HomeGoals = Math.floor(Math.random() * 3)
    const semi2AwayGoals = Math.floor(Math.random() * 3)
    let semi2Winner = semi2HomeGoals > semi2AwayGoals ? t4 : (semi2AwayGoals > semi2HomeGoals ? t5 : t4) // Ventaja deportiva local

    // Final Reducido en cancha neutral
    const finalHomeGoals = Math.floor(Math.random() * 3)
    const finalAwayGoals = Math.floor(Math.random() * 3)
    let finalWinner = semi1Winner
    let penHome = null
    let penAway = null

    if (finalHomeGoals > finalAwayGoals) {
      finalWinner = semi1Winner
    } else if (finalAwayGoals > finalHomeGoals) {
      finalWinner = semi2Winner
    } else {
      // Definición por penales reglamentarios
      penHome = 5
      penAway = 4
      finalWinner = semi1Winner
    }

    // Persistir en playoff_fixtures
    try {
      await supabase.from('playoff_fixtures').insert([
        {
          career_id: careerId || null,
          season_year: seasonYear,
          division_tier: divisionTier,
          round_name: 'SEMI_FINAL',
          home_club_id: t3.id,
          away_club_id: t6.id,
          home_score: semi1HomeGoals,
          away_score: semi1AwayGoals,
          winner_club_id: semi1Winner.id,
          status: 'FINISHED'
        },
        {
          career_id: careerId || null,
          season_year: seasonYear,
          division_tier: divisionTier,
          round_name: 'SEMI_FINAL',
          home_club_id: t4.id,
          away_club_id: t5.id,
          home_score: semi2HomeGoals,
          away_score: semi2AwayGoals,
          winner_club_id: semi2Winner.id,
          status: 'FINISHED'
        },
        {
          career_id: careerId || null,
          season_year: seasonYear,
          division_tier: divisionTier,
          round_name: 'FINAL',
          home_club_id: semi1Winner.id,
          away_club_id: semi2Winner.id,
          home_score: finalHomeGoals,
          away_score: finalAwayGoals,
          penalty_home_score: penHome,
          penalty_away_score: penAway,
          winner_club_id: finalWinner.id,
          status: 'FINISHED'
        }
      ])
    } catch (e) {
      console.warn('Error guardando llaves de playoff:', e)
    }

    return {
      semiFinals: [
        { home: t3, away: t6, homeScore: semi1HomeGoals, awayScore: semi1AwayGoals, winner: semi1Winner },
        { home: t4, away: t5, homeScore: semi2HomeGoals, awayScore: semi2AwayGoals, winner: semi2Winner }
      ],
      final: {
        home: semi1Winner,
        away: semi2Winner,
        homeScore: finalHomeGoals,
        awayScore: finalAwayGoals,
        penaltyHomeScore: penHome,
        penaltyAwayScore: penAway,
        winner: finalWinner
      },
      playoffWinnerClubId: finalWinner.id
    }
  },

  /**
   * Ejecuta y asienta los ascensos y descensos de la división en promotion_relegation_ledger
   */
  async processPromotionRelegation(careerId, seasonYear, currentTier = 5, standings = [], playoffWinnerId = null) {
    if (!standings || standings.length === 0) return []

    const movements = []

    // 1. Identificar campeones y ascendidos
    const championId = standings[0]?.club_id
    const runnerUpId = standings[1]?.club_id
    const playoffId = playoffWinnerId || standings[2]?.club_id

    // 2. Identificar descendidos (últimos 3)
    const relegatedIds = standings.slice(-3).map(s => s.club_id).filter(Boolean)

    for (let idx = 0; idx < standings.length; idx++) {
      const s = standings[idx]
      const clubId = s.club_id
      const pos = idx + 1

      let moveType = 'MAINTAINED'
      let toTier = currentTier

      if (clubId === championId && currentTier > 1) {
        moveType = 'PROMOTION_CHAMPION'
        toTier = currentTier - 1
      } else if (clubId === runnerUpId && currentTier > 1) {
        moveType = 'PROMOTION_RUNNER_UP'
        toTier = currentTier - 1
      } else if (clubId === playoffId && currentTier > 1) {
        moveType = 'PROMOTION_PLAYOFF'
        toTier = currentTier - 1
      } else if (relegatedIds.includes(clubId) && currentTier < 5) {
        moveType = 'RELEGATION'
        toTier = currentTier + 1
      }

      // Actualizar club si cambió de categoría
      if (toTier !== currentTier) {
        const { data: c } = await supabase
          .from('clubs')
          .select('reputation, wage_budget')
          .eq('id', clubId)
          .single()

        const rep = c?.reputation || 50
        const newRep = moveType.startsWith('PROMOTION') ? Math.min(100, rep + 15) : Math.max(10, rep - 15)
        
        await supabase
          .from('clubs')
          .update({
            league_tier: toTier,
            reputation: newRep
          })
          .eq('id', clubId)
      }

      // Asentar en promotion_relegation_ledger
      if (careerId) {
        await supabase
          .from('promotion_relegation_ledger')
          .upsert({
            career_id: careerId,
            season_year: seasonYear,
            club_id: clubId,
            movement_type: moveType,
            from_tier: currentTier,
            to_tier: toTier,
            final_position: pos
          }, { onConflict: 'career_id,season_year,club_id' })
      }

      movements.push({
        clubId,
        clubName: s.club?.name || s.club_name || `Club #${pos}`,
        finalPosition: pos,
        movementType: moveType,
        fromTier: currentTier,
        toTier
      })
    }

    queryCache.clear()
    return movements
  },

  /**
   * Obtiene las llaves de playoffs registradas
   */
  async getPlayoffFixtures(careerId, seasonYear) {
    if (!careerId || !seasonYear) return []

    const { data } = await supabase
      .from('playoff_fixtures')
      .select(`
        *,
        home_club:home_club_id (name, short_name, logo_url),
        away_club:away_club_id (name, short_name, logo_url),
        winner_club:winner_club_id (name, short_name, logo_url)
      `)
      .eq('career_id', careerId)
      .eq('season_year', seasonYear)

    return data || []
  }
}
