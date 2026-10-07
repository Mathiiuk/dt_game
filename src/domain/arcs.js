/**
 * Historias de varias fechas: una a la vez, cuatro capítulos separados por unas semanas. Funciones puras.
 * Estado guardado en el club:
 *   { active: { id, chapter, delivered, wait, flags, visits }, cooldown, done: [{ id, title, ending, season }] }
 *
 * Los personajes con nombre (barra, presidente, periodista, utilero, vecina, quiosquero, cocinera,
 * puntero, detective, arquitecto, ingeniero, empresario, ayudante, colectivero, dirigente, contador)
 * se recuerdan entre capítulos y entre historias: cuántas veces aparecieron y cuánto rencor acumularon.
 * El motor es puro: recibe `characters` y devuelve `characters` actualizados.
 */
import { ARC_CATALOG, arcById } from './arcCatalog'
import { renderTemplate, renderText, rememberVisit, adjustGrudgeFor } from './characters'

export const ARC_GAP_WEEKS = 3 // semanas entre que resolvés un capítulo y llega el siguiente
export const ARC_COOLDOWN_WEEKS = 4 // descanso entre una historia y la siguiente
export const ARC_FIRST_WEEK = 3 // no empiezan en las primeras fechas
export const MAX_PENDING_EVENTS = 3

/** Roles que el motor rastrea cuando aparecen en un texto de arco. */
export const TRACKED_ROLES = [
  'barra', 'utilero', 'vecina', 'quiosquero', 'cocinera',
  'puntero', 'detective', 'arquitecto', 'ingeniero', 'empresario',
  'ayudante', 'colectivero', 'dirigente', 'contador'
]

/** Alias de marcador en texto → clave interna del club. */
const ROLE_ALIASES = {
  barra: 'barra',
  presidente: 'president',
  periodista: 'journalist',
  medio: 'journalist',
  utilero: 'utilero',
  vecina: 'vecina',
  quiosquero: 'quiosquero',
  cocinera: 'cocinera',
  puntero: 'puntero',
  detective: 'detective',
  arquitecto: 'arquitecto',
  ingeniero: 'ingeniero',
  empresario: 'empresario',
  ayudante: 'ayudante',
  colectivero: 'colectivero',
  dirigente: 'dirigente',
  contador: 'contador'
}

const START_CHANCE = { FLOWS: 0.22, TENSION: 0.18, CRISIS: 0.10, CHAOS: 0.05 }

export const emptyArcs = () => ({ active: null, cooldown: 0, done: [], visits: {} })

export const normalizeArcs = (raw) => {
  const base = emptyArcs()
  const merged = { ...base, ...(raw && typeof raw === 'object' ? raw : {}) }
  merged.visits = { ...base.visits, ...(merged.visits || {}) }
  if (merged.active && typeof merged.active === 'object') {
    merged.active = { ...merged.active, visits: { ...(merged.active.visits || {}) } }
  }
  return merged
}

export const arcChapterCode = (arcId, index) => `ARC_${arcId.toUpperCase()}_${index}`

export function parseArcCode(code) {
  const m = /^ARC_([A-Z_]+)_(\d+)$/.exec(code || '')
  if (!m) return null
  const arc = ARC_CATALOG.find(a => a.id.toUpperCase() === m[1])
  return arc ? { arcId: arc.id, index: Number(m[2]) } : null
}

/** Elige una historia que todavía no viviste en esta carrera (si ya viviste todas, vuelven a entrar todas) */
export function pickArc(done = [], rng = Math.random) {
  const seen = new Set(done.map(d => d.id))
  const pool = ARC_CATALOG.filter(a => !seen.has(a.id))
  const list = pool.length ? pool : ARC_CATALOG
  return list[Math.floor(rng() * list.length)]
}

/**
 * Detecta qué roles aparecen en un texto de arco: {utilero}, {vecina}, {periodista}, etc.
 * Devuelve las claves internas del club ('barra', 'utilero', 'journalist', 'president', ...).
 * Ignora marcadores desconocidos ({medio} se mapea a journalist).
 */
