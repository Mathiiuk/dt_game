import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { setPublicRanking, claimPublicSlug, fetchPublicProfile } = vi.hoisted(() => ({ setPublicRanking: vi.fn(), claimPublicSlug: vi.fn(), fetchPublicProfile: vi.fn() }))
vi.mock('../../src/api/manager', () => ({ managerApi: { setPublicRanking, claimPublicSlug } }))
vi.mock('../../src/lib/publicProfile', async (orig) => ({ ...(await orig()), fetchPublicProfile }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import PublicRankingCard from '../../src/features/more/PublicRankingCard'

const renderIt = (manager = { id: 'm1', public_ranking: false }) => render(<MemoryRouter><PublicRankingCard manager={manager} /></MemoryRouter>)

describe('privacidad: aparecer en la tabla pública', () => {
  beforeEach(() => { setPublicRanking.mockReset(); claimPublicSlug.mockReset().mockResolvedValue(null); fetchPublicProfile.mockReset().mockResolvedValue(null); window.dataLayer = [] })

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
    expect(window.dataLayer.map(d => d.event)).toEqual(['ranking_opt_in'])
    await userEvent.click(sw)
    await waitFor(() => expect(setPublicRanking).toHaveBeenLastCalledWith('m1', false))
    expect(window.dataLayer.map(d => d.event)).toEqual(['ranking_opt_in'])
    expect(sw).not.toBeChecked()
  })

  it('si falla el guardado vuelve al estado anterior y avisa', async () => {
    setPublicRanking.mockRejectedValue(new Error('sin red'))
    renderIt()
    const sw = screen.getByRole('switch', { name: /aparecer en la tabla pública/i })
    await userEvent.click(sw)
    await waitFor(() => expect(sw).not.toBeChecked())
  })

  it('si ya aceptó, muestra el enlace a su perfil público y su puesto', async () => {
    claimPublicSlug.mockResolvedValue('ana-gomez-a1b2')
    fetchPublicProfile.mockResolvedValue({ name: 'Ana Gómez', points: 1301, rank: 7, played: 40 })
    renderIt({ id: 'm1', public_ranking: true })
    expect(await screen.findByRole('link', { name: /ver mi perfil público/i })).toHaveAttribute('href', '/dt/ana-gomez-a1b2')
    expect(await screen.findByText(/tu puesto: 7º/i)).toBeInTheDocument()
  })

  it('al activar el consentimiento genera la dirección del perfil', async () => {
    setPublicRanking.mockResolvedValue(true)
    claimPublicSlug.mockResolvedValue('ana-gomez-a1b2')
    renderIt()
    await userEvent.click(screen.getByRole('switch', { name: /aparecer en la tabla pública/i }))
    expect(await screen.findByRole('link', { name: /ver mi perfil público/i })).toBeInTheDocument()
    expect(claimPublicSlug).toHaveBeenCalled()
  })

  it('si todavía no tiene 10 partidos, avisa que el puesto llega después', async () => {
    claimPublicSlug.mockResolvedValue('ana-gomez-a1b2')
    fetchPublicProfile.mockResolvedValue({ name: 'Ana Gómez', points: 200, rank: null, played: 4 })
    renderIt({ id: 'm1', public_ranking: true })
    expect(await screen.findByText(/te faltan 6 partidos/i)).toBeInTheDocument()
  })

  it('sin consentimiento no muestra perfil', () => {
    renderIt({ id: 'm1', public_ranking: false })
    expect(screen.queryByRole('link', { name: /ver mi perfil público/i })).toBeNull()
    expect(claimPublicSlug).not.toHaveBeenCalled()
  })
})
