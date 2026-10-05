import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PublicHeader, { careerTarget } from './PublicHeader'
import PublicFooter from './PublicFooter'
import { FULL_SCREEN } from './HomeLanding'
import { useVisitorState } from './useVisitorState'
import { getPublicPage } from '../../data/publicPages'
import { useSeo } from '../../seo/useSeo'
import { faqStructuredData } from '../../seo/structuredData'
import { HOME_COPY } from '../../seo/homeSeo'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { track } from '../../lib/analytics'

/**
 * Plantilla de las páginas públicas secundarias (el juego, cómo jugar, tácticas, preguntas frecuentes, legales…).
 * El contenido sale de src/data/publicPages.js; acá sólo se define cómo se ve.
 */
export default function InfoPage({ path }) {
  const page = getPublicPage(path)
  const visitor = useVisitorState()
  useSeo({
    title: page.title,
    description: page.description,
    path: page.path,
    jsonLd: page.faq ? faqStructuredData(page.sections) : undefined
  })
  // Cada página empieza arriba aunque se llegue desde el pie de otra
  useEffect(() => { window.scrollTo?.(0, 0) }, [path])

  return (
    <div className={`grid ${FULL_SCREEN} grid-rows-[auto_1fr_auto] bg-bg`}>
      <PublicHeader visitor={visitor} />
      <main className="mx-auto w-full max-w-2xl px-5 pb-12 pt-6 sm:pt-10">
        <article>
          <h1 className="text-balance font-display text-4xl font-bold leading-none text-fg sm:text-5xl">{page.h1}</h1>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">{page.intro}</p>
          {page.sections.map(section => (
            <section key={section.heading} className="mt-8">
              <h2 className="font-display text-2xl font-semibold text-fg">{section.heading}</h2>
              {section.body.map(paragraph => (
                <p key={paragraph} className="mt-2 leading-relaxed text-fg-muted">{paragraph}</p>
              ))}
            </section>
          ))}
        </article>

        <aside className="mt-10 rounded-lg border border-line bg-surface p-5">
          <p className="font-display text-2xl font-semibold text-fg">{HOME_COPY.h1}</p>
          <p className="mt-1 text-sm text-fg-muted">{HOME_COPY.subheadline}</p>
          <Link
            to={careerTarget(visitor)}
            onClick={() => track(visitor === 'career' ? 'continue_click' : 'register_click', { placement: 'page', path: page.path })}
            className={cn(buttonVariants({ size: 'lg' }), 'mt-4 w-full sm:w-auto')}
          >
            {visitor === 'career' ? HOME_COPY.continueCta : HOME_COPY.primaryCta}
          </Link>
        </aside>

        {page.related?.length > 0 && (
          <nav aria-label="Páginas relacionadas" className="mt-8">
            <h2 className="eyebrow">Seguí leyendo</h2>
            <ul className="mt-2 flex flex-wrap gap-x-5">
              {page.related.map(relatedPath => {
                const related = getPublicPage(relatedPath)
                return (
                  <li key={relatedPath}>
                    <Link to={relatedPath} className="inline-flex min-h-11 items-center font-medium text-accent underline-offset-4 hover:underline">
                      {related.label === 'FAQ' ? 'Preguntas frecuentes' : related.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
