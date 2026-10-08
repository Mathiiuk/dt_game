import React from 'react'
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const POSITIONS = ['PO', 'LI', 'DFC', 'DFC', 'LD', 'MI', 'MC', 'MC', 'MD', 'DC', 'DC', 'DFC', 'MC']
const squad = POSITIONS.map((position, i) => ({
  id: `p${i}`, first_name: `Nombre${i}`, last_name: `Apellido${i}`, position, age: 25, attr_overall: 60, shirt_number: i + 1, state_fitness: 90
}))

const state = { tactic: null }
const updateTactic = vi.fn(async (clubId, data) => ({ id: 't1', ...data }))

vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({ club: { id: 'c1' }, loading: false })
}))
vi.mock('../../src/api/player', () => ({ playerApi: { getSquad: vi.fn(async () => squad) } }))
vi.mock('../../src/api/tactics', async (importOriginal) => ({
  ...(await importOriginal()),
  tacticsApi: {
    getTactic: vi.fn(async () => state.tactic),
    updateTactic: (...a) => updateTactic(...a)
  }
}))

import TacticsScreen from '../../src/features/tactics/TacticsScreen'
import { getLayout } from '../../src/domain/formations'

const lineup442 = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']

const renderScreen = () => render(<MemoryRouter><TacticsScreen /></MemoryRouter>)
// Las fichas de la cancha tienen aria-pressed; la lista de candidatos no
const token = (name) => screen.getAllByRole('button', { name }).find(b => b.hasAttribute('aria-pressed'))

describe('pizarra con alineación libre', () => {
  beforeEach(() => {
    updateTactic.mockClear()
    state.tactic = { id: 't1', formation: '4-4-2', mentality: 'BALANCED', lineup: lineup442 }
  })

  it('con una formación fija todo sigue igual: sin esquema libre', async () => {
    renderScreen()
    expect(await screen.findByRole('group', { name: /formación 4-4-2/ })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /Libre/ })).not.toBeInTheDocument()
  })

  it('mover una ficha pasa a alineación libre, muestra el esquema y se puede guardar', async () => {
    renderScreen()
    await screen.findByRole('group', { name: /formación 4-4-2/ })

    // El mediocampista izquierdo se selecciona y sube a la punta con las flechas
    await userEvent.click(token(/MI: Nombre5/))
    expect(token(/MI: Nombre5.*seleccionado/)).toBeTruthy()
    for (let i = 0; i < 12; i++) fireEvent.keyDown(token(/Nombre5/), { key: 'ArrowUp' })

    // Ya es un 4-3-3 libre (al seleccionar una ficha la pizarra muestra la pestaña de jugadores)
    expect(screen.getByRole('group', { name: /formación 4-3-3/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: /Instrucciones/ }))
    expect(await screen.findByRole('radio', { name: 'Libre 4-3-3' })).toBeInTheDocument()

    await userEvent.click(screen.getAllByRole('button', { name: /Guardar cambios/ })[0])
    await waitFor(() => expect(updateTactic).toHaveBeenCalledTimes(1))
    const saved = updateTactic.mock.calls[0][1]
    expect(saved.formation).toBe('LIBRE')
    expect(saved.customLayout).toHaveLength(11)
    expect(saved.lineup).toHaveLength(11)
    expect(new Set(saved.lineup).size).toBe(11)
    expect(saved.customLayout.filter(p => p.slot === 'PO')).toHaveLength(1)
    expect(saved.lineupDetails.every(d => saved.customLayout.some(p => p.slot === d.pitch_position))).toBe(true)
  })

  it('una alineación libre guardada se recupera tal cual', async () => {
    const layout = getLayout('4-3-3')
    state.tactic = { id: 't1', formation: 'LIBRE', custom_layout: layout, lineup: lineup442 }
    renderScreen()
    expect(await screen.findByRole('radio', { name: 'Libre 4-3-3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /EI:/ })).toBeInTheDocument()
  })

  it('un layout guardado roto se descarta y vuelve a una formación fija', async () => {
    state.tactic = { id: 't1', formation: 'LIBRE', custom_layout: [{ slot: 'PO', x: 50, y: 90 }], lineup: lineup442 }
    renderScreen()
    expect(await screen.findByRole('group', { name: /formación 4-4-2/ })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /Libre/ })).not.toBeInTheDocument()
  })

  it('elegir una formación fija vuelve a la estructura clásica', async () => {
    state.tactic = { id: 't1', formation: 'LIBRE', custom_layout: getLayout('4-3-3'), lineup: lineup442 }
    renderScreen()
    await screen.findByRole('radio', { name: 'Libre 4-3-3' })
    await userEvent.click(screen.getByRole('radio', { name: '5-3-2' }))
    expect(screen.getByRole('group', { name: /formación 5-3-2/ })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /Libre/ })).not.toBeInTheDocument()
  })

  it('muestra quién cobra cada pelota parada', async () => {
    renderScreen()
    const card = await screen.findByRole('region', { name: 'Especialistas de pelota parada' })
    for (const label of ['Penales', 'Tiros libres', 'Córners', 'Cabezazos']) expect(within(card).getByText(label)).toBeInTheDocument()
  })
})
