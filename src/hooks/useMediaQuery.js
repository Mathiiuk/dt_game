import { useEffect, useState } from 'react'

/** Suscripción reactiva a una media query (true/false). Seguro en entornos sin matchMedia. */
export function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false)
  const [matches, setMatches] = useState(get)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** Escritorio/tablet: a partir de 768 px las superposiciones son diálogos; por debajo, páginas completas */
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)')
