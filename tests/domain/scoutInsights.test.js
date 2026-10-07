import { scoutInsights } from '../../src/domain/scoutInsights'
import { valueOfPlayer } from '../../src/domain/valuation'

const squad = [
  { position: 'DC', attr_overall: 62 }, { position: 'DC', attr_overall: 55 },
  { position: 'MC', attr_overall: 58 }
]
const texts = (r) => r.map(x => x.text).join(' | ')

describe('lectura del ojeador', () => {
  it('si mejora a tu mejor jugador de esa posición, lo dice con la diferencia', () => {
    const r = scoutInsights({ player: { position: 'DC', attr_overall: 66, age: 26 }, squad, price: 20000 })
    expect(r[0]).toMatchObject({ tone: 'good' })
    expect(r[0].text).toMatch(/Mejoraría a tu mejor DC \(\+4\)/)
  })
  it('si es igual, compite de igual a igual; si es peor, sería suplente', () => {
    expect(scoutInsights({ player: { position: 'DC', attr_overall: 62, age: 26 }, squad, price: 1 })[0].text).toMatch(/igual a igual/)
    const worse = scoutInsights({ player: { position: 'DC', attr_overall: 58, age: 26 }, squad, price: 1 })[0]
    expect(worse.tone).toBe('warn')
    expect(worse.text).toMatch(/suplente/)
    expect(worse.text).toMatch(/-4|−4/)
  })
  it('si no tenés a nadie en esa posición, cubre un puesto vacío', () => {
    const r = scoutInsights({ player: { position: 'PO', attr_overall: 55, age: 27 }, squad, price: 1 })
    expect(r[0]).toMatchObject({ tone: 'good' })
    expect(r[0].text).toMatch(/puesto sin titular/)
  })
  it('compara el precio con el valor de mercado: barato, justo o caro', () => {
    const p = { position: 'DC', attr_overall: 60, attr_potential: 62, age: 26 }
    const value = valueOfPlayer(p)
    expect(texts(scoutInsights({ player: p, squad, price: Math.round(value * 0.7) }))).toMatch(/barato/i)
    expect(texts(scoutInsights({ player: p, squad, price: Math.round(value * 1.3) }))).toMatch(/caro/i)
    expect(texts(scoutInsights({ player: p, squad, price: value }))).toMatch(/acorde|justo/i)
  })
  it('un joven con margen de crecimiento y un veterano tienen su frase', () => {
    expect(texts(scoutInsights({ player: { position: 'MC', attr_overall: 50, attr_potential: 66, age: 19 }, squad, price: 1 }))).toMatch(/puede crecer hasta 66/)
    expect(texts(scoutInsights({ player: { position: 'MC', attr_overall: 60, attr_potential: 60, age: 33 }, squad, price: 1 }))).toMatch(/veterano/i)
  })
  it('sin plantel o sin precio no rompe y devuelve lo que puede', () => {
    expect(scoutInsights({ player: { position: 'DC', attr_overall: 60, age: 26 }, squad: [], price: 0 }).length).toBeGreaterThanOrEqual(1)
    expect(scoutInsights({ player: null })).toEqual([])
  })
})
