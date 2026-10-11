import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OfflineBanner from '../../src/components/OfflineBanner'
import { setSlow, resetNetStatus } from '../../src/lib/netStatus'

describe('aviso de red', () => {
  beforeEach(() => resetNetStatus())

  it('sin conexión explica que se puede mirar lo ya cargado y que no se puede guardar', () => {
    render(<OfflineBanner />)
    act(() => { window.dispatchEvent(new Event('offline')) })
    const status = screen.getByRole('status')
    expect(status.textContent).toMatch(/sin conexión/i)
    expect(status.textContent).toMatch(/solo lectura|podés mirar/i)
    act(() => { window.dispatchEvent(new Event('online')) })
  })

  it('conexión lenta: avisa sin alarmar, y desaparece cuando mejora', () => {
    render(<OfflineBanner />)
    expect(screen.queryByRole('status')).toBeNull()
    act(() => setSlow(true))
    expect(screen.getByRole('status').textContent).toMatch(/conexión lenta/i)
    act(() => setSlow(false))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('"Reintentar" recarga los datos de la pantalla', async () => {
    const onRetry = vi.fn()
    render(<OfflineBanner onRetry={onRetry} />)
    act(() => { window.dispatchEvent(new Event('offline')) })
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(onRetry).toHaveBeenCalled()
    act(() => { window.dispatchEvent(new Event('online')) })
  })
})
