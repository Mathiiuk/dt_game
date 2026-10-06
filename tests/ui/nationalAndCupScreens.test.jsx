import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const state = { team: null }
const acceptOffer = vi.fn(async () => ({}))
const playMatch = vi.fn(async () => ({ won: true, teamGoals: 2, oppGoals: 0, xpBonus: 5 }))
const playUserMatch = vi.fn(async () => ({ userWon: true, matchBonus: 10000, homeScore: 2, awayScore: 1 }))
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
    playUserMatch: (...a) => playUserMatch(...a)
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

// El mock del contexto devuelve un club nuevo en cada render, así que la pantalla vuelve a pedir la copa:
// para variar la respuesta hay que cambiar la implementación (no sólo la primera llamada) y restaurarla después.
const withCup = async (value, run) => {
  const { internationalCupApi } = await import('../../src/api/internationalCup')
  const original = internationalCupApi.getActiveTournament.getMockImplementation()
  internationalCupApi.getActiveTournament.mockImplementation(async () => value)
  try { await run() } finally { internationalCupApi.getActiveTournament.mockImplementation(original) }
}

describe('pantalla Copa Continental', () => {
  it('muestra las llaves y permite jugar sólo el partido propio pendiente', async () => {
    playUserMatch.mockClear()
    render(<MemoryRouter><InternationalCupScreen /></MemoryRouter>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Copa Gloria' })).toBeInTheDocument()
    expect(screen.getByText('Se definirán al concluir los cuartos de final.')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button', { name: /Jugar partido continental/ })
    expect(buttons).toHaveLength(1)
    await userEvent.click(buttons[0])
    await waitFor(() => expect(playUserMatch).toHaveBeenCalledWith('q1', 'c1', 'm1'))
  })

  it('antes del sorteo explica cuándo arranca y no ofrece jugar nada', async () => {
    await withCup({
      tournament: null, fixtures: [], notStarted: true, qualified: false, gameDate: '2026-08-05',
      schedule: { seedDate: '2026-09-01', quarter_finals: '2026-09-16', semi_finals: '2026-10-21', final: '2026-11-21' }
    }, async () => {
      render(<MemoryRouter><InternationalCupScreen /></MemoryRouter>)
      expect(await screen.findByText('La copa todavía no arrancó')).toBeInTheDocument()
      expect(screen.getByText(/Clasifican los 8 mejores de la liga/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Jugar partido continental/ })).not.toBeInTheDocument()
    })
  })

  it('si el partido todavía no llegó a su fecha no se puede jugar y dice cuándo es', async () => {
    await withCup({
      tournament: { name: 'Copa Gloria', season_year: 2026, status: 'in_progress', prize_pool: 1 },
      fixtures: [{ id: 'q1', stage: 'quarter_finals', played: false, match_date: '2026-09-16', home_club_id: 'c1', away_club_id: 'x', home_club: { name: 'Mi Club' }, away_club: { name: 'Rival' } }],
      qualified: true, gameDate: '2026-09-09',
      schedule: { seedDate: '2026-09-01', quarter_finals: '2026-09-16', semi_finals: '2026-10-21', final: '2026-11-21' }
    }, async () => {
      render(<MemoryRouter><InternationalCupScreen /></MemoryRouter>)
      expect(await screen.findByText(/Avanzá las semanas hasta esa fecha/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Jugar partido continental/ })).not.toBeInTheDocument()
    })
  })

  const twoLegSchedule = { seedDate: '2026-09-01', quarter_finals: '2026-09-16', quarter_finals_leg2: '2026-09-23', semi_finals: '2026-10-21', semi_finals_leg2: '2026-10-28', final: '2026-11-21' }
  const club = (id, name) => ({ id, name })
  const leg = (id, n, number, home, away, extra = {}) => ({
    id, stage: 'quarter_finals', match_number: number, leg: n, played: false, match_date: n === 1 ? '2026-09-16' : '2026-09-23',
    home_club_id: home.id, away_club_id: away.id, home_club: home, away_club: away, ...extra
  })

  it('los cruces de ida y vuelta muestran cuál es cada partido y el global parcial', async () => {
    const me = club('c1', 'Mi Club')
    const rival = club('x', 'Rival')
    await withCup({
      tournament: { name: 'Copa Gloria', season_year: 2026, status: 'in_progress', prize_pool: 1 },
      fixtures: [
        leg('i1', 1, 1, me, rival, { played: true, home_score: 2, away_score: 1 }),
        leg('v1', 2, 1, rival, me)
      ],
      qualified: true, gameDate: '2026-09-23', schedule: twoLegSchedule
    }, async () => {
      render(<MemoryRouter><InternationalCupScreen /></MemoryRouter>)
      expect(await screen.findByText(/Cuartos · Ida/)).toBeInTheDocument()
      expect(screen.getByText(/Cuartos · Vuelta/)).toBeInTheDocument()
      expect(screen.getAllByText(/Global parcial: Mi Club 2 - 1 Rival/).length).toBeGreaterThan(0)
      // Con la ida jugada, la vuelta vencida se puede jugar
      expect(screen.getAllByRole('button', { name: /Jugar partido continental/ })).toHaveLength(1)
    })
  })

  it('la vuelta no se puede jugar antes que la ida', async () => {
    const me = club('c1', 'Mi Club')
    const rival = club('x', 'Rival')
    await withCup({
      tournament: { name: 'Copa Gloria', season_year: 2026, status: 'in_progress', prize_pool: 1 },
      fixtures: [leg('i1', 1, 1, me, rival), leg('v1', 2, 1, rival, me)],
      qualified: true, gameDate: '2026-09-30', schedule: twoLegSchedule
    }, async () => {
      render(<MemoryRouter><InternationalCupScreen /></MemoryRouter>)
      expect(await screen.findByText('Primero se juega el partido de ida.')).toBeInTheDocument()
      // solo la ida ofrece jugar
      expect(screen.getAllByRole('button', { name: /Jugar partido continental/ })).toHaveLength(1)
    })
  })

  it('con el cruce definido se informa el global y quién clasifica', async () => {
    const me = club('c1', 'Mi Club')
    const rival = club('x', 'Rival')
    await withCup({
      tournament: { name: 'Copa Gloria', season_year: 2026, status: 'in_progress', prize_pool: 1 },
      fixtures: [
        leg('i1', 1, 1, me, rival, { played: true, home_score: 1, away_score: 0 }),
        leg('v1', 2, 1, rival, me, { played: true, home_score: 1, away_score: 0, winner_club_id: 'c1' })
      ],
      qualified: true, gameDate: '2026-09-30', schedule: twoLegSchedule
    }, async () => {
      render(<MemoryRouter><InternationalCupScreen /></MemoryRouter>)
      expect((await screen.findAllByText(/Global Mi Club 1 - 1 Rival/)).length).toBeGreaterThan(0)
      expect(screen.getAllByText('Mi Club').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Clasifica/).length).toBeGreaterThan(0)
    })
  })
})
