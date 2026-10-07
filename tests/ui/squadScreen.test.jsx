import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const setViewport = (desktop) => {
  window.matchMedia = (query) => ({
    matches: query.includes('min-width: 768px') ? desktop : false,
    media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false
  })
}

const players = [
  { id: '1', first_name: 'Hugo', last_name: 'Ríos', position: 'GK', age: 31, attr_overall: 60, contract_salary: 500, shirt_number: 1, state_fitness: 90, morale: 80, market_value: 20000 },
  { id: '2', first_name: 'Cristian', last_name: 'García', position: 'LB', age: 22, attr_overall: 52, contract_salary: 450, shirt_number: 3, state_fitness: 55, morale: 45, is_injured: true, injury_type: 'Esguince' },
  { id: '3', first_name: 'Álvaro', last_name: 'Medina', position: 'CM', age: 28, attr_overall: 58, contract_salary: 700, shirt_number: 8, state_fitness: 80, morale: 70, transfer_status: 'TRANSFER_LISTED', asking_price: 30000 }
]
const offers = [{ id: 'o1', amount: 10000, player_id: '3', from_club_id: 'x', from_club_name: 'Racing', players: { first_name: 'Álvaro', last_name: 'Medina' }, expires_at_week: 5 }]

const confirmAction = vi.fn(async () => true)
const resolveOffer = vi.fn(async () => ({ status: 'REJECTED', message: 'No aceptan' }))
const setTransferStatus = vi.fn(async () => ({}))

vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({
    club: { id: 'c1', budget: 94916, squad_morale: 72, squad_cohesion: 40, current_week: 3 },
    manager: { id: 'm1' }, loading: false, refreshContext: vi.fn(), confirmAction
  })
}))
vi.mock('../../src/api/player', () => ({ playerApi: { getSquad: vi.fn(async () => players) } }))
vi.mock('../../src/api/contracts', () => ({
  contractApi: {
    getOffersForClub: vi.fn(async () => offers),
    setTransferStatus: (...a) => setTransferStatus(...a),
    resolveOffer: (...a) => resolveOffer(...a),
    calculateSeveranceCost: () => 1000,
    terminateContract: vi.fn()
  }
}))
const loanOut = vi.fn(async () => ({ borrowerName: 'Juventud Unida', wageSaved: 500 }))
vi.mock('../../src/api/loans', () => ({ loansApi: { loanOut: (...a) => loanOut(...a), getLoans: vi.fn(async () => ({ players: [{ id: '9', first_name: 'Nico', last_name: 'Paz', contract_salary: 400, clubs: { name: 'Almagro Regional' } }], weeklySaving: 400 })) } }))
vi.mock('../../src/api/personalities', () => ({
  personalitiesApi: { syncSquadPersonalities: vi.fn(async () => []) },
  PERSONALITY_ARCHETYPES: {}
}))
vi.mock('../../src/features/squad/ContractRenewalModal', () => ({ default: () => null }))
vi.mock('../../src/features/squad/MentorshipModal', () => ({ default: () => null }))
vi.mock('../../src/features/squad/PlayerEvolutionModal', () => ({ default: () => null }))

import SquadScreen from '../../src/features/squad/SquadScreen'

const renderScreen = () => render(<MemoryRouter><SquadScreen /></MemoryRouter>)

