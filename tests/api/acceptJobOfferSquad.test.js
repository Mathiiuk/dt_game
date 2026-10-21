// Firmar con un club de la IA le da plantel: esos clubes no tienen jugadores (juegan con su fuerza)
const state = { calls: [] }

vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn() } }))
vi.mock('../../src/api/player', () => ({
  playerApi: { generateInitialSquad: vi.fn(async (clubId) => { state.calls.push({ squad: clubId }); return [] }) }
}))
vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq', 'is', 'order', 'limit']) q[m] = () => q
    q.update = (row) => { state.calls.push({ table, update: row }); return q }
    q.insert = (row) => { state.calls.push({ table, insert: row }); return q }
    q.maybeSingle = async () => ({ data: { id: 'o1', offering_club_id: 'c2', wage_offered: 900 }, error: null })
    q.single = async () => ({ data: { id: 'c2', name: 'Flandria', league_tier: 3 }, error: null })
    q.then = (resolve) => resolve({ data: null, error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { careerApi } from '../../src/api/career'
import { playerApi } from '../../src/api/player'

describe('aceptar una oferta de trabajo genera el plantel del club nuevo', () => {
  beforeEach(() => { state.calls = []; playerApi.generateInitialSquad.mockClear() })

  it('pide el plantel del club nuevo', async () => {
    const res = await careerApi.acceptJobOffer('m1', 'o1', 'c1')
    expect(res).toMatchObject({ success: true, newClubId: 'c2' })
    expect(playerApi.generateInitialSquad).toHaveBeenCalledWith('c2')
  })

  it('el plantel existe antes de que el DT quede vinculado al club', async () => {
    await careerApi.acceptJobOffer('m1', 'o1', 'c1')
    const squadAt = state.calls.findIndex(c => c.squad === 'c2')
    const linkAt = state.calls.findIndex(c => c.table === 'clubs' && c.update?.manager_id === 'm1')
    expect(squadAt).toBeGreaterThanOrEqual(0)
    expect(squadAt).toBeLessThan(linkAt)
  })

  it('si el plantel no se puede generar, la firma no sigue', async () => {
    playerApi.generateInitialSquad.mockRejectedValueOnce(new Error('sin red'))
    await expect(careerApi.acceptJobOffer('m1', 'o1', 'c1')).rejects.toThrow(/sin red/)
    expect(state.calls.some(c => c.table === 'clubs' && c.update?.manager_id === 'm1')).toBe(false)
  })
})
