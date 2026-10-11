// Inicio: en el celular un resumen corto y lo demás plegado; en escritorio, la grilla completa
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const state = { events: [], fixture: null, played: 0, available: 22, user: { id: 'u1', created_at: '2026-10-12T10:00:00Z' } }
const club = { id: 'c1', name: 'Club Atlético Potrero', budget: 5000, board_confidence: 70, game_date: '2027-01-20', league_tier: 5, city: 'Potrero', country: 'AR' }
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({ club, manager: { id: 'm1', xp: 0 }, user: state.user, loading: false, refreshContext: vi.fn(async () => {}) })
}))
vi.mock('../../src/api/dashboard', () => ({
  dashboardApi: {
    getOverview: vi.fn(async () => ({
      managerSummary: { id: 'm1', name: 'DT', level: 1, title: 'Aficionado', currentXp: 0, xpRequiredForNext: 100, progressPercent: 0, reputation: 15 },
      clubSummary: { id: 'c1', name: club.name, shortName: 'POT', city: 'Potrero', country: 'AR', gameDate: club.game_date, colors: null, stadiumName: 'El Potrero' },
      financesSummary: { balance: 5000, weeklyWageBill: 1000, wageBudget: 3500, financialHealth: 'HEALTHY' },
      squadHealth: { totalPlayers: 22, availableCount: state.available, averageFitness: 90, averageMorale: 70, injuredCount: 0, suspendedCount: 0 },
      standingsSnippet: state.played ? { rank: 3, points: 4, played: state.played } : null, nextFixture: state.fixture, urgentAlerts: [], pendingEvents: state.events
    }))
  }
}))
vi.mock('../../src/api/events', () => ({ eventsApi: { resolveEvent: vi.fn(async () => ({ outcomeNote: 'Listo.' })) } }))
vi.mock('../../src/features/dashboard/ClimatePanel', () => ({ ClimatePanel: () => <p>Panel del clima</p>, ConsequenceFeed: () => <p>Consecuencias</p> }))
vi.mock('../../src/features/season/SeasonCloseModal', () => ({ default: () => null }))

import Dashboard from '../../src/features/dashboard/Dashboard'

const fixture = { id: 'f1', match_date: '2027-01-24', match_week: 2, home_team_id: 'c1', away_team_id: 'c2', home: { name: 'Potrero' }, away: { name: 'Rival FC', strength: 55 } }
const renderDashboard = () => render(<MemoryRouter><Dashboard /></MemoryRouter>)
const setDesktop = (on) => { window.matchMedia = (query) => ({ matches: on, media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }) }

describe('inicio en el celular', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setDesktop(false)
    Object.assign(state, { events: [], fixture, played: 3, available: 20, user: { id: 'u1', created_at: '2026-01-01T00:00:00Z' } })
  })

  it('arriba va lo importante: el partido, tres tarjetitas y sin repetir el botón de jugar dentro de la tarjeta del partido', async () => {
    renderDashboard()
    expect(await screen.findByText('Próximo compromiso')).toBeInTheDocument()
    const tiles = screen.getByRole('list', { name: 'Resumen del club' })
    expect(within(tiles).getAllByRole('listitem')).toHaveLength(3)
    expect(within(tiles).getByText('20/22')).toBeInTheDocument()
    expect(within(tiles).getByText('3º')).toBeInTheDocument()
    // El botón de jugar de la tarjeta queda solo para escritorio: en el celular el principal está arriba
    expect(screen.getByRole('button', { name: /disputar partido/i })).toHaveClass('hidden')
    expect(screen.queryByText('Panel del clima')).not.toBeInTheDocument()
    expect(screen.queryByText('Estado del plantel')).not.toBeInTheDocument()
  })

  it('"Ver más" despliega clima, consecuencias, tope salarial y carrera, y recuerda cómo quedó', async () => {
    const { unmount } = renderDashboard()
    const toggle = await screen.findByRole('button', { name: /ver más/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(await screen.findByText('Panel del clima')).toBeInTheDocument()
    expect(screen.getByText('Consecuencias')).toBeInTheDocument()
    expect(screen.getByText('Tope salarial')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ver menos/i })).toHaveAttribute('aria-expanded', 'true')
    unmount()
    renderDashboard()
    expect(await screen.findByText('Panel del clima')).toBeInTheDocument()
  })
})

describe('inicio en escritorio', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setDesktop(true)
    Object.assign(state, { events: [], fixture, played: 3, available: 20, user: { id: 'u1', created_at: '2026-01-01T00:00:00Z' } })
  })

  it('mantiene la grilla completa con el estado del plantel, las finanzas y la carrera', async () => {
    renderDashboard()
    expect(await screen.findByText('Estado del plantel')).toBeInTheDocument()
    expect(screen.getByText('Panel del clima')).toBeInTheDocument()
    expect(screen.getByText('Tu carrera')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Resumen del club' })).not.toBeInTheDocument()
  })
})
