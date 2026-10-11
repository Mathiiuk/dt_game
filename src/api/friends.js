import { supabase } from './supabase'
import { normalizeCode } from '../domain/friendRoom'
import { pickNationNames, cupSizeFor } from '../domain/friendCup'
import { DEFAULT_SETTINGS, sanitizeSettings, botCount, pickBotNames, resolveRules } from '../domain/friendLeague'

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

/** Liga de amigos: salas con código, tabla compartida, muro y travesuras (todo lo escribe el servidor) */
export const friendsApi = {
  /** Las salas en las que estoy (la base solo deja ver las propias) */
  async getMyRooms() {
    return unwrap(await supabase.from('friend_rooms').select('id, code, name, created_at, created_by, status, settings, rules, current_round, total_rounds').order('created_at', { ascending: true })) || []
  },

  async createRoom(name, clubId) {
    return unwrap(await supabase.rpc('friend_create_room', { p_name: name, p_club_id: clubId }))
  },

  async joinRoom(code, clubId) {
    const clean = normalizeCode(code)
    if (clean.length < 4) throw new Error('Escribí el código de la sala.')
    return unwrap(await supabase.rpc('friend_join_room', { p_code: clean, p_club_id: clubId }))
  },

  /** Ajustes del creador (solo en el lobby): equipos, ruedas, bots, nivel de los bots y reglamento */
  async configureRoom(roomId, rawSettings) {
    const settings = sanitizeSettings({ ...DEFAULT_SETTINGS, ...rawSettings })
    return unwrap(await supabase.rpc('friend_configure_room', { p_room_id: roomId, p_settings: settings, p_rules: resolveRules(settings, roomId) }))
  },

  /** Empieza la liga: completa con bots (nombres de clubes históricos) y arma el calendario */
  async startLeague(room, humans) {
    const settings = sanitizeSettings({ ...DEFAULT_SETTINGS, ...(room.settings || {}) })
    if (settings.format === 'COPA') {
      const size = cupSizeFor(settings.teams, humans)
      return unwrap(await supabase.rpc('friend_start_cup', { p_room_id: room.id, p_bot_names: pickNationNames(room.id, size - humans) }))
    }
    const names = pickBotNames(room.id, botCount(settings, humans))
    return unwrap(await supabase.rpc('friend_start_league', { p_room_id: room.id, p_bot_names: names }))
  },

  /** Juega la próxima fecha (solo el creador) */
  async playRound(roomId, format = 'LIGA') {
    return unwrap(await supabase.rpc(format === 'COPA' ? 'friend_play_cup_round' : 'friend_play_round', { p_room_id: roomId }))
  },

  /** Tabla de cada grupo de la Copa Mundial de la sala */
  async getCupGroups(roomId) {
    return unwrap(await supabase.rpc('friend_cup_group_table', { p_room_id: roomId })) || []
  },

  /** Tabla de la liga de la sala */
  async getLeagueTable(roomId) {
    return unwrap(await supabase.rpc('friend_league_table', { p_room_id: roomId })) || []
  },

  /** Equipos y partidos de la liga de la sala */
  async getLeagueFixtures(roomId) {
    const [teams, fixtures] = await Promise.all([
      supabase.from('friend_league_teams').select('slot, name, user_id, group_no').eq('room_id', roomId),
      supabase.from('friend_league_fixtures').select('round, home_slot, away_slot, home_goals, away_goals, stage, group_no, match_no, winner_slot, pens_home, pens_away').eq('room_id', roomId).order('round', { ascending: true })
    ])
    return { teams: unwrap(teams) || [], fixtures: unwrap(fixtures) || [] }
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
