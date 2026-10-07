// En la semana 52 no se avanza más: la temporada se cierra desde la gala (premio, ascenso, evolución, calendario nuevo)
vi.mock('../../src/api/supabase', () => {
  const chain = () => { const q = {}; for (const m of ['select', 'eq', 'update', 'insert', 'order', 'limit']) q[m] = () => q; q.maybeSingle = async () => ({ data: { game_date: '2027-06-23' } }); q.then = (r) => r({ data: [], error: null }); return q }
  return { supabase: { from: chain, rpc: async () => ({ data: null, error: null }) } }
})

import { calendarApi } from '../../src/api/calendar'

describe('avance de semana al terminar la temporada', () => {
  it('se rechaza con un código propio para que la pantalla mande a la gala', async () => {
    vi.spyOn(calendarApi, 'getOrCreateCalendar').mockResolvedValue({ id: 'virtual-calendar', career_id: null, current_week: 52, current_date: '2027-06-23', current_season_year: 2026, is_advancing: false })
    await expect(calendarApi.advanceWeek({ careerId: null, clubId: 'me', managerId: 'm' })).rejects.toMatchObject({ code: 'ERR_SEASON_END' })
  })
})
