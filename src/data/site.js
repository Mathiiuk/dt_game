// Datos del sitio público: una sola fuente para la marca, el dominio y el contacto.
export const SITE = {
  name: 'Vestuario',
  url: 'https://vestuario.com.ar',
  // Canal de contacto público. Mientras sea null, las páginas de contacto y soporte avisan que todavía no está publicado
  // (no se inventa una casilla que nadie lee).
  contactEmail: null
}

/** URL absoluta de una ruta pública (la Home lleva barra final, el resto no). */
export const absoluteUrl = (path = '/') => `${SITE.url}${path === '/' ? '/' : path}`
