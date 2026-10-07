/**
 * Personajes con nombre y memoria: el líder de la barra, el presidente, el periodista que te sigue
 * y toda la galería de barrio (utilero, vecina, quiosquero, cocinera, puntero, detective, arquitecto,
 * ingeniero, empresario, ayudante, colectivero, dirigente, contador).
 *
 * Se sortean una vez por club (deterministas por club) y recuerdan lo que pasó:
 * cuántas veces vino la barra, cuánto rencor le dejaste al periodista, cuánto chisme acumuló la vecina.
 * Funciones puras.
 */
import { seededRandom } from './cupMatch'

export const BARRA_LEADERS = ['el Oso', 'el Gringo', 'el Tano', 'el Flaco Montes', 'el Negro Díaz', 'Cacho', 'el Pelado Ruiz', 'el Mono Peralta']
export const PRESIDENTS = ['Don Raúl Benítez', 'Don Aníbal Sosa', 'Don Ernesto Quiroga', 'Doña Marta Ibáñez', 'Don Teodoro Paz', 'Doña Norma Cuello']
export const JOURNALISTS = [
  { name: 'Pepe Cabrera', outlet: 'Radio del Barrio' },
  { name: 'Marcela Funes', outlet: 'El Diario de la Zona' },
  { name: 'Beto Giménez', outlet: 'Canal 4 Regional' },
  { name: 'Lalo Ferreyra', outlet: 'La Voz del Potrero' },
  { name: 'Nené Castro', outlet: 'Radio Cancha' }
]

// Galería de barrio: cada rol tiene su propio pool de nombres.
export const UTILEROS = ['Don Pocho', 'Don Rodolfo', 'Don Cayetano', 'Don Anselmo', 'Don Pedro', 'Don Braulio']
export const VECINAS = ['Doña Mirta', 'Doña Rosa', 'Doña Esther', 'Doña Nilda', 'Doña Carmen', 'Doña Haydée']
export const QUIOSQUEROS = ['Don Alcides', 'Don Tito', 'Don Fermín', 'Don Oscar', 'Don Rubén', 'Don Lito']
export const COCINERAS = ['Doña Norma', 'Doña Elvira', 'Doña Chola', 'Doña Beatriz', 'Doña Ramona', 'Doña Lidia']
export const PUNTEROS = ['el Turco Medina', 'el Chino Barrios', 'el Colorado Ferreyra', 'el Ruso Aguirre', 'el Vasco Etcheverry', 'el Gallego Pereira']
export const DETECTIVES = ['el Chapa Rodríguez', 'el Pistola Vega', 'el Sabueso Ledesma', 'el Olfato Bustos', 'el Lupa Giménez', 'el Sigilo Paz']
export const ARQUITECTOS = ['el Ingeniero Pucheta', 'el Arquitecto Bermúdez', 'el Maestro Ojeda', 'el Ingeniero Villalba', 'el Arquitecto Sosa']
export const INGENIEROS = ['el Ingeniero Ferraro', 'el Técnico Zabala', 'el Doctor Cáceres', 'el Licenciado Ponce', 'el Ingeniero Bustamante']
export const EMPRESARIOS = ['el Turco Salomón', 'el Gallego Rial', 'Don Bigote Fernández', 'el Ruso Katz', 'el Flaco Etchegaray']
export const AYUDANTES = ['el Colo Sández', 'el Pipa Molina', 'el Tito Ramírez', 'el Chueco Ledesma', 'el Bebe Ferreyra']
export const COLECTIVEROS = ['el Tito Acuña', 'el Cholo Benítez', 'el Pato Ramírez', 'el Negro Sosa', 'el Vasco Loyola']
export const DIRIGENTES = ['el Doctor Bermúdez', 'el Contador Paz', 'el Ingeniero Ruiz', 'el Doctor Ferrari', 'el Licenciado Ocampo']
export const CONTADORES = ['el Contador Peralta', 'el Contador Sosa', 'el Contador Ibarra', 'el Contador Ríos', 'el Contador Funes']

const pick = (list, rand) => list[Math.floor(rand() * list.length)]

