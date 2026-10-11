// Calendario: las filas no se encimen ni se rompan palabra por palabra con rivales de nombre largo
import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const LONG = 'Club Social y Deportivo Independiente de Chivilcoy Unidos'
const weeks = [
  { weekNumber: 11, date: '2026-09-09', phase: 'REGULAR_SEASON_APERTURA', phaseLabel: 'Torneo Apertura', transferWindowOpen: false, isCurrent: false, isPast: true, isFuture: false, events: [],
    match: { id: 'a', status: 'COMPLETED', is_home: false, opponent_name: LONG, home_score: 3, away_score: 1, home_club_id: 'x', away_club_id: 'c1' } },
  { weekNumber: 12, date: '2026-09-16', phase: 'REGULAR_SEASON_APERTURA', phaseLabel: 'Torneo Apertura', transferWindowOpen: false, isCurrent: true, isPast: false, isFuture: false, events: [],
    match: { id: 'b', status: 'SCHEDULED', is_home: false, opponent_name: 'Defensores de Formosa', home_club_id: 'x', away_club_id: 'c1' } },
  { weekNumber: 13, date: '2026-09-23', phase: 'REGULAR_SEASON_APERTURA', phaseLabel: 'Torneo Apertura', transferWindowOpen: true, isCurrent: false, isPast: false, isFuture: true, events: [{ label: 'Libro de pases' }], match: null }
]
vi.mock('../../src/api/calendar', () => ({
  SEASON_PHASES: {},
  calendarApi: {
    resolveCareerId: vi.fn(async () => 'k1'),
    getSeasonCalendar: vi.fn(async () => ({ currentState: { career_id: 'k1', current_week: 12, current_date: '2026-09-16', current_season_year: 2026, season_phase: 'REGULAR_SEASON_APERTURA', transfer_window_open: false }, weeks }))
  }
}))
vi.mock('../../src/api/gameLoop', () => ({ gameLoopApi: { advanceWeek: vi.fn() } }))
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({ club: { id: 'c1', game_date: '2026-09-16' }, manager: { id: 'm1' }, loading: false, refreshContext: vi.fn() })
}))

import CalendarScreen from '../../src/features/calendar/CalendarScreen'

const renderScreen = () => render(<MemoryRouter><CalendarScreen /></MemoryRouter>)

describe('filas del calendario', () => {
  it('el rival ocupa hasta dos líneas (se corta con puntos suspensivos después) y local o visitante va en la línea de la fecha', async () => {
    renderScreen()
    await screen.findByRole('heading', { level: 1, name: 'Calendario' })
    const name = (await screen.findAllByText(new RegExp(LONG)))[0]
    expect(name.className).toMatch(/line-clamp-2/)
    expect(name.className).toMatch(/min-w-0/)
    expect(screen.getAllByText(/^Visitante · /).length).toBeGreaterThan(0)
  })

  it('el resultado se cuenta desde el club propio, con su etiqueta', async () => {
    renderScreen()
    const results = await screen.findByRole('heading', { name: 'Últimos resultados' })
    const list = results.closest('section')
    // Visitante: perdió 1 a 3 aunque el local metió 3
    expect(within(list).getByText('1 - 3')).toBeInTheDocument()
    expect(within(list).getByText('Derrota')).toBeInTheDocument()
  })

  it('la semana en curso va arriba y no se repite en la lista de próximos partidos', async () => {
    renderScreen()
    const upcoming = (await screen.findByRole('heading', { name: 'Próximos 5 partidos' })).closest('section')
    expect(within(upcoming).queryByText(/Defensores de Formosa/)).not.toBeInTheDocument()
    expect(within(upcoming).queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByText('Sin próximos partidos')).toBeInTheDocument()
  })

  it('la semana en curso se marca y el partido pendiente dice "Por jugar"', async () => {
    renderScreen()
    const current = await screen.findByRole('list', { name: 'Semana en curso' })
    expect(within(current).getByText('En curso')).toBeInTheDocument()
    expect(within(current).getByText('Por jugar')).toBeInTheDocument()
    expect(within(current).getByText(/Defensores de Formosa/)).toBeInTheDocument()
  })

  it('en la vista por semanas, una semana sin partido dice "Sin partido" con sus insignias', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('radio', { name: 'Semanas' }))
    const list = screen.getByRole('list', { name: 'Semanas de la temporada' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(within(items[2]).getByText('Sin partido')).toBeInTheDocument()
    expect(within(items[2]).getByText('Mercado')).toBeInTheDocument()
    expect(within(items[2]).getByText('Libro de pases')).toBeInTheDocument()
  })

  it('el filtro de semanas se desliza de costado en una línea en el celular', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('radio', { name: 'Semanas' }))
    expect(screen.getByRole('radiogroup', { name: 'Filtrar semanas' }).className).toMatch(/flex-nowrap/)
  })
})
