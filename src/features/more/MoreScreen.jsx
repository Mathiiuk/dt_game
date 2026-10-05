import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Card } from '../../components/ui'
import { NAV_GROUPS, MOBILE_TABS } from '../../components/layout/navigation'

// Los destinos que ya están en la barra inferior no se repiten aquí
const IN_TAB_BAR = new Set(MOBILE_TABS.map(t => t.to))

/** Página "Más" (móvil): el resto de las secciones del juego, agrupadas, con descripción */
export default function MoreScreen() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-5">
      {NAV_GROUPS.map(group => {
        const items = group.items.filter(i => !IN_TAB_BAR.has(i.to))
        if (items.length === 0) return null
        return (
          <section key={group.id} aria-labelledby={`more-${group.id}`}>
            <h2 id={`more-${group.id}`} className="eyebrow mb-2 px-1">{group.label}</h2>
            <Card as="div" className="divide-y divide-line overflow-hidden">
              {items.map(({ to, label, icon: Icon, description }) => (
                <Link key={to} to={to} className="flex min-h-16 items-center gap-3.5 px-4 py-3 transition-colors hover:bg-surface-2 active:bg-surface-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-surface-3 text-accent" aria-hidden="true">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-fg">{label}</span>
                    <span className="block truncate text-xs text-fg-subtle">{description}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                </Link>
              ))}
            </Card>
          </section>
        )
      })}
    </div>
  )
}
