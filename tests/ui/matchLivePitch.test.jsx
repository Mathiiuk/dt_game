// Cancha en vivo dentro de la pantalla del partido real (con los mismos datos de prueba que matchDecisions): pelota, gol, tarjeta y bancos
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

describe('cancha en vivo dentro del partido', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mocks.replay.mockClear()
    mocks.start.mockReset()
    mocks.staff.mockResolvedValue([{ id: 's1', role: 'HEAD_SCOUT' }])
    mocks.ctx = {}
  })
  afterEach(() => vi.useRealTimers())

  const startMatch = async (events) => {
    mocks.start.mockResolvedValue(results(events))
    render(<MemoryRouter><MatchScreen /></MemoryRouter>)
    // Antes del pitazo no hay cancha: solo el vestuario
    expect(screen.queryByTestId('live-ball')).toBeNull()
    click(await screen.findByRole('button', { name: /Comenzar partido/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pausa' })).toBeInTheDocument())
    vi.useFakeTimers()
    click(screen.getByRole('button', { name: 'Pausa' }))
    click(screen.getByRole('button', { name: 'Reanudar' }))
  }

  it('al empezar aparece la cancha con la pelota en juego, sin cartel de gol', async () => {
    await startMatch([])
    minutes(1)
    expect(screen.getByTestId('live-ball')).toBeInTheDocument()
    expect(screen.queryByTestId('goal-flash')).toBeNull()
  })

  it('un gol propio muestra el cartel y el banco festeja; el del rival, se lamenta', async () => {
    await startMatch([
      { minute: 5, type: 'GOAL', team: 'home', text: 'Gol nuestro', playerId: 'p9' },
      { minute: 20, type: 'GOAL', team: 'away', text: 'Gol rival' }
    ])
    minutes(5)
    expect(screen.getByTestId('goal-flash')).toBeInTheDocument()
    expect(screen.getByTestId('bench-home')).toHaveAttribute('data-cheer', 'true')
    expect(screen.getByTestId('bench-away')).toHaveAttribute('data-lament', 'true')
    minutes(15)
    expect(screen.getByTestId('goal-flash')).toBeInTheDocument()
    expect(screen.getByTestId('bench-away')).toHaveAttribute('data-cheer', 'true')
    expect(screen.getByTestId('bench-home')).toHaveAttribute('data-lament', 'true')
  })

  it('el cartel de gol se apaga unos minutos después', async () => {
    await startMatch([{ minute: 5, type: 'GOAL', team: 'home', text: 'Gol nuestro', playerId: 'p9' }])
    minutes(5)
    expect(screen.getByTestId('goal-flash')).toBeInTheDocument()
    minutes(4)
    expect(screen.queryByTestId('goal-flash')).toBeNull()
  })

  it('una roja se ve en la cancha y la pelota va al arco del que ataca', async () => {
    await startMatch([
      { minute: 3, type: 'SHOT', team: 'home', text: 'Remate' },
      { minute: 10, type: 'CARD_RED', team: 'away', text: 'Roja', playerId: 'q1' }
    ])
    minutes(3)
    expect(Number(screen.getByTestId('live-ball').getAttribute('data-x'))).toBeGreaterThan(80)
    minutes(7)
    expect(screen.getByTestId('card-flash')).toHaveAttribute('data-kind', 'red')
  })

  it('la cancha es decorativa: oculta a lectores de pantalla (el relato ya lo cuenta)', async () => {
    await startMatch([])
    minutes(1)
    expect(screen.getByTestId('live-ball').closest('[aria-hidden="true"]')).not.toBeNull()
  })
})
