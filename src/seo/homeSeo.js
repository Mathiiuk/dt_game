import { absoluteUrl } from '../data/site'

// Textos y metadatos de la Home. `index.html` los repite en estático (para buscadores y redes que no ejecutan
// JavaScript) y tests/static/homeSeo.test.jsx obliga a que ambos coincidan.
export const HOME_COPY = {
  h1: 'Vos sos el DT.',
  subheadline: 'Construí tu carrera, dirigí tu equipo y llevá un club desde el barrio hasta la gloria.',
  context: 'Vestuario es un juego de Director Técnico de fútbol donde vos armás el plantel, elegís la táctica, negociás jugadores y construís tu carrera desde abajo.',
  primaryCta: 'Crear mi carrera',
  continueCta: 'Continuar carrera',
  secondaryCta: 'Conocer el juego'
}

export const HOME_SEO = {
  path: '/',
  title: 'Vestuario | Juego de Director Técnico de Fútbol',
  description: HOME_COPY.context,
  robots: 'index,follow',
  ogTitle: 'Vestuario | Juego de Director Técnico de Fútbol',
  ogDescription: 'Vos sos el DT. Armá tu plantel, elegí tu táctica y construí tu carrera.',
  ogImage: absoluteUrl('/vestuario-og-home.webp'),
  ogType: 'website'
}

// Rutas del juego: nunca se indexan
export const PRIVATE_SEO = { title: 'Vestuario', robots: 'noindex,nofollow' }
