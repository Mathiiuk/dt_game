import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

import Pitch from '../../src/features/tactics/Pitch'
import { FORMATIONS } from '../../src/api/tactics'

const squad = [
  { id: 'gk', first_name: 'Hugo', last_name: 'Lloris', position: 'GK', shirt_number: 1 },
  { id: 'lb', first_name: 'Leo', last_name: 'Borda', position: 'LB', shirt_number: 3 },
  { id: 'st', first_name: 'Pablo', last_name: 'Delantero', position: 'ST', shirt_number: 9, is_injured: true }
]

describe('cancha de la pizarra', () => {
  it('muestra una ficha por puesto de la formación, con el puesto vacío marcado', () => {
    render(<Pitch formation="4-3-3" lineup={{ GK: 'gk', LB: 'lb' }} players={squad} selectedSlot={null} onSelectSlot={() => {}} />)
    expect(screen.getByRole('group', { name: /formación 4-3-3/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(FORMATIONS['4-3-3'].slots.length)
    expect(screen.getByRole('button', { name: /GK: Hugo Lloris, Natural/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /CDM: puesto vacío/ })).toBeInTheDocument()
  })

  it('anuncia lesionados y fuera de puesto en el nombre accesible, y el puesto seleccionado con aria-pressed', () => {
    render(<Pitch formation="4-4-2" lineup={{ LST: 'st', GK: 'lb' }} players={squad} selectedSlot="GK" onSelectSlot={() => {}} />)
    expect(screen.getByRole('button', { name: /LST: Pablo Delantero.*lesionado/ })).toBeInTheDocument()
    const gk = screen.getByRole('button', { name: /GK: Leo Borda, Fuera de Puesto.*seleccionado/ })
    expect(gk).toHaveAttribute('aria-pressed', 'true')
  })

  it('al tocar una ficha informa el puesto', async () => {
    const onSelect = vi.fn()
    render(<Pitch formation="4-4-2" lineup={{ GK: 'gk' }} players={squad} selectedSlot={null} onSelectSlot={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /GK: Hugo Lloris/ }))
    expect(onSelect).toHaveBeenCalledWith('GK')
  })

  it('al cambiar de formación conserva las fichas de los jugadores (se reubican, no se recrean)', () => {
    const { rerender } = render(<Pitch formation="4-4-2" lineup={{ GK: 'gk', LB: 'lb' }} players={squad} selectedSlot={null} onSelectSlot={() => {}} />)
    const before = screen.getByRole('button', { name: /GK: Hugo Lloris/ })
    rerender(<Pitch formation="3-5-2" lineup={{ GK: 'gk', LWB: 'lb' }} players={squad} selectedSlot={null} onSelectSlot={() => {}} />)
    expect(screen.getByRole('button', { name: /LWB: Leo Borda/ })).toBeInTheDocument()
    // el arquero es el mismo nodo del DOM: React lo reutilizó porque la clave es el jugador
    expect(screen.getByRole('button', { name: /GK: Hugo Lloris/ })).toBe(before)
  })
})
