import { managerApi } from './manager'
import { supabase } from './supabase'
import { gameConfigApi } from './gameConfig'
import { auditApi } from './audit'
import { clubHistoryApi } from './clubHistory'
import { achievementsApi } from './achievements'

export const postMatchApi = {
  async processResult(managerId, clubId, result) {
    // result = { homeScore, awayScore, isHome, opponentName }
    const matchCost = await gameConfigApi.getNumber('match_fitness_cost', 15)
    const winXp = await gameConfigApi.getNumber('xp_per_win', 50)
    const drawXp = await gameConfigApi.getNumber('xp_per_draw', 20)
    const lossXp = await gameConfigApi.getNumber('xp_per_loss', 5)

    const isWin = (result.isHome && result.homeScore > result.awayScore) || (!result.isHome && result.awayScore > result.homeScore)
    const isDraw = result.homeScore === result.awayScore
    
    // 1. Dar XP al manager
    let xpAward = isWin ? winXp : isDraw ? drawXp : lossXp
    await managerApi.addXp(managerId, xpAward)

    // 2. Reducir fitness y actualizar moral de los jugadores
    const { data: players } = await supabase.from('players').select('id, state_fitness, morale').eq('club_id', clubId)
    if (players) {
      for (const p of players) {
        let newFitness = Math.max(0, p.state_fitness - matchCost)
        let playerMorale = p.morale ?? 70
        playerMorale = isWin ? Math.min(100, playerMorale + 5) : isDraw ? playerMorale : Math.max(0, playerMorale - 5)
        await supabase.from('players').update({ state_fitness: newFitness, morale: playerMorale }).eq('id', p.id)
      }
    }

    // 3. Dirigencia (Board Confidence) y Moral del Club
    const { data: clubData } = await supabase.from('clubs').select('budget, board_confidence, squad_morale').eq('id', clubId).single()
    
    let currentConfidence = clubData?.board_confidence ?? 80
    if (isWin) currentConfidence += 5
    else if (isDraw) currentConfidence -= 2
    else currentConfidence -= 10
    
    // Clamp
    currentConfidence = Math.max(0, Math.min(100, currentConfidence))

    let currentMorale = clubData?.squad_morale ?? 70
    if (isWin) currentMorale += 6
    else if (isDraw) currentMorale += 0
    else currentMorale -= 6
    currentMorale = Math.max(0, Math.min(100, currentMorale))

    await supabase.from('clubs').update({ 
      board_confidence: currentConfidence,
      squad_morale: currentMorale
    }).eq('id', clubId)

    // 4. Taquilla
    let matchIncome = 0
    if (result.isHome) {
      // Ingreso básico por partido de local
      matchIncome = isWin ? 50000 : isDraw ? 30000 : 20000
      
      if (clubData) {
        await supabase.from('clubs').update({ budget: clubData.budget + matchIncome }).eq('id', clubId)
        await auditApi.logAction({
          whoId: managerId,
          action: 'MATCH_INCOME',
          entityType: 'club',
          entityId: clubId,
          stateBefore: { budget: clubData.budget },
          stateAfter: { budget: clubData.budget + matchIncome, amount: matchIncome }
        })
      }
    }

    // 5. Historia y Progresión de Ídolos / Récords del Club (Fases 36 y 37)
    try {
      const playerIds = players ? players.map(p => p.id) : []
      await clubHistoryApi.processPostMatchPlayerStats(clubId, {
        playedPlayerIds: playerIds,
        homeScore: result.homeScore || 0,
        awayScore: result.awayScore || 0,
        opponentName: result.opponentName || 'Rival',
        isHome: result.isHome
      })
    } catch (err) {
      console.warn('Error recording club history / idol progress:', err)
    }

    // 6. Evaluación de Logros de Carrera (Fase 39)
    try {
      achievementsApi.evaluateAchievements(managerId, clubId).catch(err => {
        console.warn('Error evaluating career achievements post-match:', err)
      })
    } catch (e) {
      // Ignorar para no bloquear flujo principal
    }

    // Recordatorio: ya no avanzamos tiempo aquí. El tiempo avanza con "Avanzar Semana" en el Dashboard.

    return { xpAward, matchIncome }
  }
}
