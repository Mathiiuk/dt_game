import { managerApi } from './manager'
import { gameLoopApi } from './gameLoop'

export const postMatchApi = {
  async processResult(managerId, clubId, result) {
    // result = { homeScore, awayScore, isHome }
    
    // 1. Dar XP al manager (Ej: Victoria = 100XP, Empate = 50XP, Derrota = 20XP)
    let xpAward = 20
    if (result.homeScore > result.awayScore && result.isHome) xpAward = 100
    if (result.awayScore > result.homeScore && !result.isHome) xpAward = 100
    if (result.homeScore === result.awayScore) xpAward = 50
    
    await managerApi.addXp(managerId, xpAward)
    
    // 2. Avanzar el tiempo un par de días
    await gameLoopApi.advanceDay(clubId)
    await gameLoopApi.advanceDay(clubId)
    
    // En el futuro, actualizaríamos standings y moral aquí.
    return { xpAward }
  }
}
