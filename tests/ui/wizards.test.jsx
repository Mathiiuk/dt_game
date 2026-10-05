import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const navigate = vi.fn()
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }))

const createManager = vi.fn(async () => ({}))
const createClub = vi.fn(async () => ({ id: 'c1' }))
vi.mock('../../src/api/auth', () => ({ authApi: { getSession: vi.fn(async () => ({ id: 'u1', name: 'Marcelo Gallardo' })) } }))
vi.mock('../../src/api/manager', () => ({
  FREE_POINTS_POOL: 15,
  ATTRIBUTE_MAX_INITIAL_CAP: 14,
  MANAGER_BACKGROUND_PRESETS: {
    STREET_COACH: { id: 'STREET_COACH', title: 'Técnico de barrio', description: 'Empezó en el potrero.', reputation: 10, baseAttributes: { tactics: 5, motivation: 5, youth: 5, management: 5, negotiation: 5 } },
    EX_PLAYER: { id: 'EX_PLAYER', title: 'Ex jugador', description: 'Colgó los botines.', reputation: 20, baseAttributes: { tactics: 4, motivation: 8, youth: 4, management: 6, negotiation: 4 } }
  },
  managerApi: { createManager: (...a) => createManager(...a), getManager: vi.fn(async () => ({ id: 'm1', first_name: 'Marcelo', last_name: 'Gallardo' })) }
}))
vi.mock('../../src/api/club', () => ({
  TIER_5_STARTING_CONFIG: { initialCashBalance: 25000, initialWeeklyWageCap: 3500, stadiumCapacity: 1500, pitchCondition: 60, ticketPrice: 10 },
  clubApi: { createClub: (...a) => createClub(...a), getClubByManager: vi.fn(async () => null) }
}))
vi.mock('../../src/context/GameContext', () => ({ useGameContext: () => ({ refreshContext: vi.fn(async () => {}) }) }))

import CreateManagerWizard from '../../src/features/manager/CreateManagerWizard'
import CreateClubWizard from '../../src/features/club/CreateClubWizard'

describe('asistente de creación del DT', () => {
  beforeEach(() => { createManager.mockClear(); navigate.mockClear() })

  it('exige nombre y apellido con el error junto al campo', async () => {
    render(<MemoryRouter><CreateManagerWizard /></MemoryRouter>)
    const first = await screen.findByLabelText('Nombre')
    await waitFor(() => expect(first).toHaveValue('Marcelo'))
    await userEvent.clear(first)
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ingresá tu nombre.')
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Identidad')
  })

  it('recorre los pasos, reparte los 15 puntos y crea el DT', async () => {
    render(<MemoryRouter><CreateManagerWizard /></MemoryRouter>)
    await waitFor(() => expect(screen.getByLabelText('Nombre')).toHaveValue('Marcelo'))
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ })) // -> trasfondo
    await userEvent.click(screen.getByRole('radio', { name: /Ex jugador/ }))
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ })) // -> atributos
    // 15 libres, ya hay 15 repartidos (3+4+3+3+2) => 0 libres: el botón queda habilitado
    expect(screen.getByRole('status')).toHaveTextContent('Puntos libres: 0')
    await userEvent.click(screen.getByRole('button', { name: 'Restar un punto a Táctica y pizarrón' }))
    expect(screen.getByRole('status')).toHaveTextContent('Puntos libres: 1')
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Sumar un punto a Táctica y pizarrón' }))
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ })) // -> filosofía
    await userEvent.click(screen.getByRole('radio', { name: /Gegenpressing/ }))
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ })) // -> firma
    await userEvent.click(screen.getByRole('button', { name: /Firmar credencial/ }))
    await waitFor(() => expect(createManager).toHaveBeenCalled())
    const [userId, payload] = createManager.mock.calls[0]
    expect(userId).toBe('u1')
    expect(payload).toMatchObject({ background: 'EX_PLAYER', philosophy: 'Presión', distributedPoints: { tactics: 3, motivation: 4, youth: 3, management: 3, negotiation: 2 } })
    expect(navigate).toHaveBeenCalledWith('/create-club')
  })
})

describe('asistente de fundación del club', () => {
  beforeEach(() => { createClub.mockClear(); navigate.mockClear() })

  it('valida el nombre, sigue el nombre del estadio y funda el club', async () => {
    render(<MemoryRouter><CreateClubWizard /></MemoryRouter>)
    const name = await screen.findByLabelText('Nombre oficial del club')
    await userEvent.clear(name)
    await userEvent.type(name, 'ab')
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/al menos 3/)

    await userEvent.clear(name)
    await userEvent.type(name, 'Atlético Sur')
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ })) // colores
    await userEvent.click(screen.getByRole('radio', { name: /Azul y oro/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Rombo moderno/ }))
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ })) // estadio
    expect(screen.getByLabelText('Nombre del estadio')).toHaveValue('Estadio Atlético Sur')
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ })) // acta
    await userEvent.click(screen.getByRole('button', { name: /Fundar club/ }))
    await waitFor(() => expect(createClub).toHaveBeenCalled())
    const [managerId, data] = createClub.mock.calls[0]
    expect(managerId).toBe('m1')
    expect(data).toMatchObject({ badgeId: 'DIAMOND', colors: { primary: '#1E3A8A', secondary: '#F59E0B' }, stadium: { name: 'Estadio Atlético Sur' }, identity: { name: 'Atlético Sur' } })
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })
})
