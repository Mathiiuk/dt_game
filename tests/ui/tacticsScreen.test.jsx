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

  it('muestra quién cobra cada pelota parada, solo por atributos', async () => {
    renderScreen()
    const card = await screen.findByRole('region', { name: 'Especialistas de pelota parada' })
    for (const label of ['Penales', 'Tiros libres', 'Córners', 'Cabezazos']) expect(within(card).getByText(new RegExp(`^${label} · automático`))).toBeInTheDocument()
  })

  it('el DT puede fijar a mano un especialista, se guarda y se recupera', async () => {
    renderScreen()
    const card = await screen.findByRole('region', { name: 'Especialistas de pelota parada' })
    const select = within(card).getByRole('combobox', { name: 'Especialista de penales' })
    const target = [...select.options].find(o => /Nombre5/.test(o.textContent))
    await userEvent.selectOptions(select, target.value)
    expect(within(card).getByText(/^Penales · elegido por vos/)).toBeInTheDocument()

    await userEvent.click(screen.getAllByRole('button', { name: /Guardar cambios/ })[0])
    await waitFor(() => expect(updateTactic).toHaveBeenCalledTimes(1))
    expect(updateTactic.mock.calls[0][1].setPieceTakers).toEqual({ PENALTY: target.value })

    // Al volver a "Automático" ya no queda nada guardado
    await userEvent.selectOptions(select, '')
    expect(within(card).getByText(/^Penales · automático/)).toBeInTheDocument()
  })

  it('una elección guardada se recupera al abrir la pizarra', async () => {
    state.tactic = { id: 't1', formation: '4-4-2', mentality: 'BALANCED', lineup: lineup442, set_piece_takers: { CORNER: 'p3' } }
    renderScreen()
    const card = await screen.findByRole('region', { name: 'Especialistas de pelota parada' })
    expect(within(card).getByText(/^Córners · elegido por vos/)).toBeInTheDocument()
  })

  it('cada instrucción dice qué efecto tiene en el partido', async () => {
    state.tactic = { id: 't1', formation: '4-4-2', mentality: 'BALANCED', lineup: lineup442 }
    renderScreen()
    const mentality = await screen.findByRole('radiogroup', { name: 'Mentalidad' })
    expect(within(mentality).getByRole('radio', { name: /Ofensiva/ })).toHaveTextContent('+20 % ataque, −15 % defensa')
    expect(within(mentality).getByRole('radio', { name: /Muy defensiva/i })).toHaveTextContent('−30 % ataque, +30 % defensa')
    const tempo = screen.getByRole('radiogroup', { name: 'Ritmo de juego' })
    expect(within(tempo).getByRole('radio', { name: /Rápido/ })).toHaveTextContent('más desgaste físico')
    expect(screen.getByRole('radiogroup', { name: 'Estilo de pase' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Intensidad de presión' })).toBeInTheDocument()
  })

  it('un estilo listo fija las cuatro instrucciones de un toque y se guarda', async () => {
    state.tactic = { id: 't1', formation: '4-4-2', mentality: 'BALANCED', lineup: lineup442 }
    renderScreen()
    const styles = await screen.findByRole('group', { name: 'Estilos listos' })
    await userEvent.click(within(styles).getByRole('button', { name: /Contraataque/ }))
    expect(within(styles).getByRole('button', { name: /Contraataque/ })).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('radiogroup', { name: 'Mentalidad' })).getByRole('radio', { name: /^Defensiva/ })).toHaveAttribute('aria-checked', 'true')
    expect(within(screen.getByRole('radiogroup', { name: 'Ritmo de juego' })).getByRole('radio', { name: /Rápido/ })).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(screen.getAllByRole('button', { name: /Guardar cambios/ })[0])
    await waitFor(() => expect(updateTactic).toHaveBeenCalledTimes(1))
    expect(updateTactic.mock.calls[0][1]).toMatchObject({ mentality: 'DEFENSIVE', passing_style: 'DIRECT', tempo: 'FAST', pressing_intensity: 'STAND_OFF' })
  })

  it('el resumen cuenta el efecto total y cambiar una instrucción suelta desmarca el estilo', async () => {
    state.tactic = { id: 't1', formation: '4-4-2', mentality: 'BALANCED', lineup: lineup442 }
    renderScreen()
    const styles = await screen.findByRole('group', { name: 'Estilos listos' })
    await userEvent.click(within(styles).getByRole('button', { name: /Todo arriba/ }))
    const summary = screen.getByRole('region', { name: 'Resumen de instrucciones' })
    expect(summary).toHaveTextContent(/ataque/)
    await userEvent.click(within(screen.getByRole('radiogroup', { name: 'Ritmo de juego' })).getByRole('radio', { name: /Lento/ }))
    expect(within(styles).getByRole('button', { name: /Todo arriba/ })).toHaveAttribute('aria-pressed', 'false')
  })
})

