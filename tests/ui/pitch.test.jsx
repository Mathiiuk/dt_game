import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('marca al capitán en su ficha y lo anuncia en el nombre accesible', () => {
    render(<Pitch formation="4-4-2" lineup={{ PO: 'gk', LI: 'lb' }} players={squad} selectedSlot={null} onSelectSlot={() => {}} captainId="lb" />)
    expect(screen.getByRole('button', { name: /LI: Leo Borda.*capitán/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /PO: Hugo Lloris/ }).getAttribute('aria-label')).not.toMatch(/capitán/)
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

  describe('alineación libre', () => {
    const rect = { left: 0, top: 0, width: 400, height: 600, right: 400, bottom: 600, x: 0, y: 0, toJSON() {} }
    let restore

    beforeEach(() => {
      const original = Element.prototype.getBoundingClientRect
      Element.prototype.getBoundingClientRect = function () { return this.getAttribute('role') === 'group' ? rect : original.call(this) }
      restore = () => { Element.prototype.getBoundingClientRect = original }
    })
    afterEach(() => restore())

    const lineup = { PO: 'gk', LI: 'lb' }

    it('arrastrar una ficha informa el punto de la cancha en porcentaje', () => {
      const onMove = vi.fn()
      render(<Pitch formation="4-4-2" lineup={lineup} players={squad} selectedSlot={null} onSelectSlot={() => {}} onMove={onMove} />)
      const token = screen.getByRole('button', { name: /LI: Leo Borda/ })
      fireEvent.pointerDown(token, { clientX: 56, clientY: 432, button: 0, pointerId: 1 })
      fireEvent.pointerMove(token, { clientX: 200, clientY: 300, pointerId: 1 })
      fireEvent.pointerUp(token, { clientX: 200, clientY: 300, pointerId: 1 })
      expect(onMove).toHaveBeenCalledTimes(1)
      const [slot, x, y, opts] = onMove.mock.calls[0]
      expect(slot).toBe('LI')
      expect(x).toBeCloseTo(50, 0)
      expect(y).toBeCloseTo(50, 0)
      expect(opts).toEqual({ keepSelection: false })
    })

    it('un toque corto no arrastra: solo selecciona', () => {
      const onMove = vi.fn()
      const onSelect = vi.fn()
      render(<Pitch formation="4-4-2" lineup={lineup} players={squad} selectedSlot={null} onSelectSlot={onSelect} onMove={onMove} />)
      const token = screen.getByRole('button', { name: /LI: Leo Borda/ })
      fireEvent.pointerDown(token, { clientX: 56, clientY: 432, button: 0, pointerId: 1 })
      fireEvent.pointerUp(token, { clientX: 57, clientY: 433, pointerId: 1 })
      fireEvent.click(token)
      expect(onMove).not.toHaveBeenCalled()
      expect(onSelect).toHaveBeenCalledWith('LI')
    })

    it('con una ficha seleccionada, tocar un lugar vacío de la cancha la mueve ahí', () => {
      const onMove = vi.fn()
      render(<Pitch formation="4-4-2" lineup={lineup} players={squad} selectedSlot="LI" onSelectSlot={() => {}} onMove={onMove} />)
      fireEvent.click(screen.getByRole('group'), { clientX: 100, clientY: 150 })
      expect(onMove).toHaveBeenCalledTimes(1)
      const [slot, x, y] = onMove.mock.calls[0]
      expect(slot).toBe('LI')
      expect(x).toBeCloseTo(25, 0)
      expect(y).toBeCloseTo(25, 0)
    })

    it('sin ficha seleccionada, tocar la cancha no hace nada', () => {
      const onMove = vi.fn()
      render(<Pitch formation="4-4-2" lineup={lineup} players={squad} selectedSlot={null} onSelectSlot={() => {}} onMove={onMove} />)
      fireEvent.click(screen.getByRole('group'), { clientX: 100, clientY: 150 })
      expect(onMove).not.toHaveBeenCalled()
    })

    it('la ficha seleccionada se mueve con las flechas del teclado', async () => {
      const onMove = vi.fn()
      render(<Pitch formation="4-4-2" lineup={lineup} players={squad} selectedSlot="LI" onSelectSlot={() => {}} onMove={onMove} />)
      const token = screen.getByRole('button', { name: /LI: Leo Borda/ })
      fireEvent.keyDown(token, { key: 'ArrowRight' })
      expect(onMove).toHaveBeenCalledWith('LI', 16, 72, { keepSelection: true })
      fireEvent.keyDown(token, { key: 'ArrowUp' })
      expect(onMove).toHaveBeenLastCalledWith('LI', 14, 70, { keepSelection: true })
    })

    it('las flechas no mueven una ficha que no está seleccionada, ni sin onMove', () => {
      const onMove = vi.fn()
      const { rerender } = render(<Pitch formation="4-4-2" lineup={lineup} players={squad} selectedSlot={null} onSelectSlot={() => {}} onMove={onMove} />)
      fireEvent.keyDown(screen.getByRole('button', { name: /LI: Leo Borda/ }), { key: 'ArrowRight' })
      expect(onMove).not.toHaveBeenCalled()
      rerender(<Pitch formation="4-4-2" lineup={lineup} players={squad} selectedSlot="LI" onSelectSlot={() => {}} />)
      fireEvent.keyDown(screen.getByRole('button', { name: /LI: Leo Borda/ }), { key: 'ArrowRight' })
      expect(onMove).not.toHaveBeenCalled()
    })

    it('dibuja las fichas en el layout recibido en vez del de la formación', () => {
      const layout = [{ slot: 'PO', x: 50, y: 91 }, { slot: 'DC', x: 50, y: 12 }]
      render(<Pitch formation="4-4-2" layout={layout} lineup={{ PO: 'gk' }} players={squad} selectedSlot={null} onSelectSlot={() => {}} />)
      expect(screen.getAllByRole('button')).toHaveLength(2)
      expect(screen.getByRole('button', { name: /DC: puesto vacío/ })).toBeInTheDocument()
    })
  })
})
