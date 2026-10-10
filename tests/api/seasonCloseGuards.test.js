// Piezas del cierre retomable: la evolución no repite jugadores, y el avance de semana espera al cierre pendiente
const { st, close } = vi.hoisted(() => ({
  st: { squad: [], done: [], histErr: null, writes: [] },
  close: { getPendingClose: vi.fn() }
}))

vi.mock('../../src/api/seasonClose', () => ({ seasonCloseApi: close }))
vi.mock('../../src/api/calendar', () => ({ calendarApi: { advanceWeek: vi.fn() } }))
vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq', 'in', 'update']) q[m] = () => q
    q.upsert = (row) => { st.writes.push({ table, row }); return Promise.resolve({ error: table === 'player_evolution_history' ? st.histErr : null }) }
    q.then = (resolve) => resolve({
      data: table === 'players' ? st.squad : table === 'player_evolution_history' ? st.done : [],
      error: null, count: 7
    })
    return q
  }
  return { supabase: { from: chain, rpc: async () => ({ data: null, error: null }) } }
})

import { playerEvolutionApi } from '../../src/api/playerEvolution'
import { gameLoopApi } from '../../src/api/gameLoop'

const player = (id) => ({ id, club_id: 'me', age: 24, attr_overall: 60, attr_potential: 70, contract_end: '2027-06-30' })

describe('evolución anual retomable', () => {
  beforeEach(() => { st.squad = [player('a'), player('b')]; st.done = []; st.histErr = null; st.writes = [] })

  it('saltea a los que ya evolucionaron en este cierre', async () => {
    st.done = [{ player_id: 'a' }]
    const res = await playerEvolutionApi.processAnnualEvolution('me', 2026)
    expect(res.map(r => r.player.id)).toEqual(['b'])
    expect(st.writes.filter(w => w.table === 'player_evolution_history').map(w => w.row.player_id)).toEqual(['b'])
  })

  it('un error al guardar el historial corta el proceso en vez de ignorarse', async () => {
    st.histErr = { message: 'falló' }
    await expect(playerEvolutionApi.processAnnualEvolution('me', 2026)).rejects.toThrow('falló')
  })

  it('cuenta los que evolucionaron y los que anunciaron retiro', async () => {
    expect(await playerEvolutionApi.countSeasonEvolution('me', 2026)).toEqual({ aged: 7, retiring: 7 })
  })
})

describe('avance de semana con cierre pendiente', () => {
  it('no avanza hasta terminar el cierre', async () => {
    close.getPendingClose.mockResolvedValue({ id: 'p1', stage: 'EVOLUTION_DONE' })
    await expect(gameLoopApi.advanceWeek('me', 'm')).rejects.toThrow('Primero hay que terminar el cierre')
  })
})
