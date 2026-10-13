// Partido en escritorio (≥1024 px): dirección técnica en un solo panel, cancha grande y sin la botonera de abajo
import React from 'react'
import { render, screen, act, waitFor, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const mocks = vi.hoisted(() => ({
  replay: vi.fn((results) => results),
  start: vi.fn(),
  staff: vi.fn(),
  ctx: {}
}))

const player = (i, extra = {}) => ({
  id: `p${i}`, first_name: 'Juan', last_name: `Nro${i}`, position: i === 0 ? 'PO' : 'MC', attr_overall: 60 + (i % 5),
  state_fitness: 90, attr_pace: 60, attr_shooting: 60, attr_finishing: 60, attr_passing: 60, attr_defending: 60, ...extra
})

vi.mock('../../src/api/auth', () => ({ authApi: { getSession: vi.fn(async () => ({ id: 'u1' })) } }))
vi.mock('../../src/api/manager', () => ({ managerApi: { getManager: vi.fn(async () => ({ id: 'm1' })) } }))
vi.mock('../../src/api/club', () => ({ clubApi: { getClubByManager: vi.fn(async () => ({ id: 'c1', name: 'Mi Club', manager_id: 'm1', squad_morale: 70 })) } }))
vi.mock('../../src/api/tactics', async (importActual) => ({
  ...(await importActual()),
  tacticsApi: { getTactic: vi.fn(async () => ({ formation: '4-4-2', lineup: Array.from({ length: 11 }, (_, i) => `p${i}`) })) }
}))
vi.mock('../../src/api/player', () => ({ playerApi: { getSquad: vi.fn(async () => Array.from({ length: 16 }, (_, i) => player(i))) } }))
vi.mock('../../src/api/staff', () => ({ staffApi: { getStaff: (...a) => mocks.staff(...a) } }))
vi.mock('../../src/api/chemistry', () => ({ chemistryApi: { getContext: vi.fn(async () => ({})), withArchetypes: (p) => p } }))
vi.mock('../../src/api/matchEngine', async (importActual) => ({
  ...(await importActual()),
  matchEngineApi: { startMatch: (...a) => mocks.start(...a), replayWithChanges: (...a) => mocks.replay(...a), finalizeMatch: vi.fn(async () => {}) }
}))
vi.mock('../../src/context/GameContext', () => ({ useGameContext: () => ({ confirmAction: vi.fn(async () => true), ...mocks.ctx }) }))

import MatchScreen from '../../src/features/match/MatchScreen'
import { authApi } from '../../src/api/auth'
import { managerApi } from '../../src/api/manager'
import { clubApi } from '../../src/api/club'
import { tacticsApi } from '../../src/api/tactics'
import { playerApi } from '../../src/api/player'

const results = (events = []) => ({ seed: 's', homeScore: 0, awayScore: 0, events, stats: { possession: { home: 50, away: 50 }, shots: { home: 0, away: 0 }, shotsOnTarget: { home: 0, away: 0 }, fouls: { home: 0, away: 0 }, corners: { home: 0, away: 0 } }, inputs: {} })

const minutes = (n) => { for (let i = 0; i < n; i++) act(() => { vi.advanceTimersByTime(700) }) }
const click = (el) => act(() => { fireEvent.click(el) })


const desktop = () => {
  window.matchMedia = (query) => ({ matches: query.includes('min-width: 1024px'), media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false } })
}

describe('partido en escritorio 2.0', () => {
  const original = window.matchMedia
  beforeEach(() => {
    desktop()
    sessionStorage.clear()
    mocks.start.mockReset()
    mocks.staff.mockResolvedValue([])
    mocks.ctx = {}
    mocks.start.mockResolvedValue(results([]))
  })
  afterEach(() => { window.matchMedia = original })

  const begin = async () => {
    render(<MemoryRouter><MatchScreen /></MemoryRouter>)
    click(await screen.findByRole('button', { name: /Comenzar partido/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pausa' })).toBeInTheDocument())
  }

  it('el control, las órdenes y los cambios viven en un solo panel y no hay botonera inferior', async () => {
    await begin()
    const panel = screen.getByRole('region', { name: 'Dirección técnica' })
    expect(within(panel).getByRole('button', { name: 'Pausa' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: /Hacer un cambio/ })).toBeInTheDocument()
    // Una sola botonera: sin el "Gritos" / "Cambios" repetidos de abajo
    expect(screen.getAllByRole('button', { name: 'Pausa' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /^Gritos$/ })).toBeNull()
  })

  it('muestra la cancha grande con los 22 jugadores, la línea de tiempo y las estadísticas abiertas', async () => {
    await begin()
    expect(screen.getAllByTestId('pitch-dot-home')).toHaveLength(11)
    expect(screen.getAllByTestId('pitch-dot-away')).toHaveLength(11)
    expect(screen.getByRole('progressbar', { name: /minuto/i })).toBeInTheDocument()
    expect(screen.getByText('Tiros')).toBeInTheDocument()
  })

  it('"Hacer un cambio" abre el diálogo de dos paneles y pausa el partido', async () => {
    await begin()
    click(screen.getByRole('button', { name: /Hacer un cambio/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Titulares/)).toBeInTheDocument()
    expect(within(dialog).getByText(/Elegí a quién sacar/i)).toBeInTheDocument()
  })
})
