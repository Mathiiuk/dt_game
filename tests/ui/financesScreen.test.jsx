import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const upgradeFacility = vi.fn(async () => ({}))
const updateTicketPrice = vi.fn(async () => ({}))
const confirmAction = vi.fn(async () => true)
const verifyBalance = vi.fn(async () => ({ status: 'DRIFT', drift: 500, message: 'La caja tiene $500 más que el último saldo del libro.' }))

vi.mock('../../src/api/finances', () => ({
  financesApi: {
    getFinances: vi.fn(async () => ({
      wageBudgetWeekly: 3500, balance: 94916, netWeeklyFlow: -1200, liquidityWeeks: '79 sem', healthStatus: 'CAUTION', ticketPrice: 10,
      income: { totalRecurring: 5000, membersIncome: 1000, sponsorsIncome: 2000, tvIncome: 1500, storeIncome: 500, projectedMatchdayGate: 800 },
      expenses: { total: 6200, playerWages: 5000, staffWages: 700, stadiumMaint: 300, academyMaint: 200 }
    })),
    verifyBalance: (...a) => verifyBalance(...a),
    getLedgerTransactions: vi.fn(async () => [{ id: 't1', week_number: 3, description: 'Sueldos semana 3', amount: -5000, balance_after: 90000 }]),
    updateTicketPrice: (...a) => updateTicketPrice(...a),
    upgradeFacility: (...a) => upgradeFacility(...a)
  }
}))
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({ club: { id: 'c1', stadium_level: 2, medical_level: 1, store_level: 1, stadium_capacity: 5000 }, confirmAction, refreshContext: vi.fn() })
}))

import FinancesScreen from '../../src/features/finances/FinancesScreen'

const renderScreen = () => render(<MemoryRouter><FinancesScreen /></MemoryRouter>)

describe('pantalla Finanzas', () => {
  beforeEach(() => { verifyBalance.mockClear(); upgradeFacility.mockClear(); updateTicketPrice.mockClear(); confirmAction.mockClear() })

  it('muestra caja, flujo, salud y desglose de ingresos y gastos', async () => {
    renderScreen()
    expect(await screen.findByRole('heading', { level: 1, name: 'Finanzas' })).toBeInTheDocument()
    expect(screen.getByText('Alerta de liquidez')).toBeInTheDocument()
    expect(screen.getByText('$94.916')).toBeInTheDocument()
    expect(screen.getByText('Nómina del plantel')).toBeInTheDocument()
    expect(screen.getByText('Taquilla estimada (partido local)')).toBeInTheDocument()
  })

  it('cambiar el precio de la entrada llama a la API', async () => {
    renderScreen()
    const group = await screen.findByRole('radiogroup', { name: 'Precio de la entrada' })
    expect(within(group).getByRole('radio', { name: '$10' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(within(group).getByRole('radio', { name: '$14' }))
    await waitFor(() => expect(updateTicketPrice).toHaveBeenCalledWith('c1', 14))
  })

  it('mejorar una instalación pide confirmación y usa el costo por nivel', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('tab', { name: 'Instalaciones' }))
    await userEvent.click(await screen.findByRole('button', { name: /Ampliar tribunas/ }))
    await waitFor(() => expect(upgradeFacility).toHaveBeenCalledWith('c1', 'stadium_level', 70000, 2))
    expect(confirmAction).toHaveBeenCalled()
  })

  it('la pestaña de movimientos lista los asientos', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('tab', { name: 'Movimientos' }))
    expect(await screen.findAllByText('Sueldos semana 3')).not.toHaveLength(0)
  })

  it('explica el tope de sueldos: nómina y cuerpo técnico contra el tope de la dirigencia', async () => {
    renderScreen()
    await screen.findByRole('heading', { level: 1, name: 'Finanzas' })
    expect(screen.getByText('Masa salarial')).toBeInTheDocument()
    expect(screen.getByText('$5.700 / $3.500')).toBeInTheDocument()
    expect(screen.getByText('Te pasás $2.200')).toBeInTheDocument()
  })

  it('"Verificar balance" compara la caja con el libro y explica la diferencia', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Verificar balance' }))
    await waitFor(() => expect(verifyBalance).toHaveBeenCalledWith('c1'))
    expect(await screen.findByText('La caja tiene $500 más que el último saldo del libro.')).toBeInTheDocument()
  })
})
