// Atajos de cabecera: varios botones parecidos siempre en una sola fila
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Button, PageHeader, QuickActions, QUICK_ACTION } from '../../src/components/ui'

describe('atajos de la cabecera', () => {
  it('ponen todos los botones en una sola fila de ancho completo en el celular', () => {
    render(
      <MemoryRouter>
        <PageHeader title="Plantel" actions={
          <QuickActions>
            <Button variant="outline" size="sm" className={QUICK_ACTION}>Desarrollo</Button>
            <Button variant="outline" size="sm" className={QUICK_ACTION}>Mentorías</Button>
            <Button variant="outline" size="sm" className={QUICK_ACTION}>Entrenamiento</Button>
          </QuickActions>
        } />
      </MemoryRouter>
    )
    const buttons = ['Desarrollo', 'Mentorías', 'Entrenamiento'].map(name => screen.getByRole('button', { name }))
    const row = buttons[0].parentElement
    // Los tres son hermanos en un mismo contenedor de fila (no se apilan) que ocupa todo el ancho
    expect(buttons.every(b => b.parentElement === row)).toBe(true)
    expect(row.className).toMatch(/\bflex\b/)
    expect(row.className).toMatch(/\bw-full\b/)
    expect(row.className).not.toMatch(/flex-col|flex-wrap/)
    // Cada uno reparte el ancho por igual y apila icono y texto
    for (const b of buttons) {
      expect(b.className).toMatch(/\bflex-1\b/)
      expect(b.className).toMatch(/\bflex-col\b/)
    }
  })
})
