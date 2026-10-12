/**
 * Camino a la leyenda: compara los puntos de legado del DT con los de las leyendas de la tabla pública
 * (los DT argentinos más ganadores) y dice cuál es el próximo objetivo, cuánto falta y a cuántas ya superó.
 */
export function buildRoad({ me, legends } = {}) {
  if (!me || !Array.isArray(legends)) return null
  const points = Number.isFinite(Number(me.points)) ? Math.max(0, Math.round(Number(me.points))) : 0
  const rows = legends
    .filter(l => l && String(l.name || '').trim() && Number.isFinite(Number(l.points)))
    .map(l => {
      const target = Number(l.points)
      return {
        name: String(l.name).trim(),
        era: l.era || '',
        titles: Number(l.titles) || 0,
        points: target,
        beaten: points >= target,
        remaining: Math.max(0, target - points),
        progress: target > 0 ? Math.min(1, points / target) : 1
      }
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
  if (rows.length === 0) return null
  const pending = rows.filter(r => !r.beaten)
  const next = pending.length ? pending[pending.length - 1] : null // la más baja de las que faltan: la más cercana
  return { points, rows, next, passed: rows.length - pending.length, allBeaten: pending.length === 0 }
}
