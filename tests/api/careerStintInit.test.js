// Dos pantallas piden la trayectoria a la vez: el primer ciclo en el club se crea una sola vez
const state = { stints: [], inserts: 0 }

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    let op = 'select'
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.order = async () => ({ data: table === 'manager_career_stints' ? [...state.stints] : [], error: null })
    q.insert = (row) => { op = 'insert'; if (table === 'manager_career_stints') { state.inserts++; state.stints.push({ id: `s${state.inserts}`, ...row }) } return q }
    const read = () => (table === 'clubs' ? { id: 'c1', name: 'Potrero' } : table === 'managers' ? { id: 'm1', reputation: 10 } : op === 'insert' ? state.stints.at(-1) : null)
    q.single = async () => ({ data: read(), error: null })
    q.maybeSingle = async () => ({ data: read(), error: null })
    q.then = (resolve) => resolve({ data: [], error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { careerApi } from '../../src/api/career'

describe('trayectoria: primer ciclo', () => {
  beforeEach(() => { state.stints = []; state.inserts = 0 })

  it('dos pedidos simultáneos crean un solo ciclo', async () => {
    await Promise.all([careerApi.getCareerStats('m1', 'c1'), careerApi.getCareerStats('m1', 'c1')])
    expect(state.inserts).toBe(1)
  })
})
