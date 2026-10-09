import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const setViewport = (desktop) => {
  window.matchMedia = (query) => ({
    matches: query.includes('min-width: 768px') ? desktop : false,
    media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false
  })
}

const players = [
  { id: '1', first_name: 'Hugo', last_name: 'Ríos', position: 'GK', age: 31, attr_overall: 60, contract_salary: 500, shirt_number: 1, state_fitness: 90, morale: 80, market_value: 20000, contract_end: '2027-05-12' },
  { id: '2', first_name: 'Cristian', last_name: 'García', position: 'LB', age: 22, attr_overall: 52, contract_salary: 450, shirt_number: 3, state_fitness: 55, morale: 45, is_injured: true, injury_type: 'Esguince' },
  { id: '3', first_name: 'Álvaro', last_name: 'Medina', position: 'CM', age: 28, attr_overall: 58, contract_salary: 700, shirt_number: 8, state_fitness: 80, morale: 70, transfer_status: 'TRANSFER_LISTED', asking_price: 30000, contract_end: '2028-06-30' }
]
const offers = [{ id: 'o1', amount: 10000, player_id: '3', from_club_id: 'x', from_club_name: 'Racing', players: { first_name: 'Álvaro', last_name: 'Medina' }, expires_at_week: 5 }]

const confirmAction = vi.fn(async () => true)
const resolveOffer = vi.fn(async () => ({ status: 'REJECTED', message: 'No aceptan' }))
const setTransferStatus = vi.fn(async () => ({}))

vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({
    club: { id: 'c1', budget: 94916, squad_morale: 72, squad_cohesion: 40, current_week: 3, game_date: '2027-04-14' },
    manager: { id: 'm1' }, loading: false, refreshContext: vi.fn(), confirmAction, confirmRisk: vi.fn(async () => true)
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
const grantBuyback = vi.fn(async () => ({ cost: 1000, price: 12500, expiresSeason: 2028 }))
vi.mock('../../src/api/buyback', () => ({ buybackApi: { grant: (...a) => grantBuyback(...a) } }))
vi.mock('../../src/api/climate', () => ({ climateApi: { getReferentFlags: vi.fn(async () => ({})), difficulty: { key: 'NORMAL', negative: 1, positive: 1 } } }))
vi.mock('../../src/api/personalities', () => ({
  personalitiesApi: { syncSquadPersonalities: vi.fn(async () => []) },
  PERSONALITY_ARCHETYPES: {}
}))
// B19: quién lleva la cinta (lectura liviana del vestuario)
const getCaptains = vi.fn(async () => ({ captainId: null, viceCaptainId: null }))
vi.mock('../../src/api/lockerRoom', () => ({ lockerRoomApi: { getCaptains: (...x) => getCaptains(...x) } }))
vi.mock('../../src/features/squad/ContractRenewalModal', () => ({ default: ({ player }) => <p>Renovando a {player.last_name}</p> }))
vi.mock('../../src/features/squad/MentorshipModal', () => ({ default: () => null }))
vi.mock('../../src/features/squad/PlayerEvolutionModal', () => ({ default: () => null }))

import SquadScreen from '../../src/features/squad/SquadScreen'

const LocationProbe = () => { const l = useLocation(); return <p>Club {l.search}</p> }

const renderScreen = (path = '/squad') => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/squad" element={<SquadScreen />} />
      <Route path="/club" element={<LocationProbe />} />
      <Route path="/training" element={<p>Pantalla de entrenamiento</p>} />
    </Routes>
  </MemoryRouter>
)

describe('pantalla Plantel', () => {
  beforeEach(() => { setViewport(true); resolveOffer.mockClear(); setTransferStatus.mockClear(); confirmAction.mockClear(); getCaptains.mockResolvedValue({ captainId: null, viceCaptainId: null }) })

  it('muestra el resumen del plantel y la tabla accesible con todos los jugadores', async () => {
    renderScreen()
    expect(await screen.findByRole('heading', { level: 1, name: 'Plantel' })).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: 'Plantel profesional' })
    expect(within(table).getAllByRole('row')).toHaveLength(1 + players.length)
    expect(screen.getByText('1 lesionados')).toBeInTheDocument()
    expect(within(table).getByText(/Lesionado · Esguince/)).toBeInTheDocument()
    expect(within(table).getByText(/En venta · \$30\.000/)).toBeInTheDocument()
  })

  it('marca al capitán y al subcapitán, y "Hacer capitán" lleva al Vestuario con ese jugador elegido', async () => {
    getCaptains.mockResolvedValue({ captainId: players[0].id, viceCaptainId: players[1].id })
    renderScreen()
    const table = await screen.findByRole('table', { name: 'Plantel profesional' })
    expect(await within(table).findByText('Capitán')).toBeInTheDocument()
    expect(within(table).getByText('Subcapitán')).toBeInTheDocument()
    // El capitán actual no tiene la acción; los demás sí
    const buttons = within(table).getAllByRole('button', { name: /^Hacer capitán: / })
    expect(buttons).toHaveLength(players.length - 1)
    await userEvent.click(within(table).getByRole('button', { name: `Hacer capitán: ${players[2].first_name} ${players[2].last_name}` }))
    expect(await screen.findByText(`Club ?tab=vestuario&capitan=${players[2].id}`)).toBeInTheDocument()
  })

  it('arriba hay tres botones y el tercero lleva a Entrenamiento', async () => {
    renderScreen()
    await screen.findByRole('heading', { level: 1, name: 'Plantel' })
    expect(screen.getByRole('button', { name: /Desarrollo/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mentorías/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: /Entrenamiento/ }))
    expect(await screen.findByText('Pantalla de entrenamiento')).toBeInTheDocument()
  })

  it('con el aviso de contratos dice quién vence, cuánto le falta y deja renovar desde la lista', async () => {
    renderScreen('/squad?orden=contrato')
    const panel = await screen.findByRole('region', { name: 'Contratos por vencer' })
    expect(within(panel).getByText('(1)')).toBeInTheDocument()
    expect(within(panel).getByText('Hugo Ríos')).toBeInTheDocument()
    expect(within(panel).getByText(/vence en 4 semanas/)).toBeInTheDocument()
    // La lista abre mostrando solo a quien hay que renovar, con su insignia
    const table = await screen.findByRole('table', { name: 'Plantel profesional' })
    expect(within(table).getAllByRole('row')).toHaveLength(2)
    expect(within(table).getByText('Contrato: vence en 4 semanas')).toBeInTheDocument()
    await userEvent.click(within(panel).getByRole('button', { name: 'Renovar a Hugo Ríos' }))
    expect(await screen.findByText('Renovando a Ríos')).toBeInTheDocument()
  })

  it('se puede volver a ver todo el plantel y el aviso no aparece si se entra por otro lado', async () => {
    renderScreen('/squad?orden=contrato')
    await userEvent.click(await screen.findByRole('button', { name: 'Ver todo el plantel' }))
    const table = await screen.findByRole('table', { name: 'Plantel profesional' })
    expect(within(table).getAllByRole('row')).toHaveLength(1 + players.length)
    expect(screen.getByRole('button', { name: 'Ver solo los que vencen' })).toBeInTheDocument()
  })

  it('al entrar por el menú no hay panel de contratos pero el jugador igual lleva su insignia', async () => {
    renderScreen('/squad')
    const table = await screen.findByRole('table', { name: 'Plantel profesional' })
    expect(screen.queryByRole('region', { name: 'Contratos por vencer' })).not.toBeInTheDocument()
    expect(within(table).getByText('Contrato: vence en 4 semanas')).toBeInTheDocument()
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

  it('al aceptar una oferta se puede dejar una cláusula de recompra: 10% ahora y recompra al 125%', async () => {
    resolveOffer.mockResolvedValueOnce({ status: 'ACCEPTED' })
    renderScreen()
    const aside = await screen.findByRole('complementary', { name: 'Ofertas y vestuario' })
    await userEvent.click(await within(aside).findByRole('button', { name: /Aceptar/ }))
    await waitFor(() => expect(grantBuyback).toHaveBeenCalledWith('c1', '3'))
    const asked = confirmAction.mock.calls.map(c => c[0].title)
    expect(asked).toContain('¿Dejar una cláusula de recompra?')
    const clause = confirmAction.mock.calls.find(c => c[0].title === '¿Dejar una cláusula de recompra?')[0]
    expect(clause.description).toMatch(/\$1\.000/)
    expect(clause.description).toMatch(/\$12\.500/)
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
