import { describe, it, expect, vi, beforeEach } from 'vitest'

const { calls } = vi.hoisted(() => ({ calls: { rpc: [], result: { data: null, error: null } } }))
vi.mock('../../src/api/supabase', () => {
  const q = { select: () => q, eq: () => q, order: () => q, limit: () => Promise.resolve(calls.result), then: (r) => r(calls.result) }
  return { supabase: { from: () => q, rpc: (name, args) => { calls.rpc.push({ name, args }); return Promise.resolve(calls.result) } } }
})

import { friendsApi } from '../../src/api/friends'

describe('liga de amigos (API)', () => {
  beforeEach(() => { calls.rpc.length = 0; calls.result = { data: { id: 'r1', code: 'ABC123' }, error: null } })

  it('crea la sala con nombre y club', async () => {
    expect(await friendsApi.createRoom('Los Pibes', 'club-1')).toEqual({ id: 'r1', code: 'ABC123' })
    expect(calls.rpc[0]).toEqual({ name: 'friend_create_room', args: { p_name: 'Los Pibes', p_club_id: 'club-1' } })
  })

  it('al unirse limpia el código (guiones, espacios y minúsculas)', async () => {
    await friendsApi.joinRoom(' abc-123 ', 'club-1')
    expect(calls.rpc[0].args).toEqual({ p_code: 'ABC123', p_club_id: 'club-1' })
  })

  it('un código vacío no llega a la base', async () => {
    await expect(friendsApi.joinRoom('  ', 'club-1')).rejects.toThrow(/código/i)
    expect(calls.rpc).toHaveLength(0)
  })

  it('la travesura manda tipo, objetivo y mote; los errores del servidor llegan como mensaje', async () => {
    calls.result = { data: { ok: true, message: 'Listo' }, error: null }
    expect(await friendsApi.prank('r1', 'MOTE', 'u2', 'El Cartonero')).toEqual({ ok: true, message: 'Listo' })
    expect(calls.rpc[0]).toEqual({ name: 'friend_prank', args: { p_room_id: 'r1', p_kind: 'MOTE', p_target: 'u2', p_choice: 'El Cartonero' } })
    calls.result = { data: null, error: { message: 'Te faltan mangos: cuesta 30.' } }
    await expect(friendsApi.prank('r1', 'SOBRE', 'u2')).rejects.toThrow('Te faltan mangos: cuesta 30.')
  })

  it('la tabla y el muro devuelven listas (vacías si no hay nada)', async () => {
    calls.result = { data: null, error: null }
    expect(await friendsApi.getTable('r1')).toEqual([])
    expect(await friendsApi.getWall('r1')).toEqual([])
    expect(await friendsApi.getMyRooms()).toEqual([])
  })
})

describe('liga de la sala (API)', () => {
  beforeEach(() => { calls.rpc.length = 0; calls.result = { data: { ok: true }, error: null } })

  it('configurar manda ajustes saneados y las reglas ya resueltas (el sorteo no se sortea en el servidor)', async () => {
    await friendsApi.configureRoom('r1', { teams: 99, legs: 1, rulesId: 'CERO_CERO', difficulty: 'CRACKS' })
    const { args } = calls.rpc[0]
    expect(calls.rpc[0].name).toBe('friend_configure_room')
    expect(args.p_settings).toEqual({ format: 'LIGA', deadlineHours: 24, teams: 20, fillBots: true, legs: 1, difficulty: 'CRACKS', rulesId: 'CERO_CERO' })
    expect(args.p_rules.nilNilPts).toBe(0)
  })

  it('empezar completa con los nombres de bots justos para la cantidad de DT', async () => {
    await friendsApi.startLeague({ id: 'r1', settings: { teams: 10, fillBots: true } }, 3)
    expect(calls.rpc[0].args.p_bot_names).toHaveLength(7)
    calls.rpc.length = 0
    await friendsApi.startLeague({ id: 'r1', settings: { teams: 10, fillBots: false } }, 3)
    expect(calls.rpc[0].args.p_bot_names).toEqual([])
  })

  it('jugar fecha y pedir la tabla llaman a la base', async () => {
    await friendsApi.playRound('r1')
    expect(calls.rpc[0]).toEqual({ name: 'friend_play_round', args: { p_room_id: 'r1' } })
    calls.result = { data: null, error: null }
    expect(await friendsApi.getLeagueTable('r1')).toEqual([])
  })

  it('la copa se empieza y se juega con sus propias funciones, con selecciones de relleno', async () => {
    await friendsApi.startLeague({ id: 'r1', settings: { format: 'COPA', teams: 8 } }, 3)
    expect(calls.rpc[0].name).toBe('friend_start_cup')
    expect(calls.rpc[0].args.p_bot_names).toHaveLength(5)
    calls.rpc.length = 0
    await friendsApi.startLeague({ id: 'r1', settings: { format: 'COPA', teams: 8 } }, 9)
    expect(calls.rpc[0].args.p_bot_names).toHaveLength(7)
    calls.rpc.length = 0
    await friendsApi.playRound('r1', 'COPA')
    expect(calls.rpc[0]).toEqual({ name: 'friend_play_cup_round', args: { p_room_id: 'r1' } })
    await friendsApi.getCupGroups('r1')
    expect(calls.rpc[1]).toEqual({ name: 'friend_cup_group_table', args: { p_room_id: 'r1' } })
  })

  it('las fechas interactivas usan sus funciones del servidor', async () => {
    await friendsApi.setPlan('r1', 'CONTRA', 'PICARDIA')
    expect(calls.rpc[0]).toEqual({ name: 'friend_set_plan', args: { p_room_id: 'r1', p_stance: 'CONTRA', p_cheer: 'PICARDIA' } })
    await friendsApi.predict('r1', 'f1', 'E')
    expect(calls.rpc[1]).toEqual({ name: 'friend_predict', args: { p_room_id: 'r1', p_fixture_id: 'f1', p_pick: 'E' } })
    await friendsApi.tryClose('r1')
    expect(calls.rpc[2].name).toBe('friend_try_close')
    await friendsApi.getPending()
    expect(calls.rpc[3].name).toBe('friend_pending')
    await friendsApi.markSeen('r1')
    expect(calls.rpc[4]).toEqual({ name: 'friend_mark_seen', args: { p_room_id: 'r1' } })
  })

  it('al configurar también guarda el plazo de cada fecha', async () => {
    calls.rpc.length = 0
    await friendsApi.configureRoom('r1', { deadlineHours: 48 })
    expect(calls.rpc[1]).toEqual({ name: 'friend_set_deadline', args: { p_room_id: 'r1', p_hours: 48 } })
  })
})
