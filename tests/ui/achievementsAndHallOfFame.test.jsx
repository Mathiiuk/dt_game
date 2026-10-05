import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { filterAchievements, summarizeAchievements, progressPercent } from '../../src/domain/achievements'
import { filterRanking, splitPodium } from '../../src/domain/hallOfFame'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const setViewport = (desktop) => {
  window.matchMedia = (query) => ({
    matches: query.includes('min-width: 768px') ? desktop : false,
    media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false
  })
}

const list = [
  { code: 'a', title: 'Primer triunfo', category: 'matches', rarity: 'common', is_unlocked: true, is_claimed: false, current_progress: 1, target_progress: 1, reward_xp: 10, reward_reputation: 1, description: 'Ganá un partido' },
  { code: 'b', title: 'Campeón', category: 'titles', rarity: 'legendary', is_unlocked: false, is_claimed: false, current_progress: 0, target_progress: 1, reward_xp: 100, reward_reputation: 5, description: 'Ganá la liga' },
  { code: 'c', title: 'Cantera', category: 'youth', rarity: 'rare', is_unlocked: true, is_claimed: true, current_progress: 3, target_progress: 3, reward_xp: 30, reward_reputation: 2, description: 'Promové juveniles' }
]
const claimReward = vi.fn(async () => ({ success: true, reward_xp: 10, reward_reputation: 1 }))
vi.mock('../../src/api/achievements', () => ({
  achievementsApi: {
    evaluateAchievements: vi.fn(async () => ({})),
    getManagerAchievements: vi.fn(async () => list),
    claimReward: (...a) => claimReward(...a),
    claimAllEligible: vi.fn(async () => ({ claimedCount: 0 }))
  }
}))

const ranking = [
  { id: '1', manager_name: 'Bilardo', nationality: 'Argentina', era: '80s', legacy_score: 9000, titles_count: 12, national_titles: 8, international_titles: 4, matches_won: 200, matches_played: 400, win_ratio: 50, clubs_managed: ['Estudiantes'] },
  { id: '2', manager_name: 'Vos', nationality: 'Argentina', era: 'Actual', legacy_score: 100, titles_count: 0, matches_won: 5, matches_played: 10, win_ratio: 50, is_human: true, clubs_managed: [] }
]
vi.mock('../../src/api/hallOfFame', () => ({
  hallOfFameApi: { getRanking: vi.fn(async () => ranking), getLiveManagerProjection: vi.fn(async () => null), inductManager: vi.fn() }
}))
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({ manager: { id: 'm1' }, club: { id: 'c1' }, loading: false, refreshContext: vi.fn(), confirmAction: vi.fn(async () => true) })
}))

import AchievementsScreen from '../../src/features/career/AchievementsScreen'
import HallOfFameScreen from '../../src/features/manager/HallOfFameScreen'

describe('dominio de logros y Salón de la Fama', () => {
  it('filtra y resume logros', () => {
    expect(filterAchievements(list, 'all', 'claimable').map(a => a.code)).toEqual(['a'])
    expect(filterAchievements(list, 'titles', 'all').map(a => a.code)).toEqual(['b'])
    expect(filterAchievements(list, 'all', 'in_progress').map(a => a.code)).toEqual(['b'])
    expect(summarizeAchievements(list)).toEqual({ total: 3, unlocked: 2, claimable: 1, xpClaimed: 30, percent: 67 })
    expect(progressPercent({ current_progress: 5, target_progress: 2 })).toBe(100)
  })
  it('filtra el ranking y arma el podio', () => {
    expect(filterRanking(ranking, 'human').map(r => r.id)).toEqual(['2'])
    expect(filterRanking(ranking, 'titles').map(r => r.id)).toEqual(['1'])
    expect(splitPodium(ranking).top).toHaveLength(2)
  })
})

describe('pantalla Logros', () => {
  beforeEach(() => { claimReward.mockClear() })

  it('muestra el resumen y reclama una recompensa', async () => {
    render(<MemoryRouter><AchievementsScreen /></MemoryRouter>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Logros y desafíos' })).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    const card = screen.getByText('Primer triunfo').closest('article')
    await userEvent.click(within(card).getByRole('button', { name: /Reclamar recompensa/ }))
    await waitFor(() => expect(claimReward).toHaveBeenCalledWith('m1', 'a'))
  })

  it('filtra por estado y muestra el vacío con opción de quitar filtros', async () => {
    render(<MemoryRouter><AchievementsScreen /></MemoryRouter>)
    await screen.findByRole('list', { name: 'Logros' })
    await userEvent.click(screen.getByRole('radio', { name: 'Cantera' }))
    await userEvent.click(screen.getByRole('radio', { name: 'En curso' }))
    expect(screen.getByText('Sin logros en esta selección')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }))
    expect(await screen.findAllByRole('article')).toHaveLength(3)
  })
})

describe('pantalla Salón de la Fama', () => {
  beforeEach(() => setViewport(true))

  it('muestra el podio y abre la ficha de un entrenador', async () => {
    render(<MemoryRouter><HallOfFameScreen /></MemoryRouter>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Salón de la Fama' })).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: 'Ranking histórico' })
    await userEvent.click(within(table).getByRole('button', { name: 'Ver ficha de Bilardo' }))
    const dlg = await screen.findByRole('dialog', { name: 'Bilardo' })
    expect(within(dlg).getByText('Estudiantes')).toBeInTheDocument()
  })
})
