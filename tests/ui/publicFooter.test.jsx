import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PublicFooter from '../../src/features/home/PublicFooter'

const renderIt = () => render(<MemoryRouter><PublicFooter /></MemoryRouter>)

describe('pie público: insignia "Hecho en Argentina"', () => {
  it('lleva la insignia de argentino.dev con el enlace y las medidas indicadas', () => {
    renderIt()
    const link = screen.getByRole('link', { name: 'Hecho en Argentina' })
    expect(link).toHaveAttribute('href', 'https://argentino.dev/proyecto/vestuario?utm_source=argentino.dev&utm_medium=badge&utm_campaign=insignia')
    const img = screen.getByRole('img', { name: 'Hecho en Argentina' })
    expect(img).toHaveAttribute('src', 'https://argentino.dev/badge-light.png')
    expect(img).toHaveAttribute('width', '170')
    expect(img).toHaveAttribute('height', '32')
  })

  it('el enlace externo no pasa datos de la página de origen (noopener) y la imagen carga sin bloquear', () => {
    renderIt()
    const link = screen.getByRole('link', { name: 'Hecho en Argentina' })
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(screen.getByRole('img', { name: 'Hecho en Argentina' })).toHaveAttribute('loading', 'lazy')
  })

  it('sigue estando el © y los enlaces del sitio', () => {
    renderIt()
    expect(screen.getByText(/© 2026/)).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Secciones del sitio' })).toBeInTheDocument()
  })
})
