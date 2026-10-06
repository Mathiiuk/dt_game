import { dramaChance, transferDramaTemplate, transferDramaCode, WAGE_RAISE } from '../../src/domain/transferDrama'

const base = { playerId: 'p1', playerName: 'Hugo Ríos', agentName: 'Carlos Méndez', buyerName: 'Racing', amount: 9000, wage: 120 }

describe('pedido de salida con ruido', () => {
  it('cuanto más hostil o codicioso el representante, más probable el lío', () => {
    expect(dramaChance('AGGRESSIVE')).toBeGreaterThan(dramaChance('GREEDY'))
    expect(dramaChance('GREEDY')).toBeGreaterThan(dramaChance('FAIR'))
    expect(dramaChance('FAIR')).toBeGreaterThan(dramaChance('PROTECTIVE'))
    expect(dramaChance(null)).toBeGreaterThan(0)
    expect(dramaChance('PROTECTIVE')).toBeGreaterThan(0)
  })

  it('el evento es único por jugador y cuenta la historia según el carácter del representante', () => {
    const aggressive = transferDramaTemplate({ ...base, personality: 'AGGRESSIVE' })
    const protective = transferDramaTemplate({ ...base, personality: 'PROTECTIVE' })
    expect(aggressive.template_code).toBe(transferDramaCode('p1'))
    expect(aggressive.description).toMatch(/filtró a la prensa/)
    expect(protective.description).toMatch(/la familia/)
    expect(aggressive.description).toMatch(/Racing/)
    expect(aggressive.description).toMatch(/\$9\.000/)
    expect(transferDramaTemplate({ ...base, personality: null }).description).toMatch(/Carlos Méndez/)
  })

  it('tres opciones: escuchar, mejorarle el contrato o plantarte, con el jugador y la acción para la base', () => {
    const t = transferDramaTemplate({ ...base, personality: 'GREEDY' })
    const byId = Object.fromEntries(t.options.map(o => [o.id, o]))
    expect(Object.keys(byId)).toEqual(['LISTEN', 'RAISE', 'STAND_FIRM'])
    expect(byId.LISTEN.effects).toEqual({})
    expect(byId.RAISE.effects).toMatchObject({ action: 'RAISE_WAGE', player_id: 'p1' })
    expect(byId.RAISE.label).toMatch(/\$120 a \$138/)
    expect(byId.STAND_FIRM.effects).toMatchObject({ action: 'PLAYER_UNHAPPY', player_id: 'p1', fans: 2 })
    expect(WAGE_RAISE).toBe(1.15)
  })

  it('el texto deja el marcador del periodista para que se nombre al del club', () => {
    expect(transferDramaTemplate({ ...base, personality: 'AGGRESSIVE' }).description).toContain('{periodista}')
  })
})
