import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

// Se prueban las dos presentaciones: escritorio (diálogo) y móvil (página completa)
const setViewport = (desktop) => {
  window.matchMedia = (query) => ({
    matches: query.includes('min-width: 768px') ? desktop : false,
    media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false
  })
}

const confirmAction = vi.fn(async () => true)
vi.mock('../../src/context/GameContext', () => ({ useGameContext: () => ({ confirmAction, refreshContext: vi.fn() }) }))

vi.mock('../../src/api/reputation', () => ({
  reputationApi: {
    getReputationProfile: vi.fn(async () => ({
      score: 42, peak: 55, hasRefereeRespect: false, hasSponsorBonus: true,
      rank: { title: 'Táctico regional', subtitle: 'Reconocido en la zona', nextRank: { title: 'Estratega' }, pointsToNext: 8 },
      recentLedger: [{ id: 'l1', delta_amount: 1.5, event_type: 'DERBY_VICTORY', description: 'Victoria en el clásico', reputation_after: 42, created_at: '2026-08-01T10:00:00Z' }]
    }))
  }
}))
vi.mock('../../src/api/personalities', () => ({
  personalitiesApi: {
    getClubMentorships: vi.fn(async () => [{ id: 'm1', status: 'ACTIVE', progress_percentage: 40, veteran: { name: 'Don Pedro' }, youth: { name: 'Lucho' } }]),
    assignMentorship: vi.fn()
  },
  PERSONALITY_ARCHETYPES: { LEADER: { key: 'LEADER', name: 'Líder natural', description: 'Contagia confianza al vestuario.' } }
}))
vi.mock('../../src/api/competitionTiers', () => ({
  competitionTiersApi: {
    getLeaguePyramid: vi.fn(async () => [{ tier_level: 5, tier_name: 'Torneo Regional', automatic_promotions: 2, playoff_promotions: 1, relegations_count: 0, base_tv_revenue_weekly: 400 }]),
    getPlayoffFixtures: vi.fn(async () => [])
  },
  LEAGUE_TIERS: { 5: { description: 'Base de la pirámide' } }
}))
vi.mock('../../src/api/staff', () => ({
  staffApi: {
    ROLES: { PHYSIO: { id: 'PHYSIO', name: 'Kinesiólogo' }, HEAD_SCOUT: { id: 'HEAD_SCOUT', name: 'Jefe de ojeadores' } },
    BALANCE: { severance_weeks_penalty: 8 },
    getStaff: vi.fn(async () => [{ id: 's1', role: 'PHYSIO', name: 'Dr. Villani', skill_rating: 14, wage_weekly: 210 }]),
    getAvailableCandidates: vi.fn(async () => []),
    calculateStaffBonuses: () => ({ injuryReductionPct: 12, weeklyFitnessRecoveryBonus: 2, scoutErrorReduction: 1, cohesionBonus: 0, gkTrainingBonusPct: 0 })
  }
}))
vi.mock('../../src/api/academy', () => ({
  academyApi: {
    BALANCE: { upgrade_costs: { 2: 20000 } },
    getAcademy: vi.fn(async () => ({ academy_level: 1 })),
    getYouthCandidates: vi.fn(async () => [{ id: 'y1', first_name: 'Tomi', last_name: 'Pérez', position: 'DEL', age: 16, overall_rating: 48, potential_stars_perceived: 4.6 }])
  }
}))
vi.mock('../../src/api/press', () => ({ pressApi: { getConferenceHistory: vi.fn(async () => []) } }))

import JobOfferBottomSheet from '../../src/features/career/JobOfferBottomSheet'
import ReputationHistoryModal from '../../src/features/career/ReputationHistoryModal'
import MentorshipModal from '../../src/features/squad/MentorshipModal'
import LeaguePyramidModal from '../../src/features/competition/LeaguePyramidModal'
import StaffManagementModal from '../../src/features/club/screens/StaffManagementModal'
import YouthAcademyModal from '../../src/features/club/screens/YouthAcademyModal'
import PressRoomModal from '../../src/features/club/screens/PressRoomModal'

const club = { id: 'c1', league_tier: 5 }

