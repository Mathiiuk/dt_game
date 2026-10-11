import React from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { resetBusy, markBusy } from '../../src/lib/busy'
import { STALE_EVENT } from '../../src/lib/staleVersion'

const sw = { needRefresh: false, offlineReady: false, update: vi.fn(), setNeed: vi.fn(), setOffline: vi.fn() }
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ offlineReady: [sw.offlineReady, (v) => sw.setOffline(v)], needRefresh: [sw.needRefresh, (v) => sw.setNeed(v)], updateServiceWorker: (...a) => sw.update(...a) })
}))

import ReloadPrompt from '../../src/components/ReloadPrompt'

let nav
const Nav = () => { nav = useNavigate(); return null }
const renderAt = (path) => render(<MemoryRouter initialEntries={[path]}><Nav /><ReloadPrompt /></MemoryRouter>)

describe('aviso de versión nueva', () => {
  beforeEach(() => { Object.assign(sw, { needRefresh: false, offlineReady: false }); sw.update.mockClear(); resetBusy() })

  it('sin novedades no muestra nada', () => {
    renderAt('/dashboard')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('en un buen momento ofrece actualizar ahora y avisa que se instala sola al cambiar de sección', () => {
    sw.needRefresh = true
    renderAt('/dashboard')
    expect(screen.getByText(/Se instala sola al cambiar de sección/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar ahora' }))
    expect(sw.update).toHaveBeenCalledWith(true)
  })

  it('en un partido no ofrece actualizar: espera a que termines', () => {
    sw.needRefresh = true
    renderAt('/match')
    expect(screen.getByText(/La instalamos cuando termines/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Actualizar ahora' })).not.toBeInTheDocument()
  })

  it('con algo a medias tampoco', () => {
    sw.needRefresh = true
    markBusy('tactics-unsaved')
    renderAt('/tactics')
    expect(screen.queryByRole('button', { name: 'Actualizar ahora' })).not.toBeInTheDocument()
  })

  it('al cambiar de sección en un momento seguro se instala sola', () => {
    sw.needRefresh = true
    renderAt('/dashboard')
    act(() => nav('/squad'))
    expect(sw.update).toHaveBeenCalledTimes(1)
  })

  it('no se instala sola si la nueva pantalla es un partido o hay algo a medias', () => {
    sw.needRefresh = true
    renderAt('/dashboard')
    act(() => nav('/match'))
    expect(sw.update).not.toHaveBeenCalled()
    markBusy('story')
    act(() => nav('/squad'))
    expect(sw.update).not.toHaveBeenCalled()
  })

  it('"Después" oculta el aviso pero la actualización sigue pendiente para instalarse sola', () => {
    sw.needRefresh = true
    renderAt('/dashboard')
    fireEvent.click(screen.getByRole('button', { name: 'Después' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    act(() => nav('/squad'))
    expect(sw.update).toHaveBeenCalledTimes(1)
  })

  it('una pestaña vieja que pide un archivo inexistente muestra el aviso y se recarga cuando es seguro', () => {
    const reload = vi.fn()
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true })
    renderAt('/dashboard')
    act(() => { window.dispatchEvent(new Event(STALE_EVENT)) })
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar ahora' }))
    expect(reload).toHaveBeenCalled()
  })

  it('el aviso de modo sin conexión se puede cerrar', () => {
    sw.offlineReady = true
    renderAt('/dashboard')
    expect(screen.getByText(/listo para usarse offline/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(sw.setOffline).toHaveBeenCalledWith(false)
  })
})
