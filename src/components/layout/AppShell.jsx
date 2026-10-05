import React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useGameContext } from '../../context/GameContext'
import { cn } from '../../lib/utils'
import { formatGameDate } from '../../lib/format'
import { NAV_GROUPS, MOBILE_TABS, isActivePath, titleForPath } from './navigation'

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-md bg-accent text-accent-fg" aria-hidden="true">
        <Shield className="size-4.5" />
      </span>
      <span className="font-display text-xl font-semibold leading-none tracking-wide text-fg">EL PIZARRÓN</span>
    </div>
  )
}

/** Menú lateral de escritorio: grupos con rótulo, ítem activo con barra de acento */
function Sidebar({ club, manager }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="px-5 pb-4 pt-6"><Brand /></div>

      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Navegación principal">
        {NAV_GROUPS.map(group => (
          <div key={group.id}>
            <p className="eyebrow mb-1.5 px-2">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) => cn(
                      'group relative flex min-h-10 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" aria-hidden="true" />}
                        <Icon className={cn('size-4.5 shrink-0', isActive ? 'text-accent' : 'text-fg-subtle group-hover:text-fg-muted')} aria-hidden="true" />
                        {label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-5 py-4">
        <p className="truncate text-sm font-semibold text-fg">{club?.name || 'Sin club'}</p>
        <p className="mt-0.5 truncate text-xs text-fg-subtle">
          {manager ? `${manager.first_name} ${manager.last_name} · Nv. ${manager.level ?? 1}` : ''}
        </p>
        {club?.game_date && <p className="num mt-2 text-xs capitalize text-fg-muted">{formatGameDate(club.game_date)}</p>}
      </div>
    </aside>
  )
}

/** Barra superior móvil: sección actual y fecha del juego */
function MobileTopBar({ club, title }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-bg/92 px-4 py-3 backdrop-blur lg:hidden pt-safe">
      <div className="min-w-0">
        <p className="eyebrow truncate">{club?.name || 'El Pizarrón'}</p>
        <h1 className="truncate font-display text-2xl font-semibold leading-none text-fg">{title}</h1>
      </div>
      {club?.game_date && <p className="num shrink-0 text-xs capitalize text-fg-muted">{formatGameDate(club.game_date)}</p>}
    </header>
  )
}

/** Barra inferior móvil con 5 destinos y áreas táctiles de 56 px */
function MobileTabBar({ pathname }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden pb-safe" aria-label="Navegación principal">
      <ul className="mx-auto grid h-14 max-w-xl grid-cols-5">
        {MOBILE_TABS.map(({ to, label, icon: Icon }) => {
          const active = isActivePath(pathname, to)
          return (
            <li key={to}>
              <NavLink
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold transition-colors',
                  active ? 'text-accent' : 'text-fg-subtle hover:text-fg'
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * Estructura común de las pantallas de juego.
 * - Escritorio (lg+): menú lateral fijo y contenido a la derecha.
 * - Móvil: barra superior + barra inferior; el contenido deja espacio para no quedar tapado.
 */
export default function AppShell() {
  const { club, manager } = useGameContext()
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-dvh">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">
        Saltar al contenido
      </a>
      <Sidebar club={club} manager={manager} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar club={club} title={titleForPath(pathname)} />
        <main id="contenido" className="min-w-0 flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileTabBar pathname={pathname} />
    </div>
  )
}
