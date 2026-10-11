import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WeekProgress from '../../src/features/week/WeekProgress'
import { weekDays } from '../../src/domain/weekFlavor'

const days = weekDays('2026-10-07') // miércoles 7 → martes 13

describe('WeekProgress', () => {
  it('no muestra nada si no está visible', () => {
    render(<WeekProgress visible={false} tick={0} summary={null} days={days} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('muestra los 7 días reales con su número, y marca el actual', () => {
    render(<WeekProgress visible tick={3} summary={null} days={days} onClose={() => {}} />)
    const list = screen.getByRole('list', { name: 'Días de la semana' })
    const items = within(list).getAllByRole('listitem')
    expect(items.map(li => li.textContent)).toEqual(['Mié7', 'Jue8', 'Vie9', 'Sáb10', 'Dom11', 'Lun12', 'Mar13'])
    expect(items[3]).toHaveAttribute('aria-current', 'step')
  })

  it('la frase corresponde al día que se está viviendo (el sábado juegan los rivales)', () => {
    render(<WeekProgress visible tick={3} summary={null} days={days} onClose={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent(/sábado.*rivales/i)
  })

  it('al terminar muestra el resumen con la fecha y el próximo partido, y "Seguir" cierra', async () => {
    const onClose = vi.fn()
    const summary = [
      { id: 'week', text: 'Empezó la semana 5.', tone: 'neutral' },
      { id: 'today', text: 'Hoy es miércoles, 14 de octubre.', tone: 'neutral' },
      { id: 'match', text: 'Próximo partido: sábado, 17 de octubre (en 3 días).', tone: 'neutral' }
    ]
    render(<WeekProgress visible tick={0} summary={summary} days={days} onClose={onClose} />)
    expect(screen.getByText('Hoy es miércoles, 14 de octubre.')).toBeInTheDocument()
    expect(screen.getByText(/Próximo partido: sábado, 17 de octubre/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onClose).toHaveBeenCalled()
  })
})
