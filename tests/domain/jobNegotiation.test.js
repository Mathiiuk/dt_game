import { negotiateJob, JOB_MAX_ROUNDS, maxRaiseRatio } from '../../src/domain/jobNegotiation'

describe('cuánto margen te da el club', () => {
  it('sin ventaja de reputación admite un 5% más; con 20 puntos o más de ventaja, hasta 30%', () => {
    expect(maxRaiseRatio(50, 50)).toBeCloseTo(1.05)
    expect(maxRaiseRatio(60, 50)).toBeCloseTo(1.175)
    expect(maxRaiseRatio(70, 50)).toBeCloseTo(1.30)
    expect(maxRaiseRatio(99, 50)).toBeCloseTo(1.30)
    expect(maxRaiseRatio(40, 50)).toBeCloseTo(1.05)
  })
})

describe('negociar una oferta de trabajo', () => {
  const base = { offered: 1000, reputation: 60, requiredReputation: 50, round: 1 }

  it('un pedido dentro del margen se acepta al monto pedido', () => {
    expect(negotiateJob({ ...base, ask: 1150 })).toEqual({ status: 'ACCEPTED', wage: 1150, round: 1 })
  })
  it('un pedido que se pasa un poco recibe una contraoferta con lo máximo que da el club', () => {
    expect(negotiateJob({ ...base, ask: 1300 })).toEqual({ status: 'COUNTER', wage: 1175, round: 1 })
  })
  it('un pedido desmedido ofende y el club retira la oferta', () => {
    const r = negotiateJob({ ...base, ask: 2000 })
    expect(r.status).toBe('WITHDRAWN')
    expect(r.wage).toBe(0)
  })
  it('pedir igual o menos de lo que ofrecen no es una negociación', () => {
    expect(negotiateJob({ ...base, ask: 1000 }).status).toBe('INVALID')
    expect(negotiateJob({ ...base, ask: 900 }).status).toBe('INVALID')
  })
  it('en la segunda ronda el club ya no se mueve: acepta si el pedido es mínimo y si no queda en lo que ofreció', () => {
    expect(negotiateJob({ ...base, round: 2, offered: 1175, ask: 1200 })).toEqual({ status: 'ACCEPTED', wage: 1200, round: 2 })
    expect(negotiateJob({ ...base, round: 2, offered: 1175, ask: 1300 })).toEqual({ status: 'FINAL', wage: 1175, round: 2 })
  })
  it('después de las rondas permitidas no se puede seguir negociando', () => {
    expect(JOB_MAX_ROUNDS).toBe(2)
    expect(negotiateJob({ ...base, round: 3, ask: 1100 }).status).toBe('CLOSED')
  })
  it('con más reputación el mismo pedido se acepta', () => {
    expect(negotiateJob({ ...base, reputation: 50, ask: 1150 }).status).toBe('COUNTER')
    expect(negotiateJob({ ...base, reputation: 70, ask: 1150 }).status).toBe('ACCEPTED')
  })
})
