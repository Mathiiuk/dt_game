import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const state = { offlineReady: false, needRefresh: false, update: vi.fn(), setOffline: vi.fn(), setRefresh: vi.fn() }

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [state.offlineReady, state.setOffline],
    needRefresh: [state.needRefresh, state.setRefresh],
    updateServiceWorker: state.update
  })
}))

import ReloadPrompt from '../../src/components/ReloadPrompt'

describe('aviso de actualización', () => {
  it('no muestra nada si no hay novedades', () => {
    state.offlineReady = false
    state.needRefresh = false
    const { container } = render(<ReloadPrompt />)
    expect(container).toBeEmptyDOMElement()
  })

  it('con una actualización ofrece actualizar o cerrar, y queda por encima del menú inferior en el celular', () => {
    state.needRefresh = true
    render(<ReloadPrompt />)
    const box = screen.getByRole('status')
    // En el celular se despega del borde para no tapar la barra de pestañas (56 px más la zona segura)
    expect(box.className).toContain('bottom-[calc(4.75rem+env(safe-area-inset-bottom))]')
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar juego' }))
    expect(state.update).toHaveBeenCalledWith(true)
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(state.setRefresh).toHaveBeenCalledWith(false)
  })
})
