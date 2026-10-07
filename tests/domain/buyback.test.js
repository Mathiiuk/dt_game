import { buybackTerms } from '../../src/domain/buyback'

// Estos valores salen de grant_buyback en la base (venta de 8.000: cuesta 800 y se recompra por 10.000)
describe('cláusula de recompra', () => {
  it('cuesta el 10% de la venta y se recompra por el 125%', () => {
    expect(buybackTerms(8000)).toEqual({ cost: 800, price: 10000 })
    expect(buybackTerms(12345)).toEqual({ cost: 1235, price: 15431 })
  })
  it('una venta sin importe no genera costo ni precio', () => {
    expect(buybackTerms(0)).toEqual({ cost: 0, price: 0 })
    expect(buybackTerms(undefined)).toEqual({ cost: 0, price: 0 })
  })
})
