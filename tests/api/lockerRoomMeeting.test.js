// Reunión de equipo: cooldown real, moral en UNA llamada y sobre state_morale (la columna que lee el resto del juego)
const writes = []
const state = { locker: { team_cohesion_score: 65, last_team_meeting_week: 0 }, players: [{ id: 'a', state_morale: 70 }, { id: 'b', state_morale: 98 }] }

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.update = (payload) => { writes.push({ table, op: 'update', payload }); return q }
    q.insert = (payload) => { writes.push({ table, op: 'insert', payload }); return q }
    q.maybeSingle = async () => ({ data: table === 'club_locker_room' ? state.locker : null, error: null })
    q.single = async () => ({ data: null, error: null })
    q.then = (resolve) => resolve({ data: table === 'players' ? state.players : [], error: null })
    return q
  }
  return { supabase: { from: chain, rpc: vi.fn(async (fn, args) => { writes.push({ table: 'rpc', op: fn, payload: args }); return { data: args.rows.length, error: null } }) } }
})

import { lockerRoomApi } from '../../src/api/lockerRoom'
import { absoluteWeek } from '../../src/domain/gameWeek'

describe('reunión de equipo', () => {
  beforeEach(() => { writes.length = 0; state.locker = { team_cohesion_score: 65, last_team_meeting_week: 0 } })

  it('sube la moral de todo el plantel en una sola llamada y sobre state_morale (con tope en 100)', async () => {
    await lockerRoomApi.holdTeamMeeting('c1', 'PRAISE', 10)
    const rpcs = writes.filter(w => w.table === 'rpc')
    expect(rpcs).toHaveLength(1)
    expect(rpcs[0].payload.rows).toEqual([{ id: 'a', state_morale: 78 }, { id: 'b', state_morale: 100 }])
    expect(writes.filter(w => w.table === 'players')).toEqual([]) // nada de un UPDATE por jugador
    expect(writes.find(w => w.table === 'club_locker_room').payload.last_team_meeting_week).toBe(10)
  })

  it('respeta el enfriamiento de 4 semanas con la semana real', async () => {
    state.locker = { team_cohesion_score: 65, last_team_meeting_week: 10 }
    await expect(lockerRoomApi.holdTeamMeeting('c1', 'PRAISE', 12)).rejects.toThrow(/2 semanas/)
    await expect(lockerRoomApi.holdTeamMeeting('c1', 'PRAISE', 14)).resolves.toMatchObject({ success: true })
  })
})

describe('semana absoluta del juego', () => {
  it('no se reinicia al cambiar de temporada (el enfriamiento cruza el cierre)', () => {
    expect(absoluteWeek('2026-07-01')).toBe(1)
    expect(absoluteWeek('2026-07-08')).toBe(2)
    const lateSeason = absoluteWeek('2027-06-10') // semana 50 de la temporada 2026
    const nextSeason = absoluteWeek('2027-07-08') // semana 2 de la siguiente
    expect(nextSeason - lateSeason).toBe(4)
    expect(nextSeason).toBeGreaterThan(lateSeason)
  })
})
