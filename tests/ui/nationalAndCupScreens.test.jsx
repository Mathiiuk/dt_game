import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const state = { team: null }
const acceptOffer = vi.fn(async () => ({}))
const playMatch = vi.fn(async () => ({ won: true, teamGoals: 2, oppGoals: 0, xpBonus: 5 }))
const processUserMatchResult = vi.fn(async () => ({ userWon: true, matchBonus: 10000 }))
const confirmAction = vi.fn(async () => true)

vi.mock('../../src/api/nationalTeam', () => ({
  nationalTeamApi: {
    getCurrentNationalTeam: vi.fn(async () => state.team),
    getAvailableOffers: vi.fn(async () => [
      { id: 'o1', name: 'Argentina', category_label: 'Élite', required_reputation: 60, is_eligible: false, weekly_wage: 5000, objective: 'Ganar el torneo' },
      { id: 'o2', name: 'Bolivia', category_label: 'Emergente', required_reputation: 10, is_eligible: true, weekly_wage: 800, objective: 'Clasificar' }
    ]),
    getCallups: vi.fn(async () => [
      { id: 'c1', caps: 3, international_goals: 1, player: { first_name: 'Hugo', last_name: 'Ríos', position: 'GK', age: 30, clubs: { short_name: 'RAC' } } }
    ]),
    getFixtures: vi.fn(async () => [{ id: 'f1', tournament_name: 'Amistoso', played: false, match_date: '2026-09-01', is_home: true, opponent_name: 'Chile' }]),
    acceptOffer: (...a) => acceptOffer(...a),
    playMatch: (...a) => playMatch(...a),
    resign: vi.fn()
  }
}))
vi.mock('../../src/api/internationalCup', () => ({
  internationalCupApi: {
    getActiveTournament: vi.fn(async () => ({
      tournament: { name: 'Copa Gloria', season_year: 2026, status: 'active', prize_pool: 1500000 },
      fixtures: [
        { id: 'q1', stage: 'quarter_finals', played: false, home_club_id: 'c1', away_club_id: 'x', home_club: { name: 'Mi Club' }, away_club: { name: 'Rival' } },
        { id: 'q2', stage: 'quarter_finals', played: true, home_club_id: 'y', away_club_id: 'z', home_club: { name: 'A' }, away_club: { name: 'B' }, home_score: 1, away_score: 0 }
      ]
    })),
    processUserMatchResult: (...a) => processUserMatchResult(...a)
  }
}))
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({ manager: { id: 'm1', reputation: 20 }, club: { id: 'c1' }, loading: false, confirmAction })
}))

import NationalTeamScreen from '../../src/features/manager/NationalTeamScreen'
import InternationalCupScreen from '../../src/features/competition/InternationalCupScreen'

describe('pantalla Selección Nacional', () => {
  beforeEach(() => { acceptOffer.mockClear(); playMatch.mockClear(); confirmAction.mockClear(); state.team = null })

  it('sin selección: lista ofertas, deshabilita las que no cumplen la reputación y acepta la elegible', async () => {
    render(<MemoryRouter><NationalTeamScreen /></MemoryRouter>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Selecciones nacionales' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reputación insuficiente' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /Aceptar el cargo/ }))
    await waitFor(() => expect(acceptOffer).toHaveBeenCalledWith('m1', 'o2'))
  })

  it('con selección: muestra la nómina, avisa de arqueros y permite disputar la fecha FIFA', async () => {
    state.team = { id: 't1', name: 'Bolivia', world_ranking: 80, matches_played: 4, matches_won: 2, matches_drawn: 1, matches_lost: 1 }
    render(<MemoryRouter><NationalTeamScreen /></MemoryRouter>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Bolivia' })).toBeInTheDocument()
    expect(screen.getByText('Arqueros: 1 / 3 mínimo')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: /Fechas FIFA/ }))
    await userEvent.click(await screen.findByRole('button', { name: /Disputar partido de selección/ }))
    await waitFor(() => expect(playMatch).toHaveBeenCalledWith('f1', 't1', 'm1'))
  })
})

describe('pantalla Copa Continental', () => {
  it('muestra las llaves y permite jugar sólo el partido propio pendiente', async () => {
    processUserMatchResult.mockClear()
    render(<MemoryRouter><InternationalCupScreen /></MemoryRouter>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Copa Gloria' })).toBeInTheDocument()
    expect(screen.getByText('Se definirán al concluir los cuartos de final.')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button', { name: /Jugar partido continental/ })
    expect(buttons).toHaveLength(1)
    await userEvent.click(buttons[0])
    await waitFor(() => expect(processUserMatchResult).toHaveBeenCalled())
    expect(processUserMatchResult.mock.calls[0].slice(0, 3)).toEqual(['q1', 'c1', 'm1'])
  })
})
