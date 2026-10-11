import React from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/features/home/useVisitorState', () => ({ useVisitorState: () => 'visitor' }))

import NotFoundScreen from '../../src/features/errors/NotFoundScreen'
import ErrorBoundary, { isChunkError } from '../../src/features/errors/ErrorBoundary'
import OfflineBanner from '../../src/components/OfflineBanner'

beforeEach(() => { window.dataLayer = []; window.scrollTo = () => {}; window.sessionStorage.clear() })

describe('página inexistente (404)', () => {
  it('tiene un solo h1 con humor, enlaces útiles y no se indexa', () => {
    render(<MemoryRouter initialEntries={['/no-existe']}><NotFoundScreen /></MemoryRouter>)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/VAR|no existe|offside/i)
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
    expect(main.getByRole('link', { name: /cómo jugar/i })).toHaveAttribute('href', '/como-jugar')
    expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toBe('noindex,nofollow')
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
  })
})

describe('error inesperado en la app', () => {
  const Bomb = ({ boom }) => { if (boom) throw new Error('falló un componente'); return <p>todo bien</p> }

  it('muestra una pantalla amable con recarga y vuelta al inicio, en vez de la pantalla en blanco', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><Bomb boom /></ErrorBoundary>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recargar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
    expect(window.dataLayer.some(d => d.event === 'app_error')).toBe(true)
    spy.mockRestore()
  })

  it('si no hay error deja pasar el contenido', () => {
    render(<ErrorBoundary><Bomb /></ErrorBoundary>)
    expect(screen.getByText('todo bien')).toBeInTheDocument()
  })

  it('reconoce el error de una versión vieja (el archivo ya no existe tras una actualización)', () => {
    expect(isChunkError(new Error('Failed to fetch dynamically imported module: https://x/assets/a.js'))).toBe(true)
    expect(isChunkError(new Error('Loading chunk 5 failed'))).toBe(true)
    expect(isChunkError(new Error('otra cosa'))).toBe(false)
  })
})

describe('aviso de sin conexión', () => {
  it('aparece al perder la conexión y desaparece al volver', async () => {
    render(<OfflineBanner />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(screen.getByRole('status').textContent).toMatch(/sin conexión/i)
    act(() => { window.dispatchEvent(new Event('online')) })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    await userEvent.setup()
  })
})
