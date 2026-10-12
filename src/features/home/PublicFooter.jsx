import React from 'react'
import { Link } from 'react-router-dom'
import { FOOTER_GROUPS } from '../../data/publicPages'
import { SITE } from '../../data/site'
import { track } from '../../lib/analytics'

/**
 * Pie de diario: filete doble, la marca a un costado y los enlaces agrupados con título (Juego, Guías, Soporte, Legal).
 * En escritorio van en columnas (las guías en dos); en el celular, cada grupo en su fila con los enlaces corridos.
 */
export default function PublicFooter() {
  return (
    <footer className="relative z-10 mx-auto w-full max-w-[90rem] px-5 pb-4 pt-2 text-xs text-fg-muted sm:px-8 lg:px-12">
      <div className="border-t-[4px] border-t-fg pt-3 [border-top-style:double]">
        <div className="grid gap-x-10 gap-y-3 lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <p className="font-slab text-lg font-extrabold uppercase tracking-[0.14em] text-fg">{SITE.name}</p>
            <p className="mt-0.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.16em]">El diario del DT</p>
          </div>
          <nav aria-label="Secciones del sitio" className="grid gap-x-8 gap-y-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            {FOOTER_GROUPS.map(group => (
              <div key={group.key}>
                <p className="font-display text-[0.78rem] font-bold uppercase tracking-[0.16em] text-danger">{group.label}</p>
                <ul aria-label={group.label} className={group.key === 'guias' ? 'mt-0.5 flex flex-wrap lg:block lg:columns-2 lg:gap-x-6' : 'mt-0.5 flex flex-wrap lg:block'}>
                  {group.links.map(page => (
                    <li key={page.path} className="lg:break-inside-avoid">
                      <Link
                        to={page.path}
                        onClick={() => track(page.event || 'footer_click', { placement: 'footer', path: page.path })}
                        className="inline-flex min-h-8 items-center rounded-sm pr-3 transition-colors hover:text-fg hover:underline lg:min-h-7 lg:pr-0"
                      >
                        {page.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <p className="mt-2 border-t border-line-strong pt-2 text-[0.6875rem] uppercase tracking-[0.1em]">© 2026 {SITE.name}</p>
      </div>
    </footer>
  )
}
