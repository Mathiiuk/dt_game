/**
 * Rachas de resultados de un club. `results` va del más antiguo al más reciente, con 'W' (ganó), 'D' (empató), 'L' (perdió).
 * Todas las rachas se cuentan hacia atrás desde el último partido.
 */
export function streaksFromResults(results = []) {
  const run = (pred) => {
    let n = 0
    for (let i = results.length - 1; i >= 0 && pred(results[i]); i--) n++
    return n
  }
  return {
    win: run(r => r === 'W'),
    loss: run(r => r === 'L'),
    unbeaten: run(r => r !== 'L'),
    winless: run(r => r !== 'W')
  }
}

/** Resultado del club en un partido jugado, o null si no hay marcador */
export function resultFor(fixture, clubId) {
  const { home_club_id: home, away_club_id: away, home_score: hs, away_score: as } = fixture || {}
  if (hs == null || as == null) return null
  if (home !== clubId && away !== clubId) return null
  const mine = home === clubId ? hs : as
  const theirs = home === clubId ? as : hs
  return mine > theirs ? 'W' : mine < theirs ? 'L' : 'D'
}

/** Cambio semanal de la moral del plantel: vuelve despacio hacia 60 y las rachas empujan a favor o en contra */
export function weeklyMoraleDelta(morale, { win = 0, loss = 0 } = {}) {
  const drift = morale > 60 ? -1 : morale < 60 ? 1 : 0
  let streak = 0
  if (win >= 3) streak = 5
  else if (win >= 1) streak = 2
  if (loss >= 3) streak = -8
  else if (loss >= 1) streak = -3
  return drift + streak
}
