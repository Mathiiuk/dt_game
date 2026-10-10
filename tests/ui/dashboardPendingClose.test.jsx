// Inicio: un cierre de temporada a medias se avisa y se termina con un botón, con los resultados ya guardados
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { resume, state } = vi.hoisted(() => ({ resume: vi.fn(), state: { pendingClose: null } }))

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))
vi.mock('../../src/api/seasonClose', () => ({ seasonCloseApi: { resumeSeasonClose: resume } }))
const club = { id: 'c1', career_id: 'k1', name: 'Club Atlético Potrero', budget: 5000, board_confidence: 70, game_date: '2027-07-01', league_tier: 5, city: 'Potrero', country: 'AR' }
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({ club, manager: { id: 'm1', xp: 0 }, loading: false, refreshContext: vi.fn(async () => {}) })
}))
vi.mock('../../src/api/dashboard', () => ({
  dashboardApi: {
    getOverview: vi.fn(async () => ({
      pendingClose: state.pendingClose,
      managerSummary: { id: 'm1', name: 'DT', level: 1, title: 'Aficionado', currentXp: 0, xpRequiredForNext: 100, progressPercent: 0, reputation: 15 },
      clubSummary: { id: 'c1', name: club.name, shortName: 'POT', city: 'Potrero', country: 'AR', gameDate: club.game_date, colors: null, stadiumName: 'El Potrero' },
      financesSummary: { balance: 5000, weeklyWageBill: 1000, wageBudget: 3500, financialHealth: 'HEALTHY' },
      squadHealth: { totalPlayers: 22, availableCount: 22, averageFitness: 90, averageMorale: 70, injuredCount: 0, suspendedCount: 0 },
      standingsSnippet: null, nextFixture: null, urgentAlerts: [], pendingEvents: []
    }))
  }
}))
vi.mock('../../src/api/events', () => ({ eventsApi: { resolveEvent: vi.fn() } }))
vi.mock('../../src/features/dashboard/ClimatePanel', () => ({ ClimatePanel: () => null, ConsequenceFeed: () => null }))
vi.mock('../../src/features/season/SeasonCloseModal', () => ({ default: () => null }))

import Dashboard from '../../src/features/dashboard/Dashboard'

const renderDashboard = () => render(<MemoryRouter><Dashboard /></MemoryRouter>)

describe('cierre de temporada pendiente en el inicio', () => {
  beforeEach(() => { resume.mockReset().mockResolvedValue({ success: true }); state.pendingClose = null })

  it('sin cierre pendiente no aparece el aviso', async () => {
    renderDashboard()
    await screen.findByText(/Club Atlético Potrero/)
    expect(screen.queryByLabelText('Cierre de temporada pendiente')).not.toBeInTheDocument()
  })

  it('con cierre pendiente avisa qué falta y "Terminar el cierre" lo retoma del club', async () => {
    state.pendingClose = { id: 'p1', season_year: 2026, stage: 'EVOLUTION_DONE' }
    renderDashboard()
    const card = await screen.findByLabelText('Cierre de temporada pendiente')
    expect(card).toHaveTextContent('2026')
    expect(card).toHaveTextContent('Falta armar la liga del nuevo año')
    fireEvent.click(screen.getByRole('button', { name: 'Terminar el cierre' }))
    await waitFor(() => expect(resume).toHaveBeenCalledWith({ clubId: 'c1', careerId: 'k1' }))
  })

  it('la acción principal pasa a ser terminar el cierre', async () => {
    state.pendingClose = { id: 'p1', season_year: 2026, stage: 'DB_DONE' }
    renderDashboard()
    expect((await screen.findAllByRole('button', { name: 'Terminar el cierre de temporada' })).length).toBeGreaterThan(0)
  })
})
