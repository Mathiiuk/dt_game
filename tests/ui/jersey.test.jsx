import React from 'react'
import { render, screen } from '@testing-library/react'
import { Jersey } from '../../src/components/ui/Jersey'
import { JERSEY_PATTERNS } from '../../src/domain/jerseyKits'

describe('camiseta', () => {
  it('se dibuja con un nombre accesible y con los colores del club', () => {
    const { container } = render(<Jersey primary="#112233" secondary="#ffeedd" pattern="STRIPES_VERTICAL" />)
    expect(screen.getByRole('img', { name: /camiseta/i })).toBeInTheDocument()
    expect(container.innerHTML).toContain('#112233')
    expect(container.innerHTML).toContain('#ffeedd')
  })

  it.each(JERSEY_PATTERNS.map(p => p.id))('el diseño %s se dibuja sin romperse', (id) => {
    const { container } = render(<Jersey primary="#047857" secondary="#ffffff" pattern={id} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('sin diseño usa la franja central y no se rompe', () => {
    const { container } = render(<Jersey primary="#047857" secondary="#ffffff" />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('el estampado queda recortado a la camiseta (clipPath) y los ids son únicos entre camisetas', () => {
    const { container } = render(<><Jersey primary="#1" secondary="#2" pattern="HALVES" /><Jersey primary="#1" secondary="#2" pattern="HALVES" /></>)
    const ids = [...container.querySelectorAll('clipPath')].map(n => n.id)
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })
})
