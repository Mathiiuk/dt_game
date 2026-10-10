// Cierre de temporada: el servidor lee la tabla de la liga del club aislando las demás
const state = { rpc: [], writes: [] }

vi.mock('../../src/api/playerEvolution', () => ({ playerEvolutionApi: { processAnnualEvolution: vi.fn(async () => []), countSeasonEvolution: vi.fn(async () => ({ aged: 0, retiring: 0 })) } }))

vi.mock('../../src/api/supabase', () => {
  return { 
    supabase: { 
      rpc: async (fn, args) => { 
        state.rpc.push({ fn, args })
        if (args.p_club_id === 'sin-liga') return { error: { message: 'No está en ninguna liga' } }
        return { data: { success: true, standingsJson: [], newSeasonYear: 2027 }, error: null } 
      },
      from: () => {
        const q = { insert: () => Promise.resolve({ error: null }), maybeSingle: async () => ({ data: null, error: null }), then: (resolve) => resolve({ data: [], error: null }) }
        for (const m of ['select', 'eq', 'is', 'limit', 'update']) q[m] = () => q
        return q
      }
    } 
  }
})

import { seasonCloseApi } from '../../src/api/seasonClose'

describe('fin de temporada y ligas aisladas', () => {
  beforeEach(() => {
    state.rpc = []
    state.writes = []
  })

  it('el cierre oficial delega la lectura de la tabla de la liga del club al servidor', async () => {
    await seasonCloseApi.executeSeasonClose({ careerId: null, clubId: 'me', seasonYear: 2026 })
    expect(state.rpc[0]).toEqual({ fn: 'close_season_atomic', args: { p_club_id: 'me', p_career_id: null, p_season_year: 2026 } })
  })

  it('falla limpiamente si el servidor devuelve error porque el club no tiene liga', async () => {
    await expect(seasonCloseApi.executeSeasonClose({ careerId: null, clubId: 'sin-liga', seasonYear: 2026 }))
      .rejects.toThrow('No está en ninguna liga')
  })
})
