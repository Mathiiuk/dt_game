import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SubstitutionsPanel from '../../src/features/match/SubstitutionsPanel'

const p = (id, extra = {}) => ({ id, first_name: 'Juan', last_name: id, position: 'MC', attr_overall: 60, state_fitness: 88, ...extra })

describe('panel de cambios', () => {
  const setup = (props = {}) => {
    const onSubstitute = vi.fn()
    render(<SubstitutionsPanel onField={[p('a', { slot_base: 'MC', slot_rating: 61 }), p('b')]} bench={[p('x', { attr_overall: 72 })]} subsLeft={3} onSubstitute={onSubstitute} {...props} />)
    return onSubstitute
  }

  it('primero se elige quién sale y después quién entra', async () => {
    const onSubstitute = setup()
    expect(screen.getByText(/3 disponibles/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Juan a/ }))
    expect(screen.getByText(/¿Quién entra\?/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Juan x/ }))
    expect(onSubstitute).toHaveBeenCalledWith('a', 'x')
  })

  it('se puede elegir a otro antes de confirmar', async () => {
    const onSubstitute = setup()
    await userEvent.click(screen.getByRole('button', { name: /Juan a/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Elegir otro' }))
    expect(screen.getByText('¿Quién sale?')).toBeInTheDocument()
    expect(onSubstitute).not.toHaveBeenCalled()
  })

  it('sin cambios disponibles avisa y no ofrece jugadores', () => {
    setup({ subsLeft: 0 })
    expect(screen.getByText(/todos los cambios permitidos/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Juan a/ })).toBeNull()
  })
})
