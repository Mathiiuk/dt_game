import { YELLOWS_FOR_BAN, RED_BAN_MATCHES, applyMatchCards, serveSuspension, cardStatus, suspensionNote } from '../../src/domain/suspensions'

const clean = { is_injured: false, is_suspended: false, yellow_cards_season: 0, suspended_matches: 0, suspension_reason: null }

describe('suspensions', () => {
  it('una roja directa suspende por un partido', () => {
    expect(applyMatchCards(clean, { yellows: 0, reds: 1 })).toEqual({ yellow_cards_season: 0, suspended_matches: RED_BAN_MATCHES, suspension_reason: 'RED', is_suspended: true })
  })

  it('una amarilla suma y no suspende', () => {
    expect(applyMatchCards(clean, { yellows: 1, reds: 0 })).toEqual({ yellow_cards_season: 1, suspended_matches: 0, suspension_reason: null, is_suspended: false })
  })

  it('la quinta amarilla suspende por un partido y el contador vuelve a cero', () => {
    const p = { ...clean, yellow_cards_season: YELLOWS_FOR_BAN - 1 }
    expect(applyMatchCards(p, { yellows: 1, reds: 0 })).toEqual({ yellow_cards_season: 0, suspended_matches: 1, suspension_reason: 'YELLOWS', is_suspended: true })
  })

  it('doble amarilla en un partido cuenta como roja y no suma al contador', () => {
    const p = { ...clean, yellow_cards_season: 2 }
    expect(applyMatchCards(p, { yellows: 2, reds: 0 })).toEqual({ yellow_cards_season: 2, suspended_matches: RED_BAN_MATCHES, suspension_reason: 'RED', is_suspended: true })
  })

  it('sin tarjetas no cambia nada y no pisa una sanción vigente', () => {
    expect(applyMatchCards(clean, { yellows: 0, reds: 0 })).toBeNull()
    const sancionado = { ...clean, is_suspended: true, suspended_matches: 1, suspension_reason: 'RED' }
    expect(applyMatchCards(sancionado, { yellows: 1, reds: 0 })).toMatchObject({ yellow_cards_season: 1, suspended_matches: 1, suspension_reason: 'RED', is_suspended: true })
  })

  it('cumplir la sanción la descuenta y la levanta al llegar a cero', () => {
    expect(serveSuspension({ ...clean, is_suspended: true, suspended_matches: 2, suspension_reason: 'RED' })).toEqual({ suspended_matches: 1, suspension_reason: 'RED', is_suspended: true })
    expect(serveSuspension({ ...clean, is_suspended: true, suspended_matches: 1, suspension_reason: 'YELLOWS' })).toEqual({ suspended_matches: 0, suspension_reason: null, is_suspended: false })
    expect(serveSuspension(clean)).toBeNull()
  })

  it('una sanción sin contador (dato viejo) se cumple en el siguiente partido', () => {
    expect(serveSuspension({ ...clean, is_suspended: true })).toEqual({ suspended_matches: 0, suspension_reason: null, is_suspended: false })
  })

  it('estado visible: lesión, roja, suspensión por amarillas y apercibido', () => {
    expect(cardStatus(clean)).toBeNull()
    expect(cardStatus({ ...clean, is_injured: true })).toBe('injured')
    expect(cardStatus({ ...clean, is_suspended: true, suspension_reason: 'RED' })).toBe('red')
    expect(cardStatus({ ...clean, is_suspended: true, suspension_reason: 'YELLOWS' })).toBe('yellow-ban')
    expect(cardStatus({ ...clean, is_suspended: true })).toBe('red')
    expect(cardStatus({ ...clean, yellow_cards_season: YELLOWS_FOR_BAN - 1 })).toBe('warning')
    expect(cardStatus({ ...clean, is_injured: true, is_suspended: true, suspension_reason: 'RED' })).toBe('injured')
  })

  it('el texto explica por qué y cuánto', () => {
    expect(suspensionNote({ ...clean, is_suspended: true, suspension_reason: 'RED', suspended_matches: 1 })).toMatch(/expulsión/i)
    expect(suspensionNote({ ...clean, is_suspended: true, suspension_reason: 'YELLOWS', suspended_matches: 1 })).toMatch(/5 amarillas/)
    expect(suspensionNote({ ...clean, yellow_cards_season: 4 })).toMatch(/4 amarillas/)
    expect(suspensionNote(clean)).toBe('')
  })
})

import { suspensionUpdates, mergeRowsById } from '../../src/domain/suspensions'

describe('suspensionUpdates', () => {
  const players = [
    { id: 'a', ...clean },
    { id: 'b', ...clean, yellow_cards_season: 4 },
    { id: 'c', ...clean, is_suspended: true, suspended_matches: 1, suspension_reason: 'RED' },
    { id: 'd', ...clean }
  ]
  const events = [
    { type: 'CARD_RED', playerId: 'a' },
    { type: 'CARD_YELLOW', playerId: 'b' },
    { type: 'CARD_YELLOW', playerId: 'zz' }
  ]

  it('suma tarjetas a los que jugaron y hace cumplir a los suspendidos que no jugaron', () => {
    const rows = suspensionUpdates({ players, playedIds: ['a', 'b'], events })
    expect(rows.map(r => r.id)).toEqual(['a', 'b', 'c'])
    expect(rows[0]).toMatchObject({ suspension_reason: 'RED', is_suspended: true })
    expect(rows[1]).toMatchObject({ suspension_reason: 'YELLOWS', yellow_cards_season: 0 })
    expect(rows[2]).toEqual({ id: 'c', suspended_matches: 0, suspension_reason: null, is_suspended: false })
  })

  it('un suspendido que juega (no debería) no cumple fecha', () => {
    expect(suspensionUpdates({ players: [players[2]], playedIds: ['c'], events: [] })).toEqual([])
  })

  it('mergeRowsById junta las claves de un mismo jugador en una sola fila', () => {
    const rows = mergeRowsById([{ id: 'a', state_fitness: 70 }, { id: 'x', state_morale: 50 }], [{ id: 'a', is_suspended: true }, { id: 'y', is_suspended: false }])
    expect(rows).toEqual([{ id: 'a', state_fitness: 70, is_suspended: true }, { id: 'x', state_morale: 50 }, { id: 'y', is_suspended: false }])
  })
})
