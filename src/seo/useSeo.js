import { useEffect } from 'react'
import { absoluteUrl } from '../data/site'

// Crea o actualiza una etiqueta del <head>; con `content` vacío la quita.
function upsert(selector, tag, attrs, content) {
  let el = document.head.querySelector(selector)
  if (content == null) { el?.remove(); return }
  if (!el) {
    el = document.createElement(tag)
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value))
    document.head.appendChild(el)
  }
  if (tag === 'script') el.textContent = content
  else el.setAttribute(tag === 'link' ? 'href' : 'content', content)
}

/**
 * Metadatos de la página actual: título, descripción, canonical, robots, Open Graph y JSON-LD.
 * Las rutas privadas no pasan `path`: quedan sin canonical y con `noindex`.
 */
export function useSeo({ title, description, path, robots = 'index,follow', ogTitle, ogDescription, ogImage, jsonLd } = {}) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : null
  useEffect(() => {
    const url = path ? absoluteUrl(path) : null
    if (title) document.title = title
    upsert('meta[name="description"]', 'meta', { name: 'description' }, description ?? null)
    upsert('meta[name="robots"]', 'meta', { name: 'robots' }, robots)
    upsert('link[rel="canonical"]', 'link', { rel: 'canonical' }, url)
    upsert('meta[property="og:title"]', 'meta', { property: 'og:title' }, ogTitle || title || null)
    upsert('meta[property="og:description"]', 'meta', { property: 'og:description' }, ogDescription || description || null)
    upsert('meta[property="og:url"]', 'meta', { property: 'og:url' }, url)
    if (ogImage) upsert('meta[property="og:image"]', 'meta', { property: 'og:image' }, ogImage)
    upsert('script#ld-page', 'script', { type: 'application/ld+json', id: 'ld-page' }, ld)
  }, [title, description, path, robots, ogTitle, ogDescription, ogImage, ld])
}
