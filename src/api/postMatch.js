import { managerApi } from './manager'
import { supabase } from './supabase'
import { gameConfigApi } from './gameConfig'
import { auditApi } from './audit'

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

    // 2. Reducir fitness de los jugadores (los 11 titulares)
    // Asumimos por ahora que todos jugaron los 90 min (hasta que haya sistema de suplentes activo)
    const { data: players } = await supabase.from('players').select('id, state_fitness').eq('club_id', clubId)
    if (players) {
      for (const p of players) {
        // En un MVP, bajamos fitness a todos o a los primeros 11. Aplicamos a todos como squad rotation simple.
        let newFitness = Math.max(0, p.state_fitness - matchCost)
        await supabase.from('players').update({ state_fitness: newFitness }).eq('id', p.id)
      }
    }

    // 3. Dirigencia (Board Confidence)
    const { data: clubData } = await supabase.from('clubs').select('budget, board_confidence').eq('id', clubId).single()
    
    let currentConfidence = clubData?.board_confidence ?? 80
    if (isWin) currentConfidence += 5
    else if (isDraw) currentConfidence -= 2
    else currentConfidence -= 10
    
    // Clamp
    currentConfidence = Math.max(0, Math.min(100, currentConfidence))
    await supabase.from('clubs').update({ board_confidence: currentConfidence }).eq('id', clubId)

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

    // Recordatorio: ya no avanzamos tiempo aquí. El tiempo avanza con "Avanzar Semana" en el Dashboard.

    return { xpAward, matchIncome }
  }
}
