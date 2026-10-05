import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({
    club: { name: 'Club Atlético Potrero', game_date: '2026-08-12' },
    manager: { first_name: 'Matías', last_name: 'Gallardo', level: 3 }
  })
}))

import AppShell from '../../src/components/layout/AppShell'
import MoreScreen from '../../src/features/more/MoreScreen'
import { NAV_GROUPS, MOBILE_TABS, isActivePath, titleForPath } from '../../src/components/layout/navigation'

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<p>Pantalla inicio</p>} />
        <Route path="/squad" element={<p>Pantalla plantel</p>} />
        <Route path="/more" element={<MoreScreen />} />
      </Route>
    </Routes>
  </MemoryRouter>
)

describe('mapa de navegación', () => {
  it('no repite rutas y la barra inferior apunta a rutas existentes', () => {
    const all = NAV_GROUPS.flatMap(g => g.items.map(i => i.to))
    expect(new Set(all).size).toBe(all.length)
    for (const tab of MOBILE_TABS.filter(t => t.to !== '/more')) expect(all).toContain(tab.to)
  })

  it('resuelve ítem activo y título de sección', () => {
    expect(isActivePath('/club/staff', '/club')).toBe(true)
    expect(isActivePath('/clubhouse', '/club')).toBe(false)
    expect(titleForPath('/finances')).toBe('Finanzas')
    expect(titleForPath('/more')).toBe('Más')
  })
})

describe('AppShell', () => {
  it('muestra contenido, menú lateral con todos los destinos y la fecha del juego', () => {
    renderAt('/dashboard')
    expect(screen.getByText('Pantalla inicio')).toBeInTheDocument()
    const sidebars = screen.getAllByRole('navigation', { name: 'Navegación principal' })
    expect(sidebars.length).toBe(2) // lateral (escritorio) + inferior (móvil); CSS decide cuál se ve
    const lateral = sidebars[0]
    for (const group of NAV_GROUPS) for (const item of group.items) {
      expect(within(lateral).getByRole('link', { name: item.label })).toHaveAttribute('href', item.to)
    }
    expect(screen.getAllByText(/12 ago 2026/i).length).toBeGreaterThan(0)
  })

  it('marca la pestaña activa de la barra inferior con aria-current', () => {
    renderAt('/squad')
    const bottom = screen.getAllByRole('navigation', { name: 'Navegación principal' })[1]
    expect(within(bottom).getByRole('link', { name: 'Plantel' })).toHaveAttribute('aria-current', 'page')
    expect(within(bottom).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current')
  })

  it('incluye un enlace para saltar al contenido principal', () => {
    renderAt('/dashboard')
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#contenido')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenido')
  })
})

describe('página Más', () => {
  it('lista las secciones que no están en la barra inferior, con descripción', () => {
    renderAt('/more')
    const main = screen.getByRole('main')
    expect(within(main).getByRole('link', { name: /Finanzas/ })).toHaveAttribute('href', '/finances')
    expect(within(main).getByRole('link', { name: /Salón de la Fama/ })).toHaveAttribute('href', '/hall-of-fame')
    // 'Plantel' está en la barra inferior: no se duplica en la lista de Más
    expect(within(main).queryByRole('link', { name: /Plantel/ })).not.toBeInTheDocument()
  })
})
