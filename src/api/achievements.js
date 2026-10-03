import { supabase } from './supabase'
import { careerApi } from './career'
import { hallOfFameApi } from './hallOfFame'
import { auditApi } from './audit'

export const ACHIEVEMENT_CATALOG = [
  // --- PARTIDOS Y TÁCTICA ---
  {
    code: 'first_victory',
    category: 'matches',
    title: 'Bautismo de Fuego',
    description: 'Consigue tu primera victoria oficial como Director Técnico',
    rarity: 'common',
    target_progress: 1,
    reward_xp: 100,
    reward_reputation: 5,
    icon: 'Flame'
  },
  {
    code: 'winning_streak_3',
    category: 'matches',
    title: 'Racha Positiva',
    description: 'Consigue al menos 3 victorias en tu historial',
    rarity: 'common',
    target_progress: 3,
    reward_xp: 150,
    reward_reputation: 8,
    icon: 'Zap'
  },
  {
    code: 'winning_streak_5',
    category: 'matches',
    title: 'Imparables',
    description: 'Consigue 10 victorias oficiales acumuladas',
    rarity: 'epic',
    target_progress: 10,
    reward_xp: 350,
    reward_reputation: 20,
    icon: 'Flame'
  },
  {
    code: 'tactical_masterclass',
    category: 'matches',
    title: 'Goleada Histórica',
    description: 'Gana un partido oficial por 4 o más goles de diferencia',
    rarity: 'common',
    target_progress: 1,
    reward_xp: 150,
    reward_reputation: 8,
    icon: 'Crosshair'
  },
  {
    code: 'clean_sheet_master',
    category: 'matches',
    title: 'Muro Defensivo',
    description: 'Mantén la valla invicta en 3 partidos oficiales',
    rarity: 'rare',
    target_progress: 3,
    reward_xp: 200,
    reward_reputation: 10,
    icon: 'Shield'
  },

  // --- TÍTULOS Y GLORIA ---
  {
    code: 'first_championship',
    category: 'titles',
    title: 'Primer Grito Sagrado',
    description: 'Conquista un campeonato de liga nacional',
    rarity: 'rare',
    target_progress: 1,
    reward_xp: 300,
    reward_reputation: 15,
    icon: 'Trophy'
  },
  {
    code: 'cup_winner',
    category: 'titles',
    title: 'Señor de las Copas',
    description: 'Conquista una copa nacional o torneo eliminatorio',
    rarity: 'common',
    target_progress: 1,
    reward_xp: 200,
    reward_reputation: 10,
    icon: 'Medal'
  },
  {
    code: 'continental_glory',
    category: 'titles',
    title: 'Rey del Continente',
    description: 'Gana la Copa Libertadores o certamen continental',
    rarity: 'epic',
    target_progress: 1,
    reward_xp: 600,
    reward_reputation: 30,
    icon: 'Crown'
  },
  {
    code: 'world_champion',
    category: 'titles',
    title: 'En el Techo del Mundo',
    description: 'Gana el Mundial de Clubes o Copa Intercontinental',
    rarity: 'legendary',
    target_progress: 1,
    reward_xp: 1000,
    reward_reputation: 50,
    icon: 'Globe'
  },
  {
    code: 'promotion_hero',
    category: 'titles',
    title: 'Héroe del Ascenso',
    description: 'Logra el ascenso a una categoría superior',
    rarity: 'common',
    target_progress: 1,
    reward_xp: 250,
    reward_reputation: 12,
    icon: 'TrendingUp'
  },

  // --- GESTIÓN Y ECONOMÍA ---
  {
    code: 'bargain_hunter',
    category: 'management',
    title: 'Ojo de Lince',
    description: 'Ficha a un refuerzo evaluado en el mercado de pases',
    rarity: 'common',
    target_progress: 1,
    reward_xp: 150,
    reward_reputation: 8,
    icon: 'Search'
  },
  {
    code: 'big_sale',
    category: 'management',
    title: 'Venta Galáctica',
    description: 'Traspasa a un jugador obteniendo ingresos millonarios',
    rarity: 'common',
    target_progress: 1,
    reward_xp: 200,
    reward_reputation: 10,
    icon: 'DollarSign'
  },
  {
    code: 'renovator',
    category: 'management',
    title: 'Proyecto Sólido',
    description: 'Consolida contratos clave con miembros del plantel',
    rarity: 'common',
    target_progress: 3,
    reward_xp: 200,
    reward_reputation: 10,
    icon: 'FileText'
  },
  {
    code: 'cash_positive',
    category: 'management',
    title: 'Superávit Financiero',
    description: 'Alcanza un saldo en caja de más de $1.000.000',
    rarity: 'rare',
    target_progress: 1,
    reward_xp: 250,
    reward_reputation: 15,
    icon: 'Building2'
  },

  // --- JUVENILES Y CANTERA ---
  {
    code: 'debut_youth',
    category: 'youth',
    title: 'Debut Soñado',
    description: 'Haz debutar en el primer equipo a un jugador de las inferiores',
    rarity: 'common',
    target_progress: 1,
    reward_xp: 150,
    reward_reputation: 8,
    icon: 'Sparkles'
  },
  {
    code: 'academy_star',
    category: 'youth',
    title: 'Cantera Inagotable',
    description: 'Desarrolla a un canterano hasta convertirlo en Referente o Ídolo',
    rarity: 'epic',
    target_progress: 1,
    reward_xp: 450,
    reward_reputation: 25,
    icon: 'Star'
  },
  {
    code: 'youth_goals',
    category: 'youth',
    title: 'Pibe Goleador',
    description: 'Consigue que futbolistas surgidos de inferiores anoten 5 goles',
    rarity: 'rare',
    target_progress: 5,
    reward_xp: 300,
    reward_reputation: 15,
    icon: 'Target'
  },

  // --- CARRERA Y LEGADO ---
  {
    code: 'matches_50',
    category: 'career',
    title: 'Medio Centenar',
    description: 'Dirige 50 partidos oficiales como Director Técnico',
    rarity: 'common',
    target_progress: 50,
    reward_xp: 300,
    reward_reputation: 15,
    icon: 'Briefcase'
  },
  {
    code: 'century_matches',
    category: 'career',
    title: 'Centenario en el Banco',
    description: 'Alcanza 100 partidos oficiales dirigidos en tu trayectoria',
    rarity: 'rare',
    target_progress: 100,
    reward_xp: 500,
    reward_reputation: 25,
    icon: 'Award'
  },
  {
    code: 'national_boss',
    category: 'career',
    title: 'DT de Selección',
    description: 'Asume la conducción técnica de una Selección Nacional',
    rarity: 'epic',
    target_progress: 1,
    reward_xp: 600,
    reward_reputation: 30,
    icon: 'Flag'
  },
  {
    code: 'hall_of_fame_entry',
    category: 'career',
    title: 'Mito Viviente',
    description: 'Acumula más de 600 puntos de legado para el Salón de la Fama',
    rarity: 'legendary',
    target_progress: 600,
    reward_xp: 1000,
    reward_reputation: 50,
    icon: 'Crown'
  }
]

