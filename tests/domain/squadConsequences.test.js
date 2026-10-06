import {
  trainingLoad, trainingLoadConsequence, trainingRisk, saleConsequences, purchaseConsequences, benchConsequences, wageInequities, benchComplainers
} from '../../src/domain/squadConsequences'

describe('carga de entrenamiento', () => {
  it('la intensidad alta acumula riesgo semana tras semana', () => {
    expect(trainingLoad({ recent: [], current: 'HIGH' })).toMatchObject({ consecutiveHigh: 1, injuryMultiplier: 1 })
    expect(trainingLoad({ recent: ['HIGH'], current: 'HIGH' })).toMatchObject({ consecutiveHigh: 2, injuryMultiplier: 1.2 })
    expect(trainingLoad({ recent: ['HIGH', 'HIGH'], current: 'HIGH' })).toMatchObject({ consecutiveHigh: 3, injuryMultiplier: 1.4, exhausted: true })
  })

  it('una semana liviana corta la racha', () => {
    expect(trainingLoad({ recent: ['MEDIUM', 'HIGH', 'HIGH'], current: 'HIGH' }).consecutiveHigh).toBe(1)
    expect(trainingLoad({ recent: ['HIGH', 'HIGH'], current: 'LOW' }).consecutiveHigh).toBe(0)
  })

  it('veteranos y juveniles sufren más', () => {
    expect(trainingLoad({ recent: [], current: 'HIGH', age: 33 }).injuryMultiplier).toBe(1.3)
    expect(trainingLoad({ recent: ['HIGH'], current: 'HIGH', age: 18 }).injuryMultiplier).toBe(1.5)
    expect(trainingLoad({ recent: [], current: 'LOW', age: 33 }).injuryMultiplier).toBe(1)
  })

  it('desde la segunda semana intensa baja el vestuario', () => {
    expect(trainingLoadConsequence(1).locker).toBe(0)
    expect(trainingLoadConsequence(2).locker).toBe(-3)
    expect(trainingLoadConsequence(3).locker).toBe(-6)
  })

  it('el riesgo para avisar sube con la fatiga y la carga previa', () => {
    expect(trainingRisk({ avgFitness: 80 })).toBe('LOW')
    expect(trainingRisk({ avgFitness: 80, matchInDays: 2 })).toBe('MEDIUM')
    expect(trainingRisk({ consecutiveHigh: 2 })).toBe('HIGH')
    expect(trainingRisk({ avgFitness: 55 })).toBe('HIGH')
  })
})

describe('referentes y fichajes', () => {
  it('vender al ídolo pega fuerte en la tribuna y en el vestuario', () => {
    expect(saleConsequences({ isIdol: true })).toMatchObject({ fans: -8, locker: -6 })
    expect(saleConsequences({ isCaptain: true })).toMatchObject({ fans: -1, locker: -6 })
    expect(saleConsequences({ isIdol: true, isCaptain: true })).toMatchObject({ fans: -8, locker: -12 })
    expect(saleConsequences({})).toMatchObject({ fans: 0, locker: 0, notes: [] })
  })

  it('pagar de más y quedarse sin caja resta confianza a la dirigencia', () => {
    expect(purchaseConsequences({ fee: 5000, marketValue: 5000, balance: 20000, weeklyExpenses: 1000 }).board).toBe(0)
    expect(purchaseConsequences({ fee: 7000, marketValue: 5000, balance: 20000, weeklyExpenses: 1000 }).board).toBe(-3)
    expect(purchaseConsequences({ fee: 9000, marketValue: 9000, balance: 12000, weeklyExpenses: 1000 }).board).toBe(-5)
    expect(purchaseConsequences({ fee: 15000, marketValue: 10000, balance: 18000, weeklyExpenses: 1000 }).board).toBe(-8)
  })

  it('el capitán y el ídolo en el banco se notan', () => {
    expect(benchConsequences({ captainBenched: true })).toMatchObject({ locker: -3, fans: 0 })
    expect(benchConsequences({ idolBenched: true })).toMatchObject({ locker: -1, fans: -2 })
    expect(benchConsequences({}).notes).toEqual([])
  })
})