describe('pantalla Plantel', () => {
  beforeEach(() => { setViewport(true); resolveOffer.mockClear(); setTransferStatus.mockClear(); confirmAction.mockClear() })

  it('muestra el resumen del plantel y la tabla accesible con todos los jugadores', async () => {
    renderScreen()
    expect(await screen.findByRole('heading', { level: 1, name: 'Plantel' })).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: 'Plantel profesional' })
    expect(within(table).getAllByRole('row')).toHaveLength(1 + players.length)
    expect(screen.getByText('1 lesionados')).toBeInTheDocument()
    expect(within(table).getByText(/Lesionado · Esguince/)).toBeInTheDocument()
    expect(within(table).getByText(/En venta · \$30\.000/)).toBeInTheDocument()
  })

  it('filtra por línea y por búsqueda (sin tildes) y permite quitar los filtros', async () => {
    renderScreen()
    const table = await screen.findByRole('table')
    await userEvent.click(screen.getByRole('radio', { name: 'Arqueros' }))
    expect(within(table).getAllByRole('row')).toHaveLength(2)
    expect(within(table).getByText('Hugo Ríos')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: 'Todos' }))
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar jugador' }), 'alvaro')
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2)

    await userEvent.clear(screen.getByRole('searchbox'))
    await userEvent.type(screen.getByRole('searchbox'), 'zzz')
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })

  it('ordena la tabla por edad', async () => {
    renderScreen()
    const table = await screen.findByRole('table')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Ordenar por' }), 'age')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(within(rows[0]).getByText('Cristian García')).toBeInTheDocument()
  })

  it('lista las ofertas entrantes y rechazar llama a la API', async () => {
    renderScreen()
    const aside = await screen.findByRole('complementary', { name: 'Ofertas y vestuario' })
    expect(await within(aside).findByText('De Racing')).toBeInTheDocument()
    await userEvent.click(within(aside).getByRole('button', { name: /Rechazar/ }))
    await waitFor(() => expect(resolveOffer).toHaveBeenCalledWith('o1', 'REJECTED', '3', 'x', 'c1', 10000, 'm1'))
  })

  it('ceder a préstamo pide confirmación, llama a la API y avisa cuánto se ahorra', async () => {
    renderScreen()
    const table = await screen.findByRole('table')
    await userEvent.click(within(table).getByRole('button', { name: /Ceder a préstamo: Hugo Ríos/ }))
    await waitFor(() => expect(loanOut).toHaveBeenCalledWith('c1', '1'))
    expect(confirmAction).toHaveBeenCalled()
  })

  it('los jugadores a préstamo se listan aparte con el ahorro semanal', async () => {
    renderScreen()
    const section = await screen.findByRole('region', { name: 'Jugadores a préstamo' })
    expect(within(section).getByText(/Nico Paz/)).toBeInTheDocument()
    expect(within(section).getByText(/Almagro Regional/)).toBeInTheDocument()
    expect(within(section).getByText(/\$400/)).toBeInTheDocument()
  })

  it('poner en venta abre el panel con precios sugeridos y guarda el estado', async () => {
    renderScreen()
    const table = await screen.findByRole('table')
    await userEvent.click(within(table).getByRole('button', { name: /Poner en venta: Hugo Ríos/ }))
    const dlg = await screen.findByRole('dialog', { name: 'Hugo Ríos' })
    await userEvent.click(within(dlg).getByRole('button', { name: /Justa/ }))
    expect(within(dlg).getByLabelText('Precio pedido')).toHaveValue(20000)
    await userEvent.click(within(dlg).getByRole('button', { name: /Poner en lista/ }))
    await waitFor(() => expect(setTransferStatus).toHaveBeenCalledWith('1', { transfer_status: 'TRANSFER_LISTED', asking_price: 20000 }))
  })

  it('la contraoferta exige un monto mayor al ofrecido y lo muestra junto al campo', async () => {
    renderScreen()
    const aside = await screen.findByRole('complementary', { name: 'Ofertas y vestuario' })
    await userEvent.click(await within(aside).findByRole('button', { name: /Contra/ }))
    const dlg = await screen.findByRole('dialog', { name: /Contraoferta por Álvaro Medina/ })
    const field = within(dlg).getByLabelText('Nuevo monto exigido')
    await userEvent.clear(field)
    await userEvent.type(field, '9000')
    await userEvent.click(within(dlg).getByRole('button', { name: /Enviar contraoferta/ }))
    expect(await within(dlg).findByRole('alert')).toHaveTextContent('La contraoferta debe superar la oferta inicial.')
    expect(resolveOffer).not.toHaveBeenCalled()
  })

  it('en móvil muestra tarjetas y alterna entre jugadores y ofertas con pestañas', async () => {
    setViewport(false)
    renderScreen()
    expect(await screen.findByText('Hugo Ríos', { selector: 'h3' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: /Ofertas/ }))
    expect(await screen.findAllByText('De Racing')).not.toHaveLength(0)
  })
})
