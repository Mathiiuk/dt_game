import React from 'react'
import { render } from '@testing-library/react'
import { PlayerPortrait } from '../../src/components/ui/PlayerPortrait'

describe('retrato en pantalla', () => {
  it('es decorativo: oculto a lectores de pantalla, para no repetir el nombre', () => {
    const { container } = render(<PlayerPortrait player={{ id: 'p1', first_name: 'Tomás', last_name: 'Luna' }} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg.getAttribute('aria-hidden')).toBe('true')
  })

  it('usa los colores de la camiseta del club', () => {
    const { container } = render(<PlayerPortrait player={{ id: 'p1' }} primary="#112233" secondary="#aabbcc" />)
    expect(container.innerHTML).toContain('#112233')
  })

  it('un jugador sin datos no rompe', () => {
    const { container } = render(<PlayerPortrait />)
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
