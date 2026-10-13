import React from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/features/home/useVisitorState', () => ({ useVisitorState: () => 'visitor' }))
const repair = vi.hoisted(() => ({ fn: vi.fn().mockResolvedValue(true) }))
vi.mock('../../src/lib/repairApp', () => ({ repairAndReload: (...a) => repair.fn(...a) }))

import NotFoundScreen from '../../src/features/errors/NotFoundScreen'
import ErrorBoundary, { isChunkError } from '../../src/features/errors/ErrorBoundary'
import OfflineBanner from '../../src/components/OfflineBanner'

beforeEach(() => { window.dataLayer = []; window.scrollTo = () => {}; window.sessionStorage.clear(); repair.fn.mockClear() })

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

describe('error de una versión vieja (archivo que ya no existe)', () => {
  const OldChunk = () => { throw new Error('Failed to fetch dynamically imported module: https://x/assets/Plantel-abc.js') }
  const Other = () => { throw new Error('falló un componente') }

  it('repara sola (desregistra el service worker, vacía las cachés y recarga) en vez de una recarga común', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><OldChunk /></ErrorBoundary>)
    expect(repair.fn).toHaveBeenCalledTimes(1)
    expect(repair.fn.mock.calls[0][0]?.force).toBeFalsy()
    spy.mockRestore()
  })

  it('el botón de la pantalla de error repara a la fuerza cuando el problema es la versión vieja', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><OldChunk /></ErrorBoundary>)
    repair.fn.mockClear()
    await userEvent.click(screen.getByRole('button', { name: /actualizar el juego/i }))
    expect(repair.fn).toHaveBeenCalledWith({ force: true })
    spy.mockRestore()
  })

  it('explica que es una versión vieja y que la carrera está a salvo', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><OldChunk /></ErrorBoundary>)
    expect(screen.getByText(/tenías una versión vieja/i)).toBeInTheDocument()
    expect(screen.getByText(/carrera está a salvo/i)).toBeInTheDocument()
    spy.mockRestore()
  })

  it('un error común no dispara la reparación', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><Other /></ErrorBoundary>)
    expect(repair.fn).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('aviso de sin conexión', () => {
  it('aparece al perder la conexión y desaparece al volver', async () => {
    render(<OfflineBanner />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(screen.getByRole('status').textContent).toMatch(/sin conexión/i)
    act(() => { window.dispatchEvent(new Event('online')) })
    expect(screen.getByRole('status').textContent).toMatch(/volviste/i)
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), { timeout: 4000 })
    await userEvent.setup()
  })
})
