import {
  ticketPriceWarning, trainingWarning, saleWarning, purchaseWarning, isWarningMuted, shouldReactivateWarnings, WARNING_KEYS, WARNING_LABELS
} from '../../src/domain/warnings'

describe('avisos antes de una acción riesgosa', () => {
  it('la entrada cara con el equipo sin ganar avisa; con victorias o precio normal no', () => {
    const high = ticketPriceWarning({ price: 18, streaks: { winless: 3 } })
    expect(high).toMatchObject({ key: 'TICKET_PRICE', level: 'HIGH', variant: 'danger' })
    expect(high.description).toMatch(/6 por semana/)
    expect(ticketPriceWarning({ price: 13, streaks: { winless: 2 } })).toMatchObject({ level: 'MEDIUM', variant: 'primary' })
    expect(ticketPriceWarning({ price: 18, streaks: { win: 3 } })).toBeNull()
    expect(ticketPriceWarning({ price: 10, streaks: { winless: 5 } })).toBeNull()
  })

  it('entrenar fuerte avisa solo si hay motivo, y explica cuál', () => {
    expect(trainingWarning({ intensity: 'MEDIUM', consecutiveHigh: 3 })).toBeNull()
    expect(trainingWarning({ intensity: 'HIGH', avgFitness: 85 })).toBeNull()
    const w = trainingWarning({ intensity: 'HIGH', consecutiveHigh: 2, avgFitness: 55 })
    expect(w).toMatchObject({ key: 'TRAINING_HIGH', level: 'HIGH' })
    expect(w.description).toMatch(/2 semanas seguidas/)
    expect(w.description).toMatch(/55/)
    expect(trainingWarning({ intensity: 'HIGH', matchInDays: 1, avgFitness: 80 }).level).toBe('MEDIUM')
  })

  it('vender al ídolo es riesgo alto y al capitán medio; a un jugador común no avisa', () => {
    expect(saleWarning({ isIdol: true, playerName: 'Ríos' })).toMatchObject({ level: 'HIGH', title: 'Ríos es un referente' })
    expect(saleWarning({ isCaptain: true })).toMatchObject({ level: 'MEDIUM' })
    expect(saleWarning({})).toBeNull()
  })

  it('un fichaje caro avisa con el efecto estimado', () => {
    expect(purchaseWarning({ fee: 5000, marketValue: 5000, balance: 20000, weeklyExpenses: 1000 })).toBeNull()
    expect(purchaseWarning({ fee: 7000, marketValue: 5000, balance: 20000, weeklyExpenses: 1000 })).toMatchObject({ level: 'MEDIUM' })
    expect(purchaseWarning({ fee: 9000, marketValue: 9000, balance: 12000, weeklyExpenses: 1000 })).toMatchObject({ level: 'HIGH' })
  })

  it('todas las claves tienen su etiqueta', () => {
    for (const key of Object.values(WARNING_KEYS)) expect(WARNING_LABELS[key]).toBeTruthy()
  })
})

describe('silenciar avisos', () => {
  it('detecta los silenciados', () => {
    expect(isWarningMuted({ TICKET_PRICE: true }, 'TICKET_PRICE')).toBe(true)
    expect(isWarningMuted({}, 'TICKET_PRICE')).toBe(false)
    expect(isWarningMuted(null, 'TICKET_PRICE')).toBe(false)
  })

  it('se reactivan tras un escándalo nuevo o al llegar a 5 victorias seguidas', () => {
    expect(shouldReactivateWarnings({ previousScandals: 0, scandals: 1, winStreak: 0 })).toBe(true)
    expect(shouldReactivateWarnings({ previousScandals: 1, scandals: 1, winStreak: 5 })).toBe(true)
    expect(shouldReactivateWarnings({ previousScandals: 1, scandals: 1, winStreak: 4 })).toBe(false)
    expect(shouldReactivateWarnings({ previousScandals: 1, scandals: 1, winStreak: 6 })).toBe(false)
  })
})
