/**
 * Identidad del club al fundarlo: paletas, escudos y validación del nombre.
 */

export const COLOR_PRESETS = [
  { name: 'Verde y blanco', primary: '#047857', secondary: '#FFFFFF', desc: 'Esperanza y pureza barrial' },
  { name: 'Azul y oro', primary: '#1E3A8A', secondary: '#F59E0B', desc: 'Fuerza popular y gloria' },
  { name: 'Rojo y blanco', primary: '#DC2626', secondary: '#FFFFFF', desc: 'Pasión y tradición' },
  { name: 'Negro y blanco', primary: '#18181B', secondary: '#FFFFFF', desc: 'Elegancia y combate' },
  { name: 'Celeste y blanco', primary: '#0284C7', secondary: '#FFFFFF', desc: 'Identidad nacional' },
  { name: 'Granate y blanco', primary: '#831843', secondary: '#F4F4F5', desc: 'Orgullo obrero del sur' }
]

export const BADGES = [
  { id: 'SHIELD', label: 'Escudo clásico' },
  { id: 'CREST', label: 'Blasón real' },
  { id: 'CIRCLE', label: 'Emblema circular' },
  { id: 'DIAMOND', label: 'Rombo moderno' }
]

export const NAME_MIN = 3
export const NAME_MAX = 40

/** Devuelve { campo: mensaje } con los errores de la identidad; vacío si es válida */
export const validateIdentity = (identity) => {
  const errors = {}
  const name = (identity.name || '').trim()
  if (name.length < NAME_MIN) errors.name = `El nombre debe tener al menos ${NAME_MIN} caracteres.`
  else if (name.length > NAME_MAX) errors.name = `El nombre no puede superar los ${NAME_MAX} caracteres.`
  return errors
}

/** El estadio sigue al nombre del club mientras tenga el nombre por defecto */
export const defaultStadiumName = (clubName) => `Estadio ${clubName}`
export const isAutoStadiumName = (stadiumName, previousClubName) => !stadiumName || stadiumName === defaultStadiumName(previousClubName)

export const sameColors = (a, b) => a.primary === b.primary && a.secondary === b.secondary
