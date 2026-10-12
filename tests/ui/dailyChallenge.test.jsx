import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { api } = vi.hoisted(() => ({ api: { get: vi.fn(), submit: vi.fn(), board: vi.fn() } }))
vi.mock('../../src/api/dailyChallenge', () => ({ dailyApi: api }))
vi.mock('../../src/api/supabase', () => ({ supabase: {} }))
vi.mock('../../src/context/GameContext', () => ({ useGameContext: () => ({ club: { id: 'c1', name: 'Mi Club' } }) }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }))
const share = vi.fn()
vi.mock('../../src/lib/shareMatch', () => ({ shareMoment: (...a) => share(...a) }))

import DailyChallengeScreen from '../../src/features/daily/DailyChallengeScreen'

const decisions = [
  { id: 'd1', title: 'La barra te espera', body: 'Tres muchachos con bombo.', options: [{ id: 'a', label: 'Les das entradas' }, { id: 'b', label: 'Los saludás' }] },
  { id: 'd2', title: 'El sobre', body: 'Un sobre abultado.', options: [{ id: 'a', label: 'Aceptás' }, { id: 'b', label: 'Devolvés' }] },
  { id: 'd3', title: 'El árbitro', body: 'Te abraza en el túnel.', options: [{ id: 'a', label: 'Camiseta' }, { id: 'b', label: 'Ignorás' }] }
]
const today = { day: '2026-10-12', goal: { meter: 'barra', min: 65, text: 'Terminá con la Barra en 65 o más' }, decisions, mine: null }
const result = { score: 265, goal_met: true, meters: { caja: 50, barra: 70, vestuario: 55, dirigencia: 60 }, rank: 2, players: 9, results: [
  { title: 'La barra te espera', choice: 'Les das entradas', reaction: 'Aplausos y una factura.', effects: { barra: 20, caja: -10 } },
  { title: 'El sobre', choice: 'Devolvés', reaction: 'El vice se lo guardó.', effects: { dirigencia: 10 } },
  { title: 'El árbitro', choice: 'Ignorás', reaction: 'Se quedó con la mano en el aire.', effects: { vestuario: 5 } }
] }
const board = [{ rank: 1, club: 'Los Pibes', score: 300, goal_met: true, is_me: false }, { rank: 2, club: 'Mi Club', score: 265, goal_met: true, is_me: true }]

const renderIt = () => render(<MemoryRouter><DailyChallengeScreen /></MemoryRouter>)

