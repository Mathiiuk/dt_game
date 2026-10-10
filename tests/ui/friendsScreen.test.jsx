import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { api } = vi.hoisted(() => ({
  api: { getMyRooms: vi.fn(), getTable: vi.fn(), getWall: vi.fn(), createRoom: vi.fn(), joinRoom: vi.fn(), leaveRoom: vi.fn(), prank: vi.fn() }
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
    api.getMyRooms.mockResolvedValueOnce([]).mockResolvedValue([{ id: 'r1', code: 'ABC123', name: 'Los Pibes' }])
    api.createRoom.mockResolvedValue({ id: 'r1', code: 'ABC123' })
    api.getTable.mockResolvedValue([])
    api.getWall.mockResolvedValue([])
    renderIt()
    expect(await screen.findByText('Armar una sala')).toBeInTheDocument()
    expect(screen.getByText('Entrar con un código')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Nombre de la sala'), 'Los Pibes')
    await userEvent.click(screen.getByRole('button', { name: /crear sala/i }))
    await waitFor(() => expect(api.createRoom).toHaveBeenCalledWith('Los Pibes', 'c1'))
  })

  it('en una sala muestra la tabla, mis mangos, las travesuras y el muro', async () => {
    api.getMyRooms.mockResolvedValue([{ id: 'r1', code: 'ABC123', name: 'Los Pibes' }])
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
    api.getMyRooms.mockResolvedValue([{ id: 'r1', code: 'ABC123', name: 'Los Pibes' }])
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
})
