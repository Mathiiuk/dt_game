import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

import Pitch from '../../src/features/tactics/Pitch'
import { FORMATIONS } from '../../src/api/tactics'

const squad = [
  { id: 'gk', first_name: 'Hugo', last_name: 'Lloris', position: 'PO', attr_overall: 62, shirt_number: 1 },
  { id: 'lb', first_name: 'Leo', last_name: 'Borda', position: 'LI', attr_overall: 60, shirt_number: 3 },
  { id: 'st', first_name: 'Pablo', last_name: 'Delantero', position: 'DC', attr_overall: 66, shirt_number: 9, is_injured: true }
]

describe('cancha de la pizarra', () => {
  it('muestra una ficha por puesto de la formación, con el puesto vacío marcado', () => {
    render(<Pitch formation="4-3-3" lineup={{ PO: 'gk', LI: 'lb' }} players={squad} selectedSlot={null} onSelectSlot={() => {}} />)
    expect(screen.getByRole('group', { name: /formación 4-3-3/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(FORMATIONS['4-3-3'].slots.length)
    expect(screen.getByRole('button', { name: /PO: Hugo Lloris, Natural/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /MCD: puesto vacío/ })).toBeInTheDocument()
  })

  it('anuncia lesionados y fuera de puesto en el nombre accesible, y el puesto seleccionado con aria-pressed', () => {
    render(<Pitch formation="4-4-2" lineup={{ DC1: 'st', PO: 'lb' }} players={squad} selectedSlot="PO" onSelectSlot={() => {}} />)
    expect(screen.getByRole('button', { name: /DC: Pablo Delantero.*lesionado/ })).toBeInTheDocument()
    const gk = screen.getByRole('button', { name: /PO: Leo Borda, Fuera de puesto.*seleccionado/ })
    expect(gk).toHaveAttribute('aria-pressed', 'true')
  })

  it('al tocar una ficha informa el puesto', async () => {
    const onSelect = vi.fn()
    render(<Pitch formation="4-4-2" lineup={{ PO: 'gk' }} players={squad} selectedSlot={null} onSelectSlot={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /PO: Hugo Lloris/ }))
    expect(onSelect).toHaveBeenCalledWith('PO')
  })

  it('al cambiar de formación conserva las fichas de los jugadores (se reubican, no se recrean)', () => {
    const { rerender } = render(<Pitch formation="4-4-2" lineup={{ PO: 'gk', LI: 'lb' }} players={squad} selectedSlot={null} onSelectSlot={() => {}} />)
    const before = screen.getByRole('button', { name: /PO: Hugo Lloris/ })
    rerender(<Pitch formation="3-5-2" lineup={{ PO: 'gk', LI: 'lb' }} players={squad} selectedSlot={null} onSelectSlot={() => {}} />)
    expect(screen.getByRole('button', { name: /LI: Leo Borda/ })).toBeInTheDocument()
    // el arquero es el mismo nodo del DOM: React lo reutilizó porque la clave es el jugador
    expect(screen.getByRole('button', { name: /PO: Hugo Lloris/ })).toBe(before)
  })
})
