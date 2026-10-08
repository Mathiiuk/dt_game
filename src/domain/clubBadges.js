/**
 * Patrones heráldicos clásicos del fútbol argentino
 */
export const CREST_PATTERNS = {
  SASH_DIAGONAL: 'SASH_DIAGONAL', // Banda diagonal (River, Morón)
  STRIPE_HORIZONTAL: 'STRIPE_HORIZONTAL', // Franja horizontal central (Boca, Gimnasia LP, Atlanta)
  STRIPES_VERTICAL: 'STRIPES_VERTICAL', // Bastones verticales (Racing, San Lorenzo, Chacarita, Unión, Estudiantes, etc.)
  CHEVRON_V: 'CHEVRON_V', // V azulada en el pecho (Vélez Sarsfield)
  HALVES: 'HALVES', // Mitad y mitad (Newell's, Colón)
  SOLID: 'SOLID' // Pleno tradicional con iniciales (Independiente, Huracán, Lanús, Ferro, etc.)
}

/**
 * Resuelve el patrón visual más representativo a partir de los datos del club
 */
export function resolveClubPattern(club) {
  if (club?.pattern) return club.pattern
  const name = String(club?.name || '').toLowerCase()
  const short = String(club?.short_name || '').toUpperCase()

  if (name.includes('river') || short === 'RIV' || name.includes('morón') || short === 'MOR') {
    return CREST_PATTERNS.SASH_DIAGONAL
  }
  if (name.includes('boca') || short === 'BOC' || name.includes('gimnasia y esgrima la plata') || short === 'GEL' || name.includes('atlanta') || short === 'ATL') {
    return CREST_PATTERNS.STRIPE_HORIZONTAL
  }
  if (
    name.includes('racing') || short === 'RAC' ||
    name.includes('san lorenzo') || short === 'SLO' ||
    name.includes('chacarita') || short === 'CHJ' ||
    name.includes('estudiantes de la plata') || short === 'EDL' ||
    name.includes('rosario central') || short === 'CEN' ||
    name.includes('talleres de córdoba') || short === 'TAL' ||
    name.includes('unión de santa fe') || short === 'UNI' ||
    name.includes('atlético tucumán') || short === 'ATU' ||
    name.includes('san martín de tucumán') || short === 'SMT' ||
    name.includes('almirante brown') || short === 'ALM' ||
    name.includes('instituto') || short === 'INS' ||
    name.includes('almagro') || short === 'AMG' ||
    name.includes('kimberley') || short === 'KIM' ||
    name.includes('quilmes') || short === 'QUI'
  ) {
    return CREST_PATTERNS.STRIPES_VERTICAL
  }
  if (name.includes('vélez') || short === 'VEL') {
    return CREST_PATTERNS.CHEVRON_V
  }
  if (name.includes("newell") || short === 'NOB' || name.includes('colón') || short === 'COL') {
    return CREST_PATTERNS.HALVES
  }

  return CREST_PATTERNS.SOLID
}

/**
 * Colores por defecto para clubes que no tengan paleta cargada
 */
export const DEFAULT_COLORS = {
  primary: '#15803d',
  secondary: '#facc15'
}