export function rolesInText(text) {
  if (typeof text !== 'string') return []
  const found = new Set()
  const re = /\{([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\}/g
  let m
  while ((m = re.exec(text))) {
    const raw = m[1].toLowerCase()
    const key = ROLE_ALIASES[raw]
    if (key) found.add(key)
  }
  return [...found]
}

/** Roles que aparecen en un capítulo puntual (título, descripción, opciones y memoria). */
export function rolesInChapter(arcId, index) {
  const arc = arcById(arcId)
  const ch = arc?.chapters[index]
  if (!ch) return []
  const roles = new Set()
  rolesInText(ch.title).forEach(r => roles.add(r))
  rolesInText(ch.description).forEach(r => roles.add(r))
  for (const opt of ch.options || []) {
    rolesInText(opt.label).forEach(r => roles.add(r))
    rolesInText(opt.description).forEach(r => roles.add(r))
  }
  for (const text of Object.values(ch.memory || {})) {
    rolesInText(text).forEach(r => roles.add(r))
  }
  return [...roles]
}

/** Roles que aparecen en toda una historia. */
export function rolesInArc(arcId) {
  const arc = arcById(arcId)
  if (!arc) return []
  const roles = new Set()
  arc.chapters.forEach((_, i) => rolesInChapter(arcId, i).forEach(r => roles.add(r)))
  return [...roles]
}

/**
 * Suma una visita a cada rol que aparece en la lista. Devuelve los personajes actualizados
 * y las líneas de memoria ("Don Pocho ya apareció antes: es la segunda vez.").
 * No inventa personajes: si el club no tiene ese rol sorteado, lo saltea.
 */
export function trackVisits(characters, roles = []) {
  if (!characters) return { characters, memories: [] }
  const memories = []
  let next = characters
  for (const key of roles) {
    if (!next[key]) continue
    const { characters: updated, memory } = rememberVisit(next, key)
    next = updated
    if (memory) memories.push(memory)
  }
  return { characters: next, memories }
}

/**
 * Aplica los efectos de rencor que traiga la opción. Soporta:
 *   effects.grudges = { periodista: -1, vecina: +1 }
 *   effects.grudge  = { periodista: -1 }
 * Las claves se mapean con ROLE_ALIASES (periodista → journalist).
 */
function applyGrudgeEffects(characters, effects) {
  if (!characters || !effects) return characters
  const map = effects.grudges || effects.grudge
  if (!map || typeof map !== 'object') return characters
  let next = characters
  for (const [key, delta] of Object.entries(map)) {
    const internal = ROLE_ALIASES[key] || key
    if (next[internal] && typeof delta === 'number') {
      next = adjustGrudgeFor(next, internal, delta)
    }
  }
  return next
}

/** Efectos numéricos "planos" (fans, board, locker, budget, cost) que se suman al club. */
export function optionEffects(option) {
  return option?.effects && typeof option.effects === 'object' ? option.effects : {}
}

/**
 * Plantilla del evento de un capítulo: título con numeración, texto con el recuerdo de lo que elegiste antes
 * y personajes del club con nombre. `extraMemory` permite inyectar las líneas de memoria de personajes.
 */
export function chapterTemplate(arcId, index, flags = [], characters = null, extraMemory = []) {
  const arc = arcById(arcId)
  const ch = arc?.chapters[index]
  if (!ch) return null

  const flagMemory = Object.entries(ch.memory || {})
    .filter(([flag]) => flags.includes(flag))
    .map(([, text]) => renderText(text, characters))

  const description = [ch.description, ...flagMemory, ...extraMemory].filter(Boolean).join(' ')

  const template = {
    template_code: arcChapterCode(arcId, index),
    title: `${ch.title} (${index + 1}/${arc.chapters.length})`,
    description,
    category: arc.category,
    severity: 'MEDIUM',
    options: ch.options
  }
  return renderTemplate(template, characters)
}

/**
 * Un paso por semana. Devuelve el estado nuevo, qué capítulo hay que entregar ahora (si corresponde),
 * si arrancó una historia nueva, los personajes actualizados con las visitas nuevas y las líneas de memoria.
 *
 * @param {{
 *   arcs: object, climate: string, week: number, pendingEvents: number,
 *   chapterPending?: boolean, characters?: object|null, rng?: Function
 * }} p
 * @returns {{
 *   arcs: object,
 *   deliver: { arcId: string, index: number, flags: string[], memories: string[] } | null,
 *   started: boolean,
 *   characters: object|null,
 *   memories: string[]
 * }}
 */
export function stepArcs({
  arcs: raw,
  climate = 'FLOWS',
  week = 1,
  pendingEvents = 0,
  chapterPending = true,
  characters = null,
  rng = Math.random
}) {
  const arcs = normalizeArcs(raw)
  const room = pendingEvents < MAX_PENDING_EVENTS

  if (arcs.active) {
    // Esperando tu decisión (si el evento del capítulo desapareció, se vuelve a entregar)
    if (arcs.active.delivered && chapterPending) {
      return { arcs, deliver: null, started: false, characters, memories: [] }
    }
    const wait = arcs.active.delivered ? 0 : Math.max(0, (arcs.active.wait || 0) - 1)
    if (wait > 0 || !room) {
      return { arcs: { ...arcs, active: { ...arcs.active, wait } }, deliver: null, started: false, characters, memories: [] }
    }

    const chapter = arcs.active.chapter
    const alreadyVisited = !!arcs.active.visits?.[chapter]
    const firstDelivery = !arcs.active.delivered && !alreadyVisited

    let nextCharacters = characters
    let memories = []
    if (firstDelivery) {
      const roles = rolesInChapter(arcs.active.id, chapter)
      const tracked = trackVisits(characters, roles)
      nextCharacters = tracked.characters
      memories = tracked.memories
    }

    return {
      arcs: {
        ...arcs,
        active: {
          ...arcs.active,
          wait: 0,
          delivered: true,
          visits: { ...(arcs.active.visits || {}), [chapter]: true }
        }
      },
      deliver: { arcId: arcs.active.id, index: chapter, flags: arcs.active.flags || [], memories },
      started: false,
      characters: nextCharacters,
      memories
    }
  }

  if (arcs.cooldown > 0) {
    return { arcs: { ...arcs, cooldown: arcs.cooldown - 1 }, deliver: null, started: false, characters, memories: [] }
  }
  if (week < ARC_FIRST_WEEK || !room || rng() >= (START_CHANCE[climate] ?? 0.15)) {
    return { arcs, deliver: null, started: false, characters, memories: [] }
  }

  const arc = pickArc(arcs.done, rng)
  const roles = rolesInChapter(arc.id, 0)
  const { characters: nextCharacters, memories } = trackVisits(characters, roles)

  return {
    arcs: {
      ...arcs,
      active: { id: arc.id, chapter: 0, delivered: true, wait: 0, flags: [], visits: { 0: true } }
    },
    deliver: { arcId: arc.id, index: 0, flags: [], memories },
    started: true,
    characters: nextCharacters,
    memories
  }
}

/**
 * Frase que cierra el final según cómo está el club: la barra manda sobre la dirigencia y esta sobre los favores.
 * @param {{ barra?: string, board?: number, favors?: number, visits?: object }} ctx
 */
export function closingTail(ctx = {}) {
  const { barra = 'CALM', board = null, favors = 0, visits = null } = ctx
  if (barra === 'INVASION' || barra === 'SQUEEZES') return 'Y todo esto pasó con la barra respirándote en la nuca.'
  if (board !== null && board <= 30) return 'En el palco, mientras tanto, ya se hablaba de tu continuidad.'
  if (board !== null && board >= 75) return 'La dirigencia, de buen humor, se quedó con los aplausos.'
  if (favors >= 3) return 'Algunos favores quedaron anotados en una libreta que ojalá nadie abra.'
  if (visits && visits.utilero >= 3) return 'El utilero ya perdió la cuenta de las veces que apareció esta temporada.'
  if (visits && visits.vecina >= 3) return 'La vecina ya tiene material para tres temporadas de chisme.'
  return ''
}

/**
 * Final de la historia: el de la opción elegida, o la variante de la primera marca del camino que coincida,
 * más la frase de cierre del estado del club, más la memoria de personajes si la hay.
 */
export function endingFor(option, flags = [], ctx = {}, characterMemories = []) {
  const variant = (option?.variants || []).find(v => flags.includes(v.if))
  const base = variant?.ending || option?.ending || 'La historia terminó como pudo.'
  const tail = closingTail(ctx)
  const memoryLine = characterMemories.filter(Boolean).join(' ')
  return [base, tail, memoryLine].filter(Boolean).join(' ')
}

/**
 * Resolvió un capítulo: guarda la marca de la opción, ajusta rencores si la opción lo pide,
 * prepara el siguiente capítulo o cierra la historia en el último.
 *
 * @returns {{
 *   arcs: object,
 *   finished: { id, title, ending, season } | null,
 *   characters: object|null,
 *   effects: object
 * }}
 */
export function resolveChapter(raw, code, optionId, season = null, ctx = {}, characters = null) {
  const arcs = normalizeArcs(raw)
  const parsed = parseArcCode(code)
  if (!parsed || !arcs.active || arcs.active.id !== parsed.arcId || arcs.active.chapter !== parsed.index) {
    return { arcs, finished: null, characters, effects: {} }
  }

  const arc = arcById(parsed.arcId)
  const option = arc.chapters[parsed.index].options.find(o => o.id === optionId)
  const flags = option?.flag ? [...(arcs.active.flags || []), option.flag] : (arcs.active.flags || [])
  const effects = optionEffects(option)
  const nextCharacters = applyGrudgeEffects(characters, effects)

  if (parsed.index >= arc.chapters.length - 1) {
    // Memoria de personajes que aparecieron dos o más veces a lo largo de la historia
    const characterMemories = []
    if (nextCharacters) {
      for (const role of rolesInArc(arc.id)) {
        const person = nextCharacters[role]
        if (!person) continue
        const times = person.times || 0
        if (times >= 2) {
          characterMemories.push(`${person.name} ya había aparecido ${times} veces en esta historia.`)
        }
      }
    }

    const finished = {
      id: arc.id,
      title: arc.title,
      ending: endingFor(option, flags, ctx, characterMemories),
      season
    }

    return {
      arcs: {
        active: null,
        cooldown: ARC_COOLDOWN_WEEKS,
        done: [...arcs.done, finished],
        visits: { ...(arcs.visits || {}) }
      },
      finished,
      characters: nextCharacters,
      effects
    }
  }

  return {
    arcs: {
      ...arcs,
      active: {
        ...arcs.active,
        chapter: parsed.index + 1,
        delivered: false,
        wait: ARC_GAP_WEEKS,
        flags
      }
    },
    finished: null,
    characters: nextCharacters,
    effects
  }
}