// Datos del sitio público: una sola fuente para la marca, el dominio y el contacto.
export const SITE = {
  name: 'Vestuario',
  url: 'https://www.vestuario.com.ar',
  // Canal de contacto público (si fuera null, las páginas de contacto y soporte avisarían que todavía no está publicado)
  // (no se inventa una casilla que nadie lee).
  contactEmail: 'contacto@vestuario.com.ar'
}

/** URL absoluta de una ruta pública (la Home lleva barra final, el resto no). */
export const absoluteUrl = (path = '/') => `${SITE.url}${path === '/' ? '/' : path}`
