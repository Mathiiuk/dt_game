const state = { club: { game_date: '2026-07-08' }, updates: [] }

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    from: (table) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => ({ data: table === 'clubs' ? state.club : null }),
        update: (patch) => { state.updates.push({ table, patch }); return chain }
      }
      return chain
    }
  }
}))

import { calendarApi, weekOfDate, seasonYearOf } from '../../src/api/calendar'

describe('calendario alineado con la fecha del club', () => {
  beforeEach(() => { state.updates = []; state.club = { game_date: '2026-07-08' } })

  it('calcula semana y temporada a partir de la fecha (la temporada empieza el 1 de julio)', () => {
    expect(weekOfDate('2026-07-01')).toBe(1)
    expect(weekOfDate('2026-07-08')).toBe(2)
    expect(weekOfDate('2026-09-02')).toBe(10)
    expect(weekOfDate('2027-06-30')).toBe(52)
    expect(seasonYearOf('2027-02-10')).toBe(2026)
    expect(seasonYearOf('2026-07-01')).toBe(2026)
  })

  it('un calendario de carrera desfasado (semana 10) se corrige a la fecha del club y se persiste', async () => {
    const stale = { id: 'cal1', career_id: 'k', current_week: 10, current_date: '2026-09-02', current_season_year: 2026 }
    const fixed = await calendarApi.reconcileWithClub(stale, 'club1')
    expect(fixed.current_week).toBe(2)
    expect(fixed.current_date).toBe('2026-07-08')
    expect(state.updates[0].patch.current_week).toBe(2)
  })

  it('un calendario virtual se corrige en memoria sin escribir en la base', async () => {
    const virtual = { id: 'virtual-calendar', career_id: null, current_week: 1, current_date: '2026-07-01', current_season_year: 2026 }
    const fixed = await calendarApi.reconcileWithClub(virtual, 'club1')
    expect(fixed.current_week).toBe(2)
    expect(state.updates).toHaveLength(0)
  })

  it('si ya coinciden no toca nada', async () => {
    const cal = { id: 'cal1', current_week: 2, current_date: '2026-07-08' }
    expect(await calendarApi.reconcileWithClub(cal, 'club1')).toBe(cal)
    expect(state.updates).toHaveLength(0)
  })
})
