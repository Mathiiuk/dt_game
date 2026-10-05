import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const setViewport = (desktop) => {
  window.matchMedia = (query) => ({
    matches: query.includes('min-width: 768px') ? desktop : false,
    media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false
  })
}

vi.mock('../../src/api/contracts', () => ({
  contractApi: {
    BALANCE: { max_negotiation_rounds: 3, lockout_duration_on_collapse_weeks: 4 },
    getNegotiationStatus: vi.fn(async () => ({
      demands: { expectedWage: 500, minAcceptableWage: 420, desiredYears: 3, desiredRole: 'FIRST_TEAM', suggestedReleaseClause: 90000 },
      roundsCompleted: 1, isLockedOut: false, lockoutWeeksRemaining: 0
    })),
    submitRenewalOffer: vi.fn(async () => ({ status: 'COUNTER_OFFERED', message: 'Quiere un poco más', roundsCompleted: 2 }))
  }
}))
vi.mock('../../src/api/agents', () => ({ agentsApi: { getAgentForPlayer: vi.fn(async () => null) } }))
vi.mock('../../src/features/squad/AgentProfileCard', () => ({ default: () => null }))
vi.mock('../../src/api/playerEvolution', () => ({
  CAREER_PHASES: { PRIME_DEVELOPMENT: { name: 'Plenitud' }, YOUTH: { name: 'Promesa' } },
  playerEvolutionApi: {
    getRetiringPlayers: vi.fn(async () => [{ player_id: 'p2', future_role_interest: 'COACH' }]),
    getClubEvolutionHistory: vi.fn(async () => [{ player_id: 'p1', ovr_before: 55, ovr_after: 58 }]),
    determineCareerPhase: () => 'PRIME_DEVELOPMENT'
  }
}))

import ContractRenewalModal from '../../src/features/squad/ContractRenewalModal'
import PlayerEvolutionModal from '../../src/features/squad/PlayerEvolutionModal'

const club = { id: 'c1' }
const player = { id: 'p1', first_name: 'Ramiro', last_name: 'Benítez', position: 'DEL', age: 24, personality: 'Profesional' }

describe.each([['escritorio', true], ['móvil', false]])('modales del plantel (%s)', (_, desktop) => {
  beforeEach(() => setViewport(desktop))

  it('ContractRenewalModal carga las pretensiones y valida el salario antes de enviar', async () => {
    render(<ContractRenewalModal player={player} club={club} manager={{ id: 'm1' }} onClose={() => {}} />)
    const dlg = await screen.findByRole('dialog', { name: 'Ramiro Benítez' })
    const wage = await within(dlg).findByLabelText('Salario semanal ofrecido')
    expect(wage).toHaveValue(500)
    expect(within(dlg).getByText('1 / 3'.replace('1', '2'))).toBeInTheDocument()

    await userEvent.clear(wage)
    await userEvent.click(within(dlg).getByRole('button', { name: /Enviar propuesta/ }))
    expect(await within(dlg).findByRole('alert')).toHaveTextContent('Ingresa un salario semanal válido.')
  })

  it('ContractRenewalModal: los montos rápidos completan el salario', async () => {
    render(<ContractRenewalModal player={player} club={club} manager={{ id: 'm1' }} onClose={() => {}} />)
    const dlg = await screen.findByRole('dialog', { name: 'Ramiro Benítez' })
    const wage = await within(dlg).findByLabelText('Salario semanal ofrecido')
    await userEvent.click(within(dlg).getByRole('button', { name: /Mínimo/ }))
    expect(wage).toHaveValue(420)
  })

  it('PlayerEvolutionModal filtra por etapa y muestra retiros y último balance', async () => {
    const players = [
      { ...player, shirt_number: 9, overall: 58, potential_rating: 70, minutes_played_season: 950 },
      { id: 'p2', first_name: 'Don', last_name: 'Pedro', position: 'DEF', age: 34, shirt_number: 4, overall: 60, minutes_played_season: 100 }
    ]
    render(<PlayerEvolutionModal club={club} players={players} onClose={() => {}} />)
    expect(await screen.findByText('Ramiro Benítez')).toBeInTheDocument()
    expect(screen.getByText(/Se retira/)).toBeInTheDocument()
    expect(screen.getByText('Último balance anual')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: /Veteranos/ }))
    expect(screen.queryByText('Ramiro Benítez')).not.toBeInTheDocument()
    expect(screen.getByText('Don Pedro')).toBeInTheDocument()
  })
})
