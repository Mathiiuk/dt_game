import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const state = {
  ctx: { user: { id: 'u1' }, manager: null, retiredManager: { id: 'm1', is_retired: true }, club: null, loading: false },
  snapshot: null,
  confirm: true
}
const navigate = vi.fn()
const startNewDynasty = vi.fn(async () => ({ success: true }))
const processRetirement = vi.fn(async () => state.snapshot)
const confirmAction = vi.fn(async () => state.confirm)

vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }))
vi.mock('../../src/context/GameContext', () => ({ useGameContext: () => ({ ...state.ctx, confirmAction }) }))
vi.mock('../../src/api/endgame', () => ({
  endgameApi: {
    getEndgameSnapshot: vi.fn(async () => state.snapshot),
    processRetirement: (...a) => processRetirement(...a),
    startNewDynasty: (...a) => startNewDynasty(...a)
  }
}))

import EndgameScreen from '../../src/features/career/EndgameScreen'

const snapshot = {
  manager_name: 'Marcelo Gallardo', club_name: 'Club Atlético Potrero', legacy_rank: 'Leyenda del banco', legacy_score: 640,
  total_matches: 120, total_won: 70, win_rate: 58, titles_count: 2, trophies: [{ name: 'Liga' }],
  career_headline: 'PUNTO FINAL A UNA ERA DE GLORIA Y TÍTULOS', newspaper_edition: 'Edición Histórica de Colección',
  epilogue_text: 'Primer párrafo de la crónica.\n\nSegundo párrafo de la crónica.'
}

const renderScreen = () => render(<MemoryRouter><EndgameScreen /></MemoryRouter>)

describe('Epílogo y dinastía', () => {
  beforeEach(() => {
    navigate.mockClear()
    startNewDynasty.mockClear()
    processRetirement.mockClear()
    confirmAction.mockClear()
    state.confirm = true
    state.snapshot = snapshot
    state.ctx = { user: { id: 'u1' }, manager: null, retiredManager: { id: 'm1', is_retired: true }, club: null, loading: false }
  })

  it('muestra la crónica, el rango y las estadísticas del DT retirado', async () => {
    renderScreen()
    expect(await screen.findByText('PUNTO FINAL A UNA ERA DE GLORIA Y TÍTULOS')).toBeInTheDocument()
    expect(screen.getAllByText('Leyenda del banco').length).toBeGreaterThan(0)
    expect(screen.getByText('640')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('Primer párrafo de la crónica.')).toBeInTheDocument()
    expect(screen.getByText('Segundo párrafo de la crónica.')).toBeInTheDocument()
  })

  it('con el DT retirado no hay botón de volver: solo sucesión o Salón de la Fama', async () => {
    const { unmount } = renderScreen()
    await screen.findByText('PUNTO FINAL A UNA ERA DE GLORIA Y TÍTULOS')
    const retiredButtons = screen.getAllByRole('button').length
    expect(screen.getAllByRole('button', { name: /Salón de la Fama/ }).length).toBeGreaterThan(0)
    unmount()

    // Con el DT todavía en actividad aparece, además, el botón de volver a su carrera
    state.ctx = { user: { id: 'u1' }, manager: { id: 'm1', is_retired: true }, retiredManager: null, club: { id: 'c1' }, loading: false }
    renderScreen()
    await screen.findByText('PUNTO FINAL A UNA ERA DE GLORIA Y TÍTULOS')
    expect(screen.getAllByRole('button').length).toBe(retiredButtons + 1)
  })

  it('fundar la dinastía pide confirmación y lleva a crear al nuevo DT', async () => {
    renderScreen()
    await screen.findByText('PUNTO FINAL A UNA ERA DE GLORIA Y TÍTULOS')
    await userEvent.click(screen.getByRole('button', { name: /Fundar/ }))
    expect(confirmAction).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(startNewDynasty).toHaveBeenCalledWith('u1', 'm1'))
    expect(navigate).toHaveBeenCalledWith('/create-manager', { replace: true })
  })

  it('si cancelás la confirmación no pasa nada', async () => {
    state.confirm = false
    renderScreen()
    await screen.findByText('PUNTO FINAL A UNA ERA DE GLORIA Y TÍTULOS')
    await userEvent.click(screen.getByRole('button', { name: /Fundar/ }))
    expect(startNewDynasty).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('un DT que todavía no se retiró ve el aviso y puede volver a su carrera', async () => {
    state.snapshot = null
    state.ctx = { user: { id: 'u1' }, manager: { id: 'm2', is_retired: false }, retiredManager: null, club: { id: 'c1' }, loading: false }
    renderScreen()
    expect(await screen.findByText('Aún no te has retirado')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Volver a carrera del DT/ }))
    expect(navigate).toHaveBeenCalledWith('/manager')
    expect(processRetirement).not.toHaveBeenCalled()
  })

  it('un DT marcado como retirado sin crónica la genera al entrar', async () => {
    state.snapshot = null
    processRetirement.mockResolvedValueOnce(snapshot)
    state.ctx = { user: { id: 'u1' }, manager: null, retiredManager: { id: 'm1', is_retired: true }, club: { id: 'c1' }, loading: false }
    state.ctx.manager = { id: 'm1', is_retired: true }
    renderScreen()
    expect(await screen.findByText('PUNTO FINAL A UNA ERA DE GLORIA Y TÍTULOS')).toBeInTheDocument()
    expect(processRetirement).toHaveBeenCalledWith('m1', 'c1')
  })

  it('sin ningún DT manda a crear uno', async () => {
    state.ctx = { user: { id: 'u1' }, manager: null, retiredManager: null, club: null, loading: false }
    renderScreen()
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/create-manager', { replace: true }))
  })
})
