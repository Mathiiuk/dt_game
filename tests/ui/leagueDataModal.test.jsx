import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const mocks = vi.hoisted(() => ({ ensure: vi.fn(), leagues: vi.fn(), leaders: vi.fn(), mine: vi.fn(), results: vi.fn() }))
vi.mock('../../src/api/competition', () => ({
  competitionApi: {
    ensureWorldLeagues: (...a) => mocks.ensure(...a),
    getAllLeagues: (...a) => mocks.leagues(...a),
    getLeagueLeaders: (...a) => mocks.leaders(...a),
    getClubLeaders: (...a) => mocks.mine(...a),
    getLeagueResults: (...a) => mocks.results(...a)
  }
}))

import LeagueDataModal from '../../src/features/competition/LeagueDataModal'

const club = { id: 'me', name: 'Mi Club', game_date: '2027-01-20', league_tier: 4 }
const row = (club_id, position, name, points) => ({ club_id, position, points, played: 4, goals_for: 6, goals_against: 2, clubs: { name } })
const leagues = [
  { competition: { id: 'w1', name: 'Primera División (Argentina)', level: 1, season_year: 2026 }, current: false, past: false, rows: [row('a', 1, 'River Plate', 9), row('b', 2, 'Boca Juniors', 7)] },
  { competition: { id: 'c4', name: 'Primera C (Argentina)', level: 4, season_year: null }, current: true, past: false, rows: [row('z', 1, 'Rival FC', 9), row('me', 2, 'Mi Club', 3)] },
  { competition: { id: 'old5', name: 'Torneo Regional (Argentina)', level: 5, season_year: 2025 }, current: false, past: true, rows: [row('x', 1, 'Club Viejo', 12)] }
]
const person = (name, clubName, goals, assists, extra = {}) => ({ key: name, name, clubName, goals, assists, points: goals + assists, ...extra })
const boards = {
  w1: { scorers: [person('Lucas Gómez', 'River Plate', 8, 1)], assisters: [person('Mateo Sosa', 'Boca Juniors', 1, 6)], best: [person('Lucas Gómez', 'River Plate', 8, 1)] },
  c4: { scorers: [person('Bruno Díaz', 'Rival FC', 5, 0)], assisters: [], best: [] }
}

const open = async () => {
  render(<LeagueDataModal club={club} onClose={vi.fn()} />)
  return screen.findByRole('dialog')
}

