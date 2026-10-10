import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { api } = vi.hoisted(() => ({
  api: { getMyRooms: vi.fn(), getTable: vi.fn(), getWall: vi.fn(), createRoom: vi.fn(), joinRoom: vi.fn(), leaveRoom: vi.fn(), prank: vi.fn(), configureRoom: vi.fn(), startLeague: vi.fn(), playRound: vi.fn(), getLeagueTable: vi.fn(), getLeagueFixtures: vi.fn() }
}))
vi.mock('../../src/api/friends', () => ({ friendsApi: api }))
vi.mock('../../src/api/supabase', () => ({ supabase: {} }))
vi.mock('../../src/context/GameContext', () => ({ useGameContext: () => ({ club: { id: 'c1' }, loading: false }) }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }))

import FriendsScreen from '../../src/features/friends/FriendsScreen'

const renderIt = () => render(<MemoryRouter><FriendsScreen /></MemoryRouter>)

describe('pantalla de la liga de amigos', () => {
  beforeEach(() => Object.values(api).forEach(f => f.mockReset()))

  it('sin sala ofrece armar una o entrar con código, y crea con el club propio', async () => {
    api.getMyRooms.mockResolvedValueOnce([]).mockResolvedValue([{ id: 'r1', code: 'ABC123', name: 'Los Pibes', status: 'LOBBY', created_by: 'u1', settings: {} }])
    api.createRoom.mockResolvedValue({ id: 'r1', code: 'ABC123' })
    api.configureRoom.mockResolvedValue({})
    api.getTable.mockResolvedValue([])
    api.getWall.mockResolvedValue([])
    renderIt()
    expect(await screen.findByText('Armar una sala')).toBeInTheDocument()
    expect(screen.getByText('Entrar con un código')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Nombre de la sala'), 'Los Pibes')
    await userEvent.click(screen.getByRole('button', { name: /crear sala/i }))
    await waitFor(() => expect(api.createRoom).toHaveBeenCalledWith('Los Pibes', 'c1'))
    await waitFor(() => expect(api.configureRoom).toHaveBeenCalledWith('r1', expect.objectContaining({ teams: 10, fillBots: true, legs: 2 })))
  })

  it('en una sala muestra la tabla, mis mangos, las travesuras y el muro', async () => {
    api.getMyRooms.mockResolvedValue([{ id: 'r1', code: 'ABC123', name: 'Los Pibes', status: 'LOBBY', created_by: 'u1', settings: {} }])
    api.getTable.mockResolvedValue([
      { user_id: 'u1', is_me: true, club_name: 'Mi Club', mote: null, league_points: 10, bonus: -3, points: 7, played: 5, mangos: 40 },
      { user_id: 'u2', is_me: false, club_name: 'Club Amigo', mote: 'El Cartonero', league_points: 9, bonus: 0, points: 9, played: 5, mangos: 40 }
    ])
    api.getWall.mockResolvedValue([{ id: 'w1', kind: 'NEWS', text: 'Mi Club abrió la sala.', created_at: '2026-10-10T10:00:00Z' }])
    renderIt()
    expect(await screen.findByText('Los Pibes')).toBeInTheDocument()
    expect(await screen.findByText('Club Amigo')).toBeInTheDocument()
    expect(screen.getByText('“El Cartonero”')).toBeInTheDocument()
    expect(await screen.findByText('40 mangos')).toBeInTheDocument()
    expect(await screen.findByText('Mi Club abrió la sala.')).toBeInTheDocument()
    expect(screen.getByText('El Sobre', { exact: false })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /hacer travesura/i }).length).toBe(4)
  })

  it('una travesura con un amigo pasa por el servidor y refresca la sala', async () => {
    api.getMyRooms.mockResolvedValue([{ id: 'r1', code: 'ABC123', name: 'Los Pibes', status: 'LOBBY', created_by: 'u1', settings: {} }])
    api.getTable.mockResolvedValue([
      { user_id: 'u1', is_me: true, club_name: 'Mi Club', mote: null, league_points: 10, bonus: 0, points: 10, played: 5, mangos: 100 },
      { user_id: 'u2', is_me: false, club_name: 'Club Amigo', mote: null, league_points: 9, bonus: 0, points: 9, played: 5, mangos: 100 }
    ])
    api.getWall.mockResolvedValue([])
    api.prank.mockResolvedValue({ ok: true, message: 'Mi Club le mandó un sobre.' })
    renderIt()
    await screen.findByText('Club Amigo')
    await screen.findByText('100 mangos')
    await userEvent.click(screen.getAllByRole('button', { name: /hacer travesura/i })[0])
    await userEvent.click(await screen.findByRole('button', { name: /club amigo/i }))
    await waitFor(() => expect(api.prank).toHaveBeenCalledWith('r1', 'SOBRE', 'u2', null))
    await waitFor(() => expect(api.getTable.mock.calls.length).toBeGreaterThan(1))
  })

  const humans = [
    { user_id: 'u1', is_me: true, club_name: 'Mi Club', mote: null, league_points: 0, bonus: 0, points: 0, played: 0, mangos: 30 },
    { user_id: 'u2', is_me: false, club_name: 'Club Amigo', mote: null, league_points: 0, bonus: 0, points: 0, played: 0, mangos: 30 }
  ]

  it('el creador ve los ajustes de la liga en el lobby y puede empezarla con 2 DT', async () => {
    api.getMyRooms.mockResolvedValue([{ id: 'r1', code: 'ABC123', name: 'Los Pibes', status: 'LOBBY', created_by: 'u1', settings: { teams: 12 } }])
    api.getTable.mockResolvedValue(humans)
    api.getWall.mockResolvedValue([])
    api.startLeague.mockResolvedValue({ teams: 12, rounds: 22 })
    renderIt()
    expect(await screen.findByText('La liga de la sala')).toBeInTheDocument()
    expect(await screen.findByText(/12 equipos, 22 fechas/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /empezar la liga/i }))
    await waitFor(() => expect(api.startLeague).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }), 2))
  })

  it('quien no armó la sala no ve los botones de ajustes', async () => {
    api.getMyRooms.mockResolvedValue([{ id: 'r1', code: 'ABC123', name: 'Los Pibes', status: 'LOBBY', created_by: 'u2', settings: {} }])
    api.getTable.mockResolvedValue(humans)
    api.getWall.mockResolvedValue([])
    renderIt()
    expect(await screen.findByText(/quien armó la sala decide/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /empezar la liga/i })).not.toBeInTheDocument()
  })

  it('con la liga en juego muestra la tabla con bots y deja jugar la fecha al creador', async () => {
    api.getMyRooms.mockResolvedValue([{ id: 'r1', code: 'ABC123', name: 'Los Pibes', status: 'PLAYING', created_by: 'u1', settings: {}, current_round: 1, total_rounds: 3 }])
    api.getTable.mockResolvedValue(humans)
    api.getWall.mockResolvedValue([])
    api.getLeagueTable.mockResolvedValue([
      { slot: 1, user_id: 'u1', name: 'Mi Club', is_bot: false, is_me: true, played: 1, won: 1, drawn: 0, lost: 0, gf: 2, ga: 0, gd: 2, league_points: 3, bonus: 0, points: 3 },
      { slot: 3, user_id: null, name: 'Gimnasia', is_bot: true, is_me: false, played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 2, gd: -2, league_points: 0, bonus: 0, points: 0 }
    ])
    api.getLeagueFixtures.mockResolvedValue({ teams: [{ slot: 1, name: 'Mi Club' }, { slot: 3, name: 'Gimnasia' }], fixtures: [{ round: 1, home_slot: 1, away_slot: 3, home_goals: 2, away_goals: 0 }, { round: 2, home_slot: 3, away_slot: 1, home_goals: null, away_goals: null }] })
    api.playRound.mockResolvedValue({ round: 2, done: false })
    renderIt()
    expect(await screen.findByText('Bot')).toBeInTheDocument()
    expect(await screen.findByText('Resultados de la fecha 1')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /jugar fecha 2/i }))
    await waitFor(() => expect(api.playRound).toHaveBeenCalledWith('r1'))
  })
})