describe.each([['escritorio', true], ['móvil', false]])('modales migrados (%s)', (_, desktop) => {
  beforeEach(() => setViewport(desktop))

  it('JobOfferBottomSheet muestra condiciones y dispara aceptar y desestimar', async () => {
    const onAccept = vi.fn()
    const onReject = vi.fn()
    const offer = { clubName: 'Racing de la Pampa', tier: 4, tierName: 'Primera C', offeredSalary: 900, budget: 25000, objective: 'PROMOTION', contractDurationYears: 2, weeksRemaining: 2 }
    render(<JobOfferBottomSheet isOpen offer={offer} onClose={() => {}} onAccept={onAccept} onReject={onReject} />)
    const dlg = screen.getByRole('dialog', { name: 'Racing de la Pampa' })
    expect(within(dlg).getByText('Lograr el ascenso de categoría')).toBeInTheDocument()
    expect(within(dlg).getByText('$900')).toBeInTheDocument()
    await userEvent.click(within(dlg).getByRole('button', { name: /Firmar contrato/ }))
    expect(onAccept).toHaveBeenCalledWith(offer)
    await userEvent.click(within(dlg).getByRole('button', { name: 'Desestimar oferta' }))
    expect(onReject).toHaveBeenCalledWith(offer)
  })

  it('JobOfferBottomSheet permite negociar el sueldo y muestra la respuesta del club', async () => {
    const onNegotiate = vi.fn(async () => ({ status: 'COUNTER', wage: 1050, round: 1 }))
    const offer = { id: 'o1', clubName: 'Racing de la Pampa', tier: 4, tierName: 'Primera C', offeredSalary: 900, budget: 25000, objective: 'PROMOTION', contractDurationYears: 2, weeksRemaining: 2, negotiationRounds: 0 }
    render(<JobOfferBottomSheet isOpen offer={offer} onClose={() => {}} onAccept={() => {}} onReject={() => {}} onNegotiate={onNegotiate} />)
    const dlg = screen.getByRole('dialog', { name: 'Racing de la Pampa' })
    const field = within(dlg).getByLabelText('Sueldo semanal que pedís')
    await userEvent.clear(field)
    await userEvent.type(field, '1100')
    await userEvent.click(within(dlg).getByRole('button', { name: 'Negociar' }))
    expect(onNegotiate).toHaveBeenCalledWith(offer, 1100)
    expect(await within(dlg).findByText(/contraofertó \$1\.050/)).toBeInTheDocument()
  })

  it('JobOfferBottomSheet exige pedir más de lo ofrecido y no deja negociar cuando se agotaron las rondas', async () => {
    const onNegotiate = vi.fn()
    const offer = { id: 'o1', clubName: 'Racing de la Pampa', tier: 4, offeredSalary: 900, budget: 25000, contractDurationYears: 1, weeksRemaining: 2, negotiationRounds: 0 }
    const { rerender } = render(<JobOfferBottomSheet isOpen offer={offer} onClose={() => {}} onAccept={() => {}} onReject={() => {}} onNegotiate={onNegotiate} />)
    const dlg = screen.getByRole('dialog', { name: 'Racing de la Pampa' })
    await userEvent.type(within(dlg).getByLabelText('Sueldo semanal que pedís'), '800')
    expect(within(dlg).getByRole('button', { name: 'Negociar' })).toBeDisabled()
    rerender(<JobOfferBottomSheet isOpen offer={{ ...offer, negotiationRounds: 2 }} onClose={() => {}} onAccept={() => {}} onReject={() => {}} onNegotiate={onNegotiate} />)
    expect(within(screen.getByRole('dialog', { name: 'Racing de la Pampa' })).queryByLabelText('Sueldo semanal que pedís')).not.toBeInTheDocument()
    expect(onNegotiate).not.toHaveBeenCalled()
  })

  it('JobOfferBottomSheet no renderiza nada si está cerrado', () => {
    const { container } = render(<JobOfferBottomSheet isOpen={false} offer={null} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('ReputationHistoryModal muestra rango, beneficios activos y bloqueados y el libro mayor', async () => {
    render(<ReputationHistoryModal isOpen managerId="m1" onClose={() => {}} />)
    expect(await screen.findByText('Victoria en el clásico')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Táctico regional' })).toBeInTheDocument()
    expect(screen.getByText('Imán de patrocinios')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Bloqueado')).toBeInTheDocument()
    expect(screen.getByText('+1.50')).toBeInTheDocument()
  })

  it('MentorshipModal lista tutorías y deshabilita iniciar hasta elegir a ambos', async () => {
    const players = [
      { id: 'v1', name: 'Don Pedro', position: 'DEF', age: 33, overall: 62 },
      { id: 'j1', name: 'Lucho', position: 'DEL', age: 18, overall: 50 }
    ]
    render(<MentorshipModal club={club} players={players} onClose={() => {}} />)
    expect(await screen.findByText('Líder natural')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('Don Pedro').length).toBeGreaterThan(0))
    expect(screen.getByLabelText('Veterano tutor (25 años o más)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Iniciar mentoría/ })).toBeDisabled()
  })

  it('LeaguePyramidModal marca la división actual y muestra lo que pasa de verdad: dos ascensos y, en la última, ningún descenso', async () => {
    render(<LeaguePyramidModal club={club} onClose={() => {}} />)
    expect(await screen.findByText('Torneo Regional')).toBeInTheDocument()
    expect(screen.getByText('Tu división')).toBeInTheDocument()
    expect(screen.getByText('2 ascensos directos')).toBeInTheDocument()
    expect(screen.getByText('Sin descensos')).toBeInTheDocument()
    expect(screen.queryByText(/reducido/i)).not.toBeInTheDocument()
  })

  it('StaffManagementModal muestra puestos ocupados y vacantes', async () => {
    render(<StaffManagementModal club={club} manager={{ id: 'm1' }} onClose={() => {}} />)
    expect(await screen.findByText('Dr. Villani')).toBeInTheDocument()
    expect(screen.getByText('Puesto vacante')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Despedir/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Contratar/ })).toBeInTheDocument()
  })

  it('YouthAcademyModal muestra la infraestructura y la joya con sus estrellas accesibles', async () => {
    render(<YouthAcademyModal club={club} manager={{ id: 'm1' }} onClose={() => {}} />)
    expect(await screen.findByText('Tomi Pérez')).toBeInTheDocument()
    expect(screen.getByText('Joya')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Potencial 4.6 de 5/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mejorar cantera/ })).toBeInTheDocument()
  })

  it('PressRoomModal muestra el estado vacío', async () => {
    render(<PressRoomModal club={club} onClose={() => {}} />)
    expect(await screen.findByText('Todavía no hay conferencias archivadas')).toBeInTheDocument()
  })
})
