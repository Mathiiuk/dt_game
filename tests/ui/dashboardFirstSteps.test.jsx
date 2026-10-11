// Inicio: tarjeta "Tu próximo paso" y misión inicial para cuentas nuevas
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
vi.mock('../../src/features/dashboard/ClimatePanel', () => ({ ClimatePanel: () => null, ConsequenceFeed: () => null }))
vi.mock('../../src/features/season/SeasonCloseModal', () => ({ default: () => null }))

import Dashboard from '../../src/features/dashboard/Dashboard'

const opts = [{ id: 'A', label: 'Opción A', description: 'a', effects: {}, cost: 0 }]
const ev = (id) => ({ id, template_code: `EVT_${id}`, category: 'COMMUNITY', severity: 'LOW', title: `Evento ${id}`, description: 'Pasó algo.', options: opts })
const fixture = (date) => ({ id: 'f1', match_date: date, match_week: 1, home_team_id: 'c1', away_team_id: 'c2', home: { name: 'Potrero' }, away: { name: 'Rival FC', strength: 55 } })
const renderDashboard = () => render(<MemoryRouter><Dashboard /></MemoryRouter>)

describe('inicio: próximo paso y misión inicial', () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.assign(state, { events: [], fixture: null, played: 0, available: 22, user: { id: 'u1', created_at: '2026-10-12T10:00:00Z' } })
  })

  it('sin nada urgente dice cómo prepararse y sin partido a la vista sugiere avanzar', async () => {
    renderDashboard()
    expect(await screen.findByRole('heading', { name: 'Preparate para el próximo partido' })).toBeInTheDocument()
  })

  it('con decisiones pendientes ofrece decidir y abre la historia a pantalla completa', async () => {
    state.events = [ev('uno')]
    renderDashboard()
    const dialog = await screen.findByRole('dialog', { name: 'Evento uno' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Dejar para más tarde' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'Tenés 1 decisión pendiente' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /decidir ahora/i }))
    expect(await screen.findByRole('dialog', { name: 'Evento uno' })).toBeInTheDocument()
  })

  it('el día del debut, sin haber visto la pizarra, manda a la táctica', async () => {
    state.fixture = fixture('2027-01-20')
    renderDashboard()
    expect(await screen.findByRole('heading', { name: 'Hoy es tu debut: revisá la táctica' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /abrir la pizarra/i })).toHaveAttribute('href', '/tactics')
  })

  it('una cuenta nueva ve la misión con tres pasos; ver la pizarra y jugar los va tildando', async () => {
    renderDashboard()
    const card = await screen.findByRole('region', { name: 'Tu primera misión' })
    expect(within(card).getByText('0 de 3', { exact: false })).toBeInTheDocument()
    // Plegada: solo el próximo paso; desplegada, los tres
    expect(within(card).getAllByRole('listitem')).toHaveLength(1)
    fireEvent.click(within(card).getByRole('button', { name: /ver los tres pasos/i }))
    expect(within(card).getAllByRole('listitem')).toHaveLength(3)
    window.localStorage.setItem('vestuario-first-steps:u1', JSON.stringify({ tactics: true }))
    window.dispatchEvent(new Event('vestuario:first-steps'))
    expect(await within(card).findByText('1 de 3', { exact: false })).toBeInTheDocument()
  })

  it('se puede ocultar y no vuelve; las cuentas anteriores no la ven', async () => {
    const { unmount } = renderDashboard()
    fireEvent.click(await screen.findByRole('button', { name: 'Ocultar la misión inicial' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Tu primera misión' })).not.toBeInTheDocument())
    unmount()
    renderDashboard()
    await screen.findByRole('heading', { name: 'Preparate para el próximo partido' })
    expect(screen.queryByRole('region', { name: 'Tu primera misión' })).not.toBeInTheDocument()
    window.localStorage.clear()
    state.user = { id: 'u2', created_at: '2026-01-01T00:00:00Z' }
    renderDashboard()
    await waitFor(() => expect(screen.getAllByRole('heading', { name: 'Preparate para el próximo partido' }).length).toBeGreaterThan(0))
    expect(screen.queryByRole('region', { name: 'Tu primera misión' })).not.toBeInTheDocument()
  })
})
