// Resumen del año: fichajes y ranking de decisiones. Funciones puras que alimentan la historia de la temporada (seasonStory).

/** Compras y ventas del club en la temporada, a partir del registro de traspasos (transfer_audit_log) */
export function signingsSummary(rows = [], clubId) {
  let bought = 0, spent = 0, sold = 0, earned = 0
  let biggestBuy = null
  for (const r of rows) {
    const fee = Number(r.transfer_fee || 0)
    if (r.to_club_id === clubId) {
      bought += 1
      spent += fee
      if (!biggestBuy || fee > biggestBuy.fee) biggestBuy = { playerId: r.player_id, fee }
    } else if (r.from_club_id === clubId) {
      sold += 1
      earned += fee
    }
  }
  return { bought, spent, sold, earned, biggestBuy }
}

const impact = (log) => Number(log.fans || 0) + Number(log.board || 0) + Number(log.locker || 0)

/** La mejor y la peor consecuencia del año por impacto total (hinchada + dirigencia + vestuario). Sin impacto no cuentan. */
export function decisionRanking(logs = []) {
  const scored = logs.map(l => ({ ...l, impact: impact(l) })).filter(l => l.impact !== 0)
  const best = scored.filter(l => l.impact > 0).sort((a, b) => b.impact - a.impact)[0] || null
  const worst = scored.filter(l => l.impact < 0).sort((a, b) => a.impact - b.impact)[0] || null
  return { best, worst }
}
