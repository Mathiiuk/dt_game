import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const { fetchPublicProfile } = vi.hoisted(() => ({ fetchPublicProfile: vi.fn() }))
vi.mock('../../src/lib/publicProfile', async (orig) => ({ ...(await orig()), fetchPublicProfile }))

import PublicProfilePage from '../../src/features/home/PublicProfilePage'

const profile = { name: 'Ana Gómez', points: 1301, titlesNational: 2, titlesContinental: 1, played: 40, won: 25, rank: 7, kit: { primary: '#112233', secondary: '#ffeedd', pattern: 'SASH' } }
const renderAt = (path = '/dt/ana-gomez-a1b2') => render(
  <MemoryRouter initialEntries={[path]}><Routes><Route path="/dt/:slug" element={<PublicProfilePage />} /></Routes></MemoryRouter>
)

describe('perfil público del DT', () => {
  beforeEach(() => { fetchPublicProfile.mockReset(); document.head.innerHTML = '' })

  it('muestra el nombre, los puntos, los títulos, las victorias y el puesto', async () => {
    fetchPublicProfile.mockResolvedValue(profile)
    renderAt()
    expect(await screen.findByRole('heading', { level: 1, name: 'Ana Gómez' })).toBeInTheDocument()
    expect(screen.getByText('1.301')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // títulos
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('7º')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /camiseta/i })).toBeInTheDocument()
  })

  it('sin puesto todavía dice cuántos partidos faltan', async () => {
    fetchPublicProfile.mockResolvedValue({ ...profile, rank: null, played: 4 })
    renderAt()
    expect(await screen.findByText(/aparece en la tabla desde los 10 partidos/i)).toBeInTheDocument()
  })

  it('invita a crear la carrera y a probar la demo', async () => {
    fetchPublicProfile.mockResolvedValue(profile)
    renderAt()
    expect(await screen.findByRole('link', { name: /probar la demo/i })).toHaveAttribute('href', '/demo')
  })

  it('no se indexa en buscadores', async () => {
    fetchPublicProfile.mockResolvedValue(profile)
    renderAt()
    await screen.findByRole('heading', { level: 1, name: 'Ana Gómez' })
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toMatch(/noindex/))
  })

  it('si no existe o no aceptó aparecer, lo dice sin revelar nada más', async () => {
    fetchPublicProfile.mockResolvedValue(null)
    renderAt('/dt/nadie-0000')
    expect(await screen.findByText(/no encontramos a este dt/i)).toBeInTheDocument()
  })

  it('si falla la carga ofrece reintentar', async () => {
    fetchPublicProfile.mockRejectedValue(new Error('sin red'))
    renderAt()
    expect(await screen.findByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })
})
