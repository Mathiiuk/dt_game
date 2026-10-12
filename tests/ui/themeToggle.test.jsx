import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggle from '../../src/features/more/ThemeToggle'
import { THEME_KEY, DEFAULT_THEME } from '../../src/lib/theme'

describe('Apariencia (Más)', () => {
  beforeEach(() => { window.localStorage.clear(); document.documentElement.removeAttribute('data-theme') })

  it('ofrece Automático, Claro y Oscuro, con el tema por defecto elegido', () => {
    render(<ThemeToggle />)
    const group = screen.getByRole('radiogroup', { name: 'Apariencia' })
    expect(group).toBeInTheDocument()
    const checked = screen.getAllByRole('radio').filter(r => r.getAttribute('aria-checked') === 'true')
    expect(checked).toHaveLength(1)
    expect(checked[0]).toHaveAccessibleName(DEFAULT_THEME === 'auto' ? 'Automático' : DEFAULT_THEME === 'dark' ? 'Oscuro' : 'Claro')
    for (const name of ['Automático', 'Claro', 'Oscuro']) expect(screen.getByRole('radio', { name })).toBeInTheDocument()
  })

  it('elegir Oscuro lo aplica al instante y lo recuerda; Claro lo cambia de vuelta', async () => {
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark')
    expect(screen.getByRole('radio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('radio', { name: 'Claro' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(window.localStorage.getItem(THEME_KEY)).toBe('light')
  })

  it('empieza con lo que había guardado', () => {
    window.localStorage.setItem(THEME_KEY, 'dark')
    render(<ThemeToggle />)
    expect(screen.getByRole('radio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'true')
  })

  it('explica que Automático sigue al celular', () => {
    render(<ThemeToggle />)
    expect(screen.getByText(/automático sigue/i)).toBeInTheDocument()
  })
})
