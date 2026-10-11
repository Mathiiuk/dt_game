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
    expect(within(summary).getByText(/Niv\./)).toBeInTheDocument()
    expect(within(summary).getByText(/Quím/)).toBeInTheDocument()
    const dock = screen.getByRole('navigation', { name: 'Herramientas de la pizarra' })
    for (const name of ['Estilo', 'Ajustes', 'Más', 'Editar']) expect(within(dock).getByRole('button', { name })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Especialistas de pelota parada' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Estilos listos' })).not.toBeInTheDocument()
  })

  it('la cinta de resumen y la barra de herramientas no son pegajosas: no tapan la barra superior del juego', async () => {
    renderScreen()
    const summary = await screen.findByRole('list', { name: 'Resumen del once' })
    expect(summary.parentElement.className).not.toMatch(/sticky|fixed/)
    expect(screen.getByRole('navigation', { name: 'Herramientas de la pizarra' }).className).not.toMatch(/sticky|fixed/)
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

  it('con jugadores suspendidos en el once lo cuenta en el resumen y explica los símbolos en una línea', async () => {
    squad[2].is_suspended = true; squad[2].suspension_reason = 'RED'; squad[2].suspended_matches = 1
    squad[3].is_injured = true
    try {
      renderScreen()
      const summary = await screen.findByRole('list', { name: 'Resumen del once' })
      // Las bajas son una sola marca compacta (cabe en la misma línea); el detalle va en el nombre accesible
      expect(within(summary).getByLabelText('1 lesionado, 1 suspendido')).toBeInTheDocument()
      expect(screen.getByText(/tarjeta roja: expulsado/i)).toBeInTheDocument()
    } finally {
      delete squad[2].is_suspended; delete squad[2].suspension_reason; delete squad[2].suspended_matches; delete squad[3].is_injured
    }
  })

  describe('ayuda con "?" (los textos explicativos no ocupan lugar en la pantalla)', () => {
    it('bajo la cancha ya no hay párrafos fijos, pero el "?" de la pizarra explica cómo usarla', async () => {
      renderScreen()
      await screen.findByRole('list', { name: 'Resumen del once' })
      expect(screen.queryByText(/Tocá una ficha para elegirla/)).toBeNull()
      await userEvent.click(screen.getByRole('button', { name: 'Ayuda: la pizarra' }))
      const dialog = screen.getByRole('dialog', { name: 'Cómo usar la pizarra' })
      expect(within(dialog).getByText(/Tocá una ficha para elegirla/)).toBeInTheDocument()
      expect(within(dialog).getByText(/Nivel:/)).toBeInTheDocument()
      expect(within(dialog).getByText(/“Editar”/)).toBeInTheDocument()
      await userEvent.click(within(dialog).getByRole('button', { name: 'Entendido' }))
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('el mismo "?" explica nivel, química, fuera de puesto y los colores y símbolos de la cancha', async () => {
      renderScreen()
      await screen.findByRole('list', { name: 'Resumen del once' })
      await userEvent.click(screen.getByRole('button', { name: 'Ayuda: la pizarra' }))
      const dialog = screen.getByRole('dialog', { name: 'Cómo usar la pizarra' })
      for (const text of [/Nivel:/, /Química:/, /Fuera de puesto:/, /Natural/, /Compatible/, /lesionado/i, /tarjeta roja/i, /tarjeta amarilla/i]) {
        expect(within(dialog).getAllByText(text).length).toBeGreaterThan(0)
      }
    })

    it('la hoja de Estilo tiene "?" para formación, mentalidad y estilos listos; la de Ajustes, para pase, ritmo y presión', async () => {
      renderScreen()
      await userEvent.click(await screen.findByRole('button', { name: 'Estilo' }))
      for (const topic of ['la formación', 'la mentalidad', 'los estilos listos']) {
        expect(screen.getByRole('button', { name: `Ayuda: ${topic}` })).toBeInTheDocument()
      }
      await userEvent.click(screen.getByRole('button', { name: 'Ayuda: la mentalidad' }))
      expect(screen.getByRole('dialog', { name: 'Mentalidad' })).toHaveTextContent(/cuánto riesgo asume/i)
    })

    it('en Ajustes cada instrucción tiene su "?"', async () => {
      renderScreen()
      await userEvent.click(await screen.findByRole('button', { name: 'Ajustes' }))
      for (const topic of ['el estilo de pase', 'el ritmo de juego', 'la presión']) {
        expect(screen.getByRole('button', { name: `Ayuda: ${topic}` })).toBeInTheDocument()
      }
    })
  })

  describe('sin scroll al elegir una ficha', () => {
    it('los datos de arriba van en una sola fila (formación, nivel, química y ayuda)', async () => {
      renderScreen()
      const summary = await screen.findByRole('list', { name: 'Resumen del once' })
      const row = summary.parentElement
      expect(row.className).toMatch(/\bflex\b/)
      expect(row.className).not.toMatch(/flex-wrap|flex-col/)
      expect(within(row).getByRole('button', { name: 'Ayuda: la pizarra' })).toBeInTheDocument()
      expect(summary.className).not.toMatch(/flex-wrap/)
    })

    it('al elegir una ficha la barra de "Cambiar jugador" ocupa el lugar de la cinta (misma altura): la pizarra no baja', async () => {
      renderScreen()
      const summary = await screen.findByRole('list', { name: 'Resumen del once' })
      const slotBefore = summary.closest('[data-top-slot]')
      expect(slotBefore).not.toBeNull()
      const heightClass = slotBefore.className.match(/\bh-\d+\b/)?.[0]
      expect(heightClass).toBeTruthy()
      await userEvent.click(token(/MI: Nombre5/))
      const bar = await screen.findByRole('region', { name: 'Puesto elegido: MI' })
      const slotAfter = bar.closest('[data-top-slot]')
      expect(slotAfter).toBe(slotBefore)
      expect(slotAfter.className).toContain(heightClass)
      expect(screen.queryByRole('list', { name: 'Resumen del once' })).toBeNull()
      // Cancelar devuelve la cinta
      await userEvent.click(within(bar).getByRole('button', { name: 'Cancelar la selección' }))
      expect(await screen.findByRole('list', { name: 'Resumen del once' })).toBeInTheDocument()
    })
  })

  it('en modo Editar el aviso va en la misma franja de arriba (no agrega altura) y "Listo" sale del modo', async () => {
    renderScreen()
    const summary = await screen.findByRole('list', { name: 'Resumen del once' })
    const slot = summary.closest('[data-top-slot]')
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.getByText(/arrastrá una ficha o tocá un lugar/i).closest('[data-top-slot]')).toBe(slot)
    expect(screen.queryByRole('list', { name: 'Resumen del once' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Listo' }))
    expect(await screen.findByRole('list', { name: 'Resumen del once' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toHaveAttribute('aria-pressed', 'false')
  })
})
