/**
 * Planteles de los clubes de la IA a partir de los planteles reales, pero con los nombres CAMBIADOS: del plantel real solo se toma
 * la composición (cuántos hay de cada puesto) y de cada jugador un nombre y apellido deterministas, distintos de los reales.
 * Así los clubes tienen planteles creíbles sin usar los nombres de personas reales. Funciones puras.
 */
const FIRST_NAMES = [
  'Lisandro', 'Bautista', 'Valentín', 'Camilo', 'Ignacio', 'Federico', 'Rodrigo', 'Damián', 'Gastón', 'Hernán', 'Axel', 'Ciro', 'Dante', 'Elías', 'Fabricio', 'Genaro',
  'Hugo', 'Iván', 'Jeremías', 'Kevin', 'Lautaro', 'Marcelo', 'Nahuel', 'Octavio', 'Pablo', 'Renzo', 'Sebastián', 'Tadeo', 'Ulises', 'Víctor', 'Walter', 'Yago',
  'Alan', 'Brian', 'Claudio', 'Darío', 'Enrique', 'Fausto', 'Gabriel', 'Horacio', 'Ismael', 'Jonás', 'Lorenzo', 'Mariano', 'Néstor', 'Oscar', 'Patricio', 'Ricardo'
]

const hash = (str) => {
  let h = 2166136261
  for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  return h
}

const VOWELS = 'aeiou'
const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

/** Apellido cambiado: se mantienen la inicial y el largo, y se cambian vocales de adentro (siempre al menos una) */
function alterSurname(surname) {
  const base = strip(surname).toLowerCase()
  const chars = [...base]
  const h = hash(`ap:${base}`)
  const slots = chars.map((c, i) => ({ c, i })).filter(({ c, i }) => i > 0 && VOWELS.includes(c))
  let changed = false
  slots.forEach(({ c, i }, k) => {
    if ((h >>> k) % 100 < 62 || (!changed && k === slots.length - 1)) {
      const options = [...VOWELS].filter(v => v !== c)
      chars[i] = options[(h >>> (k + 3)) % options.length]
      changed = true
    }
  })
  let out = chars.join('')
  // Sin vocales internas que cambiar (o igual que el original) se cambia la última letra
  if (out === base) out = base.slice(0, -1) + (base.endsWith('s') ? 'z' : 's')
  return capitalize(out)
}

/** Nombre cambiado (mismo largo de palabras): el nombre sale de una lista de nombres argentinos y el apellido se altera */
export function alterName(real) {
  const parts = String(real || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  const [first, ...rest] = parts
  let newFirst = FIRST_NAMES[hash(`n:${first}`) % FIRST_NAMES.length]
  if (strip(newFirst).toLowerCase() === strip(first).toLowerCase()) newFirst = FIRST_NAMES[(hash(`n:${first}`) + 1) % FIRST_NAMES.length]
  if (rest.length === 0) return newFirst
  return [newFirst, ...rest.map(alterSurname)].join(' ')
}

/** Línea del puesto según la abreviatura de la página (ARQ, DEF, MED, DEL…) */
export function positionGroup(pos) {
  const p = String(pos || '').toUpperCase()
  if (p.startsWith('AR') || p === 'GK' || p === 'POR') return 'GK'
  if (p.startsWith('DEF') || p === 'DFC' || p === 'LD' || p === 'LI') return 'DEF'
  if (p.startsWith('DEL') || p === 'DC' || p === 'EI' || p === 'ED') return 'FW'
  return 'MID'
}

const LINE_OF = { GK: 'ARQ', DEF: 'DEF', MID: 'MED', FW: 'DEL' }
/** Cuántos de cada línea entran en las 12 plazas, en el orden de las plazas (delanteros primero: son los que más gol hacen) */
const SLOT_PLAN = [['FW', 4], ['MID', 4], ['DEF', 3], ['GK', 1]]

/**
 * Las 12 plazas de un club a partir de su plantel: 4 delanteros, 4 medios, 3 defensores y 1 arquero (por número de camiseta).
 * Si falta alguna línea se completa con quien sobre. `squad` = [{ name, pos, num }]. Devuelve en orden de plaza (0 a 11).
 */
export function pickSquad(squad = []) {
  const list = [...(squad || [])].sort((a, b) => (a.num ?? 99) - (b.num ?? 99))
  const used = new Set()
  const out = []
  for (const [line, count] of SLOT_PLAN) {
    for (const p of list.filter(x => positionGroup(x.pos) === line && !used.has(x)).slice(0, count)) { used.add(p); out.push({ ...p, pos: LINE_OF[line] }) }
  }
  for (const p of list) { if (out.length >= 12) break; if (!used.has(p)) { used.add(p); out.push({ ...p, pos: LINE_OF[positionGroup(p.pos)] }) } }
  return out.slice(0, 12)
}
