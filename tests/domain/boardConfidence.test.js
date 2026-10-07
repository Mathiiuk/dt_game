import { evaluateBoardAfterMatch } from '../../src/domain/boardConfidence'
import { seededRandom } from '../../src/domain/cupMatch'

const board = (over = {}) => ({ sports_satisfaction: 70, financial_satisfaction: 70, squad_satisfaction: 70, is_under_ultimatum: false, ultimatum_points_required: 0, ultimatum_matches_remaining: 0, ultimatum_points_gathered: 0, ...over })
const apply = (b, o) => {
  const r = evaluateBoardAfterMatch(b, o)
  return { r, next: { ...b, sports_satisfaction: r.sports, is_under_ultimatum: r.isUnderUltimatum, ultimatum_points_required: r.pointsRequired, ultimatum_matches_remaining: r.matchesRemaining, ultimatum_points_gathered: r.pointsGathered } }
}

describe('confianza de la directiva tras un partido', () => {
  it('una victoria sube 4 puntos deportivos, un empate baja 1 y una derrota baja 6', () => {
    expect(evaluateBoardAfterMatch(board(), { isWin: true }).sports).toBe(74)
    expect(evaluateBoardAfterMatch(board(), { isDraw: true }).sports).toBe(69)
    expect(evaluateBoardAfterMatch(board(), {}).sports).toBe(64)
  })
  it('la confianza global pondera deportiva 50%, financiera 30% y plantel 20%', () => {
    expect(evaluateBoardAfterMatch(board({ sports_satisfaction: 50, financial_satisfaction: 40, squad_satisfaction: 90 }), { isDraw: true }).globalConfidence).toBe(Math.round(49 * 0.5 + 40 * 0.3 + 90 * 0.2))
  })
  it('con la confianza en 40 o menos se da un ultimátum de 4 puntos en 3 partidos', () => {
    const r = evaluateBoardAfterMatch(board({ sports_satisfaction: 10, financial_satisfaction: 40, squad_satisfaction: 40 }), {})
    expect(r).toMatchObject({ event: 'ISSUED', isUnderUltimatum: true, pointsRequired: 4, matchesRemaining: 3, pointsGathered: 0, dismissal: null })
  })
  it('superar el ultimátum devuelve la confianza (+20) y el ánimo deportivo (+15)', () => {
    const b = board({ sports_satisfaction: 30, is_under_ultimatum: true, ultimatum_points_required: 4, ultimatum_matches_remaining: 2, ultimatum_points_gathered: 1 })
    const r = evaluateBoardAfterMatch(b, { isWin: true })
    expect(r).toMatchObject({ event: 'SURVIVED', isUnderUltimatum: false, pointsRequired: 0, dismissal: null })
    expect(r.sports).toBe(Math.min(100, 34 + 15))
  })
  it('fallar el ultimátum es el despido', () => {
    const b = board({ is_under_ultimatum: true, ultimatum_points_required: 4, ultimatum_matches_remaining: 1, ultimatum_points_gathered: 0 })
    expect(evaluateBoardAfterMatch(b, {})).toMatchObject({ event: 'FAILED', dismissal: 'ULTIMATUM_FAILED' })
  })
  it('nunca hay un despido sin ultimátum previo: con la confianza por el piso se da el ultimátum', () => {
    const r = evaluateBoardAfterMatch(board({ sports_satisfaction: 3, financial_satisfaction: 5, squad_satisfaction: 5 }), {})
    expect(r).toMatchObject({ event: 'ISSUED', dismissal: null })
  })
})

// Calibración: cuántas temporadas de 19 partidos terminan en ultimátum o despido según el nivel del equipo
describe('calibración de la directiva con simulación', () => {
  const season = (seed, p, fin = 70, squad = 70) => {
    const rng = seededRandom(`board:${seed}`)
    let b = board({ financial_satisfaction: fin, squad_satisfaction: squad })
    let issued = false
    for (let i = 0; i < 19; i++) {
      const x = rng()
      const outcome = x < p.w ? { isWin: true } : x < p.w + p.d ? { isDraw: true } : {}
      const { r, next } = apply(b, outcome)
      if (r.event === 'ISSUED') issued = true
      if (r.dismissal) return { dismissed: true, issued }
      b = next
    }
    return { dismissed: false, issued }
  }
  const rate = (p, fin, squad) => {
    let d = 0, u = 0
    const N = 1000
    for (let i = 0; i < N; i++) { const s = season(i, p, fin, squad); if (s.dismissed) d++; if (s.issued) u++ }
    return { dismissed: d / N, issued: u / N }
  }

  it('un equipo promedio (38% gana, 27% empata) con cuentas sanas casi nunca tiene problemas', () => {
    const r = rate({ w: 0.38, d: 0.27 })
    expect(r.dismissed).toBeLessThan(0.02)
    expect(r.issued).toBeLessThan(0.05)
  })
  it('un equipo flojo (15% gana, 20% empata) termina muchas veces en ultimátum y a veces despedido', () => {
    const r = rate({ w: 0.15, d: 0.2 })
    expect(r.issued).toBeGreaterThan(0.5)
    expect(r.dismissed).toBeGreaterThan(0.05)
    expect(r.dismissed).toBeLessThan(0.7)
  })
  it('con la caja en rojo (financiera 30) hasta un equipo promedio corre riesgo real', () => {
    const r = rate({ w: 0.38, d: 0.27 }, 30, 60)
    expect(r.issued).toBeGreaterThan(0.1)
  })
})