describe('panel "Todas las ligas"', () => {
  beforeEach(() => {
    mocks.ensure.mockReset().mockResolvedValue({ created: 0 })
    mocks.leagues.mockReset().mockResolvedValue(leagues)
    mocks.leaders.mockReset().mockResolvedValue(boards)
    mocks.mine.mockReset().mockResolvedValue({ scorers: [], assisters: [], best: [] })
    mocks.results.mockReset().mockResolvedValue([{ id: 'f1', date: '2027-01-13', round: 18, homeName: 'River Plate', awayName: 'Boca Juniors', homeScore: 2, awayScore: 1 }])
  })

  it('arma el mundo para la fecha de juego y muestra primero la liga del club', async () => {
    const dialog = await open()
    expect(await within(dialog).findByText('Rival FC')).toBeInTheDocument()
    expect(mocks.ensure).toHaveBeenCalledWith({ clubId: 'me', userTier: 4, gameDate: '2027-01-20' })
    expect(mocks.leagues).toHaveBeenCalledWith('me', '2027-01-20')
    expect(within(dialog).getByLabelText('Liga')).toHaveValue('c4')
  })

  it('el selector tiene todas las divisiones, de la Primera al Potrero, y las temporadas anteriores aparte', async () => {
    const dialog = await open()
    const select = await within(dialog).findByLabelText('Liga')
    const labels = within(select).getAllByRole('option').map(o => o.textContent)
    expect(labels[0]).toMatch(/Primera División/)
    expect(labels.some(l => /Primera C/.test(l) && /tu liga/i.test(l))).toBe(true)
    const group = within(select).getByRole('group', { name: 'Temporadas anteriores' })
    expect(within(group).getByRole('option', { name: /Torneo Regional/ })).toBeInTheDocument()
  })

  it('cambiar de liga muestra su tabla', async () => {
    const dialog = await open()
    await userEvent.selectOptions(await within(dialog).findByLabelText('Liga'), 'w1')
    expect(await within(dialog).findByText('River Plate')).toBeInTheDocument()
    expect(within(dialog).queryByText('Rival FC')).not.toBeInTheDocument()
  })

  it('resultados de la liga elegida', async () => {
    const dialog = await open()
    await userEvent.selectOptions(await within(dialog).findByLabelText('Liga'), 'w1')
    await userEvent.click(within(dialog).getByRole('tab', { name: 'Resultados' }))
    expect(await within(dialog).findByText(/River Plate/)).toBeInTheDocument()
    expect(mocks.results).toHaveBeenCalledWith('w1', expect.any(Number))
    expect(within(dialog).getByText('2 - 1')).toBeInTheDocument()
  })

  it('goleadores, asistencias y figura salen de la liga elegida', async () => {
    const dialog = await open()
    await userEvent.selectOptions(await within(dialog).findByLabelText('Liga'), 'w1')
    await userEvent.click(within(dialog).getByRole('tab', { name: 'Goleadores' }))
    expect(await within(dialog).findByText('Lucas Gómez')).toBeInTheDocument()
    expect(within(dialog).getByText('River Plate', { selector: 'span' })).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('tab', { name: 'Asistencias' }))
    expect(await within(dialog).findByText('Mateo Sosa')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('tab', { name: 'Figura' }))
    expect(await within(dialog).findByText('Lucas Gómez')).toBeInTheDocument()
  })

  it('en tu liga se suman los jugadores de tu club', async () => {
    mocks.mine.mockResolvedValue({ scorers: [{ player_id: 'p1', name: 'Mi Goleador', goals: 9, assists: 0, matches: 5 }], assisters: [], best: [] })
    const dialog = await open()
    await userEvent.click(within(dialog).getByRole('tab', { name: 'Goleadores' }))
    const first = (await within(dialog).findAllByRole('listitem'))[0]
    expect(first).toHaveTextContent('Mi Goleador')
    expect(first).toHaveTextContent('Mi Club')
  })

  it('mientras arma el mundo por primera vez lo avisa', async () => {
    let release
    mocks.ensure.mockImplementation(() => new Promise(r => { release = () => r({ created: 4 }) }))
    render(<LeagueDataModal club={club} onClose={vi.fn()} />)
    expect(await screen.findByText(/Armando el mundo del fútbol/)).toBeInTheDocument()
    release()
    await waitFor(() => expect(screen.queryByText(/Armando el mundo del fútbol/)).not.toBeInTheDocument())
  })

  it('si no se pudo armar el mundo igual muestra las ligas que hay', async () => {
    mocks.ensure.mockRejectedValue(new Error('sin red'))
    const dialog = await open()
    expect(await within(dialog).findByText('Rival FC')).toBeInTheDocument()
    expect(within(dialog).getByText(/No pudimos armar las demás divisiones/)).toBeInTheDocument()
  })

  it('si falla la carga de las ligas lo avisa sin romper', async () => {
    mocks.leagues.mockRejectedValue(new Error('sin red'))
    render(<LeagueDataModal club={club} onClose={vi.fn()} />)
    expect(await screen.findByText(/No pudimos cargar las ligas/)).toBeInTheDocument()
  })

  it('sin goles todavía lo dice', async () => {
    mocks.leaders.mockResolvedValue({ c4: { scorers: [], assisters: [], best: [] } })
    const dialog = await open()
    await userEvent.click(within(dialog).getByRole('tab', { name: 'Goleadores' }))
    expect(await within(dialog).findByText(/Todavía no hay goles/)).toBeInTheDocument()
  })
})
