import { DEFAULT_SETTINGS, DIFFICULTIES, ROOM_RULESETS, sanitizeSettings, roundsFor, teamsFor, botCount, pickBotNames, resolveRules, settingsSummary } from '../../src/domain/friendLeague'

describe('liga de la sala: ajustes del creador', () => {
  it('por defecto: 10 equipos, con bots parejos, ida y vuelta y reglamento clásico', () => {
    expect(DEFAULT_SETTINGS).toEqual({ format: 'LIGA', teams: 10, fillBots: true, legs: 2, difficulty: 'PAREJOS', rulesId: 'CLASICO', deadlineHours: 24 })
  })

  it('sanea valores raros: equipos entre 4 y 20, ruedas 1 o 2, dificultad y reglamento conocidos', () => {
    expect(sanitizeSettings({ teams: 99, legs: 7, difficulty: 'xx', rulesId: 'nada', fillBots: 'si' })).toEqual({ format: 'LIGA', deadlineHours: 24, teams: 20, fillBots: true, legs: 2, difficulty: 'PAREJOS', rulesId: 'CLASICO' })
    expect(sanitizeSettings({ teams: 1, legs: 1, difficulty: 'CRACKS', rulesId: 'CERO_CERO', fillBots: false })).toEqual({ format: 'LIGA', deadlineHours: 24, teams: 4, fillBots: false, legs: 1, difficulty: 'CRACKS', rulesId: 'CERO_CERO' })
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings({ rulesId: 'SORTEO' }).rulesId).toBe('SORTEO')
  })

  it('las fechas dependen de los equipos y las ruedas (con impar, un descanso por fecha)', () => {
    expect(roundsFor(10, 2)).toBe(18)
    expect(roundsFor(10, 1)).toBe(9)
    expect(roundsFor(7, 1)).toBe(7)
    expect(roundsFor(20, 2)).toBe(38)
  })

  it('con bots se completa hasta los equipos pedidos; sin bots juegan solo los DT', () => {
    expect(teamsFor({ teams: 10, fillBots: true }, 3)).toBe(10)
    expect(botCount({ teams: 10, fillBots: true }, 3)).toBe(7)
    expect(teamsFor({ teams: 10, fillBots: false }, 3)).toBe(3)
    expect(botCount({ teams: 10, fillBots: false }, 3)).toBe(0)
    expect(teamsFor({ teams: 4, fillBots: true }, 6)).toBe(6)
    expect(botCount({ teams: 4, fillBots: true }, 6)).toBe(0)
  })

  it('los nombres de los bots son clubes históricos distintos, siempre los mismos para la misma sala', () => {
    const a = pickBotNames('sala-1', 7, ['Mi Club'])
    expect(a).toHaveLength(7)
    expect(new Set(a).size).toBe(7)
    expect(a).not.toContain('Mi Club')
    expect(pickBotNames('sala-1', 7, ['Mi Club'])).toEqual(a)
    expect(pickBotNames('sala-1', 0)).toEqual([])
  })

  it('solo se ofrecen reglamentos que cambian puntos (no ruedas ni ascensos), y el sorteo es determinista', () => {
    expect(ROOM_RULESETS.map(r => r.id)).toEqual(expect.arrayContaining(['CLASICO', 'CERO_CERO', 'VISITANTE_DORADO']))
    expect(ROOM_RULESETS.map(r => r.id)).not.toEqual(expect.arrayContaining(['EXPRESS']))
    expect(ROOM_RULESETS.map(r => r.id)).not.toContain('GUILLOTINA')
    expect(resolveRules({ rulesId: 'CERO_CERO' }, 's').nilNilPts).toBe(0)
    const a = resolveRules({ rulesId: 'SORTEO' }, 'sala-1')
    expect(resolveRules({ rulesId: 'SORTEO' }, 'sala-1')).toEqual(a)
    expect(a.promoted).toBe(2)
    expect(Object.keys(DIFFICULTIES)).toEqual(['FLOJOS', 'PAREJOS', 'CRACKS'])
  })

  it('el resumen cuenta todo en una línea', () => {
    const t = settingsSummary({ teams: 10, fillBots: true, legs: 2, difficulty: 'CRACKS', rulesId: 'CERO_CERO' })
    expect(t).toMatch(/10 equipos/)
    expect(t).toMatch(/18 fechas/)
    expect(t).toMatch(/bots/i)
    expect(t).toMatch(/Cero a cero prohibido/)
    expect(settingsSummary({ teams: 10, fillBots: false, legs: 1, difficulty: 'PAREJOS', rulesId: 'CLASICO' })).toMatch(/solo los DT/i)
  })
})
