/**
 * Historias de varias fechas: una a la vez, cuatro capítulos separados por unas semanas. Funciones puras.
 * Estado guardado en el club: { active: { id, chapter, delivered, wait, flags }, cooldown, done: [{ id, title, ending, season }] }
 */
import { ARC_CATALOG, arcById } from './arcCatalog'
import { renderTemplate } from './characters'

export const ARC_GAP_WEEKS = 3 // semanas entre que resolvés un capítulo y llega el siguiente
export const ARC_COOLDOWN_WEEKS = 4 // descanso entre una historia y la siguiente
export const ARC_FIRST_WEEK = 3 // no empiezan en las primeras fechas
export const MAX_PENDING_EVENTS = 3

const START_CHANCE = { FLOWS: 0.22, TENSION: 0.18, CRISIS: 0.10, CHAOS: 0.05 }

export const emptyArcs = () => ({ active: null, cooldown: 0, done: [] })
export const normalizeArcs = (raw) => ({ ...emptyArcs(), ...(raw && typeof raw === 'object' ? raw : {}) })

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
 * Plantilla del evento de un capítulo: título con numeración, texto con el recuerdo de lo que elegiste antes
 * y personajes del club con nombre.
 */
export function chapterTemplate(arcId, index, flags = [], characters = null) {
  const arc = arcById(arcId)
  const ch = arc?.chapters[index]
  if (!ch) return null
  const memory = Object.entries(ch.memory || {}).filter(([flag]) => flags.includes(flag)).map(([, text]) => text)
  const description = [ch.description, ...memory].join(' ')
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
 * Un paso por semana. Devuelve el estado nuevo y qué capítulo hay que entregar ahora (si corresponde).
 * @param {{ arcs: object, climate: string, week: number, pendingEvents: number, rng?: Function }} p
 * @returns {{ arcs: object, deliver: { arcId: string, index: number, flags: string[] } | null, started: boolean }}
 */
export function stepArcs({ arcs: raw, climate = 'FLOWS', week = 1, pendingEvents = 0, chapterPending = true, rng = Math.random }) {
  const arcs = normalizeArcs(raw)
  const room = pendingEvents < MAX_PENDING_EVENTS

  if (arcs.active) {
    // Esperando tu decisión (si el evento del capítulo desapareció, se vuelve a entregar)
    if (arcs.active.delivered && chapterPending) return { arcs, deliver: null, started: false }
    const wait = arcs.active.delivered ? 0 : Math.max(0, (arcs.active.wait || 0) - 1)
    if (wait > 0 || !room) return { arcs: { ...arcs, active: { ...arcs.active, wait } }, deliver: null, started: false }
    return {
      arcs: { ...arcs, active: { ...arcs.active, wait: 0, delivered: true } },
      deliver: { arcId: arcs.active.id, index: arcs.active.chapter, flags: arcs.active.flags || [] },
      started: false
    }
  }

  if (arcs.cooldown > 0) return { arcs: { ...arcs, cooldown: arcs.cooldown - 1 }, deliver: null, started: false }
  if (week < ARC_FIRST_WEEK || !room || rng() >= (START_CHANCE[climate] ?? 0.15)) return { arcs, deliver: null, started: false }

  const arc = pickArc(arcs.done, rng)
  return {
    arcs: { ...arcs, active: { id: arc.id, chapter: 0, delivered: true, wait: 0, flags: [] } },
    deliver: { arcId: arc.id, index: 0, flags: [] },
    started: true
  }
}

/**
 * Resolvió un capítulo: guarda la marca de la opción y prepara el siguiente, o cierra la historia en el último.
 * @returns {{ arcs: object, finished: { id, title, ending } | null }}
 */
export function resolveChapter(raw, code, optionId, season = null) {
  const arcs = normalizeArcs(raw)
  const parsed = parseArcCode(code)
  if (!parsed || !arcs.active || arcs.active.id !== parsed.arcId || arcs.active.chapter !== parsed.index) return { arcs, finished: null }

  const arc = arcById(parsed.arcId)
  const option = arc.chapters[parsed.index].options.find(o => o.id === optionId)
  const flags = option?.flag ? [...(arcs.active.flags || []), option.flag] : (arcs.active.flags || [])

  if (parsed.index >= arc.chapters.length - 1) {
    const finished = { id: arc.id, title: arc.title, ending: option?.ending || 'La historia terminó como pudo.', season }
    return { arcs: { active: null, cooldown: ARC_COOLDOWN_WEEKS, done: [...arcs.done, finished] }, finished }
  }
  return {
    arcs: { ...arcs, active: { ...arcs.active, chapter: parsed.index + 1, delivered: false, wait: ARC_GAP_WEEKS, flags } },
    finished: null
  }
}
