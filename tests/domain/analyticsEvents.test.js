import { track, GAME_EVENTS, LANDING_EVENTS } from '../../src/lib/analytics'

describe('eventos de medición', () => {
  beforeEach(() => { window.dataLayer = [] })

  it('los eventos del juego están permitidos y llegan al dataLayer', () => {
    for (const e of ['sign_up', 'club_created', 'season_closed', 'assembly_voted', 'friend_room_created', 'friend_room_joined']) {
      expect(GAME_EVENTS).toContain(e)
      track(e)
    }
    expect(window.dataLayer.map(d => d.event)).toEqual(GAME_EVENTS.filter(e => ['sign_up', 'club_created', 'season_closed', 'assembly_voted', 'friend_room_created', 'friend_room_joined'].includes(e)))
  })

  it('un evento desconocido se descarta y nunca viajan datos personales', () => {
    track('evento_raro')
    track('sign_up', { placement: 'registro', email: 'a@b.com', name: 'Pepe' })
    expect(window.dataLayer).toEqual([{ event: 'sign_up', placement: 'registro' }])
    expect(LANDING_EVENTS).toContain('landing_view')
  })
})
