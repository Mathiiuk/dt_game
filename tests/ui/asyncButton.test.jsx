import React, { useState } from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button, AsyncButton } from '../../src/components/ui'

const deferred = () => { let resolve, reject; const promise = new Promise((res, rej) => { resolve = res; reject = rej }); return { promise, resolve, reject } }

describe('botones con acciones asíncronas', () => {
  it('un doble clic ejecuta la acción una sola vez y mientras corre muestra carga y queda inactivo', async () => {
    const d = deferred()
    const action = vi.fn(() => d.promise)
    render(<Button onClick={action}>Guardar</Button>)
    const btn = screen.getByRole('button', { name: 'Guardar' })

    await userEvent.dblClick(btn)

    expect(action).toHaveBeenCalledTimes(1)
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')

    await act(async () => { d.resolve() })
    expect(btn).not.toBeDisabled()
    expect(btn).not.toHaveAttribute('aria-busy')
  })

  it('si la acción falla el botón vuelve a estar disponible', async () => {
    const d = deferred()
    const action = vi.fn(() => d.promise)
    render(<Button onClick={action}>Enviar</Button>)
    const btn = screen.getByRole('button', { name: 'Enviar' })
    await userEvent.click(btn)
    expect(btn).toBeDisabled()
    await act(async () => { d.reject(new Error('falló')); await d.promise.catch(() => {}) })
    expect(btn).not.toBeDisabled()
    await userEvent.click(btn)
    expect(action).toHaveBeenCalledTimes(2)
  })

  it('un manejador síncrono no bloquea nada', async () => {
    const action = vi.fn()
    render(<Button onClick={action}>Abrir</Button>)
    await userEvent.dblClick(screen.getByRole('button', { name: 'Abrir' }))
    expect(action).toHaveBeenCalledTimes(2)
  })

  it('AsyncButton conserva sus clases y tiene el mismo bloqueo', async () => {
    const d = deferred()
    const action = vi.fn(() => d.promise)
    render(<AsyncButton className="mi-clase" onClick={action}>Reunión</AsyncButton>)
    const btn = screen.getByRole('button', { name: 'Reunión' })
    expect(btn).toHaveClass('mi-clase')
    await userEvent.dblClick(btn)
    expect(action).toHaveBeenCalledTimes(1)
    expect(btn).toBeDisabled()
    await act(async () => { d.resolve() })
    expect(btn).not.toBeDisabled()
  })

  it('no actualiza el estado si el botón se desmontó mientras corría', async () => {
    const d = deferred()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Host() { const [open, setOpen] = useState(true); return open ? <Button onClick={() => { setOpen(false); return d.promise }}>Ir</Button> : <p>cerrado</p> }
    render(<Host />)
    await userEvent.click(screen.getByRole('button', { name: 'Ir' }))
    await act(async () => { d.resolve() })
    expect(screen.getByText('cerrado')).toBeInTheDocument()
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })
})
