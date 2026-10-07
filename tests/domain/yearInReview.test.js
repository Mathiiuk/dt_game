import { signingsSummary, decisionRanking } from '../../src/domain/yearInReview'
import { seasonStory } from '../../src/domain/seasonStory'

describe('fichajes del año', () => {
  const rows = [
    { from_club_id: 'x', to_club_id: 'me', transfer_fee: 8000, player_id: 'p1' },
    { from_club_id: 'y', to_club_id: 'me', transfer_fee: 3000, player_id: 'p2' },
    { from_club_id: 'me', to_club_id: 'z', transfer_fee: 5000, player_id: 'p3' },
    { from_club_id: 'a', to_club_id: 'b', transfer_fee: 99999, player_id: 'p4' }
  ]
  it('cuenta compras y ventas del club con lo que se gastó y lo que entró', () => {
    expect(signingsSummary(rows, 'me')).toEqual({ bought: 2, spent: 11000, sold: 1, earned: 5000, biggestBuy: { playerId: 'p1', fee: 8000 } })
  })
  it('sin movimientos devuelve ceros y ningún fichaje principal', () => {
    expect(signingsSummary([], 'me')).toEqual({ bought: 0, spent: 0, sold: 0, earned: 0, biggestBuy: null })
  })
})

describe('ranking de decisiones', () => {
  const logs = [
    { source: 'DECISION', message: 'Asado con el plantel', fans: 1, board: 0, locker: 4 },
    { source: 'DECISION', message: 'Cedieron ante la barra', fans: -2, board: -3, locker: -4 },
    { source: 'BARRA', message: 'Banderazo', fans: -1, board: 0, locker: -1 },
    { source: 'COMBO', message: 'Racha de campeón', fans: 4, board: 4, locker: 4 },
    { source: 'DECISION', message: 'Neutra', fans: 0, board: 0, locker: 0 }
  ]
  it('elige la mejor y la peor por impacto total en hinchada, dirigencia y vestuario', () => {
    const r = decisionRanking(logs)
    expect(r.best.message).toBe('Racha de campeón')
    expect(r.worst.message).toBe('Cedieron ante la barra')
  })
  it('ignora las consecuencias sin impacto y devuelve null si no hay nada', () => {
    expect(decisionRanking([{ message: 'Neutra', fans: 0, board: 0, locker: 0 }])).toEqual({ best: null, worst: null })
    expect(decisionRanking([])).toEqual({ best: null, worst: null })
  })
  it('si todo fue bueno no hay una "peor" decisión, y si todo fue malo no hay "mejor"', () => {
    expect(decisionRanking([{ message: 'A', fans: 2, board: 0, locker: 0 }]).worst).toBeNull()
    expect(decisionRanking([{ message: 'B', fans: -2, board: 0, locker: 0 }]).best).toBeNull()
  })
})

describe('la historia del año con fichajes y decisiones', () => {
  it('agrega la línea de fichajes y la mejor y peor decisión', () => {
    const story = seasonStory({
      clubName: 'Potrero', position: 4,
      signings: { bought: 2, spent: 11000, sold: 1, earned: 5000, biggestBuy: null },
      decisions: { best: { message: 'Asado con el plantel' }, worst: { message: 'Cedieron ante la barra' } }
    })
    expect(story.lines.join('\n')).toMatch(/Compraste 2 jugadores por \$11\.000 y vendiste 1 por \$5\.000/)
    expect(story.lines.join('\n')).toMatch(/Tu mejor decisión: Asado con el plantel/)
    expect(story.lines.join('\n')).toMatch(/La que más te costó: Cedieron ante la barra/)
  })
  it('sin movimientos no inventa ninguna línea de fichajes', () => {
    const story = seasonStory({ clubName: 'Potrero', position: 4, signings: { bought: 0, spent: 0, sold: 0, earned: 0, biggestBuy: null } })
    expect(story.lines.join('\n')).not.toMatch(/Compraste|vendiste/)
  })
})
