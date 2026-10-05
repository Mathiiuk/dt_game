/**
 * Posiciones del juego, con las siglas del fútbol en castellano.
 * PO arquero · DFC defensor central · LI/LD laterales · MCD mediocentro defensivo · MC mediocentro · MCO mediocentro ofensivo
 * MI/MD volantes por banda · EI/ED extremos · DC delantero centro.
 * Un puesto de la cancha ("slot") puede repetirse en una formación (dos centrales): se distingue con un número
 * (DFC1, DFC2) y `slotBase` devuelve la posición real (DFC).
 */

export const POSITIONS = [
  { code: 'PO', name: 'Arquero', line: 'ARQ' },
  { code: 'DFC', name: 'Defensor central', line: 'DEF' },
  { code: 'LI', name: 'Lateral izquierdo', line: 'DEF' },
  { code: 'LD', name: 'Lateral derecho', line: 'DEF' },
  { code: 'MCD', name: 'Mediocentro defensivo', line: 'MED' },
  { code: 'MC', name: 'Mediocentro', line: 'MED' },
  { code: 'MCO', name: 'Mediocentro ofensivo', line: 'MED' },
  { code: 'MI', name: 'Volante izquierdo', line: 'MED' },
  { code: 'MD', name: 'Volante derecho', line: 'MED' },
  { code: 'EI', name: 'Extremo izquierdo', line: 'DEL' },
  { code: 'ED', name: 'Extremo derecho', line: 'DEL' },
  { code: 'DC', name: 'Delantero centro', line: 'DEL' }
]

export const POSITION_CODES = POSITIONS.map(p => p.code)
const BY_CODE = Object.fromEntries(POSITIONS.map(p => [p.code, p]))

/** Códigos que usó el juego antes (inglés y abreviaturas viejas) -> código actual */
const LEGACY = {
  GK: 'PO', POR: 'PO',
  CB: 'DFC', LCB: 'DFC', RCB: 'DFC', DF: 'DFC', DEF: 'DFC',
  LB: 'LI', LWB: 'LI', RB: 'LD', RWB: 'LD',
  DM: 'MCD', CDM: 'MCD', LDM: 'MCD', RDM: 'MCD',
  CM: 'MC', LCM: 'MC', RCM: 'MC', MED: 'MC',
  AM: 'MCO', CAM: 'MCO',
  LM: 'MI', RM: 'MD',
  LW: 'EI', RW: 'ED',
  ST: 'DC', LST: 'DC', RST: 'DC', CF: 'DC', FW: 'DC', DEL: 'DC'
}

/** Posición base de un puesto de formación: "DFC2" -> "DFC" */
export const slotBase = (slot) => String(slot || '').toUpperCase().replace(/\d+$/, '')

/** Lleva cualquier código (viejo, con número o ya actual) al código actual; desconocido -> MC (el más neutro) */
export const normalizePosition = (code) => {
  const base = slotBase(code)
  if (BY_CODE[base]) return base
  return LEGACY[base] || 'MC'
}

export const positionInfo = (code) => BY_CODE[normalizePosition(code)]
export const positionName = (code) => positionInfo(code).name
export const positionLine = (code) => positionInfo(code).line

export const isGoalkeeper = (code) => normalizePosition(code) === 'PO'

/** Líneas para filtros: Arqueros, Defensores, Mediocampistas, Delanteros */
export const LINE_LABELS = { ARQ: 'Arqueros', DEF: 'Defensores', MED: 'Mediocampistas', DEL: 'Delanteros' }

/**
 * Cercanía entre dos posiciones (0 = la misma, mayor = más lejos). Se usa para castigar a quien juega fuera de su puesto.
 * Vecinos naturales (lateral-volante de banda, MC-MCD...) cuestan poco; cambiar de línea cuesta más; el arco es caso aparte.
 */
const NEIGHBORS = {
  DFC: ['MCD'],
  LI: ['MI', 'LD', 'DFC'],
  LD: ['MD', 'LI', 'DFC'],
  MCD: ['MC', 'DFC'],
  MC: ['MCD', 'MCO'],
  MCO: ['MC', 'DC', 'EI', 'ED'],
  MI: ['LI', 'EI', 'MC'],
  MD: ['LD', 'ED', 'MC'],
  EI: ['MI', 'DC', 'ED'],
  ED: ['MD', 'DC', 'EI'],
  DC: ['MCO', 'EI', 'ED'],
  PO: []
}

// La relación de vecindad es simétrica: si A es vecino de B, B lo es de A
for (const [a, list] of Object.entries(NEIGHBORS)) for (const b of list) if (!NEIGHBORS[b].includes(a)) NEIGHBORS[b].push(a)

const LINE_ORDER = ['ARQ', 'DEF', 'MED', 'DEL']

export const positionDistance = (a, b) => {
  const pa = normalizePosition(a)
  const pb = normalizePosition(b)
  if (pa === pb) return 0
  if (pa === 'PO' || pb === 'PO') return 9 // arquero de campo o jugador de campo al arco
  if ((NEIGHBORS[pa] || []).includes(pb)) return 1
  const la = LINE_ORDER.indexOf(positionLine(pa))
  const lb = LINE_ORDER.indexOf(positionLine(pb))
  if (la === lb) return 2 // misma línea, puesto distinto
  return 2 + Math.abs(la - lb) // una línea de distancia = 3, dos = 4, tres = 5
}

/** Puntos de media que se pierden por jugar fuera de la posición natural, según la distancia */
export const OUT_OF_POSITION_PENALTY = { 0: 0, 1: 3, 2: 7, 3: 13, 4: 20, 5: 27, 9: 45 }

export const positionPenalty = (natural, slot) => OUT_OF_POSITION_PENALTY[positionDistance(natural, slot)] ?? 30

/** Etiqueta para mostrar cómo rinde un jugador en un puesto */
export const fitLabel = (natural, slot) => {
  const d = positionDistance(natural, slot)
  if (d === 0) return { code: 'NATURAL', label: 'Natural', tone: 'accent' }
  if (d === 1) return { code: 'COMPATIBLE', label: 'Compatible', tone: 'warning' }
  if (d === 2) return { code: 'ADAPTED', label: 'Adaptado', tone: 'warning' }
  return { code: 'OUT_OF_POSITION', label: 'Fuera de puesto', tone: 'danger' }
}
