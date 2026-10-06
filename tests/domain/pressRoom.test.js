import { PRESS_SECONDS, timeoutOption, roomReaction, phraseRound, phraseResult } from '../../src/domain/pressRoom'

describe('rueda de prensa relámpago', () => {
  it('se acaba el tiempo: se responde con la opción más cauta, o la última si no hay', () => {
    const options = [{ tone: 'COMBATIVE', text: 'a' }, { tone: 'PRAGMATIC', text: 'b' }, { tone: 'PRAISING', text: 'c' }]
    expect(timeoutOption(options).tone).toBe('PRAGMATIC')
    expect(timeoutOption([{ tone: 'COMBATIVE' }, { tone: 'PRAISING' }]).tone).toBe('PRAISING')
    expect(timeoutOption([])).toBeNull()
    expect(PRESS_SECONDS).toBeGreaterThanOrEqual(8)
  })

  it('la sala reacciona distinto según el tono y el resultado, con el signo de lo que pasa', () => {
    const lossCombative = roomReaction({ tone: 'COMBATIVE', outcome: 'L' })
    expect(lossCombative.line).toMatch(/silencio/i)
    expect(lossCombative.board).toBe(-1)
    const lossSelf = roomReaction({ tone: 'SELF_CRITICAL', outcome: 'L' })
    expect(lossSelf.board).toBe(1)
    expect(lossSelf.fans).toBe(1)
    expect(roomReaction({ tone: 'PRAGMATIC', outcome: 'W' })).toMatchObject({ fans: 0, board: 0 })
  })

  it('hay reacciones para todas las combinaciones de tono y resultado', () => {
    for (const outcome of ['W', 'D', 'L']) {
      for (const tone of ['PRAISING', 'COMBATIVE', 'SELF_CRITICAL', 'PRAGMATIC']) {
        expect(roomReaction({ tone, outcome }).line).not.toBe('La sala toma nota.')
      }
    }
  })

  it('la ronda de frases ofrece tres opciones, una de manual, una pasable y una desubicada', () => {
    for (const outcome of ['W', 'D', 'L']) {
      for (let i = 0; i < 8; i++) {
        const round = phraseRound(outcome, () => i / 8)
        expect(round.prompt).toBeTruthy()
        expect(round.options).toHaveLength(3)
        expect(round.options.map(o => o.fit).sort()).toEqual(['best', 'bad', 'ok'].sort())
      }
    }
  })

  it('el orden de las opciones se mezcla y la frase de manual suma, la desubicada resta', () => {
    const orders = new Set()
    for (let i = 0; i < 20; i++) orders.add(phraseRound('W', () => (i * 7 % 10) / 10).options.map(o => o.fit).join())
    expect(orders.size).toBeGreaterThan(1)
    expect(phraseResult({ fit: 'best' }).fans).toBe(1)
    expect(phraseResult({ fit: 'ok' }).fans).toBe(0)
    expect(phraseResult({ fit: 'bad' }).fans).toBe(-1)
  })

  it('las frases dependen del resultado', () => {
    const prompts = (outcome) => new Set(Array.from({ length: 12 }, (_, i) => phraseRound(outcome, () => i / 12).prompt))
    const win = prompts('W')
    const loss = prompts('L')
    expect([...win].some(p => loss.has(p))).toBe(false)
  })
})
