import React, { useState } from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResponsiveOverlay, Button } from '../../src/components/ui'

// matchMedia controlable: `desktop` decide si (min-width: 768px) coincide
const setViewport = (desktop) => {
  window.matchMedia = (query) => ({
    matches: query.includes('min-width: 768px') ? desktop : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false
  })
}

const Demo = ({ onClosed }) => {
  const [open, setOpen] = useState(true)
  return open ? (
    <ResponsiveOverlay
      title="Renovar contrato"
      description="Define años y salario"
      onClose={() => { setOpen(false); onClosed?.() }}
      footer={<Button>Ofrecer</Button>}
    >
      <p>Contenido del formulario</p>
    </ResponsiveOverlay>
  ) : <p>cerrado</p>
}

describe('ResponsiveOverlay', () => {
  afterEach(() => { window.history.replaceState({}, '') })

  it('escritorio: diálogo con botón "Cerrar", sin tocar el historial', async () => {
    setViewport(true)
    const push = vi.spyOn(window.history, 'pushState')
    render(<Demo />)

    const dialog = screen.getByRole('dialog', { name: 'Renovar contrato' })
    expect(dialog).toHaveAccessibleDescription('Define años y salario')
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Volver' })).not.toBeInTheDocument()
    expect(screen.getByText('Contenido del formulario')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ofrecer' })).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.getByText('cerrado')).toBeInTheDocument()
    push.mockRestore()
  })

  it('móvil: página completa con flecha "Volver" y una entrada de historial', async () => {
    setViewport(false)
    const push = vi.spyOn(window.history, 'pushState')
    render(<Demo />)

    const dialog = screen.getByRole('dialog', { name: 'Renovar contrato' })
    expect(dialog.className).toMatch(/inset-0/)           // ocupa toda la pantalla
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cerrar' })).not.toBeInTheDocument()
    expect(push).toHaveBeenCalledTimes(1)
    expect(window.history.state.__overlay).toBeTruthy()
    push.mockRestore()
  })

  it('móvil: el gesto/botón "atrás" del teléfono cierra la página', async () => {
    setViewport(false)
    const onClosed = vi.fn()
    render(<Demo onClosed={onClosed} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    act(() => { window.history.back() })

    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1))
    expect(screen.getByText('cerrado')).toBeInTheDocument()
  })

  it('móvil: cerrar con la flecha quita la entrada de historial agregada', async () => {
    setViewport(false)
    const back = vi.spyOn(window.history, 'back')
    render(<Demo />)
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(screen.getByText('cerrado')).toBeInTheDocument()
    await waitFor(() => expect(back).toHaveBeenCalled())
    back.mockRestore()
  })

  it('en StrictMode (montar-desmontar-montar) la página sigue abierta y no se duplica la entrada de historial', async () => {
    setViewport(false)
    const push = vi.spyOn(window.history, 'pushState')
    const back = vi.spyOn(window.history, 'back')
    render(<React.StrictMode><Demo /></React.StrictMode>)
    await new Promise(r => setTimeout(r, 30))
    expect(screen.getByRole('dialog', { name: 'Renovar contrato' })).toBeInTheDocument()
    expect(push).toHaveBeenCalledTimes(1)
    expect(back).not.toHaveBeenCalled()
    push.mockRestore(); back.mockRestore()
  })
})
