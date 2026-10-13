import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DesktopSubstitutions from '../../src/features/match/DesktopSubstitutions'

const mk = (id, last, position, extra = {}) => ({ id, first_name: 'J', last_name: last, position, slot: position, slot_base: position, attr_overall: 70, state_fitness: 90, ...extra })
const onField = [mk('a', 'Arquero', 'ARQ'), mk('b', 'Zaguero', 'DFC'), mk('c', 'Volante', 'MC'), mk('d', 'Nueve', 'DEL')]
const players = [...onField, mk('e', 'Suplente9', 'DEL', { attr_overall: 80 }), mk('f', 'SuplenteMC', 'MC', { attr_overall: 65 })]

const setup = (props = {}) => {
  const onSubstitute = vi.fn()
  const onClose = vi.fn()
  render(<DesktopSubstitutions open onClose={onClose} onField={onField} players={players} subsMade={[]} onSubstitute={onSubstitute} statusById={{}} {...props} />)
  return { onSubstitute, onClose }
}

describe('cambios en escritorio (dos paneles)', () => {
  it('lista los titulares por línea y pide elegir a quién sacar', () => {
    setup()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nueve/ })).toBeInTheDocument()
    expect(screen.getByText(/elegí a quién sacar/i)).toBeInTheDocument()
  })

  it('al elegir un titular muestra los suplentes, el mejor en ese puesto primero', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /Nueve/ }))
    const bench = screen.getByRole('list', { name: /suplentes/i })
    const items = within(bench).getAllByRole('button')
    expect(items[0]).toHaveTextContent('Suplente9')
  })

  it('confirma el cambio con un clic y cierra', async () => {
    const { onSubstitute, onClose } = setup()
    await userEvent.click(screen.getByRole('button', { name: /Nueve/ }))
    await userEvent.click(screen.getByRole('button', { name: /Suplente9/ }))
    expect(onSubstitute).toHaveBeenCalledWith('d', 'e')
    expect(onClose).toHaveBeenCalled()
  })

  it('marca al lesionado y lo deja preseleccionado', () => {
    setup({ preselectOutId: 'c', statusById: { c: { hurt: true } } })
    expect(screen.getByText(/lesionado/i)).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: /suplentes/i })).getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('sin cambios disponibles lo avisa y no deja elegir', () => {
    const subsMade = [1, 2, 3, 4, 5].map(i => ({ outId: `x${i}`, inId: `y${i}`, minute: i }))
    setup({ subsMade })
    expect(screen.getByText(/todos los cambios/i)).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /suplentes/i })).toBeNull()
  })
})
