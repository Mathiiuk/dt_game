import { SITE, absoluteUrl } from '../data/site'
import { HOME_SEO } from './homeSeo'

// Datos estructurados (Schema.org). Sólo información real: sin puntajes, reseñas, precios ni premios inventados.

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${absoluteUrl('/')}#organizacion`,
    name: SITE.name,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/pwa-icon.svg')
  }
}

export function videoGameSchema() {
  return {
    '@type': ['VideoGame', 'WebApplication'],
    '@id': `${absoluteUrl('/')}#juego`,
    name: SITE.name,
    url: absoluteUrl('/'),
    description: HOME_SEO.description,
    inLanguage: 'es-AR',
    genre: ['Gestión deportiva', 'Fútbol'],
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    gamePlatform: 'Navegador web',
    publisher: { '@id': `${absoluteUrl('/')}#organizacion` }
  }
}

/** JSON-LD de la Home: la organización y el juego en un mismo grafo. */
export function homeStructuredData() {
  return { '@context': 'https://schema.org', '@graph': [organizationSchema(), videoGameSchema()] }
}

/** JSON-LD de una página de preguntas frecuentes, a partir de sus secciones (pregunta → respuesta). */
export function faqStructuredData(sections) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sections.map(s => ({
      '@type': 'Question',
      name: s.heading,
      acceptedAnswer: { '@type': 'Answer', text: s.body.join(' ') }
    }))
  }
}

/** Migas de pan de una página interna: Inicio > (Guías >) Página */
export function breadcrumbStructuredData(page) {
  const trail = [{ name: 'Inicio', path: '/' }]
  if (page.path.startsWith('/guias/')) trail.push({ name: 'Guías', path: '/guias' })
  trail.push({ name: page.label || page.h1, path: page.path })
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: absoluteUrl(t.path) }))
  }
}

/** Todos los datos estructurados de una página interna: migas de pan y, en las preguntas frecuentes, el FAQPage */
export function pageStructuredData(page) {
  const graph = [breadcrumbStructuredData(page)]
  if (page.faq) {
    const { '@context': _ctx, ...faq } = faqStructuredData(page.sections)
    graph.push(faq)
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}
