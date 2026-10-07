import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const reports = [{ player_id: '2', knowledge_level: 2 }]
vi.mock('../../src/api/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ eq: async () => ({ data: reports }) }) }) }
}))

const setViewport = (desktop) => {
  window.matchMedia = (query) => ({
    matches: query.includes('min-width: 768px') ? desktop : false,
    media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false
  })
}

const players = [
  { id: '1', first_name: 'Hugo', last_name: 'Ríos', position: 'GK', age: 31, attr_overall: 60, attr_pace: 40, attr_potential: 62, market_value: 20000 },
  { id: '2', first_name: 'Álvaro', last_name: 'Medina', position: 'CM', age: 19, attr_overall: 55, attr_pace: 70, attr_potential: 80, market_value: 50000, clubs: { name: 'Racing' } }
]

const negotiate = vi.fn(async () => ({ status: 'ACCEPTED', price: 42500, upfront: 42500, installments: 1 }))
const scoutPlayer = vi.fn(async () => ({}))
let status = { isOpen: true, windowName: 'Libro de Pases de Verano (Abierto)' }
const confirmAction = vi.fn(async () => true)

vi.mock('../../src/api/market', () => ({
  marketApi: { getMarketPlayers: vi.fn(async () => players), getMarketStatus: () => status, negotiate: (...a) => negotiate(...a) }
}))
vi.mock('../../src/api/scouting', () => ({ scoutingApi: { scoutPlayer: (...a) => scoutPlayer(...a) } }))
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({ club: { id: 'c1', budget: 60000, manager_id: 'm1', game_date: '2026-07-01' }, loading: false, refreshContext: vi.fn(), confirmAction })
}))

import MarketScreen from '../../src/features/market/MarketScreen'

const renderScreen = () => render(<MemoryRouter><MarketScreen /></MemoryRouter>)

describe('pantalla Mercado', () => {
  beforeEach(() => { setViewport(false); status = { isOpen: true, windowName: 'Libro de Pases de Verano (Abierto)' }; negotiate.mockClear(); scoutPlayer.mockClear() })

  it('muestra candidatos, oculta atributos no ojeados y revela los ojeados', async () => {
    renderScreen()
    expect(await screen.findByRole('heading', { level: 1, name: 'Mercado de pases' })).toBeInTheDocument()
    const cards = await screen.findAllByRole('article')
    expect(cards).toHaveLength(2)
    const hugo = cards.find(c => within(c).queryByText('Hugo Ríos'))
    expect(within(hugo).getByText('30-50')).toBeInTheDocument()
    expect(within(hugo).getByText('Desconocida')).toBeInTheDocument()
    const alvaro = cards.find(c => within(c).queryByText('Álvaro Medina'))
    expect(within(alvaro).getByText('80')).toBeInTheDocument()
  })

  it('un jugador ojeado trae la lectura del ojeador y uno sin ojear no', async () => {
    renderScreen()
    const cards = await screen.findAllByRole('article')
    const alvaro = cards.find(c => within(c).queryByText('Álvaro Medina'))
    const lectura = within(alvaro).getByRole('list', { name: 'Lectura del ojeador' })
    expect(within(lectura).getByText(/Cubre un puesto sin titular/)).toBeInTheDocument()
    expect(within(lectura).getByText(/puede crecer hasta 80/)).toBeInTheDocument()
    const hugo = cards.find(c => within(c).queryByText('Hugo Ríos'))
    expect(within(hugo).queryByRole('list', { name: 'Lectura del ojeador' })).not.toBeInTheDocument()
  })

  it('ojear pide confirmación y llama a la API', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Ojear a Hugo Ríos' }))
    await waitFor(() => expect(scoutPlayer).toHaveBeenCalledWith('c1', '1', 'FULL'))
  })

  it('ofertar abre el panel, valida el monto junto al campo y compra', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Ofertar por Álvaro Medina' }))
    const dlg = await screen.findByRole('dialog', { name: 'Álvaro Medina' })
    const field = within(dlg).getByLabelText('Monto de la oferta')
    await userEvent.clear(field)
    await userEvent.type(field, '999999')
    await userEvent.click(within(dlg).getByRole('button', { name: /Enviar oferta/ }))
    expect(await within(dlg).findByRole('alert')).toHaveTextContent(/presupuesto suficiente/)
    expect(negotiate).not.toHaveBeenCalled()

    await userEvent.click(within(dlg).getByRole('button', { name: /Mínima/ }))
    await userEvent.click(within(dlg).getByRole('button', { name: /Enviar oferta/ }))
    await waitFor(() => expect(negotiate).toHaveBeenCalledWith('c1', '2', 42500, 1, 'm1'))
    expect(await within(dlg).findByText(/Acuerdo cerrado/)).toBeInTheDocument()
  })

  it('con el mercado cerrado el botón de ofertar queda deshabilitado', async () => {
    status = { isOpen: false, windowName: 'Mercado Cerrado' }
    renderScreen()
    expect(await screen.findByRole('button', { name: 'Ofertar por Álvaro Medina' })).toBeDisabled()
  })

  it('filtra por línea y muestra el estado vacío con opción de quitar filtros', async () => {
    renderScreen()
    await screen.findAllByRole('article')
    await userEvent.click(screen.getByRole('radio', { name: 'Delanteros' }))
    expect(screen.getByText('Sin candidatos')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }))
    expect(await screen.findAllByRole('article')).toHaveLength(2)
  })
})
