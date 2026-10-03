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

    // 3. Moral / Cohesión (basado en resultado)
    // Fetch squad cohesion (using state_fitness as placeholder for cohesion if it doesn't exist, wait, cohesion is in squad)
    // Actually, maybe we can track morale directly on the players or club. Let's just track it on the players for now, or just leave it for the specific Morale phase.
    
    // 4. Taquilla
    let matchIncome = 0
    if (result.isHome) {
      // Ingreso básico por partido de local
      matchIncome = isWin ? 50000 : isDraw ? 30000 : 20000
      
      const { data: finances } = await supabase.from('clubs').select('budget').eq('id', clubId).single()
      if (finances) {
        await supabase.from('clubs').update({ budget: finances.budget + matchIncome }).eq('id', clubId)
        await auditApi.logAction({
          whoId: managerId,
          action: 'MATCH_INCOME',
          entityType: 'club',
          entityId: clubId,
          stateBefore: { budget: finances.budget },
          stateAfter: { budget: finances.budget + matchIncome, amount: matchIncome }
        })
      }
    }

    // Recordatorio: ya no avanzamos tiempo aquí. El tiempo avanza con "Avanzar Semana" en el Dashboard.

    return { xpAward, matchIncome }
  }
}
