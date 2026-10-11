import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WeekProgress from '../../src/features/week/WeekProgress'
import { WEEK_PHRASES } from '../../src/domain/weekFlavor'

describe('WeekProgress', () => {
  it('no muestra nada si no está visible', () => {
    render(<WeekProgress visible={false} tick={0} summary={null} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('mientras corre anuncia la frase actual y marca el día', () => {
    render(<WeekProgress visible tick={2} summary={null} onClose={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent(WEEK_PHRASES[2])
    expect(screen.getByText('Mié').closest('li')).toHaveAttribute('aria-current', 'step')
  })

  it('al terminar muestra el resumen y "Seguir" cierra', async () => {
    const onClose = vi.fn()
    render(<WeekProgress visible tick={0} summary={[{ id: 'week', text: 'Empezó la semana 5.', tone: 'neutral' }]} onClose={onClose} />)
    expect(screen.getByText('Empezó la semana 5.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onClose).toHaveBeenCalled()
  })
})
