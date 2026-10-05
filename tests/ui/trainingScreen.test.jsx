import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const squad = [
  { id: '1', first_name: 'Hugo', last_name: 'Ríos', position: 'GK', age: 33, attr_overall: 60, attr_potential: 60, state_fitness: 40, shirt_number: 1 },
  { id: '2', first_name: 'Tomás', last_name: 'Luna', position: 'ST', age: 18, attr_overall: 55, attr_potential: 85, state_fitness: 50, shirt_number: 9 }
]
vi.mock('../../src/api/supabase', () => ({
  supabase: { from: () => { const c = { select: () => c, eq: () => c, order: async () => ({ data: squad }) }; return c } }
}))

const updatePlan = vi.fn(async () => ({}))
const setAssignment = vi.fn(async () => ({}))
vi.mock('../../src/api/training', async (orig) => {
  const real = await orig()
  return {
    ...real,
    trainingApi: {
      getClubTrainingPlan: vi.fn(async () => ({ general_focus: 'BALANCED', intensity_level: 'MEDIUM' })),
      getPlayerAssignments: vi.fn(async () => []),
      updateClubTrainingPlan: (...a) => updatePlan(...a),
      setPlayerAssignment: (...a) => setAssignment(...a)
    }
  }
})
vi.mock('../../src/context/GameContext', () => ({ useGameContext: () => ({ club: { id: 'c1' }, refreshContext: vi.fn() }) }))

import TrainingScreen from '../../src/features/training/TrainingScreen'

const renderScreen = () => render(<MemoryRouter><TrainingScreen /></MemoryRouter>)

describe('pantalla Entrenamiento', () => {
  beforeEach(() => { updatePlan.mockClear(); setAssignment.mockClear() })

  it('alerta cuando la condición media es crítica y permite guardar el plan', async () => {
    renderScreen()
    expect(await screen.findByRole('heading', { level: 1, name: 'Entrenamiento' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/crítica \(45%\)/)

    await userEvent.click(screen.getByRole('radio', { name: /Regenerativo|Descanso/i }))
    await userEvent.click(screen.getByRole('button', { name: /Confirmar plan de trabajo/ }))
    await waitFor(() => expect(updatePlan).toHaveBeenCalledWith('c1', 'RECOVERY_REST', 'MEDIUM'))
  })

  it('la intensidad queda deshabilitada en semana regenerativa y se puede cambiar en otras', async () => {
    renderScreen()
    await screen.findByRole('radiogroup', { name: 'Nivel de intensidad' })
    await userEvent.click(screen.getByRole('radio', { name: 'Alta' }))
    await userEvent.click(screen.getByRole('button', { name: /Confirmar plan de trabajo/ }))
    await waitFor(() => expect(updatePlan).toHaveBeenCalledWith('c1', 'BALANCED', 'HIGH'))
  })

  it('en la tutoría individual bloquea atributos físicos a veteranos y guarda el foco', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('tab', { name: /Tutoría individual/ }))
    const vet = await screen.findByRole('combobox', { name: 'Foco individual de Hugo Ríos' })
    expect(within(vet).getByRole('option', { name: /Velocidad.*bloqueado por edad/ })).toBeDisabled()

    const youth = screen.getByRole('combobox', { name: 'Foco individual de Tomás Luna' })
    await userEvent.selectOptions(youth, 'pace')
    await waitFor(() => expect(setAssignment).toHaveBeenCalledWith('c1', '2', 'pace'))
  })
})