/** Metadatos por rol: etiqueta para memoria y si acumulan rencor. */
const ROLES = {
  barra:      { label: 'barra',      grudge: false },
  utilero:    { label: 'utilero',    grudge: false },
  vecina:     { label: 'vecina',     grudge: true  },
  quiosquero: { label: 'quiosquero', grudge: true  },
  cocinera:   { label: 'cocinera',   grudge: false },
  puntero:    { label: 'puntero',    grudge: false },
  detective:  { label: 'detective',  grudge: false },
  arquitecto: { label: 'arquitecto', grudge: false },
  ingeniero:  { label: 'ingeniero',  grudge: false },
  empresario: { label: 'empresario', grudge: false },
  ayudante:   { label: 'ayudante',   grudge: false },
  colectivero:{ label: 'colectivero',grudge: false },
  dirigente:  { label: 'dirigente',  grudge: false },
  contador:   { label: 'contador',   grudge: false }
}

/** Personajes del club, siempre los mismos para el mismo club */
export function generateCharacters(seed) {
  const rand = seededRandom(`characters:${seed}`)
  const base = {
    barra: { name: pick(BARRA_LEADERS, rand), times: 0 },
    president: { name: pick(PRESIDENTS, rand) },
    journalist: { ...pick(JOURNALISTS, rand), grudge: 0 }
  }
  const galeria = {
    utilero:     pick(UTILEROS, rand),
    vecina:      pick(VECINAS, rand),
    quiosquero:  pick(QUIOSQUEROS, rand),
    cocinera:    pick(COCINERAS, rand),
    puntero:     pick(PUNTEROS, rand),
    detective:   pick(DETECTIVES, rand),
    arquitecto:  pick(ARQUITECTOS, rand),
    ingeniero:   pick(INGENIEROS, rand),
    empresario:  pick(EMPRESARIOS, rand),
    ayudante:    pick(AYUDANTES, rand),
    colectivero: pick(COLECTIVEROS, rand),
    dirigente:   pick(DIRIGENTES, rand),
    contador:    pick(CONTADORES, rand)
  }
  const personajes = { ...base }
  for (const key of Object.keys(galeria)) {
    personajes[key] = { name: galeria[key], times: 0 }
    if (ROLES[key]?.grudge) personajes[key].grudge = 0
  }
  return personajes
}

/** Completa lo que falte (clubes que todavía no tenían personajes) sin pisar lo que ya recuerdan */
export function ensureCharacters(existing, seed) {
  const base = generateCharacters(seed)
  const have = existing || {}
  const merged = {}
  for (const key of Object.keys(base)) {
    merged[key] = { ...base[key], ...(have[key] || {}) }
  }
  // personajes viejos guardados por las dudas
  for (const key of Object.keys(have)) {
    if (!merged[key]) merged[key] = have[key]
  }
  return merged
}

const capitalize = (text) => (text ? text[0].toUpperCase() + text.slice(1) : text)

/** Primer nombre o título de pila del presidente ("Don Raúl", "Doña Marta") para nombrarlo en una frase */
export const presidentShortName = (name = '') => name.split(' ').slice(0, 2).join(' ')

/** Etiquetas genéricas por si el club todavía no tiene personajes sorteados */
const FALLBACKS = {
  utilero: 'el utilero de siempre',
  vecina: 'una vecina del barrio',
  quiosquero: 'el quiosquero de la esquina',
  cocinera: 'la cocinera del comedor',
  puntero: 'un puntero del barrio',
  detective: 'un detective privado',
  arquitecto: 'un arquitecto de la zona',
  ingeniero: 'un ingeniero de la zona',
  empresario: 'un empresario de la zona',
  ayudante: 'el ayudante',
  colectivero: 'el colectivero de la línea',
  dirigente: 'un dirigente del club',
  contador: 'el contador del club'
}

/**
 * Reemplaza los marcadores del texto con los personajes del club:
 * {barra}, {Barra}, {presidente}, {periodista}, {medio} y toda la galería:
 * {utilero}, {vecina}, {quiosquero}, {cocinera}, {puntero}, {detective},
 * {arquitecto}, {ingeniero}, {empresario}, {ayudante}, {colectivero},
 * {dirigente}, {contador}. Cada uno con su versión capitalizada.
 * Sin personajes deja el texto con un nombre genérico, nunca con llaves.
 */