describe('reto del día', () => {
  beforeEach(() => { Object.values(api).forEach(f => f.mockReset()); share.mockReset(); window.dataLayer = [] })

  it('muestra el objetivo y el primer dilema, sin revelar los efectos', async () => {
    api.get.mockResolvedValue(today)
    renderIt()
    expect(await screen.findByText('Terminá con la Barra en 65 o más')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'La barra te espera' })).toBeInTheDocument()
    expect(screen.getByText(/dilema 1 de 3/i)).toBeInTheDocument()
    expect(screen.queryByText(/\+20/)).toBeNull()
  })

  it('juega los tres dilemas, manda las opciones elegidas y muestra puntaje, puesto y tabla', async () => {
    api.get.mockResolvedValue(today)
    api.submit.mockResolvedValue(result)
    api.board.mockResolvedValue(board)
    renderIt()
    await userEvent.click(await screen.findByRole('button', { name: 'Les das entradas' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Devolvés' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Ignorás' }))
    await userEvent.click(await screen.findByRole('button', { name: /enviar mi reto/i }))
    await waitFor(() => expect(api.submit).toHaveBeenCalledWith(['a', 'b', 'b']))
    const strip = await screen.findByRole('list', { name: 'Resumen del reto' })
    expect(within(strip).getByText('265')).toBeInTheDocument()
    expect(screen.getByText('Aplausos y una factura.')).toBeInTheDocument()
    expect(within(await screen.findByRole('table', { name: /tabla del día/i })).getByText('Los Pibes')).toBeInTheDocument()
    expect(window.dataLayer).toContainEqual({ event: 'daily_complete' })
  })

  it('si ya jugó hoy muestra su resultado y no vuelve a ofrecer los dilemas', async () => {
    api.get.mockResolvedValue({ ...today, mine: { score: 265, goal_met: true, rank: 2, players: 9, results: result.results } })
    api.board.mockResolvedValue(board)
    renderIt()
    expect(within(await screen.findByRole('list', { name: 'Resumen del reto' })).getByText('265')).toBeInTheDocument()
    expect(screen.queryByText(/dilema 1 de 3/i)).toBeNull()
    expect(screen.getByRole('button', { name: /compartir mi reto/i })).toBeInTheDocument()
  })

  it('la tabla se puede filtrar a mis amigos', async () => {
    api.get.mockResolvedValue({ ...today, mine: { score: 265, goal_met: true, rank: 2, players: 9, results: result.results } })
    api.board.mockResolvedValue(board)
    renderIt()
    await userEvent.click(await screen.findByRole('radio', { name: /mis amigos/i }))
    await waitFor(() => expect(api.board).toHaveBeenLastCalledWith(true))
  })

  it('comparte el reto con la tarjeta del momento', async () => {
    api.get.mockResolvedValue({ ...today, mine: { score: 265, goal_met: true, rank: 2, players: 9, results: result.results } })
    api.board.mockResolvedValue(board)
    share.mockResolvedValue('shared')
    renderIt()
    await userEvent.click(await screen.findByRole('button', { name: /compartir mi reto/i }))
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ kind: 'daily', big: '265 pts' }))
  })

  it('muestra la racha de días seguidos y no muestra nada si no hay', async () => {
    api.get.mockResolvedValue({ ...today, streak: 3 })
    const { unmount } = renderIt()
    expect(await screen.findByText(/racha: 3 días/i)).toBeInTheDocument()
    unmount()
    api.get.mockResolvedValue({ ...today, streak: 1 })
    const again = renderIt()
    expect(await screen.findByText(/racha: 1 día\b/i)).toBeInTheDocument()
    again.unmount()
    api.get.mockResolvedValue({ ...today, streak: 0 })
    renderIt()
    await screen.findByText('Terminá con la Barra en 65 o más')
    expect(screen.queryByText(/racha:/i)).toBeNull()
  })

  it('al jugar muestra la cuenta regresiva del contrarreloj con lo que ya corrió el reloj', async () => {
    api.get.mockResolvedValue({ ...today, seconds_since_start: 10 })
    renderIt()
    expect(await screen.findByText(/contrarreloj/i)).toHaveTextContent(/20 s/)
    expect(screen.getByText(/contrarreloj/i)).toHaveTextContent(/\+10/)
  })

  it('pasado el minuto ya no hay contrarreloj', async () => {
    api.get.mockResolvedValue({ ...today, seconds_since_start: 400 })
    renderIt()
    await screen.findByText('Terminá con la Barra en 65 o más')
    expect(screen.queryByText(/contrarreloj/i)).toBeNull()
  })

  it('el resultado cuenta el bonus por rapidez cuando lo hubo', async () => {
    api.get.mockResolvedValue({ ...today, mine: { score: 275, goal_met: true, rank: 1, players: 9, bonus: 10, results: result.results } })
    api.board.mockResolvedValue(board)
    renderIt()
    expect(await screen.findByText(/bonus por rapidez: \+10/i)).toBeInTheDocument()
  })

  it('sin bonus no se menciona', async () => {
    api.get.mockResolvedValue({ ...today, mine: { score: 265, goal_met: true, rank: 2, players: 9, bonus: 0, results: result.results } })
    api.board.mockResolvedValue(board)
    renderIt()
    await screen.findByRole('list', { name: 'Resumen del reto' })
    expect(screen.queryByText(/bonus por rapidez/i)).toBeNull()
  })

  it('la tabla tiene la pestaña de ayer y la pide con el día anterior del servidor', async () => {
    api.get.mockResolvedValue({ ...today, mine: { score: 265, goal_met: true, rank: 2, players: 9, results: result.results } })
    api.board.mockResolvedValue(board)
    renderIt()
    await userEvent.click(await screen.findByRole('radio', { name: /ayer/i }))
    await waitFor(() => expect(api.board).toHaveBeenLastCalledWith(false, '2026-10-11'))
    await userEvent.click(screen.getByRole('radio', { name: /hoy/i }))
    await waitFor(() => expect(api.board).toHaveBeenLastCalledWith(false))
  })

  it('el resumen del reto incluye las pestañas de hoy y ayer con amigos también', async () => {
    api.get.mockResolvedValue({ ...today, mine: { score: 265, goal_met: true, rank: 2, players: 9, results: result.results } })
    api.board.mockResolvedValue(board)
    renderIt()
    await userEvent.click(await screen.findByRole('radio', { name: /ayer/i }))
    await userEvent.click(screen.getByRole('radio', { name: /mis amigos/i }))
    await waitFor(() => expect(api.board).toHaveBeenLastCalledWith(true, '2026-10-11'))
  })

  it('si falla la carga avisa y deja reintentar', async () => {
    api.get.mockRejectedValueOnce(new Error('sin red')).mockResolvedValue(today)
    renderIt()
    await userEvent.click(await screen.findByRole('button', { name: /reintentar/i }))
    expect(await screen.findByText('Terminá con la Barra en 65 o más')).toBeInTheDocument()
  })
})
