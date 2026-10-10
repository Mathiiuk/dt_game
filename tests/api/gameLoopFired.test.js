// Despido al avanzar la semana: el DT queda sin empleo con columnas que existen (antes escribía `is_looking_for_job`, que no existe)
const { writes, state } = vi.hoisted(() => ({ writes: [], state: { board: 0 } }))

vi.mock('../../src/api/seasonClose', () => ({ seasonCloseApi: { getPendingClose: async () => null } }))
vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn(async () => true) } }))
vi.mock('../../src/api/calendar', () => ({
  calendarApi: { resolveCareerId: async () => null, advanceWeek: async () => ({ week: 5, date: '2026-08-05', phase: 'REGULAR', stats: {} }) }
}))
vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq']) q[m] = () => q
    q.single = async () => ({ data: { board_confidence: state.board }, error: null })
    q.update = (row) => { writes.push({ table, row }); return q }
    q.then = (r) => r({ data: null, error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { gameLoopApi } from '../../src/api/gameLoop'

describe('despido al avanzar la semana', () => {
  beforeEach(() => { writes.length = 0 })

  it('con confianza 0 libera el club y deja al DT desempleado, sin tocar columnas inexistentes', async () => {
    state.board = 0
    const res = await gameLoopApi.advanceWeek('c1', 'm1')
    expect(res.fired).toBe(true)
    expect(writes).toContainEqual({ table: 'clubs', row: { manager_id: null } })
    const mgr = writes.find(w => w.table === 'managers')
    expect(mgr.row).toMatchObject({ employment_status: 'UNEMPLOYED' })
    expect(mgr.row).not.toHaveProperty('is_looking_for_job')
  })

  it('con confianza normal no despide a nadie', async () => {
    state.board = 40
    const res = await gameLoopApi.advanceWeek('c1', 'm1')
    expect(res.fired).toBe(false)
    expect(writes).toHaveLength(0)
  })
})
