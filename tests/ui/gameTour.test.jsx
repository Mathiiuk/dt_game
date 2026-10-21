import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

let joyrideProps = null
vi.mock('react-joyride', () => ({
  EVENTS: { TOUR_END: 'tour:end' },
  Joyride: (props) => { joyrideProps = props; return <div data-testid="joyride" /> }
}))
const updateUser = vi.fn().mockResolvedValue({})
vi.mock('../../src/api/supabase', () => ({ supabase: { auth: { updateUser: (...a) => updateUser(...a) } } }))
vi.mock('../../src/lib/analytics', () => ({ track: vi.fn() }))
let ctxUser = null
vi.mock('../../src/context/GameContext', () => ({ useGameContext: () => ({ user: ctxUser }) }))

import GameTour from '../../src/features/tutorial/GameTour'
import { EVENT_START_TOUR, tourKey } from '../../src/features/tutorial/tourState'
import { TOUR_STEPS } from '../../src/features/tutorial/tourSteps'

const fresh = { id: 'u1', created_at: '2026-10-12T10:00:00Z', user_metadata: {} }
// El recorrido se carga aparte (lazy): antes de afirmar que no apareció hay que dejar que termine de cargar
const settle = () => act(async () => { await new Promise(r => setTimeout(r, 20)) })
const renderAt = (path) => render(<MemoryRouter initialEntries={[path]}><GameTour /></MemoryRouter>)

describe('GameTour', () => {
  beforeEach(() => { window.localStorage.clear(); joyrideProps = null; updateUser.mockClear(); ctxUser = fresh })

  it('arranca solo para una cuenta nueva en el inicio', async () => {
    renderAt('/dashboard')
    expect(await screen.findByTestId('joyride')).toBeInTheDocument()
    expect(joyrideProps.steps).toHaveLength(TOUR_STEPS.length)
    expect(joyrideProps.locale.skip).toMatch(/Saltear/)
  })

  it('no arranca fuera del inicio, ni para cuentas viejas, ni si ya lo vio', async () => {
    renderAt('/squad')
    await settle()
    expect(screen.queryByTestId('joyride')).toBeNull()
    ctxUser = { ...fresh, created_at: '2026-01-01T00:00:00Z' }
    renderAt('/dashboard')
    await settle()
    expect(screen.queryByTestId('joyride')).toBeNull()
    ctxUser = fresh
    window.localStorage.setItem(tourKey('u1'), 'done')
    renderAt('/dashboard')
    await settle()
    expect(screen.queryByTestId('joyride')).toBeNull()
  })

  it('al terminar o saltear queda anotado y se cierra', async () => {
    renderAt('/dashboard')
    await screen.findByTestId('joyride')
    await act(async () => { joyrideProps.onEvent({ type: 'tour:end', status: 'skipped' }) })
    expect(screen.queryByTestId('joyride')).toBeNull()
    expect(updateUser).toHaveBeenCalledWith({ data: { tour_version: 1 } })
    expect(window.localStorage.getItem(tourKey('u1'))).toBe('done')
  })

  it('se puede volver a ver desde "Más", aunque ya lo haya visto', async () => {
    ctxUser = { ...fresh, created_at: '2026-01-01T00:00:00Z' }
    renderAt('/more')
    expect(screen.queryByTestId('joyride')).toBeNull()
    act(() => { window.dispatchEvent(new Event(EVENT_START_TOUR)) })
    expect(await screen.findByTestId('joyride')).toBeInTheDocument()
  })
})
