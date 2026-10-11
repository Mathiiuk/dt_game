import { dayPhrase, weekDays, dayAt, weekSummary, MIN_VISIBLE_MS, SHOW_AFTER_MS } from '../../src/domain/weekFlavor'

describe('weekFlavor', () => {
  describe('weekDays', () => {
    it('recorre los 7 días reales desde la fecha de juego, empezando por el día en que está (miércoles → martes)', () => {
      const days = weekDays('2026-10-07') // miércoles
      expect(days).toHaveLength(7)
      expect(days.map(d => d.weekday)).toEqual(['Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Lun', 'Mar'])
      expect(days.map(d => d.day)).toEqual([7, 8, 9, 10, 11, 12, 13])
      expect(days[0].date).toBe('2026-10-07')
      expect(days[6].date).toBe('2026-10-13')
    })

    it('cruza el fin de mes y de año sin desfase', () => {
      expect(weekDays('2026-12-30').map(d => d.date)).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04', '2027-01-05'])
      expect(weekDays('2026-10-29').map(d => d.day)).toEqual([29, 30, 31, 1, 2, 3, 4])
    })

    it('sin fecha usa una semana genérica en vez de romper', () => {
      expect(weekDays(undefined)).toHaveLength(7)
      expect(weekDays('basura')).toHaveLength(7)
    })
  })

  it('el día resaltado avanza con el tiempo y se queda en el último', () => {
    expect(dayAt(0)).toBe(0)
    expect(dayAt(3)).toBe(3)
    expect(dayAt(99)).toBe(6)
  })

  it('la frase depende del día de la semana: el sábado juegan los rivales y el domingo se descansa', () => {
    expect(dayPhrase('Sáb')).toMatch(/sábado.*rivales/i)
    expect(dayPhrase('Dom')).toMatch(/domingo/i)
    expect(dayPhrase('Mar')).toBeTruthy()
    expect(dayPhrase('???')).toBeTruthy()
  })

  describe('weekSummary', () => {
    const base = { budgetBefore: 25000, budgetAfter: 23415, injuriesRecovered: 2, week: 5, today: '2026-10-14', nextMatchDate: '2026-10-17' }

    it('dice qué día es hoy y cuándo es el próximo partido, con el mismo cálculo que el Inicio', () => {
      const lines = weekSummary(base)
      expect(lines.map(l => l.id)).toEqual(['week', 'today', 'match', 'money', 'medical'])
      expect(lines.find(l => l.id === 'today').text).toBe('Hoy es miércoles, 14 de octubre.')
      expect(lines.find(l => l.id === 'match').text).toBe('Próximo partido: sábado, 17 de octubre (en 3 días).')
      expect(lines.find(l => l.id === 'money').tone).toBe('danger')
      expect(lines.find(l => l.id === 'medical').text).toMatch(/2/)
    })

    it('mañana, hoy y sin partido a la vista', () => {
      expect(weekSummary({ ...base, nextMatchDate: '2026-10-15' }).find(l => l.id === 'match').text).toBe('Próximo partido: jueves, 15 de octubre (mañana).')
      expect(weekSummary({ ...base, nextMatchDate: '2026-10-14' }).find(l => l.id === 'match').text).toBe('Hoy se juega tu partido.')
      expect(weekSummary({ ...base, nextMatchDate: null }).find(l => l.id === 'match').text).toBe('No hay partido a la vista.')
    })

    it('sin cambios de caja ni altas quedan solo la semana, la fecha y el partido', () => {
      expect(weekSummary({ ...base, budgetAfter: 25000, injuriesRecovered: 0 }).map(l => l.id)).toEqual(['week', 'today', 'match'])
    })

    it('tolera datos faltantes', () => {
      expect(weekSummary({}).map(l => l.id)).toEqual([])
      expect(MIN_VISIBLE_MS).toBeGreaterThan(SHOW_AFTER_MS)
    })
  })
})
