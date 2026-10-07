// Bolsa de trabajo: qué vacantes se muestran. Primero las que el DT puede conseguir, y de cada categoría un máximo,
// para que la lista no sea 15 clubes de la misma división (antes todos los rivales figuraban en Primera).
const CHANCE_RANK = { 'MUY ALTA': 0, 'CANDIDATO FIRME': 1, 'POCAS OPCIONES': 2, 'CASI IMPOSIBLE': 3 }

export function pickVacancies(vacancies = [], max = 15, perTier = 5) {
  const sorted = [...vacancies].sort((a, b) =>
    (CHANCE_RANK[a.chance] ?? 4) - (CHANCE_RANK[b.chance] ?? 4) || (a.tier || 5) - (b.tier || 5))
  const taken = {}
  const picked = []
  for (const v of sorted) {
    const t = v.tier || 5
    if ((taken[t] || 0) >= perTier) continue
    taken[t] = (taken[t] || 0) + 1
    picked.push(v)
    if (picked.length === max) break
  }
  return picked
}