export function renderText(text, characters) {
  if (typeof text !== 'string') return text
  const c = characters || {}
  const barra = c.barra?.name || 'un referente de la barra'
  const president = c.president?.name ? presidentShortName(c.president.name) : 'el presidente'
  const journalist = c.journalist?.name || 'un periodista de la zona'
  const outlet = c.journalist?.outlet || 'un medio de la zona'

  let out = text
    .replaceAll('{Barra}', capitalize(barra))
    .replaceAll('{barra}', barra)
    .replaceAll('{Presidente}', capitalize(president))
    .replaceAll('{presidente}', president)
    .replaceAll('{Periodista}', capitalize(journalist))
    .replaceAll('{periodista}', journalist)
    .replaceAll('{Medio}', capitalize(outlet))
    .replaceAll('{medio}', outlet)

  for (const key of Object.keys(FALLBACKS)) {
    const value = c[key]?.name || FALLBACKS[key]
    out = out
      .replaceAll(`{${capitalize(key)}}`, capitalize(value))
      .replaceAll(`{${key}}`, value)
  }
  return out
}

/** Copia de una plantilla de evento con todos sus textos personalizados */
export function renderTemplate(template, characters) {
  return {
    ...template,
    title: renderText(template.title, characters),
    description: renderText(template.description, characters),
    options: (template.options || []).map(o => ({
      ...o,
      label: renderText(o.label, characters),
      description: renderText(o.description, characters),
      ...(o.ending ? { ending: renderText(o.ending, characters) } : {}),
      ...(o.variants ? { variants: o.variants.map(v => ({ ...v, ending: renderText(v.ending, characters) })) } : {})
    }))
  }
}

/**
 * Cualquier personaje vuelve: suma una aparición y devuelve la línea de memoria si no es la primera vez.
 * Sirve para la barra, el utilero, la vecina, el quiosquero, el puntero, el detective, etc.
 */
export function rememberVisit(characters, key) {
  const current = characters?.[key]
  if (!current) return { characters, memory: '' }
  const times = (current.times || 0) + 1
  const next = { ...characters, [key]: { ...current, times } }
  const name = capitalize(current.name || ROLES[key]?.label || key)
  const memory = times === 1
    ? ''
    : times === 2
      ? `${name} ya vino antes: es la segunda vez.`
      : `${name} ya vino ${times} veces y sabe cómo terminó cada una.`
  return { characters: next, memory }
}

/** Compatibilidad: la barra vuelve. Usa rememberVisit por dentro. */
export function rememberBarraVisit(characters) {
  return rememberVisit(characters, 'barra')
}

/** Rencor genérico: sirve para el periodista y para cualquier personaje con `grudge` (vecina, quiosquero). */
export const adjustGrudgeFor = (characters, key, delta) => ({
  ...characters,
  [key]: {
    ...(characters?.[key] || {}),
    grudge: Math.min(5, Math.max(0, (characters?.[key]?.grudge || 0) + delta))
  }
})

/** Rencor del periodista (compatibilidad). */
export const adjustGrudge = (characters, delta) => adjustGrudgeFor(characters, 'journalist', delta)

/** Rencor de la vecina (chismosa profesional). */
export const adjustVecinaGrudge = (characters, delta) => adjustGrudgeFor(characters, 'vecina', delta)

/** Rencor del quiosquero (cobra caro el enojo). */
export const adjustQuiosqueroGrudge = (characters, delta) => adjustGrudgeFor(characters, 'quiosquero', delta)

/**
 * Con rencor, la prensa carga más las tintas cuando no das la conferencia: +5% de rumor por punto de rencor (hasta +25%).
 * La vecina, si está enojada, aporta la mitad: +2,5% por punto (hasta +12,5%).
 * Los dos topes se combinan y el total no pasa de +35%.
 */
export const rumorBoost = (characters) => {
  const periodista = Math.min(0.25, 0.05 * (characters?.journalist?.grudge || 0))
  const vecina = Math.min(0.125, 0.025 * (characters?.vecina?.grudge || 0))
  return Math.min(0.35, periodista + vecina)
}