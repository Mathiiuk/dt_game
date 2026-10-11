import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const push = vi.hoisted(() => ({
  pushStatus: vi.fn(), enablePush: vi.fn(), disablePush: vi.fn(), getPrefs: vi.fn(), setPrefs: vi.fn(), sendTestPush: vi.fn()
}))
vi.mock('../../src/lib/push', () => push)
vi.mock('../../src/lib/analytics', () => ({ track: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import NotificationsCard from '../../src/features/notifications/NotificationsCard'
import { toast } from 'sonner'

describe('notificaciones en "Más"', () => {
  beforeEach(() => {
    Object.values(push).forEach(f => f.mockReset())
    push.getPrefs.mockResolvedValue({ friends: true, club: false, news: true })
  })

  it('en iPhone sin instalar explica cómo instalarlo y no ofrece activar', async () => {
    push.pushStatus.mockResolvedValue({ state: 'unsupported', reason: 'ios-install' })
    render(<NotificationsCard userId="u1" />)
    expect(await screen.findByText(/Agregar a inicio/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Activar avisos' })).not.toBeInTheDocument()
  })

  it('si el navegador los bloqueó dice cómo desbloquearlos', async () => {
    push.pushStatus.mockResolvedValue({ state: 'blocked' })
    render(<NotificationsCard userId="u1" />)
    expect(await screen.findByText(/Bloqueaste los avisos/)).toBeInTheDocument()
  })

  it('apagados: el permiso se pide solo al tocar "Activar avisos"', async () => {
    push.pushStatus.mockResolvedValueOnce({ state: 'off' }).mockResolvedValue({ state: 'on' })
    push.enablePush.mockResolvedValue('on')
    render(<NotificationsCard userId="u1" />)
    expect(push.enablePush).not.toHaveBeenCalled()
    fireEvent.click(await screen.findByRole('button', { name: 'Activar avisos' }))
    await waitFor(() => expect(push.enablePush).toHaveBeenCalledTimes(1))
    expect(await screen.findByRole('switch', { name: 'Sala de amigos' })).toBeInTheDocument()
    expect(toast.success).toHaveBeenCalled()
  })

  it('encendidos: tres interruptores con lo guardado; cambiar uno lo guarda', async () => {
    push.pushStatus.mockResolvedValue({ state: 'on' })
    push.setPrefs.mockResolvedValue()
    render(<NotificationsCard userId="u1" />)
    const club = await screen.findByRole('switch', { name: 'Tu club te espera' })
    expect(club).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('switch', { name: 'Sala de amigos' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(club)
    await waitFor(() => expect(push.setPrefs).toHaveBeenCalledWith({ friends: true, club: true, news: true }))
  })

  it('se puede probar y apagar en este dispositivo', async () => {
    push.pushStatus.mockResolvedValueOnce({ state: 'on' }).mockResolvedValue({ state: 'off' })
    push.sendTestPush.mockResolvedValue(true)
    push.disablePush.mockResolvedValue()
    render(<NotificationsCard userId="u1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Mandarme un aviso de prueba' }))
    await waitFor(() => expect(push.sendTestPush).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Apagar en este dispositivo' }))
    await waitFor(() => expect(push.disablePush).toHaveBeenCalled())
    expect(await screen.findByRole('button', { name: 'Activar avisos' })).toBeInTheDocument()
  })
})
