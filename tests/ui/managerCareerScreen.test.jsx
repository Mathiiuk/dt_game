import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const resign = vi.fn(async () => ({}))
const apply = vi.fn(async () => ({ accepted: false, message: 'Sin chances' }))
const confirmAction = vi.fn(async () => true)

vi.mock('../../src/api/career', () => ({
  careerApi: {
    getCareerStats: vi.fn(async () => ({
      employmentStatus: 'EMPLOYED', personalSavings: 12000, currentContractWage: 500, totalMatches: 10, totalWon: 5, totalDrawn: 3, totalLost: 2, winRate: 50,
      stints: [{ id: 's1', club_name: 'Club Atlético Potrero', started_at: '2026-07-01', ended_at: null, matches_managed: 10, matches_won: 5, matches_drawn: 3, matches_lost: 2 }],
      trophies: []
    })),
    getAvailableJobOffers: vi.fn(async () => [{ id: 'o1', clubName: 'Racing', tierName: 'Tier 4', offeredSalary: 900, budget: 50000, weeksRemaining: 2 }]),
    getAvailableVacancies: vi.fn(async () => [{ id: 'v1', name: 'Defensores', tierName: 'Tier 5', city: 'Rosario', requiredReputation: 20, chance: 'MUY ALTA' }]),
    calculateReputationStars: () => 2,
    applyForJob: (...a) => apply(...a),
    resignFromClub: (...a) => resign(...a),
    rejectJobOffer: vi.fn(),
    acceptJobOffer: vi.fn()
  }
}))
vi.mock('../../src/api/endgame', () => ({ endgameApi: { processRetirement: vi.fn() } }))
vi.mock('../../src/features/career/JobOfferBottomSheet', () => ({ default: () => null }))
vi.mock('../../src/features/career/ReputationHistoryModal', () => ({ default: () => null }))
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({
    manager: { id: 'm1', first_name: 'Matías', last_name: 'Gómez', level: 3, reputation: 25 },
    club: { id: 'c1', name: 'Club Atlético Potrero' }, refreshContext: vi.fn(), confirmAction
  })
}))

import ManagerCareerScreen from '../../src/features/manager/ManagerCareerScreen'

const renderScreen = () => render(<MemoryRouter><ManagerCareerScreen /></MemoryRouter>)

describe('pantalla Carrera del DT', () => {
  beforeEach(() => { resign.mockClear(); apply.mockClear(); confirmAction.mockClear() })

  it('muestra el perfil, el historial de clubes y los datos económicos', async () => {
    renderScreen()
    expect(await screen.findByRole('heading', { level: 1, name: 'Carrera del DT' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Matías Gómez' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '2 de 5 estrellas' })).toBeInTheDocument()
    expect(screen.getByText('$12.000')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /Club Atlético Potrero/ })).toBeInTheDocument()
  })

  it('renunciar pide confirmación y llama a la API', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Presentar renuncia' }))
    await waitFor(() => expect(resign).toHaveBeenCalledWith('m1', 'c1'))
    expect(confirmAction).toHaveBeenCalled()
  })

  it('lista ofertas y vacantes en sus pestañas y permite postularse', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('tab', { name: /Ofertas/ }))
    expect(await screen.findByText('Racing')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: /Bolsa de trabajo/ }))
    const card = (await screen.findByText('Defensores')).closest('article')
    await userEvent.click(within(card).getByRole('button', { name: /Postularse/ }))
    await waitFor(() => expect(apply).toHaveBeenCalledWith('m1', 'v1', 25))
  })
})
