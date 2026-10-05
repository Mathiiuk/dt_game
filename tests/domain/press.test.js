import { outcomeOf, answerConsequences, pressFine, skipPress } from '../../src/domain/press'
import { DIFFICULTY } from '../../src/domain/consequences'

describe('resultado del partido', () => {
  it('se calcula desde el lado del club', () => {
    expect(outcomeOf({ isHome: true, homeScore: 2, awayScore: 1 })).toBe('W')
    expect(outcomeOf({ isHome: false, homeScore: 2, awayScore: 1 })).toBe('L')
    expect(outcomeOf({ isHome: false, homeScore: 1, awayScore: 1 })).toBe('D')
  })
})

describe('respuestas en la conferencia', () => {
  it('asumir la derrota suma con la dirigencia y echarle la culpa al árbitro resta', () => {
    expect(answerConsequences({ tone: 'SELF_CRITICAL', outcome: 'L' })).toEqual({ fans: 1, board: 2 })
    expect(answerConsequences({ tone: 'COMBATIVE', outcome: 'L' })).toEqual({ fans: 0, board: -2 })
  })

  it('con victoria, el elogio al grupo agrada y el tono pendenciero incomoda a la dirigencia', () => {
    expect(answerConsequences({ tone: 'PRAISING', outcome: 'W' })).toEqual({ fans: 1, board: 1 })
    expect(answerConsequences({ tone: 'COMBATIVE', outcome: 'W' }).board).toBe(-1)
  })

  it('un tono desconocido no cambia nada y la dificultad escala lo negativo', () => {
    expect(answerConsequences({ tone: 'X', outcome: 'W' })).toEqual({ fans: 0, board: 0 })
    expect(answerConsequences({ tone: 'COMBATIVE', outcome: 'L' }, DIFFICULTY.REALISTIC).board).toBe(-3)
  })
})

describe('multa por no presentarse', () => {
  it('derrota: de 200 a 500 según el marcador; empate 100; victoria 300', () => {
    expect(pressFine({ outcome: 'L', goalDiff: -1 }).fine).toBe(300)
    expect(pressFine({ outcome: 'L', goalDiff: -5 }).fine).toBe(500)
    expect(pressFine({ outcome: 'L', goalDiff: 0 }).fine).toBe(200)
    expect(pressFine({ outcome: 'D' }).fine).toBe(100)
    expect(pressFine({ outcome: 'W', goalDiff: 2 }).fine).toBe(300)
  })

  it('con la dirigencia arriba de 70 la multa se reduce a la mitad', () => {
    expect(pressFine({ outcome: 'W', boardConfidence: 71 })).toEqual({ fine: 150, covered: true })
    expect(pressFine({ outcome: 'W', boardConfidence: 70 })).toEqual({ fine: 300, covered: false })
  })
})

describe('omitir la conferencia', () => {
  it('derrota: rumor, nada o la hinchada lo entiende según el azar', () => {
    const rumor = skipPress({ outcome: 'L', goalDiff: -1 }, DIFFICULTY.NORMAL, () => 0.3)
    expect(rumor).toMatchObject({ kind: 'RUMOR', fans: -3, board: -3, fine: 300 })

    const nothing = skipPress({ outcome: 'L', goalDiff: -1 }, DIFFICULTY.NORMAL, () => 0.7)
    expect(nothing).toMatchObject({ kind: 'NOTHING', fans: -1, board: 0 })

    const understood = skipPress({ outcome: 'L', goalDiff: -1 }, DIFFICULTY.NORMAL, () => 0.95)
    expect(understood).toMatchObject({ kind: 'UNDERSTOOD', fans: 2 })
  })

  it('las probabilidades de la derrota son 55 / 35 / 10', () => {
    const count = { RUMOR: 0, NOTHING: 0, UNDERSTOOD: 0 }
    for (let i = 0; i < 100; i++) count[skipPress({ outcome: 'L' }, DIFFICULTY.NORMAL, () => (i + 0.5) / 100).kind]++
    expect(count).toEqual({ RUMOR: 55, NOTHING: 35, UNDERSTOOD: 10 })
  })

  it('victoria: la soberbia pasa la mitad de las veces', () => {
    const count = { ARROGANCE: 0, NOTHING: 0 }
    for (let i = 0; i < 100; i++) count[skipPress({ outcome: 'W' }, DIFFICULTY.NORMAL, () => (i + 0.5) / 100).kind]++
    expect(count).toEqual({ ARROGANCE: 50, NOTHING: 50 })
  })

  it('empate: 35% de molestia', () => {
    const count = { ANNOYED: 0, NOTHING: 0 }
    for (let i = 0; i < 100; i++) count[skipPress({ outcome: 'D' }, DIFFICULTY.NORMAL, () => (i + 0.5) / 100).kind]++
    expect(count).toEqual({ ANNOYED: 35, NOTHING: 65 })
  })

  it('si el presidente te cubre, el mensaje lo dice', () => {
    expect(skipPress({ outcome: 'W', boardConfidence: 80 }, DIFFICULTY.NORMAL, () => 0.9).message).toMatch(/presidente te cubre/)
  })
})
