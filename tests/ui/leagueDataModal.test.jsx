import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const mocks = vi.hoisted(() => ({ leagues: vi.fn(), leaders: vi.fn() }))
vi.mock('../../src/api/competition', () => ({ competitionApi: { getAllLeagues: (...a) => mocks.leagues(...a), getClubLeaders: (...a) => mocks.leaders(...a) } }))

import LeagueDataModal from '../../src/features/competition/LeagueDataModal'

const club = { id: 'me', name: 'Mi Club', game_date: '2027-01-20' }
const leagues = [
  { competition: { id: 'c4', name: 'Primera C (Argentina)', level: 4, season_year: 2027 }, current: true, rows: [
    { club_id: 'z', position: 1, points: 9, played: 4, goals_for: 6, goals_against: 2, clubs: { name: 'Rival FC' } },
    { club_id: 'me', position: 2, points: 3, played: 4, goals_for: 4, goals_against: 5, clubs: { name: 'Mi Club' } }
  ] },
  { competition: { id: 'c5', name: 'Primera D (Argentina)', level: 5, season_year: 2026 }, current: false, rows: [
    { club_id: 'x', position: 1, points: 12, played: 5, goals_for: 9, goals_against: 1, clubs: { name: 'Club Viejo' } }
  ] }
]
const leaders = {
  scorers: [{ player_id: 'a', name: 'Lucas Pérez', position: 'DEL', matches: 3, goals: 3, assists: 1, rating: 7.3 }],
  assisters: [{ player_id: 'b', name: 'Mati Gómez', position: 'MC', matches: 2, goals: 0, assists: 3, rating: 7 }],
  best: [{ player_id: 'a', name: 'Lucas Pérez', position: 'DEL', matches: 3, goals: 3, assists: 1, rating: 7.3 }]
}

describe('panel "Todas las ligas"', () => {
  beforeEach(() => { mocks.leagues.mockReset().mockResolvedValue(leagues); mocks.leaders.mockReset().mockResolvedValue(leaders) })

  it('muestra las tablas de todas las ligas, marcando la actual y a tu club', async () => {
    render(<LeagueDataModal club={club} onClose={vi.fn()} />)
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Primera C (Argentina)')).toBeInTheDocument()
    expect(within(dialog).getByText('Primera D (Argentina)')).toBeInTheDocument()
    expect(within(dialog).getByText('Liga actual')).toBeInTheDocument()
    expect(within(dialog).getByText('Rival FC')).toBeInTheDocument()
    expect(within(dialog).getByText('Club Viejo')).toBeInTheDocument()
    expect(mocks.leagues).toHaveBeenCalledWith('me')
  })

  it('goleadores, asistencias y mejor jugador son de tu club y lo dicen', async () => {
    render(<LeagueDataModal club={club} onClose={vi.fn()} />)
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('tab', { name: 'Goleadores' }))
    expect(await within(dialog).findByText('Lucas Pérez')).toBeInTheDocument()
    expect(within(dialog).getByText(/solo de tu club/i)).toBeInTheDocument()
    expect(mocks.leaders).toHaveBeenCalledWith('me', '2027-01-20')
    await userEvent.click(within(dialog).getByRole('tab', { name: 'Asistencias' }))
    expect(await within(dialog).findByText('Mati Gómez')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('tab', { name: 'Mejor jugador' }))
    expect(await within(dialog).findByText('7,3')).toBeInTheDocument()
  })

  it('sin partidos jugados avisa que todavía no hay datos', async () => {
    mocks.leaders.mockResolvedValue({ scorers: [], assisters: [], best: [] })
    render(<LeagueDataModal club={club} onClose={vi.fn()} />)
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('tab', { name: 'Goleadores' }))
    expect(await within(dialog).findByText(/Todavía no hay goles/)).toBeInTheDocument()
  })

  it('si falla la carga lo avisa sin romper', async () => {
    mocks.leagues.mockRejectedValue(new Error('sin red'))
    render(<LeagueDataModal club={club} onClose={vi.fn()} />)
    expect(await screen.findByText(/No pudimos cargar las ligas/)).toBeInTheDocument()
  })
})
