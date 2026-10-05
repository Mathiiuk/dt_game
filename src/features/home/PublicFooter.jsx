import React from 'react'
import { Link } from 'react-router-dom'
import { FOOTER_GROUPS } from '../../data/publicPages'
import { SITE } from '../../data/site'
import { track } from '../../lib/analytics'

/**
 * Pie compacto: navegación interna con anclas descriptivas, agrupada en Juego, Soporte y Legal.
 * Ocupa pocas líneas para que la portada entre en una sola pantalla.
 */
export default function PublicFooter() {
  return (
    <footer className="relative z-10 border-t border-line/60 px-4 py-2.5 text-xs text-fg-subtle sm:px-8 lg:py-3">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-x-6 gap-y-1 lg:flex-row lg:justify-between">
        <p className="hidden font-display text-sm font-semibold uppercase tracking-[0.16em] text-fg-muted lg:block">{SITE.name}</p>
        <nav aria-label="Secciones del sitio" className="flex flex-wrap items-center justify-center gap-x-1 lg:gap-x-3">
          {FOOTER_GROUPS.map((group, i) => (
            <React.Fragment key={group.key}>
              {i > 0 && <span aria-hidden="true" className="hidden h-3 w-px bg-line-strong lg:block" />}
              <ul aria-label={group.label} className="flex flex-wrap items-center justify-center">
                {group.links.map(page => (
                  <li key={page.path}>
                    <Link
                      to={page.path}
                      onClick={() => track(page.event || 'footer_click', { placement: 'footer', path: page.path })}
                      className="inline-flex min-h-8 items-center rounded-sm px-2 transition-colors hover:text-fg"
                    >
                      {page.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </React.Fragment>
          ))}
        </nav>
        <p className="whitespace-nowrap">© 2026 {SITE.name}</p>
      </div>
    </footer>
  )
}