describe('inequidad salarial', () => {
  const P = (id, level, pay) => ({ id, attr_overall: level, contract_salary: pay })

  it('detecta al que cobra 25% menos que un compañero de nivel parecido', () => {
    const ids = wageInequities([P('a', 60, 100), P('b', 62, 140), P('c', 50, 100)])
    expect(ids).toEqual(['a'])
  })

  it('no hay reclamo si la diferencia es menor o el nivel es muy distinto', () => {
    expect(wageInequities([P('a', 60, 100), P('b', 60, 120)])).toEqual([])
    expect(wageInequities([P('a', 55, 100), P('b', 70, 300)])).toEqual([])
  })
})

describe('suplentes que reclaman minutos', () => {
  const P = (id, level, extra = {}) => ({ id, attr_overall: level, ...extra })

  it('se quejan los que no jugaron ni un minuto en cuatro partidos, empezando por los mejores', () => {
    const squad = [P('a', 55), P('b', 70), P('c', 62), P('d', 58), P('e', 66)]
    expect(benchComplainers({ players: squad, playedIds: ['e'], games: 4 })).toEqual(['b', 'c', 'd'])
  })

  it('no reclaman los lesionados, los retirados ni quienes jugaron', () => {
    const squad = [P('a', 70, { is_injured: true }), P('b', 68, { is_retired: true }), P('c', 60)]
    expect(benchComplainers({ players: squad, playedIds: [], games: 5 })).toEqual(['c'])
    expect(benchComplainers({ players: squad, playedIds: ['c'], games: 5 })).toEqual([])
  })

  it('con menos de cuatro partidos no hay reclamos y nunca más de tres por semana', () => {
    expect(benchComplainers({ players: [P('a', 60)], playedIds: [], games: 3 })).toEqual([])
    const many = Array.from({ length: 8 }, (_, i) => P(`p${i}`, 50 + i))
    expect(benchComplainers({ players: many, playedIds: [], games: 6 })).toHaveLength(3)
  })
})

describe('mercado: consecuencias de fichar y vender', () => {
  it('vender con la caja en apuros alivia a la dirigencia y preocupa a la tribuna', () => {
    const r = saleConsequences({ fee: 6000, balance: 3000, weeklyExpenses: 1000 })
    expect(r).toMatchObject({ board: 2, fans: -1 })
    expect(r.notes[0]).toMatch(/caja en apuros/)
  })

  it('con la caja sana, vender no alivia a nadie; sin datos de la caja tampoco', () => {
    expect(saleConsequences({ fee: 6000, balance: 20000, weeklyExpenses: 1000 })).toMatchObject({ board: 0, fans: 0 })
    expect(saleConsequences({ fee: 6000 })).toMatchObject({ board: 0 })
  })

  it('vender al ídolo con la caja en apuros suma las dos cosas', () => {
    expect(saleConsequences({ isIdol: true, fee: 6000, balance: 2000, weeklyExpenses: 1000 })).toMatchObject({ board: 2, fans: -9, locker: -6 })
  })

  it('un sueldo que te pasa del presupuesto salarial molesta a la dirigencia', () => {
    const r = purchaseConsequences({ fee: 5000, marketValue: 5000, balance: 20000, weeklyExpenses: 1000, wageOverBudget: true })
    expect(r.board).toBe(-2)
    expect(r.notes[0]).toMatch(/presupuesto salarial/)
  })

  it('en cuotas solo cuenta lo que se paga hoy, pero deber más de lo que cubre la caja pesa', () => {
    // 40% de $9.000 hoy = $3.600: la caja de $12.000 sigue sana
    expect(purchaseConsequences({ fee: 9000, marketValue: 9000, balance: 12000, weeklyExpenses: 1000, installments: 3 }).board).toBe(0)
    // Con $4.000 de caja no se cubre lo que queda por pagar ($5.400)
    expect(purchaseConsequences({ fee: 9000, marketValue: 9000, balance: 4000, weeklyExpenses: 0, installments: 3 }).board).toBe(-1)
  })
})

