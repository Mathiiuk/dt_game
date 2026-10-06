import { isPreseason, preseasonAid, preseasonEvent, resolveFriendlyGamble, PRESEASON_EVENT_WEEKS, PRESEASON_WAGE_COVER } from '../../src/domain/preseason'

describe('pretemporada arcade', () => {
  it('es pretemporada hasta el día del primer partido', () => {
    expect(isPreseason('2026-07-29', '2026-08-01')).toBe(true)
    expect(isPreseason('2026-08-01', '2026-08-01')).toBe(false)
    expect(isPreseason('2026-08-05', '2026-08-01')).toBe(false)
    expect(isPreseason('2026-07-01', null)).toBe(false)
    expect(isPreseason('2026-07-01T00:00:00Z', '2026-08-01')).toBe(true)
  })

  it('la dirigencia cubre la mitad de los sueldos del plantel', () => {
    expect(PRESEASON_WAGE_COVER).toBe(0.5)
    expect(preseasonAid(2604)).toBe(1302)
    expect(preseasonAid(0)).toBe(0)
    expect(preseasonAid(-5)).toBe(0)
  })

  it('con el aporte la pretemporada deja de drenar la caja casi por completo', () => {
    // Recurrentes $1.150 y gastos fijos $2.964: sin aporte -1.814 por semana; con aporte -512
    expect(1150 - 2964 + preseasonAid(2604)).toBe(-512)
  })

  it('llegan amistosos en las semanas 2 y 4, con una opción segura, una apuesta y una alternativa', () => {
    expect(PRESEASON_EVENT_WEEKS).toEqual([2, 4])
    for (const week of PRESEASON_EVENT_WEEKS) {
      const e = preseasonEvent(week)
      expect(e.template_code).toMatch(/^EVT_PRESEASON_FRIENDLY_/)
      expect(e.options).toHaveLength(3)
      expect(e.options.some(o => o.effects.gamble)).toBe(true)
      expect(e.options.some(o => o.id === 'SAFE')).toBe(true)
    }
    expect(preseasonEvent(1)).toBeNull()
    expect(preseasonEvent(3)).toBeNull()
  })

  it('la apuesta sale bien o mal según la suerte y cada resultado tiene su texto', () => {
    const gamble = preseasonEvent(2).options.find(o => o.id === 'GAMBLE').effects.gamble
    const win = resolveFriendlyGamble(gamble, () => 0.1)
    const lose = resolveFriendlyGamble(gamble, () => 0.9)
    expect(win.won).toBe(true)
    expect(win.effects.fans).toBeGreaterThan(0)
    expect(win.note).toMatch(/campeón/)
    expect(lose.won).toBe(false)
    expect(lose.effects.locker).toBeLessThan(0)
    expect(lose.note).toBeTruthy()
  })

  it('la apuesta de los pibes de la cantera es más arriesgada pero paga más', () => {
    const friendly = preseasonEvent(2).options.find(o => o.id === 'GAMBLE').effects.gamble
    const youth = preseasonEvent(4).options.find(o => o.id === 'GAMBLE').effects.gamble
    expect(youth.chance).toBeLessThan(friendly.chance)
    expect(youth.win.fans).toBeGreaterThan(friendly.win.fans)
  })
})