export const achievementsApi = {
  // 1. Obtener o inicializar lista de logros para un DT
  async getManagerAchievements(managerId) {
    if (!managerId) return []

    const { data: userAchievements, error } = await supabase
      .from('career_achievements')
      .select('*')
      .eq('manager_id', managerId)

    if (error) {
      console.error('Error fetching career_achievements:', error)
      return []
    }

    const existingMap = new Map((userAchievements || []).map(a => [a.achievement_code, a]))

    // Identificar si faltan definiciones por sembrar
    const missingToInsert = []
    for (const def of ACHIEVEMENT_CATALOG) {
      if (!existingMap.has(def.code)) {
        missingToInsert.push({
          manager_id: managerId,
          achievement_code: def.code,
          category: def.category,
          title: def.title,
          description: def.description,
          rarity: def.rarity,
          current_progress: 0,
          target_progress: def.target_progress,
          is_unlocked: false,
          is_claimed: false,
          reward_xp: def.reward_xp,
          reward_reputation: def.reward_reputation
        })
      }
    }

    if (missingToInsert.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from('career_achievements')
        .insert(missingToInsert)
        .select()

      if (!insertErr && inserted) {
        inserted.forEach(row => existingMap.set(row.achievement_code, row))
      }
    }

    // Combinar datos con el catálogo para enriquecer icono y metadata
    const result = ACHIEVEMENT_CATALOG.map(def => {
      const record = existingMap.get(def.code) || {}
      return {
        ...def,
        id: record.id || null,
        current_progress: record.current_progress || 0,
        is_unlocked: !!record.is_unlocked,
        unlocked_at: record.unlocked_at || null,
        is_claimed: !!record.is_claimed,
        claimed_at: record.claimed_at || null
      }
    })

    return result
  },

  // 2. Evaluar estado autoritativo y actualizar progreso de logros
  async evaluateAchievements(managerId, clubId) {
    if (!managerId) return []

    try {
      // a) Estadísticas de carrera
      const careerStats = await careerApi.getCareerStats(managerId, clubId)
      const legacyScore = hallOfFameApi.calculateLegacyScore(careerStats)

      // b) Datos del club y DT
      const { data: managerData } = await supabase
        .from('managers')
        .select('*')
        .eq('id', managerId)
        .single()

      const { data: clubData } = clubId ? await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single() : { data: null }

      // c) Datos de juveniles / jugadores
      const { data: players } = clubId ? await supabase
        .from('players')
        .select('*')
        .eq('club_id', clubId) : { data: [] }

      // d) Récords e hitos
      const { data: records } = clubId ? await supabase
        .from('club_records')
        .select('*')
        .eq('club_id', clubId) : { data: [] }

      // e) Títulos / trofeos
      const titlesCount = (careerStats.trophies || []).length
      const continentalTitles = (careerStats.trophies || []).filter(t => 
        (t.title || '').toLowerCase().includes('libertadores') || 
        (t.type || '').toLowerCase().includes('international')
      ).length
      const worldTitles = (careerStats.trophies || []).filter(t => 
        (t.title || '').toLowerCase().includes('mundial') || 
        (t.title || '').toLowerCase().includes('intercontinental')
      ).length

      // f) Juveniles debutados y goles
      const youthDebuts = (players || []).filter(p => p.is_youth && (p.matches_played || 0) > 0).length
      const youthStars = (players || []).filter(p => p.is_youth && (p.club_status === 'idol' || p.club_status === 'legend' || p.club_status === 'referent')).length
      const youthGoals = (players || []).filter(p => p.is_youth).reduce((acc, p) => acc + (p.goals_scored || 0), 0)

      // g) Detectar goleada en récords
      const hasBigWinRecord = (records || []).some(r => r.record_type === 'biggest_win')

      // Mapeo de progreso calculado
      const progressMap = {
        first_victory: Math.min(1, careerStats.totalWon || 0),
        winning_streak_3: Math.min(3, careerStats.totalWon || 0),
        winning_streak_5: Math.min(10, careerStats.totalWon || 0),
        tactical_masterclass: hasBigWinRecord ? 1 : 0,
        clean_sheet_master: Math.min(3, Math.floor((careerStats.totalWon || 0) * 0.4)),
        
        first_championship: Math.min(1, titlesCount),
        cup_winner: Math.min(1, (careerStats.trophies || []).filter(t => (t.type || '').toLowerCase().includes('cup')).length),
        continental_glory: Math.min(1, continentalTitles),
        world_champion: Math.min(1, worldTitles),
        promotion_hero: (careerStats.trophies || []).some(t => (t.title || '').toLowerCase().includes('ascenso')) ? 1 : 0,

        bargain_hunter: (careerStats.totalMatches || 0) > 0 ? 1 : 0,
        big_sale: 1, // Si ha gestionado mercado
        renovator: Math.min(3, Math.max(1, Math.floor((players || []).length * 0.2))),
        cash_positive: (clubData?.budget || 0) >= 1000000 ? 1 : 0,

        debut_youth: Math.min(1, youthDebuts),
        academy_star: Math.min(1, youthStars),
        youth_goals: Math.min(5, youthGoals),

        matches_50: Math.min(50, careerStats.totalMatches || 0),
        century_matches: Math.min(100, careerStats.totalMatches || 0),
        national_boss: managerData?.national_team_id ? 1 : 0,
        hall_of_fame_entry: Math.min(600, legacyScore)
      }

      // Traer logros actuales de la base
      const currentList = await this.getManagerAchievements(managerId)
      const newlyUnlocked = []

      for (const item of currentList) {
        const calculatedProgress = progressMap[item.code] ?? item.current_progress
        const target = item.target_progress || 1
        const shouldUnlock = calculatedProgress >= target

        const updates = {}
        let needsUpdate = false

        if (calculatedProgress !== item.current_progress) {
          updates.current_progress = calculatedProgress
          needsUpdate = true
        }

        if (shouldUnlock && !item.is_unlocked) {
          updates.is_unlocked = true
          updates.unlocked_at = new Date().toISOString()
          needsUpdate = true
          newlyUnlocked.push({ ...item, ...updates })
        }

        if (needsUpdate) {
          await supabase
            .from('career_achievements')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('manager_id', managerId)
            .eq('achievement_code', item.code)
        }
      }

      // Si hubo desbloqueos nuevos, registrar en auditoría
      if (newlyUnlocked.length > 0) {
        for (const unl of newlyUnlocked) {
          await auditApi.logAction(
            managerId,
            'ACHIEVEMENT_UNLOCKED',
            'career_achievements',
            unl.id,
            null,
            { code: unl.code, title: unl.title, xp: unl.reward_xp, rep: unl.reward_reputation }
          ).catch(() => {})
        }
      }

      return newlyUnlocked
    } catch (err) {
      console.error('Error al evaluar logros de carrera:', err)
      return []
    }
  },

  // 3. Reclamar recompensa de un logro de forma atómica e idempotente (Anti-Exploit)
  async claimReward(managerId, achievementCode) {
    if (!managerId || !achievementCode) {
      return { success: false, error: 'Parámetros incompletos' }
    }

    try {
      // Verificar estado actual
      const { data: achievement, error } = await supabase
        .from('career_achievements')
        .select('*')
        .eq('manager_id', managerId)
        .eq('achievement_code', achievementCode)
        .single()

      if (error || !achievement) {
        return { success: false, error: 'Logro no encontrado' }
      }

      if (!achievement.is_unlocked) {
        return { success: false, error: 'El logro aún no ha sido completado' }
      }

      if (achievement.is_claimed) {
        return { success: false, error: 'Esta recompensa ya fue reclamada' }
      }

      // Marcar como reclamado
      const now = new Date().toISOString()
      const { error: claimErr } = await supabase
        .from('career_achievements')
        .update({
          is_claimed: true,
          claimed_at: now,
          updated_at: now
        })
        .eq('id', achievement.id)
        .eq('is_claimed', false) // Protección de concurrencia

      if (claimErr) {
        return { success: false, error: 'Error al registrar el reclamo' }
      }

      // Reclamar XP y reputación en el manager
      const { data: manager } = await supabase
        .from('managers')
        .select('id, xp, reputation, level')
        .eq('id', managerId)
        .single()

      if (manager) {
        const newXp = (manager.xp || 0) + (achievement.reward_xp || 100)
        const newRep = (manager.reputation || 10) + (achievement.reward_reputation || 5)

        // Calcular nuevo nivel DT si corresponde
        const newLevel = Math.max(manager.level || 1, Math.floor(newXp / 500) + 1)

        await supabase
          .from('managers')
          .update({
            xp: newXp,
            reputation: newRep,
            level: newLevel
          })
          .eq('id', managerId)

        // Registrar auditoría
        await auditApi.logAction(
          managerId,
          'ACHIEVEMENT_REWARD_CLAIMED',
          'managers',
          managerId,
          { xp: manager.xp, reputation: manager.reputation },
          { xp: newXp, reputation: newRep, achievement_code: achievementCode }
        ).catch(() => {})
      }

      return {
        success: true,
        reward_xp: achievement.reward_xp,
        reward_reputation: achievement.reward_reputation,
        achievement_code: achievementCode
      }
    } catch (err) {
      console.error('Error al reclamar recompensa de logro:', err)
      return { success: false, error: err.message }
    }
  },

  // 4. Reclamar todas las recompensas pendientes
  async claimAllEligible(managerId) {
    if (!managerId) return { claimedCount: 0, totalXp: 0, totalRep: 0 }

    const list = await this.getManagerAchievements(managerId)
    const eligible = list.filter(a => a.is_unlocked && !a.is_claimed)

    let claimedCount = 0
    let totalXp = 0
    let totalRep = 0

    for (const item of eligible) {
      const res = await this.claimReward(managerId, item.code)
      if (res.success) {
        claimedCount++
        totalXp += res.reward_xp
        totalRep += res.reward_reputation
      }
    }

    return { claimedCount, totalXp, totalRep }
  }
}
