import { supabase } from './supabase'
import { normalizeCode } from '../domain/friendRoom'

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

/** Liga de amigos: salas con código, tabla compartida, muro y travesuras (todo lo escribe el servidor) */
export const friendsApi = {
  /** Las salas en las que estoy (la base solo deja ver las propias) */
  async getMyRooms() {
    return unwrap(await supabase.from('friend_rooms').select('id, code, name, created_at').order('created_at', { ascending: true })) || []
  },

  async createRoom(name, clubId) {
    return unwrap(await supabase.rpc('friend_create_room', { p_name: name, p_club_id: clubId }))
  },

  async joinRoom(code, clubId) {
    const clean = normalizeCode(code)
    if (clean.length < 4) throw new Error('Escribí el código de la sala.')
    return unwrap(await supabase.rpc('friend_join_room', { p_code: clean, p_club_id: clubId }))
  },

  async leaveRoom(roomId) {
    unwrap(await supabase.rpc('friend_leave_room', { p_room_id: roomId }))
  },

  /** Tabla de la sala: puntos de liga + travesuras, ya ordenada */
  async getTable(roomId) {
    return unwrap(await supabase.rpc('friend_room_table', { p_room_id: roomId })) || []
  },

  async getWall(roomId, limit = 30) {
    return unwrap(await supabase.from('friend_wall').select('id, kind, text, created_at').eq('room_id', roomId).order('created_at', { ascending: false }).limit(limit)) || []
  },

  /** Hace una travesura; devuelve { ok, message } (ok = salió bien) */
  async prank(roomId, kind, targetUserId = null, choice = null) {
    return unwrap(await supabase.rpc('friend_prank', { p_room_id: roomId, p_kind: kind, p_target: targetUserId, p_choice: choice }))
  }
}
