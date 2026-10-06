// Bingo del DT y Titular o fake: guardan la cartilla por temporada y cobran los premios en hinchada y dirigencia
const state = { club: { game_date: '2026-09-01' }, climate: { press_bingo: {} }, saves: [], consequences: [] }

vi.mock('../../src/api/climate', () => ({
  climateApi: {
    difficulty: { key: 'NORMAL' },
    saveState: vi.fn(async (clubId, patch) => { state.saves.push({ clubId, patch }) }),
    applySquadConsequence: vi.fn(async (args) => { state.consequences.push(args) })
  }
}))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq']) q[m] = () => q
    q.maybeSingle = async () => ({ data: table === 'clubs' ? state.club : state.climate })
    return q
  }
  return { supabase: { from: chain } }
})

import { pressApi } from '../../src/api/press'
import { bingoCard, BINGO_LINES } from '../../src/domain/pressRoom'

describe('Bingo del DT en la base', () => {
  beforeEach(() => {
    state.club = { game_date: '2026-09-01' }
    state.climate = { press_bingo: {} }
    state.saves = []
    state.consequences = []
  })

  it('la cartilla es la de la temporada del juego y arranca sin clichés tachados', async () => {
    const bingo = await pressApi.getBingo('c1')
    expect(bingo.season).toBe(2026)
    expect(bingo.card).toEqual(bingoCard('c1:2026'))
    expect(bingo.marks).toEqual([])
  })

  it('al empezar otra temporada se reinicia la cartilla', async () => {
    state.climate = { press_bingo: { season: 2025, marks: ['W1'] } }
    expect((await pressApi.getBingo('c1')).marks).toEqual([])
    state.climate = { press_bingo: { season: 2026, marks: ['W1'] } }
    expect((await pressApi.getBingo('c1')).marks).toEqual(['W1'])
  })

  it('tachar un cliché de la cartilla lo guarda; sin premio todavía', async () => {
    const card = bingoCard('c1:2026')
    const res = await pressApi.markBingo({ clubId: 'c1', cliche: card[0] })
    expect(state.saves[0].patch.press_bingo).toMatchObject({ season: 2026, marks: [card[0]], lines: 0 })
    expect(res.marks).toEqual([card[0]])
    expect(state.consequences).toEqual([])
  })

  it('completar una línea cobra +2 de hinchada y +1 de dirigencia, una sola vez', async () => {
    const card = bingoCard('c1:2026')
    const [a, b, c] = BINGO_LINES[0].map(i => card[i])
    state.climate = { press_bingo: { season: 2026, marks: [a, b] } }
    const res = await pressApi.markBingo({ clubId: 'c1', cliche: c })
    expect(res.newLines).toBe(1)
    expect(state.consequences).toHaveLength(1)
    expect(state.consequences[0]).toMatchObject({ clubId: 'c1', source: 'PRESS', effects: { fans: 2, board: 1 } })
    expect(state.consequences[0].effects.notes[0]).toMatch(/línea/)
    // Repetir el mismo cliché no cobra de nuevo
    state.climate = { press_bingo: { season: 2026, marks: [a, b, c] } }
    state.consequences = []
    await pressApi.markBingo({ clubId: 'c1', cliche: c })
    expect(state.consequences).toEqual([])
  })

  it('un cliché que no está en la cartilla no cambia nada', async () => {
    await pressApi.markBingo({ clubId: 'c1', cliche: 'nada' })
    expect(state.saves).toEqual([])
  })

  it('Titular o fake: acertar suma a la dirigencia y errar resta a la hinchada', async () => {
    await pressApi.applyHeadline({ clubId: 'c1', fans: 0, board: 1 })
    await pressApi.applyHeadline({ clubId: 'c1', fans: -1, board: 0 })
    expect(state.consequences[0].effects).toMatchObject({ board: 1 })
    expect(state.consequences[1].effects).toMatchObject({ fans: -1 })
    expect(await pressApi.applyHeadline({ clubId: 'c1' })).toBeNull()
  })
})
