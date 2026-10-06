import { filterMarketPlayers, sortMarketPlayers, offerPresets, validateOffer, offerBlockReason, marketPrice, hiddenRange, isScouted } from '../../src/domain/market'

const players = [
  { id: '1', first_name: 'Hugo', last_name: 'Ríos', position: 'GK', age: 31, attr_overall: 60, attr_pace: 40, attr_potential: 62, market_value: 20000, clubs: { name: 'Racing' } },
  { id: '2', first_name: 'Álvaro', last_name: 'Medina', position: 'CM', age: 19, attr_overall: 55, attr_pace: 70, attr_potential: 80, market_value: 50000 },
  { id: '3', first_name: 'Leo', last_name: 'Paz', position: 'ST', age: 25, attr_overall: 70, attr_pace: 85, attr_potential: 75 }
]

describe('dominio del mercado', () => {
  it('estima el precio por ritmo si falta el valor de mercado', () => {
    expect(marketPrice(players[0])).toBe(20000)
    expect(marketPrice(players[2])).toBe(850000)
  })

  it('filtra por línea, texto sin tildes (incluye club), ritmo y presupuesto', () => {
    expect(filterMarketPlayers(players, { group: 'DEL' }).map(p => p.id)).toEqual(['3'])
    expect(filterMarketPlayers(players, { query: 'alvaro' }).map(p => p.id)).toEqual(['2'])
    expect(filterMarketPlayers(players, { query: 'racing' }).map(p => p.id)).toEqual(['1'])
    expect(filterMarketPlayers(players, { minPace: '60' }).map(p => p.id)).toEqual(['2', '3'])
    expect(filterMarketPlayers(players, { onlyAffordable: true, budget: 30000 }).map(p => p.id)).toEqual(['1'])
  })

  it('ordena por nivel, potencial, precio y edad', () => {
    expect(sortMarketPlayers(players, 'overall').map(p => p.id)).toEqual(['3', '1', '2'])
    expect(sortMarketPlayers(players, 'potential').map(p => p.id)).toEqual(['2', '3', '1'])
    expect(sortMarketPlayers(players, 'price').map(p => p.id)).toEqual(['1', '2', '3'])
    expect(sortMarketPlayers(players, 'age').map(p => p.id)).toEqual(['2', '3', '1'])
  })

  it('arma ofertas sugeridas y valida el monto contra el presupuesto', () => {
    expect(offerPresets(10000).map(p => p.amount)).toEqual([8500, 10000, 11000])
    expect(validateOffer('abc', 100)).toMatch(/monto válido/)
    expect(validateOffer('500', 100)).toMatch(/presupuesto/)
    expect(validateOffer('100', 100)).toBe('')
  })

  it('explica por qué no se puede ofertar', () => {
    expect(offerBlockReason(players[0], { isOpen: false, budget: 1e6 })).toBe('Mercado cerrado')
    expect(offerBlockReason(players[1], { isOpen: true, budget: 100 })).toBe('Sin presupuesto')
    expect(offerBlockReason(players[1], { isOpen: true, budget: 1e6 })).toBeNull()
  })

  it('oculta atributos con un rango hasta que se ojea', () => {
    expect(hiddenRange(50)).toBe('40-60')
    expect(isScouted({ scout_level: 0 })).toBe(false)
    expect(isScouted({ scout_level: 2 })).toBe(true)
  })
})
