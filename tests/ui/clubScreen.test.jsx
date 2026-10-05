import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: [] }), then: (r) => r({ data: [{ contract_salary: 5200 }] }) }) }) }) }
}))

const fireStaff = vi.fn(async () => ({}))
const hireStaff = vi.fn(async () => ({}))
const confirmAction = vi.fn(async () => true)

vi.mock('../../src/api/club', () => ({ clubApi: { updateClub: vi.fn() } }))
vi.mock('../../src/api/clubFeatures', () => ({
  staffApi: {
    getStaff: vi.fn(async () => [{ id: 's1', name: 'Marcos Peña', role: 'Preparador físico', level: 2, salary: 4000 }]),
    getAvailableStaff: vi.fn(async () => [{ id: 'c1', name: 'Julia Sosa', role: 'Analista', level: 3, salary: 2500 }]),
    hireStaff: (...a) => hireStaff(...a),
    fireStaff: (...a) => fireStaff(...a)
  },
  academyApi: { getYouthPlayers: vi.fn(async () => [{ id: 'y1', first_name: 'Tomás', last_name: 'Luna', position: 'DEL', age: 17, attr_potential: 82 }]), generateYouthProspect: vi.fn(), promoteToFirstTeam: vi.fn() }
}))
vi.mock('../../src/api/clubHistory', () => ({
  clubHistoryApi: { getIdolsAndLegends: vi.fn(async () => []), getClubMilestones: vi.fn(async () => []), getClubRecords: vi.fn(async () => []) }
}))
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({
    club: { id: 'c1', name: 'Club Atlético Potrero', budget: 94916, academy_level: 2, founded_year: 2026, city: 'Rosario', country: 'Argentina' },
    manager: { id: 'm1' }, loading: false, confirmAction
  })
}))
vi.mock('../../src/features/club/screens/YouthAcademyModal', () => ({ default: () => null }))
vi.mock('../../src/features/club/screens/StaffManagementModal', () => ({ default: () => null }))
vi.mock('../../src/features/club/screens/PressRoomModal', () => ({ default: () => null }))
vi.mock('../../src/features/club/screens/StadiumManagementTab', () => ({ default: () => <p>Estadio tab</p> }))
vi.mock('../../src/features/club/screens/FanbaseManagementTab', () => ({ default: () => <p>Hinchada tab</p> }))
vi.mock('../../src/features/club/screens/BoardManagementTab', () => ({ default: () => <p>Directiva tab</p> }))
vi.mock('../../src/features/club/screens/LockerRoomTab', () => ({ default: () => <p>Vestuario tab</p> }))
vi.mock('../../src/features/club/screens/InfirmaryTab', () => ({ default: () => <p>Enfermería tab</p> }))
vi.mock('../../src/features/club/screens/ClubHistoryTab', () => ({ default: () => <p>Historia tab</p> }))
vi.mock('../../src/features/club/screens/IdolsLegendsTab', () => ({ default: () => <p>Ídolos tab</p> }))

import ClubScreen from '../../src/features/club/screens/ClubScreen'

const renderScreen = () => render(<MemoryRouter><ClubScreen /></MemoryRouter>)

describe('pantalla Club', () => {
  beforeEach(() => { fireStaff.mockClear(); hireStaff.mockClear(); confirmAction.mockClear() })

  it('muestra el nombre del club, el resumen y el cuerpo técnico', async () => {
    renderScreen()
    expect(await screen.findByRole('heading', { level: 1, name: 'Club Atlético Potrero' })).toBeInTheDocument()
    expect(await screen.findByText('Marcos Peña')).toBeInTheDocument()
    expect(screen.getByText('Tomás Luna')).toBeInTheDocument()
    expect(screen.getByText('Margen semanal')).toBeInTheDocument()
  })

  it('despedir pide confirmación antes de rescindir', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Despedir a Marcos Peña' }))
    await waitFor(() => expect(fireStaff).toHaveBeenCalledWith('s1'))
    expect(confirmAction).toHaveBeenCalled()
  })

  it('contratar un especialista llama a la API', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Contratar a Julia Sosa' }))
    await waitFor(() => expect(hireStaff).toHaveBeenCalled())
  })

  it('las pestañas cambian el contenido', async () => {
    renderScreen()
    const tabs = await screen.findByRole('tablist', { name: 'Secciones del club' })
    await userEvent.click(within(tabs).getByRole('tab', { name: 'Enfermería' }))
    expect(await screen.findByText('Enfermería tab')).toBeInTheDocument()
    await userEvent.click(within(tabs).getByRole('tab', { name: 'Ídolos y leyendas' }))
    expect(await screen.findByText('Ídolos tab')).toBeInTheDocument()
  })
})
