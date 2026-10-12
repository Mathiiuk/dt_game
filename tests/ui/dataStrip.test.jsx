import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { DataStrip } from '../../src/components/ui/data-strip'

const items = [
  { label: 'Caja', value: '$25.000', hint: 'hoy' },
  { label: 'Por semana', value: '+$1.800', tone: 'good' },
  { label: 'Puesto', value: '3º', to: '/standings' }
]

describe('DataStrip', () => {
  it('muestra cada dato con su etiqueta dentro de una lista con nombre', () => {
    render(<MemoryRouter><DataStrip label="Resumen" items={items} /></MemoryRouter>)
    const list = screen.getByRole('list', { name: 'Resumen' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(within(list).getByText('$25.000')).toBeInTheDocument()
    expect(within(list).getByText('hoy')).toBeInTheDocument()
  })

  it('las celdas con destino son enlaces', () => {
    render(<MemoryRouter><DataStrip label="Resumen" items={items} /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /Puesto/ })).toHaveAttribute('href', '/standings')
    expect(screen.queryAllByRole('link')).toHaveLength(1)
  })

  it('colorea según el tono', () => {
    render(<MemoryRouter><DataStrip label="Resumen" items={items} /></MemoryRouter>)
    expect(screen.getByText('+$1.800').className).toContain('text-accent')
  })
})
