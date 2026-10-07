// La conferencia de prensa pregunta por la situación (racha, ex jugador, refuerzo) y recuerda cómo contestaste
const state = { streaks: { win: 0, loss: 0, unbeaten: 0 }, buys: [], sold: [], conferences: [], inserted: [], fixture: { home_club_id: 'c1', away_club_id: 'rival' } }

vi.mock('../../src/api/morale', () => ({ moraleApi: { getStreaks: vi.fn(async () => state.streaks) } }))
vi.mock('../../src/api/climate', () => ({ climateApi: { applySquadConsequence: vi.fn(), difficulty: { key: 'NORMAL' } } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = { _filters: {} }
    for (const m of ['select', 'order', 'limit', 'in', 'or']) q[m] = () => q
    q.eq = (col, val) => { q._filters[col] = val; return q }
    q.insert = (rows) => { q._insert = rows; return q }
    q.update = () => q
    const read = () => {
      if (table === 'clubs') return { game_date: '2026-10-07' }
      if (table === 'fixtures') return state.fixture
      if (table === 'players') return { first_name: 'Matías', last_name: 'Ferreyra' }
      if (table === 'press_conferences') return q._insert ? { id: 'conf1' } : null
      return null
    }
    q.single = async () => ({ data: read(), error: null })
    q.maybeSingle = async () => ({ data: read(), error: null })
    q.then = (resolve) => {
      if (table === 'transfer_audit_log') return resolve({ data: q._filters.to_club_id ? state.buys : state.sold, error: null })
      if (table === 'press_conferences') return resolve({ data: state.conferences, error: null })
      if (table === 'press_qa_items' && q._insert) { state.inserted = q._insert; return resolve({ data: q._insert, error: null }) }
      return resolve({ data: [], error: null })
    }
    return q
  }
  return { supabase: { from: chain } }
})

import { pressApi } from '../../src/api/press'

const baseParams = { fixtureId: 'f1', clubId: 'c1', managerId: 'm1', results: { isHome: true, homeScore: 0, awayScore: 1, opponentName: 'Rival' }, mvpPlayer: { id: 'p9', name: 'Julián Gómez' }, isDerby: false }

describe('contexto de la conferencia de prensa', () => {
  beforeEach(() => {
    state.streaks = { win: 0, loss: 0, unbeaten: 0 }
    state.buys = []
    state.sold = []
    state.conferences = []
    state.inserted = []
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('reúne las rachas, el refuerzo que fue la figura y el ex jugador del rival', async () => {
    state.streaks = { win: 0, loss: 4, unbeaten: 0 }
    state.buys = [{ player_id: 'p9' }]
    state.sold = [{ player_id: 'p7' }]
    const ctx = await pressApi.buildPressContext({ clubId: 'c1', fixtureId: 'f1', mvpPlayer: { id: 'p9', name: 'Julián Gómez' } })
    expect(ctx).toEqual({ winStreak: 0, lossStreak: 4, unbeaten: 0, mvpSigningName: 'Julián Gómez', exPlayerName: 'Matías Ferreyra' })
  })

  it('si la figura no es un refuerzo de esta temporada o el rival no tiene ex jugadores, esos datos no aparecen', async () => {
    const ctx = await pressApi.buildPressContext({ clubId: 'c1', fixtureId: 'f1', mvpPlayer: { id: 'p9', name: 'Julián Gómez' } })
    expect(ctx.mvpSigningName).toBeUndefined()
    expect(ctx.exPlayerName).toBeUndefined()
  })

  it('el historial de tonos sale de las conferencias anteriores', async () => {
    state.conferences = [{ press_qa_items: [{ chosen_tone: 'COMBATIVE', order_index: 1 }] }, { press_qa_items: [{ chosen_tone: 'PRAISING', order_index: 1 }] }]
    expect(await pressApi.toneMemory('c1')).toEqual(['COMBATIVE', 'PRAISING'])
  })
})

describe('la conferencia incluye las preguntas nuevas', () => {
  beforeEach(() => {
    state.streaks = { win: 0, loss: 0, unbeaten: 0 }
    state.buys = []
    state.sold = []
    state.conferences = []
    state.inserted = []
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('con una racha de 4 derrotas pregunta por la crisis y nunca pasa de 4 preguntas', async () => {
    state.streaks = { win: 0, loss: 4, unbeaten: 0 }
    state.conferences = [3, 2, 1].map(() => ({ press_qa_items: [{ chosen_tone: 'COMBATIVE', order_index: 1 }] }))
    await pressApi._generatePostMatchConference(baseParams)
    const cats = state.inserted.map(q => q.topic_category)
    expect(cats).toContain('BAD_RUN_CRISIS')
    expect(cats).toContain('MEDIA_RELATIONSHIP')
    expect(state.inserted.length).toBeLessThanOrEqual(4)
    expect(state.inserted.map(q => q.order_index)).toEqual([1, 2, 3, 4])
  })

  it('en un clásico se mantiene la pregunta del clásico y se suma la de la situación', async () => {
    state.streaks = { win: 3, loss: 0, unbeaten: 3 }
    await pressApi._generatePostMatchConference({ ...baseParams, isDerby: true })
    const cats = state.inserted.map(q => q.topic_category)
    expect(cats).toContain('NEXT_DERBY_HYPE')
    expect(cats.filter(c => c === 'STAR_PERFORMANCE').length).toBeGreaterThanOrEqual(2)
    expect(state.inserted.length).toBe(4)
  })
})
