/**
 * Personajes con nombre y memoria: el líder de la barra, el presidente y el periodista que te sigue.
 * Se sortean una vez por club (deterministas por club) y recuerdan lo que pasó: cuántas veces vino la barra,
 * cuánto rencor le dejaste al periodista. Funciones puras.
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

const pick = (list, rand) => list[Math.floor(rand() * list.length)]

/** Personajes del club, siempre los mismos para el mismo club */
export function generateCharacters(seed) {
  const rand = seededRandom(`characters:${seed}`)
  return {
    barra: { name: pick(BARRA_LEADERS, rand), times: 0 },
    president: { name: pick(PRESIDENTS, rand) },
    journalist: { ...pick(JOURNALISTS, rand), grudge: 0 }
  }
}

/** Completa lo que falte (clubes que todavía no tenían personajes) sin pisar lo que ya recuerdan */
export function ensureCharacters(existing, seed) {
  const base = generateCharacters(seed)
  const have = existing || {}
  return {
    barra: { ...base.barra, ...(have.barra || {}) },
    president: { ...base.president, ...(have.president || {}) },
    journalist: { ...base.journalist, ...(have.journalist || {}) }
  }
}

const capitalize = (text) => (text ? text[0].toUpperCase() + text.slice(1) : text)

/** Primer nombre o título de pila del presidente ("Don Raúl", "Doña Marta") para nombrarlo en una frase */
export const presidentShortName = (name = '') => name.split(' ').slice(0, 2).join(' ')

/**
 * Reemplaza los marcadores {barra}, {Barra}, {presidente}, {periodista} y {medio} del texto con los personajes del club.
 * Sin personajes deja el texto con un nombre genérico, nunca con llaves.
 */
export function renderText(text, characters) {
  if (typeof text !== 'string') return text
  const barra = characters?.barra?.name || 'un referente de la barra'
  const president = characters?.president?.name ? presidentShortName(characters.president.name) : 'el presidente'
  const journalist = characters?.journalist?.name || 'un periodista de la zona'
  const outlet = characters?.journalist?.outlet || 'un medio de la zona'
  return text
    .replaceAll('{Barra}', capitalize(barra))
    .replaceAll('{barra}', barra)
    .replaceAll('{presidente}', president)
    .replaceAll('{periodista}', journalist)
    .replaceAll('{medio}', outlet)
}

/** Copia de una plantilla de evento con todos sus textos personalizados */
export function renderTemplate(template, characters) {
  return {
    ...template,
    title: renderText(template.title, characters),
    description: renderText(template.description, characters),
    options: (template.options || []).map(o => ({ ...o, label: renderText(o.label, characters), description: renderText(o.description, characters) }))
  }
}

/** La barra vuelve: suma una aparición y devuelve la línea de memoria si no es la primera vez */
export function rememberBarraVisit(characters) {
  const times = (characters?.barra?.times || 0) + 1
  const next = { ...characters, barra: { ...(characters?.barra || {}), times } }
  const name = capitalize(next.barra.name || 'la barra')
  const memory = times === 1 ? '' : times === 2 ? `${name} ya vino antes: es la segunda vez.` : `${name} ya vino ${times} veces y sabe cómo terminó cada una.`
  return { characters: next, memory }
}

/** Rencor del periodista: sube al ignorarlo y baja un poco cuando das la cara (nunca pasa de 0 a 5) */
export const adjustGrudge = (characters, delta) => ({
  ...characters,
  journalist: { ...(characters?.journalist || {}), grudge: Math.min(5, Math.max(0, (characters?.journalist?.grudge || 0) + delta)) }
})

/** Con rencor, la prensa carga más las tintas cuando no das la conferencia: +5% de rumor por punto de rencor (hasta +25%) */
export const rumorBoost = (characters) => Math.min(0.25, 0.05 * (characters?.journalist?.grudge || 0))
