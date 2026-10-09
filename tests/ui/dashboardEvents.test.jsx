// Inicio: de las decisiones pendientes se abre sola una por visita; el resto queda con su botón "Jugar"
import React from 'react'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const state = { events: [] }
const club = { id: 'c1', name: 'Club Atlético Potrero', budget: 5000, board_confidence: 70, game_date: '2027-01-20', league_tier: 5, city: 'Potrero', country: 'AR' }
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({ club, manager: { id: 'm1', xp: 0 }, loading: false, refreshContext: vi.fn(async () => {}) })
}))
vi.mock('../../src/api/dashboard', () => ({
  dashboardApi: {
    getOverview: vi.fn(async () => ({
      managerSummary: { id: 'm1', name: 'DT', level: 1, title: 'Aficionado', currentXp: 0, xpRequiredForNext: 100, progressPercent: 0, reputation: 15 },
      clubSummary: { id: 'c1', name: club.name, shortName: 'POT', city: 'Potrero', country: 'AR', gameDate: club.game_date, colors: null, stadiumName: 'El Potrero' },
      financesSummary: { balance: 5000, weeklyWageBill: 1000, wageBudget: 3500, financialHealth: 'HEALTHY' },
      squadHealth: { totalPlayers: 22, availableCount: 22, averageFitness: 90, averageMorale: 70, injuredCount: 0, suspendedCount: 0 },
      standingsSnippet: null, nextFixture: null, urgentAlerts: [], pendingEvents: state.events
    }))
  }
}))
vi.mock('../../src/api/events', () => ({ eventsApi: { resolveEvent: vi.fn(async () => ({ outcomeNote: 'Listo.' })) } }))
vi.mock('../../src/features/dashboard/ClimatePanel', () => ({ ClimatePanel: () => null, ConsequenceFeed: () => null }))
vi.mock('../../src/features/season/SeasonCloseModal', () => ({ default: () => null }))

import Dashboard from '../../src/features/dashboard/Dashboard'

const opts = [{ id: 'A', label: 'Opción A', description: 'a', effects: {}, cost: 0 }, { id: 'B', label: 'Opción B', description: 'b', effects: {}, cost: 0 }]
const ev = (id, extra = {}) => ({ id, template_code: `EVT_${id}`, category: 'COMMUNITY', severity: 'LOW', title: `Evento ${id}`, description: 'Pasó algo.', options: opts, ...extra })
const renderDashboard = () => render(<MemoryRouter><Dashboard /></MemoryRouter>)

describe('decisiones pendientes del inicio', () => {
  beforeEach(() => { state.events = [] })

  it('se abre sola a pantalla completa una sola: la urgente primero, y las demás quedan como tarjetas con "Jugar"', async () => {
    state.events = [ev('uno'), ev('critico', { severity: 'CRITICAL', category: 'LOCKER_ROOM' }), ev('dos')]
    renderDashboard()
    const dialog = await screen.findByRole('dialog', { name: 'Evento critico' })
    expect(dialog).toBeInTheDocument()
    // Dejarla para más tarde cierra la pantalla completa y NO abre la siguiente sola
    fireEvent.click(within(dialog).getByRole('button', { name: 'Dejar para más tarde' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const section = screen.getByRole('region', { name: 'Decisiones pendientes' })
    expect(within(section).getAllByRole('button', { name: /Jugar/ })).toHaveLength(3)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('el botón "Jugar" de una tarjeta abre ese evento a pantalla completa', async () => {
    state.events = [ev('uno'), ev('dos')]
    renderDashboard()
    fireEvent.click(await screen.findByRole('button', { name: 'Dejar para más tarde' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const section = screen.getByRole('region', { name: 'Decisiones pendientes' })
    const card = within(section).getByText('Evento dos').closest('div[class*="space-y-4"]')
    fireEvent.click(within(card).getByRole('button', { name: /Jugar/ }))
    expect(await screen.findByRole('dialog', { name: 'Evento dos' })).toBeInTheDocument()
  })

  it('sin decisiones pendientes no se abre nada', async () => {
    renderDashboard()
    await screen.findByText('Club Atlético Potrero')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Decisiones pendientes' })).not.toBeInTheDocument()
  })
})
