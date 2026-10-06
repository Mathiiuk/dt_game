import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DecisionCard from '../../src/features/match/DecisionCard'
import { halftimeTalk } from '../../src/domain/quickDecisions'

describe('tarjeta de decisión', () => {
  it('muestra el momento con el efecto de cada opción y avisa cuál se eligió', async () => {
    const onChoose = vi.fn()
    render(<DecisionCard moment={halftimeTalk({ morale: 70 })} onChoose={onChoose} />)
    expect(screen.getByRole('region', { name: 'Entretiempo' })).toBeInTheDocument()
    expect(screen.getByText(/\+10% ataque, -3% defensa/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Orden y paciencia/ }))
    expect(onChoose).toHaveBeenCalledWith(expect.objectContaining({ id: 'HT_ORDER' }))
  })
})
