import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelpHint } from '../../src/components/ui'

describe('HelpHint', () => {
  it('es un botón "?" con nombre accesible y no muestra la información hasta tocarlo', () => {
    render(<HelpHint topic="la pizarra" title="Cómo usar la pizarra"><p>Tocá una ficha.</p></HelpHint>)
    const button = screen.getByRole('button', { name: 'Ayuda: la pizarra' })
    expect(button).toHaveTextContent('?')
    expect(screen.queryByText('Tocá una ficha.')).toBeNull()
  })

  it('al tocarlo muestra título y texto; "Entendido" lo cierra y devuelve el foco al botón', async () => {
    render(<HelpHint topic="la pizarra" title="Cómo usar la pizarra"><p>Tocá una ficha.</p></HelpHint>)
    const button = screen.getByRole('button', { name: 'Ayuda: la pizarra' })
    await userEvent.click(button)
    expect(screen.getByRole('dialog', { name: 'Cómo usar la pizarra' })).toBeInTheDocument()
    expect(screen.getByText('Tocá una ficha.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Entendido' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(button).toHaveFocus()
  })

  it('se abre y cierra con el teclado (Enter y Esc)', async () => {
    render(<HelpHint topic="el estilo" title="Estilo"><p>Detalle</p></HelpHint>)
    screen.getByRole('button', { name: 'Ayuda: el estilo' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByText('Detalle')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByText('Detalle')).toBeNull()
  })

  it('el toque no se propaga al contenedor (no activa la fila o el botón donde está puesto)', async () => {
    const onParent = vi.fn()
    render(<div onClick={onParent}><HelpHint topic="x" title="T"><p>Info</p></HelpHint></div>)
    await userEvent.click(screen.getByRole('button', { name: 'Ayuda: x' }))
    expect(onParent).not.toHaveBeenCalled()
  })
})
