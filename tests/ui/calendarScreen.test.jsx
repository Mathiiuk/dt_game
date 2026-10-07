import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

let matchStatus = 'SCHEDULED'
let matchDate = '2026-07-29'
const advanceWeek = vi.fn(async () => ({ week: 3, fired: false }))

const makeWeeks = () => [1, 2, 3, 5].map(n => ({
  weekNumber: n, date: `2026-07-${String(1 + (n - 1) * 7).padStart(2, '0')}`, phase: n < 3 ? 'PRE_SEASON' : 'REGULAR_SEASON_APERTURA',
  phaseLabel: n < 3 ? 'Pretemporada' : 'Torneo Apertura', transferWindowOpen: n < 3, isCurrent: n === 2, isPast: n < 2, isFuture: n > 2,
  events: n === 1 ? [{ label: 'Apertura Libro de Pases' }] : [],
  match: n === 5 ? { id: 'f1', match_date: matchDate, status: matchStatus, home_club_id: 'c1', away_club_id: 'x', home_score: null, away_score: null } : null
}))

vi.mock('../../src/api/calendar', () => ({
  SEASON_PHASES: { PRE_SEASON: { label: 'Pretemporada' } },
  calendarApi: {
    resolveCareerId: vi.fn(async () => 'k1'),
    getSeasonCalendar: vi.fn(async () => ({
      currentState: { career_id: 'k1', current_week: 2, current_date: '2026-07-08', current_season_year: 2026, season_phase: 'PRE_SEASON', transfer_window_open: true },
      weeks: makeWeeks()
    }))
  }
}))
vi.mock('../../src/api/gameLoop', () => ({ gameLoopApi: { advanceWeek: (...a) => advanceWeek(...a) } }))
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({ club: { id: 'c1', game_date: '2026-07-08' }, manager: { id: 'm1' }, loading: false, refreshContext: vi.fn() })
}))

import CalendarScreen from '../../src/features/calendar/CalendarScreen'

const renderScreen = () => render(<MemoryRouter><CalendarScreen /></MemoryRouter>)

describe('pantalla Calendario', () => {
  beforeEach(() => { advanceWeek.mockClear(); matchStatus = 'SCHEDULED'; matchDate = '2026-07-29' })

  it('marca la semana en curso y avanza con el motor real (careerId y semana esperada)', async () => {
    renderScreen()
    expect(await screen.findByRole('heading', { level: 1, name: 'Calendario' })).toBeInTheDocument()
    expect(screen.getByRole('listitem', { current: 'date' })).toHaveTextContent('En curso')
    await userEvent.click(screen.getByRole('button', { name: /Avanzar semana/ }))
    await waitFor(() => expect(advanceWeek).toHaveBeenCalledWith('c1', 'm1', { careerId: 'k1', expectedCurrentWeek: 2 }))
  })

  it('con un partido vencido sin jugar, el avance se reemplaza por ir a jugarlo', async () => {
    matchDate = '2026-07-08'
    renderScreen()
    expect(await screen.findByRole('button', { name: /Jugar el partido pendiente/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Avanzar semana/ })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/partido pendiente/)
  })

  it('filtra por partidos y por mercado', async () => {
    renderScreen()
    await screen.findByRole('heading', { level: 1, name: 'Calendario' })
    await userEvent.click(screen.getByRole('radio', { name: 'Semanas' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Partidos' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    await userEvent.click(screen.getByRole('radio', { name: 'Fichajes' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('muestra el rival y la condición en próximos partidos', async () => {
    renderScreen()
    expect(await screen.findByText(/vs\. Rival/i)).toBeInTheDocument()
    expect(screen.getByText(/\(Local\)/i)).toBeInTheDocument()
  })
})
