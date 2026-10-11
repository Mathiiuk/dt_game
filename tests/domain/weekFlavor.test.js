import { WEEK_PHRASES, WEEK_DAYS, phraseAt, dayAt, weekSummary, MIN_VISIBLE_MS, SHOW_AFTER_MS } from '../../src/domain/weekFlavor'

describe('weekFlavor', () => {
  it('las frases rotan y vuelven a empezar', () => {
    expect(phraseAt(0)).toBe(WEEK_PHRASES[0])
    expect(phraseAt(WEEK_PHRASES.length)).toBe(WEEK_PHRASES[0])
    expect(phraseAt(-1)).toBe(WEEK_PHRASES[WEEK_PHRASES.length - 1])
  })

  it('el punto de la semana avanza hasta el último día y se queda ahí', () => {
    expect(dayAt(0)).toBe(0)
    expect(dayAt(3)).toBe(3)
    expect(dayAt(99)).toBe(WEEK_DAYS.length - 1)
  })

  it('el resumen cuenta la caja, las altas médicas y la semana nueva', () => {
    const lines = weekSummary({ budgetBefore: 25000, budgetAfter: 23415, injuriesRecovered: 2, week: 5 })
    expect(lines.map(l => l.id)).toEqual(['week', 'money', 'medical'])
    expect(lines.find(l => l.id === 'money').tone).toBe('danger')
    expect(lines.find(l => l.id === 'medical').text).toMatch(/2/)
  })

  it('sin cambios queda solo la semana, y la caja positiva es buena noticia', () => {
    expect(weekSummary({ budgetBefore: 10, budgetAfter: 10, injuriesRecovered: 0, week: 2 }).map(l => l.id)).toEqual(['week'])
    expect(weekSummary({ budgetBefore: 10, budgetAfter: 90, week: 2 }).find(l => l.id === 'money').tone).toBe('accent')
  })

  it('tolera datos faltantes', () => {
    expect(weekSummary({}).map(l => l.id)).toEqual([])
    expect(MIN_VISIBLE_MS).toBeGreaterThan(SHOW_AFTER_MS)
  })
})
