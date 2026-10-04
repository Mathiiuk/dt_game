import { isFixtureOpen, isFixturePlayed, isFixtureDue, toDay, FIXTURE_STATUS } from '../../src/domain/fixtureStatus'

describe('estados de fixture', () => {
  it('B2: tanto SCHEDULED como el alias PENDING son partidos por jugar', () => {
    expect(isFixtureOpen('SCHEDULED')).toBe(true)
    expect(isFixtureOpen('PENDING')).toBe(true)
    expect(isFixtureOpen('PLAYED')).toBe(false)
    expect(isFixtureOpen('FINISHED')).toBe(false)
  })

  it('PLAYED y el alias FINISHED son partidos disputados', () => {
    expect(isFixturePlayed('PLAYED')).toBe(true)
    expect(isFixturePlayed('FINISHED')).toBe(true)
    expect(isFixturePlayed('SCHEDULED')).toBe(false)
    expect(FIXTURE_STATUS.PLAYED).toBe('PLAYED')
  })

  it('compara solo el día: un match_date con hora no es "futuro" el mismo día', () => {
    expect(toDay('2026-08-01T00:00:00+00:00')).toBe('2026-08-01')
    expect(isFixtureDue('2026-08-01T00:00:00.000Z', '2026-08-01')).toBe(true)
    expect(isFixtureDue('2026-08-08', '2026-08-01')).toBe(false)
    expect(isFixtureDue('2026-08-01', '2026-08-05')).toBe(true)
    expect(isFixtureDue(null, '2026-08-01')).toBe(false)
  })
})
