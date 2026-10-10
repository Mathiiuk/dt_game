// El calendario pide la fecha del club y los partidos a la vez (antes uno detrás del otro) y recuerda la carrera del DT
const { st } = vi.hoisted(() => ({ st: { calls: [], release: null, gate: null, careerReads: 0 } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    st.calls.push(table)
    for (const m of ['select', 'eq', 'or', 'in', 'order', 'limit']) q[m] = () => q
    q.single = async () => { if (table === 'managers') st.careerReads++; return { data: { user_id: 'u1' } } }
    q.maybeSingle = async () => {
      if (table === 'clubs') { await st.gate; return { data: { game_date: '2026-07-01' } } }
      if (table === 'user_sessions') return { data: { active_career_id: 'k1' } }
      return { data: null }
    }
    q.then = (r) => r({ data: table === 'fixtures' ? [] : null, error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { calendarApi } from '../../src/api/calendar'
import { queryCache } from '../../src/utils/cache'

describe('calendario más rápido', () => {
  beforeEach(() => { st.calls = []; st.careerReads = 0; queryCache.clear() })

  it('los partidos se piden sin esperar la fecha del club', async () => {
    st.gate = new Promise(r => { st.release = r })
    const pending = calendarApi.getSeasonCalendar(null, 'c1')
    await new Promise(r => setTimeout(r, 20))
    // La fecha del club sigue sin respuesta y los partidos ya se pidieron
    expect(st.calls).toContain('fixtures')
    st.release()
    const res = await pending
    expect(res.weeks).toHaveLength(52)
  })

  it('la carrera del DT se consulta una sola vez por un rato', async () => {
    expect(await calendarApi.resolveCareerId('m1')).toBe('k1')
    expect(await calendarApi.resolveCareerId('m1')).toBe('k1')
    expect(st.careerReads).toBe(1)
  })
})
