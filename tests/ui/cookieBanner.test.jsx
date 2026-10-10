import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CookieBanner from '../../src/features/consent/CookieBanner'
import { getConsent, CONSENT_KEY } from '../../src/lib/consent'

const renderIt = () => render(<MemoryRouter><CookieBanner /></MemoryRouter>)

describe('aviso de cookies', () => {
  beforeEach(() => { window.localStorage.clear(); window.dataLayer = [] })

  it('aparece la primera vez, explica qué se mide y enlaza a la privacidad', () => {
    renderIt()
    expect(screen.getByRole('region', { name: /cookies/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /privacidad/i })).toHaveAttribute('href', '/privacidad')
  })

  it('aceptar guarda el permiso y se cierra', async () => {
    renderIt()
    await userEvent.click(screen.getByRole('button', { name: /aceptar/i }))
    expect(getConsent()).toBe('granted')
    expect(screen.queryByRole('region', { name: /cookies/i })).not.toBeInTheDocument()
  })

  it('"Solo necesarias" guarda el rechazo y se cierra', async () => {
    renderIt()
    await userEvent.click(screen.getByRole('button', { name: /solo necesarias/i }))
    expect(getConsent()).toBe('denied')
    expect(screen.queryByRole('region', { name: /cookies/i })).not.toBeInTheDocument()
  })

  it('si ya se eligió antes, no vuelve a molestar', () => {
    window.localStorage.setItem(CONSENT_KEY, 'granted')
    renderIt()
    expect(screen.queryByRole('region', { name: /cookies/i })).not.toBeInTheDocument()
  })
})
