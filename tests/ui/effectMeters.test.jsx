import React from 'react'
import { render, screen, within } from '@testing-library/react'
import EffectMeters from '../../src/components/EffectMeters'
import { effectChips } from '../../src/domain/storyFlavor'

describe('qué cambió tras decidir', () => {
  it('una fila por efecto, con su descripción para lectores de pantalla y la barra llena según la fuerza', () => {
    const { container } = render(<EffectMeters chips={effectChips({ fans: 8, board: -1, locker: 0 })} />)
    const list = screen.getByRole('list', { name: 'Lo que cambió' })
    const items = within(list).getAllByRole('listitem')
    expect(items.map(i => i.getAttribute('aria-label'))).toEqual(['Hinchada, sube mucho, más 8', 'Dirigencia, baja un poco, menos 1'])
    const bars = container.querySelectorAll('li [style*="width"]')
    expect(parseInt(bars[0].style.width, 10)).toBeGreaterThan(parseInt(bars[1].style.width, 10))
    expect(bars[1].className).toMatch(/bg-danger/)
    expect(bars[0].className).toMatch(/bg-accent/)
  })

  it('sin cambios no dibuja nada', () => {
    const { container } = render(<EffectMeters chips={effectChips({})} />)
    expect(container).toBeEmptyDOMElement()
  })
})
