import { STANCES, CHEERS, DEADLINE_HOURS, stanceBeats, stanceEdge, timeLeft, resultPick, pickLabel, canPick } from '../../src/domain/friendPlans'
import { matchStory } from '../../src/domain/friendStory'
import { sanitizeSettings } from '../../src/domain/friendLeague'

describe('planteos de la fecha', () => {
  it('hay tres planteos y tres arengas, cada uno con su explicación', () => {
    expect(STANCES.map(s => s.id)).toEqual(['PRESION', 'EQUILIBRADO', 'CONTRA'])
    expect(CHEERS.map(c => c.id)).toEqual(['GARRA', 'CALMA', 'PICARDIA'])
    for (const s of STANCES) { expect(s.name.length).toBeGreaterThan(3); expect(s.blurb.length).toBeGreaterThan(20) }
  })

  it('es un piedra-papel-tijera: presión > equilibrado > contra > presión', () => {
    expect(stanceBeats('PRESION', 'EQUILIBRADO')).toBe(true)
    expect(stanceBeats('EQUILIBRADO', 'CONTRA')).toBe(true)
    expect(stanceBeats('CONTRA', 'PRESION')).toBe(true)
    expect(stanceBeats('PRESION', 'CONTRA')).toBe(false)
    expect(stanceBeats('PRESION', 'PRESION')).toBe(false)
    expect(stanceEdge('PRESION', 'EQUILIBRADO')).toBe('wins')
    expect(stanceEdge('PRESION', 'CONTRA')).toBe('loses')
    expect(stanceEdge('CONTRA', 'CONTRA')).toBe('even')
  })

  it('el plazo puede ser de 12, 24 o 48 horas y se guarda en los ajustes', () => {
    expect(DEADLINE_HOURS).toEqual([12, 24, 48])
    expect(sanitizeSettings({}).deadlineHours).toBe(24)
    expect(sanitizeSettings({ deadlineHours: 48 }).deadlineHours).toBe(48)
    expect(sanitizeSettings({ deadlineHours: 7 }).deadlineHours).toBe(24)
    expect(sanitizeSettings({ format: 'COPA', deadlineHours: 12 }).deadlineHours).toBe(12)
  })

  it('cuenta regresiva legible', () => {
    const now = new Date('2026-10-12T10:00:00Z').getTime()
    expect(timeLeft('2026-10-12T10:30:00Z', now)).toBe('30 min')
    expect(timeLeft('2026-10-12T15:10:00Z', now)).toBe('5 h 10 min')
    expect(timeLeft('2026-10-14T10:00:00Z', now)).toBe('2 días')
    expect(timeLeft('2026-10-12T09:00:00Z', now)).toBe('venció')
    expect(timeLeft(null, now)).toBe('')
  })
})

describe('prode', () => {
  it('resultado de un partido como L, E o V (en llaves manda el ganador)', () => {
    expect(resultPick({ home_goals: 2, away_goals: 1 })).toBe('L')
    expect(resultPick({ home_goals: 0, away_goals: 3 })).toBe('V')
    expect(resultPick({ home_goals: 1, away_goals: 1 })).toBe('E')
    expect(resultPick({ home_goals: 1, away_goals: 1, stage: 'LLAVE', winner_slot: 2, home_slot: 1, away_slot: 2 })).toBe('V')
    expect(resultPick({ home_goals: null, away_goals: null })).toBeNull()
  })

  it('en las llaves no se puede pronosticar empate', () => {
    expect(canPick({ stage: 'GRUPO' }, 'E')).toBe(true)
    expect(canPick({ stage: 'LLAVE' }, 'E')).toBe(false)
    expect(canPick({ stage: 'LLAVE' }, 'L')).toBe(true)
    expect(pickLabel('L', { home: 'A', away: 'B' })).toBe('Gana A')
    expect(pickLabel('E', { home: 'A', away: 'B' })).toBe('Empatan')
    expect(pickLabel('V', { home: 'A', away: 'B' })).toBe('Gana B')
  })
})

describe('relato del partido', () => {
  const base = { id: 'f1', home_goals: 2, away_goals: 1, minutes: [{ m: 12, s: 'H' }, { m: 55, s: 'A' }, { m: 80, s: 'H' }], home_stance: 'PRESION', away_stance: 'EQUILIBRADO' }
  const names = { home: 'Mi Club', away: 'Club Amigo' }

  it('cuenta los goles en orden de minuto y cierra con el resultado', () => {
    const s = matchStory(base, names)
    expect(s.lines.filter(l => /^\d+'/.test(l)).map(l => parseInt(l, 10))).toEqual([12, 55, 80])
    expect(s.lines.at(-1)).toMatch(/2 - 1/)
    expect(s.headline).toContain('Mi Club')
  })

  it('es el mismo relato siempre para el mismo partido', () => {
    expect(matchStory(base, names)).toEqual(matchStory(base, names))
  })

  it('menciona los planteos y los penales, y no inventa nada si no se jugó', () => {
    expect(matchStory(base, names).lines.join(' ')).toMatch(/presión/i)
    const pens = matchStory({ ...base, home_goals: 1, away_goals: 1, minutes: [{ m: 10, s: 'H' }, { m: 70, s: 'A' }], stage: 'LLAVE', winner_slot: 1, home_slot: 1, away_slot: 2, pens_home: 5, pens_away: 4 }, names)
    expect(pens.lines.join(' ')).toMatch(/penales/i)
    expect(pens.headline).toContain('Mi Club')
    expect(matchStory({ id: 'x', home_goals: null, away_goals: null }, names)).toEqual({ headline: '', lines: [] })
  })

  it('un 0 a 0 también tiene relato', () => {
    const s = matchStory({ id: 'z', home_goals: 0, away_goals: 0, minutes: [] }, names)
    expect(s.lines.at(-1)).toMatch(/0 - 0/)
    expect(s.headline.length).toBeGreaterThan(10)
  })
})
