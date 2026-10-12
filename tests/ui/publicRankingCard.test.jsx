import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { setPublicRanking } = vi.hoisted(() => ({ setPublicRanking: vi.fn() }))
vi.mock('../../src/api/manager', () => ({ managerApi: { setPublicRanking } }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import PublicRankingCard from '../../src/features/more/PublicRankingCard'

const renderIt = (manager = { id: 'm1', public_ranking: false }) => render(<MemoryRouter><PublicRankingCard manager={manager} /></MemoryRouter>)

describe('privacidad: aparecer en la tabla pública', () => {
  beforeEach(() => { setPublicRanking.mockReset(); window.dataLayer = [] })

  it('explica qué se publica y qué no, y enlaza a la política', () => {
    renderIt()
    expect(screen.getByText(/nombre y apellido de tu DT/i)).toBeInTheDocument()
    expect(screen.getByText(/nunca tu correo/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /política de privacidad/i })).toHaveAttribute('href', '/privacidad')
  })

  it('arranca apagado si la persona no aceptó', () => {
    renderIt({ id: 'm1', public_ranking: false })
    expect(screen.getByRole('switch', { name: /aparecer en la tabla pública/i })).not.toBeChecked()
  })

  it('refleja el consentimiento ya dado', () => {
    renderIt({ id: 'm1', public_ranking: true })
    expect(screen.getByRole('switch', { name: /aparecer en la tabla pública/i })).toBeChecked()
  })

  it('al activarlo lo guarda; al apagarlo retira el consentimiento', async () => {
    setPublicRanking.mockResolvedValue(true)
    renderIt()
    const sw = screen.getByRole('switch', { name: /aparecer en la tabla pública/i })
    await userEvent.click(sw)
    await waitFor(() => expect(setPublicRanking).toHaveBeenLastCalledWith('m1', true))
    expect(sw).toBeChecked()
    await userEvent.click(sw)
    await waitFor(() => expect(setPublicRanking).toHaveBeenLastCalledWith('m1', false))
    expect(sw).not.toBeChecked()
  })

  it('si falla el guardado vuelve al estado anterior y avisa', async () => {
    setPublicRanking.mockRejectedValue(new Error('sin red'))
    renderIt()
    const sw = screen.getByRole('switch', { name: /aparecer en la tabla pública/i })
    await userEvent.click(sw)
    await waitFor(() => expect(sw).not.toBeChecked())
  })
})
