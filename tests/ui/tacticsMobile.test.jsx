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

const lineup442 = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']
const renderScreen = () => render(<MemoryRouter><TacticsScreen /></MemoryRouter>)
const token = (name) => screen.getAllByRole('button', { name }).find(b => b.hasAttribute('aria-pressed'))

// Celular: sin matchMedia el hook devuelve "no es escritorio"
describe('pizarra en el celular', () => {
  beforeEach(() => {
    updateTactic.mockClear()
    state.tactic = { id: 't1', formation: '4-4-2', mentality: 'BALANCED', lineup: lineup442 }
  })

  it('muestra la cinta de resumen y la barra de herramientas, sin las tarjetas largas', async () => {
    renderScreen()
    const summary = await screen.findByRole('list', { name: 'Resumen del once' })
    expect(within(summary).getByText(/Nivel/)).toBeInTheDocument()
    expect(within(summary).getByText(/Química/)).toBeInTheDocument()
    const dock = screen.getByRole('navigation', { name: 'Herramientas de la pizarra' })
    for (const name of ['Estilo', 'Ajustes', 'Más', 'Editar']) expect(within(dock).getByRole('button', { name })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Especialistas de pelota parada' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Estilos listos' })).not.toBeInTheDocument()
  })

  it('tocar una ficha solo la elige: no abre ninguna lista; "Cambiar jugador" sí', async () => {
    renderScreen()
    await screen.findByRole('group', { name: /formación 4-4-2/ })
    await userEvent.click(token(/MI: Nombre5/))
    const bar = await screen.findByRole('region', { name: 'Puesto elegido: MI' })
    expect(within(bar).getByText('Nombre5 Apellido5')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /Candidatos para/ })).not.toBeInTheDocument()
    await userEvent.click(within(bar).getByRole('button', { name: 'Cambiar jugador' }))
    const list = await screen.findByRole('list', { name: /Candidatos para MI/ })
    // Elegir a otro jugador lo pone en el puesto y cierra la hoja
    await userEvent.click(within(list).getByRole('button', { name: /Nombre11 Apellido11/ }))
    await waitFor(() => expect(screen.queryByRole('list', { name: /Candidatos para/ })).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('tocar el campo con una ficha elegida NO la mueve; con "Editar" sí', async () => {
    renderScreen()
    const field = await screen.findByRole('group', { name: /formación 4-4-2/ })
    await userEvent.click(token(/MI: Nombre5/))
    fireEvent.click(field, { clientX: 10, clientY: 10 })
    expect(screen.getByRole('group', { name: /formación 4-4-2/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.getByRole('button', { name: 'Editando' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(token(/MI: Nombre5/))
    for (let i = 0; i < 12; i++) fireEvent.keyDown(token(/Nombre5/), { key: 'ArrowUp' })
    expect(screen.getByRole('group', { name: /formación 4-3-3/ })).toBeInTheDocument()
  })

  it('sin modo Editar las flechas del teclado tampoco mueven la ficha', async () => {
    renderScreen()
    await screen.findByRole('group', { name: /formación 4-4-2/ })
    await userEvent.click(token(/MI: Nombre5/))
    for (let i = 0; i < 12; i++) fireEvent.keyDown(token(/Nombre5/), { key: 'ArrowUp' })
    expect(screen.getByRole('group', { name: /formación 4-4-2/ })).toBeInTheDocument()
  })

  it('la hoja de Estilo fija un estilo listo de un toque y cuenta su efecto', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Estilo' }))
    await userEvent.click(await screen.findByRole('button', { name: /Todo arriba/ }))
    expect(screen.getByRole('group', { name: 'Estilos listos' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Resumen de instrucciones' })).toHaveTextContent('+40 % ataque')
  })

  it('la hoja de Ajustes muestra una línea por instrucción con el efecto de la elegida', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Ajustes' }))
    const sheet = await screen.findByRole('dialog')
    for (const label of ['Estilo de pase', 'Ritmo de juego', 'Intensidad de presión']) expect(within(sheet).getByRole('radiogroup', { name: label })).toBeInTheDocument()
    await userEvent.click(within(sheet).getByRole('radio', { name: 'Rápido / Vértigo' }))
    expect(within(sheet).getByText(/\+12 % ataque/)).toBeInTheDocument()
  })

  it('la hoja Más trae los especialistas de pelota parada y la química', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Más' }))
    expect(await screen.findByRole('region', { name: 'Especialistas de pelota parada' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Referencias de color' })).toBeInTheDocument()
  })
})
