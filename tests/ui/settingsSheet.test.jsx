import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const confirmAction = vi.fn(async () => true)
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({
    club: { id: 'c1', name: 'Club Atlético Potrero', game_date: '2026-08-12' },
    manager: { id: 'm1', first_name: 'Matías', last_name: 'Gallardo', level: 3, public_ranking: false },
    user: { id: 'u1' },
    confirmAction
  })
}))
vi.mock('../../src/features/dashboard/DifficultySelector', () => ({ default: () => <div>Selector de dificultad</div> }))
vi.mock('../../src/features/notifications/NotificationsCard', () => ({ default: () => <div>Tarjeta de avisos</div> }))
vi.mock('../../src/features/more/PublicRankingCard', () => ({ default: () => <div>Tarjeta de privacidad</div> }))
vi.mock('../../src/api/friends', () => ({ friendsApi: { getPending: () => Promise.resolve([]) } }))
vi.mock('../../src/api/auth', () => ({ authApi: { logout: vi.fn() } }))

import SettingsSheet from '../../src/components/layout/SettingsSheet'
import { THEME_KEY } from '../../src/lib/theme'
import { EVENT_START_TOUR } from '../../src/features/tutorial/tourState'

const renderIt = (props = {}) => render(<MemoryRouter><SettingsSheet open onOpenChange={vi.fn()} {...props} /></MemoryRouter>)

describe('menú de ajustes de escritorio', () => {
  beforeEach(() => { window.localStorage.clear(); document.documentElement.removeAttribute('data-theme') })

  it('es un panel con título "Ajustes" y todas las configuraciones juntas', () => {
    renderIt()
    const dialog = screen.getByRole('dialog', { name: 'Ajustes' })
    expect(within(dialog).getByRole('radiogroup', { name: 'Apariencia' })).toBeInTheDocument()
    expect(within(dialog).getByText('Selector de dificultad')).toBeInTheDocument()
    expect(within(dialog).getByText('Tarjeta de avisos')).toBeInTheDocument()
    expect(within(dialog).getByText('Tarjeta de privacidad')).toBeInTheDocument()
  })

  it('el modo claro es el que viene marcado y se puede pasar a oscuro desde acá', async () => {
    renderIt()
    expect(screen.getByRole('radio', { name: 'Claro' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it('permite volver a ver el tutorial y cierra el panel', async () => {
    const onOpenChange = vi.fn()
    const started = vi.fn()
    window.addEventListener(EVENT_START_TOUR, started)
    renderIt({ onOpenChange })
    await userEvent.click(screen.getByRole('button', { name: /ver el tutorial/i }))
    expect(started).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    window.removeEventListener(EVENT_START_TOUR, started)
  })

  it('se cierra con el botón de cerrar', async () => {
    const onOpenChange = vi.fn()
    renderIt({ onOpenChange })
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('cerrado no muestra nada', () => {
    renderIt({ open: false })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
