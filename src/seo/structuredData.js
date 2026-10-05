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
