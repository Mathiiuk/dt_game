import { roundSteps } from '../../src/features/friends/RoundPanel'

const fx = [{ id: 'a' }, { id: 'b' }]
const status = (...ready) => ready.map((r, i) => ({ user_id: `u${i}`, ready: r }))

describe('pasos de la fecha en la sala', () => {
  it('abre en el primer paso pendiente: planteo, después prode, después quiénes', () => {
    expect(roundSteps({ plan: null, picks: {}, nextFixtures: fx, status: status(false, true) }).first).toBe('planteo')
    expect(roundSteps({ plan: { stance: 'CONTRA' }, picks: {}, nextFixtures: fx, status: status(true, false) }).first).toBe('prode')
    expect(roundSteps({ plan: { stance: 'CONTRA' }, picks: { a: 'L', b: 'V' }, nextFixtures: fx, status: status(true, false) }).first).toBe('quienes')
  })

  it('cuenta lo que falta y lo detalla en cada paso', () => {
    const r = roundSteps({ plan: null, picks: { a: 'L' }, nextFixtures: fx, status: status(true, false, false) })
    expect(r.pending.map(p => p.id)).toEqual(['planteo', 'prode'])
    expect(r.steps.find(s => s.id === 'prode').detail).toBe('1/2')
    expect(r.steps.find(s => s.id === 'quienes').detail).toBe('1/3')
  })

  it('sin partidos para pronosticar el prode no bloquea; con todo hecho no queda nada pendiente', () => {
    const r = roundSteps({ plan: { stance: 'PRESION' }, picks: {}, nextFixtures: [], status: status(true, true) })
    expect(r.pending).toEqual([])
    expect(r.steps.every(s => s.done)).toBe(true)
  })
})
