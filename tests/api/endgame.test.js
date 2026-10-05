// Epílogo: retiro del DT, crónica, idempotencia y sucesión
const state = { snapshot: null, manager: { id: 'm1', first_name: 'Marcelo', last_name: 'Gallardo', is_retired: false, user_id: 'u1' }, writes: [], audits: [] }

vi.mock('../../src/api/career', () => ({
  careerApi: { getCareerStats: vi.fn(async () => ({ totalMatches: 120, totalWon: 70, totalDrawn: 20, totalLost: 30, winRate: 58, trophies: [{ name: 'Liga' }, { name: 'Copa' }] })) }
}))
vi.mock('../../src/api/hallOfFame', () => ({
  hallOfFameApi: {
    calculateLegacyScore: () => 640,
    getLegacyTier: () => ({ title: 'Leyenda del banco' }),
    inductManager: vi.fn(async () => ({ id: 'hof1' }))
  }
}))
vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn(async (args) => { state.audits.push(args); return true }) } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    let op = 'select'
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.order = () => q
    q.limit = () => q
    q.insert = (rows) => { op = 'insert'; state.writes.push({ table, op, rows }); return q }
    q.update = (row) => { op = 'update'; state.writes.push({ table, op, row }); return q }
    const read = () => {
      if (table === 'managers') return state.manager
      if (table === 'career_snapshots') return op === 'insert' ? { id: 'snap1', ...state.writes.at(-1).rows[0] } : state.snapshot
      if (table === 'clubs') return { name: 'Potrero' }
      return null
    }
    q.single = async () => ({ data: read(), error: null })
    q.maybeSingle = async () => ({ data: read(), error: null })
    q.then = (resolve) => resolve({ data: null, error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { endgameApi } from '../../src/api/endgame'

describe('crónica del retiro', () => {
  const stats = (extra) => ({ trophies: [], totalMatches: 50, totalWon: 20, winRate: 40, ...extra })

  it('el titular cambia según los títulos', () => {
    expect(endgameApi.generateNewspaperChronicle('Marcelo', stats({ trophies: [1, 2, 3] }), 'Leyenda', 'Potrero').headline).toMatch(/INMORTAL/)
    expect(endgameApi.generateNewspaperChronicle('Marcelo', stats({ trophies: [1] }), 'Leyenda', 'Potrero').headline).toMatch(/ERA DE GLORIA/)
    expect(endgameApi.generateNewspaperChronicle('Marcelo', stats(), 'Leyenda', 'Potrero').headline).toMatch(/GUERRERO/)
    expect(endgameApi.generateNewspaperChronicle('Marcelo', stats({ legacyScore: 1200 }), 'Leyenda', 'Potrero').headline).toMatch(/INMORTAL/)
  })

  it('el texto incluye el nombre, los partidos, las victorias y el club', () => {
    const c = endgameApi.generateNewspaperChronicle('Marcelo Gallardo', stats(), 'Leyenda', 'Potrero')
    expect(c.paragraphs).toHaveLength(3)
    expect(c.epilogueText).toContain('Marcelo Gallardo')
    expect(c.epilogueText).toContain('50 partidos')
    expect(c.epilogueText).toContain('Potrero')
    expect(endgameApi.generateNewspaperChronicle('M', stats(), 'L', '').epilogueText).toContain('su equipo')
  })
})

describe('retiro del DT', () => {
  beforeEach(() => { state.snapshot = null; state.writes = []; state.audits = []; state.manager = { ...state.manager, is_retired: false } })

  it('guarda el epílogo, marca al DT como retirado, libera el club y registra la auditoría', async () => {
    const snap = await endgameApi.processRetirement('m1', 'c1')
    expect(snap).toMatchObject({ manager_name: 'Marcelo Gallardo', club_name: 'Potrero', legacy_rank: 'Leyenda del banco', titles_count: 2, hall_of_fame_id: 'hof1', total_matches: 120 })
    expect(state.writes.find(w => w.table === 'career_snapshots' && w.op === 'insert')).toBeTruthy()
    expect(state.writes.find(w => w.table === 'managers' && w.op === 'update').row).toEqual({ is_retired: true })
    expect(state.writes.find(w => w.table === 'clubs' && w.op === 'update').row).toEqual({ manager_id: null })
    // La auditoría ahora sí se registra (antes se llamaba con argumentos sueltos y se perdía)
    expect(state.audits).toHaveLength(1)
    expect(state.audits[0]).toMatchObject({ whoId: 'm1', action: 'ENDGAME_MANAGER_RETIRED', stateAfter: expect.objectContaining({ is_retired: true, snapshotId: 'snap1' }) })
  })

  it('es idempotente: si ya hay epílogo lo devuelve sin escribir nada', async () => {
    state.snapshot = { id: 'viejo', manager_name: 'Marcelo Gallardo' }
    const snap = await endgameApi.processRetirement('m1', 'c1')
    expect(snap.id).toBe('viejo')
    expect(state.writes).toEqual([])
    expect(state.audits).toEqual([])
  })

  it('sin DT no hace nada', async () => {
    await expect(endgameApi.processRetirement(null)).rejects.toThrow(/requerido/)
    expect(await endgameApi.getEndgameSnapshot(null)).toBeNull()
  })
})

describe('nueva dinastía', () => {
  beforeEach(() => { state.audits = [] })

  it('solo se puede suceder a un DT retirado', async () => {
    state.manager = { ...state.manager, is_retired: false }
    await expect(endgameApi.startNewDynasty('u1', 'm1')).rejects.toThrow(/todavía no se retiró/)
  })

  it('con el DT retirado registra el inicio de la dinastía', async () => {
    state.manager = { ...state.manager, is_retired: true }
    await expect(endgameApi.startNewDynasty('u1', 'm1')).resolves.toEqual({ success: true })
    expect(state.audits[0]).toMatchObject({ whoId: 'u1', action: 'DYNASTY_STARTED', entityId: 'm1' })
  })

  it('faltan parámetros', async () => {
    await expect(endgameApi.startNewDynasty(null, 'm1')).rejects.toThrow(/insuficientes/)
  })
})
