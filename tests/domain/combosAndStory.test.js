import { detectCombos, COMBO_KIND } from '../../src/domain/combos'
import { seasonStory, seasonHeadline, countBySource } from '../../src/domain/seasonStory'
import { DIFFICULTY } from '../../src/domain/consequences'
import { getPrizeForPosition, TOP_SCORER_BONUS } from '../../src/api/seasonClose'

describe('combos y círculos viciosos', () => {
  it('entrada barata y tres victorias seguidas: la fiesta del pueblo', () => {
    const [combo] = detectCombos({ price: 6, streaks: { win: 3 } })
    expect(combo).toMatchObject({ key: 'VILLAGE_PARTY', kind: COMBO_KIND.COMBO, label: 'La fiesta del pueblo' })
    expect(combo.effects).toEqual({ fans: 8, board: 2, locker: 3 })
  })

  it('se dispara una sola vez, justo en la tercera victoria', () => {
    expect(detectCombos({ price: 6, streaks: { win: 2 } })).toEqual([])
    expect(detectCombos({ price: 6, streaks: { win: 4 } })).toEqual([])
    expect(detectCombos({ price: 10, streaks: { win: 3 } })).toEqual([])
  })

  it('entrada cara sin ganar tres semanas: círculo vicioso', () => {
    const [combo] = detectCombos({ price: 16, streaks: { winless: 3 } })
    expect(combo).toMatchObject({ key: 'EXPENSIVE_LOSING', kind: COMBO_KIND.VICIOUS })
    expect(combo.label).toMatch(/Círculo vicioso/)
    expect(combo.effects.fans).toBe(-8)
    expect(detectCombos({ price: 12, streaks: { winless: 3 } })).toEqual([])
  })

  it('tres semanas a máxima intensidad con varios lesionados: plantel reventado', () => {
    const [combo] = detectCombos({ trainingHighWeeks: 3, injuredCount: 4 })
    expect(combo).toMatchObject({ key: 'BURNED_SQUAD', kind: COMBO_KIND.VICIOUS })
    expect(combo.effects.locker).toBe(-8)
    expect(detectCombos({ trainingHighWeeks: 3, injuredCount: 2 })).toEqual([])
    expect(detectCombos({ trainingHighWeeks: 2, injuredCount: 5 })).toEqual([])
  })

  it('seis partidos sin perder: racha de campeón', () => {
    expect(detectCombos({ streaks: { unbeaten: 6, loss: 0 } })[0]).toMatchObject({ key: 'UNBEATEN_SPELL' })
    expect(detectCombos({ streaks: { unbeaten: 7, loss: 0 } })).toEqual([])
  })

  it('la dificultad escala lo negativo y no lo positivo', () => {
    expect(detectCombos({ price: 16, streaks: { winless: 3 } }, DIFFICULTY.REALISTIC)[0].effects.fans).toBe(-10)
    expect(detectCombos({ price: 6, streaks: { win: 3 } }, DIFFICULTY.REALISTIC)[0].effects.fans).toBe(7)
  })

  it('pueden darse varios a la vez', () => {
    const found = detectCombos({ price: 16, streaks: { winless: 3, unbeaten: 0 }, trainingHighWeeks: 3, injuredCount: 3 })
    expect(found.map(c => c.key).sort()).toEqual(['BURNED_SQUAD', 'EXPENSIVE_LOSING'])
  })
})

describe('resumen de historia de la temporada', () => {
  it('cuenta las consecuencias por tipo', () => {
    expect(countBySource([{ source: 'BARRA' }, { source: 'BARRA' }, { source: 'SALE' }])).toEqual({ BARRA: 2, SALE: 1 })
    expect(countBySource()).toEqual({})
  })

  it('el titular depende del resultado', () => {
    expect(seasonHeadline({ position: 1, champion: true })).toMatch(/Campeones/)
    expect(seasonHeadline({ position: 2, promoted: true })).toMatch(/Ascenso/)
    expect(seasonHeadline({ position: 5 })).toMatch(/pelea arriba/)
    expect(seasonHeadline({ position: 10 })).toMatch(/mitad de tabla/)
    expect(seasonHeadline({ position: 19 })).toMatch(/olvidar/)
  })

  it('cuenta el año: posición, barra, favores, escándalos, ventas, combos y caja', () => {
    const story = seasonStory({
      clubName: 'Potrero', position: 8, prize: 2500, cash: 31500,
      state: { favors: 3, scandals: 1 }, counts: { BARRA: 5, SALE: 2, COMBO: 1 }
    })
    const text = story.lines.join(' ')
    expect(text).toContain('Potrero terminó 8.º')
    expect(text).toContain('5 semanas')
    expect(text).toContain('3 favores')
    expect(text).toContain('1 escándalo')
    expect(text).toContain('2 referentes')
    expect(text).toContain('1 combinaciones')
    expect(text).toContain('$31.500')
    expect(text).toContain('$2.500 de premios')
  })

  it('un año limpio y sin barra se cuenta como tal', () => {
    const text = seasonStory({ position: 3, state: {}, counts: {}, cash: 10000 }).lines.join(' ')
    expect(text).toContain('no te molestó')
    expect(text).toContain('Te mantuviste limpio')
  })

  it('el campeón y el ascenso se mencionan en la primera línea', () => {
    expect(seasonStory({ clubName: 'Potrero', position: 1, champion: true }).lines[0]).toContain('se quedó con el título')
    expect(seasonStory({ clubName: 'Potrero', position: 2, promoted: true }).lines[0]).toContain('ascendió')
  })
})

describe('premios de la temporada en la economía chica', () => {
  it('el campeón cobra bastante menos que antes y siempre por posición decreciente', () => {
    expect(getPrizeForPosition(1)).toBe(12000)
    expect(getPrizeForPosition(2)).toBe(8000)
    expect(getPrizeForPosition(4)).toBe(5000)
    expect(getPrizeForPosition(10)).toBe(2500)
    expect(getPrizeForPosition(19)).toBe(1000)
    const prizes = [1, 2, 4, 10, 19].map(getPrizeForPosition)
    expect([...prizes].sort((a, b) => b - a)).toEqual(prizes)
    expect(TOP_SCORER_BONUS).toBe(1500)
  })
})
