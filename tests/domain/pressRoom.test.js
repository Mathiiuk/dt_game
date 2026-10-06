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

import { BINGO_CLICHES, BINGO_LINES, bingoCard, bingoLines, markCliche, headlineRound, headlineResult } from '../../src/domain/pressRoom'

describe('Bingo del DT', () => {
  it('hay 12 clichés y cada frase de manual de la ronda tacha uno', () => {
    expect(BINGO_CLICHES).toHaveLength(12)
    expect(new Set(BINGO_CLICHES.map(c => c.id)).size).toBe(12)
    for (const outcome of ['W', 'D', 'L']) {
      for (let i = 0; i < 12; i++) {
        const best = phraseRound(outcome, () => i / 12).options.find(o => o.fit === 'best')
        expect(BINGO_CLICHES.some(c => c.id === best.cliche)).toBe(true)
        expect(phraseResult(best).cliche).toBe(best.cliche)
      }
    }
    expect(phraseResult({ fit: 'bad', cliche: 'W1' }).cliche).toBeNull()
  })

  it('la cartilla tiene 9 clichés distintos, siempre la misma para el mismo club y temporada', () => {
    const card = bingoCard('club1:2026')
    expect(card).toHaveLength(9)
    expect(new Set(card).size).toBe(9)
    expect(bingoCard('club1:2026')).toEqual(card)
    expect(bingoCard('club1:2027')).not.toEqual(card)
  })

  it('una línea completa da un premio chico; la cartilla llena, uno grande', () => {
    const card = bingoCard('c:2026')
    let marks = []
    let last
    for (const i of BINGO_LINES[0]) { last = markCliche({ card, marks }, card[i]); marks = last.marks }
    expect(last.newLines).toBe(1)
    expect(last.reward).toEqual({ fans: 2, board: 1 })
    expect(bingoLines(card, marks)).toHaveLength(1)
    for (const id of card) { last = markCliche({ card, marks }, id); marks = last.marks }
    expect(last.full).toBe(true)
    expect(last.reward.fans).toBeGreaterThanOrEqual(4)
  })

  it('un cliché que no está en la cartilla o ya tachado no cambia nada', () => {
    const card = bingoCard('c:2026')
    const outside = BINGO_CLICHES.find(c => !card.includes(c.id)).id
    expect(markCliche({ card, marks: [] }, outside).changed).toBe(false)
    expect(markCliche({ card, marks: [card[0]] }, card[0]).changed).toBe(false)
    expect(markCliche({ card, marks: [] }, null).changed).toBe(false)
  })
})

describe('Titular o fake', () => {
  const ctx = { clubName: 'Potrero', rivalName: 'Racing', isHome: true, homeScore: 2, awayScore: 1, mvpName: 'Hugo Ríos' }

  it('hay dos titulares verdaderos (resultado y figura) y un rumor inventado, mezclados', () => {
    const round = headlineRound(ctx, () => 0.3)
    expect(round.options).toHaveLength(3)
    expect(round.options.filter(o => o.fake)).toHaveLength(1)
    expect(round.options.map(o => o.text)).toEqual(expect.arrayContaining(['Potrero le ganó 2-1 a Racing', 'Hugo Ríos fue la figura del partido']))
  })

  it('el titular del resultado respeta empate, derrota y de qué lado jugás', () => {
    const texts = (c) => headlineRound(c, () => 0.1).options.map(o => o.text)
    expect(texts({ ...ctx, homeScore: 1, awayScore: 1 })).toContain('Potrero y Racing igualaron 1-1')
    expect(texts({ ...ctx, isHome: false, homeScore: 3, awayScore: 0 })).toContain('Potrero cayó 0-3 ante Racing')
  })

  it('sin figura usa un dato del marcador', () => {
    const texts = headlineRound({ ...ctx, mvpName: null, homeScore: 0, awayScore: 0 }, () => 0.5).options.map(o => o.text)
    expect(texts).toContain('Partido cerrado, sin goles')
  })

  it('acertar el rumor es desmentirlo (+1 dirigencia); errar cuesta 1 de hinchada', () => {
    expect(headlineResult({ fake: true })).toMatchObject({ correct: true, board: 1, fans: 0 })
    expect(headlineResult({ fake: false })).toMatchObject({ correct: false, board: 0, fans: -1 })
  })

  it('los rumores inventados varían', () => {
    const fakes = new Set(Array.from({ length: 8 }, (_, i) => headlineRound(ctx, () => i / 8).options.find(o => o.fake).text))
    expect(fakes.size).toBeGreaterThan(3)
  })
})
