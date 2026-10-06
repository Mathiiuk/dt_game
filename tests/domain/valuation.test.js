import { playerValue, valueOfPlayer, sellerFactor, askingPrice, minAcceptable, VALUE_MAX, VALUE_MIN } from '../../src/domain/valuation'

describe('valor de los jugadores a escala de la caja', () => {
  // Estos valores salen de la función `player_value` de la base: si cambia una fórmula, tiene que cambiar la otra
  it('coincide con la base en puntos conocidos', () => {
    expect(playerValue({ ovr: 55, potential: 55, age: 25 })).toBe(6000)
    expect(playerValue({ ovr: 70, potential: 70, age: 25 })).toBe(36300)
    expect(playerValue({ ovr: 60, potential: 80, age: 19 })).toBe(15600)
    expect(playerValue({ ovr: 60, potential: 60, age: 33 })).toBe(4900)
  })

  it('un titular medio cuesta una fracción de la caja inicial (unos $25.000), no un múltiplo', () => {
    const typical = playerValue({ ovr: 56, potential: 58, age: 26 })
    expect(typical).toBeGreaterThan(3000)
    expect(typical).toBeLessThan(10000)
  })

  it('sube con la media, con el potencial no alcanzado y con la juventud; baja con la edad', () => {
    const base = playerValue({ ovr: 60, potential: 60, age: 26 })
    expect(playerValue({ ovr: 65, potential: 65, age: 26 })).toBeGreaterThan(base)
    expect(playerValue({ ovr: 60, potential: 78, age: 26 })).toBeGreaterThan(base)
    expect(playerValue({ ovr: 60, potential: 60, age: 19 })).toBeGreaterThan(base)
    expect(playerValue({ ovr: 60, potential: 60, age: 33 })).toBeLessThan(base)
  })

  it('tiene piso y techo y se redondea a $50', () => {
    expect(playerValue({ ovr: 10 })).toBe(VALUE_MIN)
    expect(playerValue({ ovr: 99, potential: 99, age: 22 })).toBe(VALUE_MAX)
    expect(playerValue({ ovr: 58, potential: 61, age: 24 }) % 50).toBe(0)
  })

  it('toma las columnas de la base', () => {
    expect(valueOfPlayer({ attr_overall: 55, attr_potential: 55, age: 25 })).toBe(6000)
    expect(valueOfPlayer({})).toBe(playerValue({ ovr: 50, potential: 50, age: 25 }))
  })

  it('los clubes grandes piden más y el agente libre pide una prima del 60%', () => {
    expect(sellerFactor(0)).toBeCloseTo(0.9)
    expect(sellerFactor(100)).toBeCloseTo(1.3)
    expect(askingPrice(10000, 100)).toBeGreaterThan(askingPrice(10000, 0))
    expect(askingPrice(10000, null, true)).toBe(6000)
  })

  it('el vendedor acepta desde el 85% de lo que pide', () => {
    expect(minAcceptable(10000)).toBe(8500)
  })
})
