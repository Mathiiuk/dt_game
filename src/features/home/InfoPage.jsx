import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PublicHeader, { careerTarget } from './PublicHeader'
import PublicFooter from './PublicFooter'
import { FULL_SCREEN } from './HomeLanding'
import { useVisitorState } from './useVisitorState'
import { getPublicPage } from '../../data/publicPages'
import { useSeo } from '../../seo/useSeo'
import { pageStructuredData } from '../../seo/structuredData'
import { HOME_COPY } from '../../seo/homeSeo'
import { buttonVariants } from '../../components/ui/button'
import { Card, CardBody, Kicker } from '../../components/ui'

const SECTION_LABEL = { juego: 'El juego', guias: 'Guía', soporte: 'Soporte', legal: 'Legal' }
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
    jsonLd: pageStructuredData(page)
  })
  // Cada página empieza arriba aunque se llegue desde el pie de otra
  useEffect(() => { window.scrollTo?.(0, 0) }, [path])

  return (
    <div className={`grid ${FULL_SCREEN} grid-rows-[auto_1fr_auto] bg-bg`}>
      <PublicHeader visitor={visitor} />
      <main className="mx-auto w-full max-w-3xl px-5 pb-12 pt-6 sm:pt-9">
        <article>
          <Kicker>{SECTION_LABEL[page.group] || 'Vestuario'}</Kicker>
          <h1 className="mt-1 text-balance font-slab text-[2.25rem] font-extrabold leading-[1.05] tracking-tight text-fg sm:text-5xl">{page.h1}</h1>
          <p className="mt-4 border-b border-line-strong pb-5 text-lg leading-relaxed text-fg-muted">{page.intro}</p>
          {page.sections.map(section => (
            <section key={section.heading} className="mt-7">
              <h2 className="flex items-baseline gap-3 font-slab text-2xl font-bold text-fg">
                <span>{section.heading}</span>
                <span className="h-0 grow border-b border-line-strong" aria-hidden="true" />
              </h2>
              {section.body.map(paragraph => (
                <p key={paragraph} className="mt-2.5 leading-relaxed text-fg-muted">{paragraph}</p>
              ))}
            </section>
          ))}
        </article>

        <Card masthead as="aside" className="mt-10">
          <CardBody className="p-5">
            <Kicker>Vestuario</Kicker>
            <p className="mt-1 font-slab text-2xl font-extrabold text-fg">{HOME_COPY.h1}</p>
            <p className="mt-1 text-sm text-fg-muted">{HOME_COPY.subheadline}</p>
            <Link
              to={careerTarget(visitor)}
              onClick={() => track(visitor === 'career' ? 'continue_click' : 'register_click', { placement: 'page', path: page.path })}
              className={cn(buttonVariants({ size: 'lg' }), 'mt-4 w-full sm:w-auto')}
            >
              {visitor === 'career' ? HOME_COPY.continueCta : HOME_COPY.primaryCta}
            </Link>
          </CardBody>
        </Card>

        {page.related?.length > 0 && (
          <nav aria-label="Páginas relacionadas" className="mt-8">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-danger">Seguí leyendo</h2>
            <ul className="mt-1 border-t border-line-strong">
              {page.related.map(relatedPath => {
                const related = getPublicPage(relatedPath)
                return (
                  <li key={relatedPath} className="border-b border-line">
                    <Link to={relatedPath} className="flex min-h-11 items-center justify-between gap-3 py-2 font-semibold text-fg transition-colors hover:text-primary">
                      <span>{related.label === 'FAQ' ? 'Preguntas frecuentes' : related.label}</span>
                      <span aria-hidden="true" className="text-primary">→</span>
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
