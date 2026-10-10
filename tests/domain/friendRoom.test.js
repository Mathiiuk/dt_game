import { MAX_MEMBERS, PRANKS, MOTES, prankById, normalizeCode, canAfford, prankBlockReason } from '../../src/domain/friendRoom'

describe('liga de amigos', () => {
  it('una sala admite hasta 10 amigos', () => {
    expect(MAX_MEMBERS).toBe(10)
  })

  it('las travesuras tienen nombre, precio, bajada y un tipo de objetivo', () => {
    expect(PRANKS.length).toBeGreaterThanOrEqual(4)
    expect(new Set(PRANKS.map(p => p.id)).size).toBe(PRANKS.length)
    for (const p of PRANKS) {
      expect(p.name && p.blurb).toBeTruthy()
      expect(p.cost).toBeGreaterThan(0)
      expect(['friend', 'self']).toContain(p.target)
    }
    expect(prankById('SOBRE').target).toBe('friend')
    expect(prankById('ARBITRO').target).toBe('self')
    expect(prankById('nada')).toBeNull()
  })

  it('hay motes graciosos para ponerle a un amigo (elegidos de una lista, sin texto libre)', () => {
    expect(MOTES.length).toBeGreaterThanOrEqual(8)
    expect(new Set(MOTES).size).toBe(MOTES.length)
    expect(prankById('MOTE').needsChoice).toBe(true)
  })

  it('el código de invitación se normaliza (mayúsculas, sin espacios)', () => {
    expect(normalizeCode(' ab-12cd ')).toBe('AB12CD')
    expect(normalizeCode('')).toBe('')
  })

  it('no se puede hacer una travesura sin mangos suficientes ni contra uno mismo', () => {
    expect(canAfford(prankById('SOBRE'), 30)).toBe(true)
    expect(canAfford(prankById('SOBRE'), 29)).toBe(false)
    expect(prankBlockReason(prankById('SOBRE'), { mangos: 10, targetIsMe: false })).toMatch(/mangos/i)
    expect(prankBlockReason(prankById('SOBRE'), { mangos: 99, targetIsMe: true })).toMatch(/vos mismo|a vos/i)
    expect(prankBlockReason(prankById('SOBRE'), { mangos: 99, targetIsMe: false })).toBeNull()
    expect(prankBlockReason(prankById('ARBITRO'), { mangos: 99, targetIsMe: true })).toBeNull()
  })
})
