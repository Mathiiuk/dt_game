import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WageCapMeter from '../../src/features/finances/WageCapMeter'

describe('medidor del tope de sueldos', () => {
  it('dice qué es y cuánto margen queda', () => {
    render(<WageCapMeter bill={2000} cap={3500} />)
    expect(screen.getByText('Masa salarial')).toBeInTheDocument()
    expect(screen.getByText('$2.000 / $3.500')).toBeInTheDocument()
    expect(screen.getByText('Margen: $1.500')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /tope de la dirigencia/i })).toHaveAttribute('aria-valuenow', '57')
  })

  it('si se pasa del tope lo dice con el monto', () => {
    render(<WageCapMeter bill={4000} cap={3500} />)
    expect(screen.getByText('Te pasás $500')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('el explicador se abre y se cierra', async () => {
    render(<WageCapMeter bill={2000} cap={3500} />)
    const toggle = screen.getByRole('button', { name: /qué es esto/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/no te frena/i)).not.toBeInTheDocument()
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/no te frena/i)).toBeInTheDocument()
  })
})
