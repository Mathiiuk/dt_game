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
