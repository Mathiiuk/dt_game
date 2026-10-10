/**
 * Cómo se cuentan las historias: el texto se parte en "momentos" para leerlo de a poco y, al elegir,
 * el narrador comenta lo que pasó con una cargada acorde. Funciones puras.
 */

const SENTENCE_END = /[.!?…:]["»”)]*$/
const CLOSE_QUOTES = '"”»'

const capitalizeFirst = (t) => t.charAt(0).toUpperCase() + t.slice(1)

/** Agrega narración; la que cuelga de un globo (", te susurra, mirando…") pierde la puntuación suelta y arranca en mayúscula */
function pushTell(out, raw) {
  let text = raw.trim()
  if (out.length && out[out.length - 1].type === 'say') text = capitalizeFirst(text.replace(/^[\s.,;:]+/, ''))
  if (/[\p{L}\p{N}]/u.test(text)) out.push({ type: 'tell', text })
}

/**
 * Parte un texto en fragmentos: narración y diálogos.
 * Un diálogo (entre comillas) es un globo solo si ocupa una oración entera: al principio, después de un punto o de dos puntos.
 * Una cita a mitad de oración ("se presenta como "tal cosa". Pide...") queda dentro de la narración, con sus comillas.
 * Lo que sigue a un globo ("..., te susurra, mirando") pierde la puntuación suelta y arranca en mayúscula.
 * @returns {Array<{ type: 'say'|'tell', text: string }>}
 */
export function splitSegments(text = '') {
  const out = []
  const re = /["“«]([^"”»]+)["”»]/g
  let pending = ''
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(last, m.index)
    const standalone = !(pending + before).trim() || SENTENCE_END.test((pending + before).trim())
    if (standalone) {
      pushTell(out, pending + before)
      out.push({ type: 'say', text: m[1].trim() })
      pending = ''
    } else {
      pending += before + m[0]
    }
    last = m.index + m[0].length
  }
  pushTell(out, pending + text.slice(last))
  return out
}

/** Oraciones de un texto: corta en . ! ? salvo dentro de una cita y salvo en números con punto (1.000) */
export function splitSentences(text = '') {
  const sentences = []
  let current = ''
  let inQuote = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    current += ch
    if (ch === '“' || ch === '«') inQuote = true
    else if (ch === '”' || ch === '»') inQuote = false
    else if (ch === '"') inQuote = !inQuote
    if (!/[.!?]/.test(ch) || inQuote) continue
    if (/[.!?]/.test(text[i + 1] || '')) continue
    if (ch === '.' && /\d/.test(text[i + 1] || '')) continue
    // pegar las comillas o paréntesis de cierre a la oración que termina
    while (i + 1 < text.length && /["”»)]/.test(text[i + 1])) { current += text[++i]; if (CLOSE_QUOTES.includes(text[i])) inQuote = false }
    if (i + 1 < text.length && !/\s/.test(text[i + 1])) continue
    sentences.push(current.trim())
    current = ''
  }
  if (current.trim()) sentences.push(current.trim())
  return sentences
}

/** Divide la narración en oraciones y las agrupa de a dos; los diálogos quedan solos, como un globo */
export function splitBeats(text = '') {
  const beats = []
  for (const seg of splitSegments(text)) {
    if (seg.type === 'say') { beats.push(seg); continue }
    const sentences = splitSentences(seg.text)
    if (!sentences.length) sentences.push(seg.text)
    for (let i = 0; i < sentences.length; i += 2) beats.push({ type: 'tell', text: sentences.slice(i, i + 2).join(' ') })
  }
  return beats.length ? beats : [{ type: 'tell', text }]
}

const REACTIONS = {
  fans_up: ['La tribuna canta. El del choripán, también.', 'En la popular ya hay una bandera nueva con tu apellido mal escrito.', 'Los hinchas te aplauden. Es raro, pero se siente lindo.'],
  fans_down: ['En la tribuna se oyen silbidos. Alguien juró que fue el viento.', 'La popular te mira como a un tío que se olvidó el asado.', 'Un hincha armó un grupo de WhatsApp solo para quejarse de esto.'],
  locker_up: ['En el vestuario sube la moral y alguien pone cumbia.', 'Los muchachos se abrazan. Hasta el utilero se emociona.'],
  locker_down: ['En el vestuario se cortó el aire con tijera.', 'Se escucha un "bueno, bueno" que no suena a bueno.'],
  board_up: ['La dirigencia asiente con la cabeza. Dos veces. Es muchísimo.', 'El presidente sonríe, que en él es un hecho histórico.'],
  board_down: ['La dirigencia anota algo en una servilleta. Mala señal.', 'El presidente se acomoda la corbata. No es buena señal.'],
  budget_up: ['La caja suena a monedas y el contador te mira con cariño.', 'Entra plata. Alguien dice "alcanza para pintar el baño".'],
  budget_down: ['La caja hace un ruido triste, tipo trombón.', 'El contador se agarra la cabeza con las dos manos.'],
  neutral: ['Nadie se enteró de nada. Mejor así.', 'El barrio sigue girando, como si nada.', 'Elegiste con calma. O con miedo; desde afuera es igual.']
}

const hash = (str) => { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }

/** Cargada del narrador según lo que más pesó en la decisión (estable para el mismo evento) */
export function reactionFor(effects = {}, seed = '') {
  const keys = [['fans', 'fans'], ['locker', 'locker'], ['board', 'board'], ['budget', 'budget']]
  let best = null
  for (const [k, id] of keys) {
    const v = Number(effects[k] || 0)
    const weight = k === 'budget' ? Math.abs(v) / 500 : Math.abs(v)
    if (v !== 0 && (!best || weight > best.weight)) best = { id, v, weight }
  }
  const pool = best ? REACTIONS[`${best.id}_${best.v > 0 ? 'up' : 'down'}`] : REACTIONS.neutral
  return pool[hash(seed) % pool.length]
}

const EFFECT_LABELS = { fans: 'Hinchada', locker: 'Vestuario', board: 'Dirigencia', budget: 'Caja' }

/** Chips de efecto para mostrar tras decidir: [{ key, label, value }] */
export function effectChips(effects = {}) {
  return Object.keys(EFFECT_LABELS)
    .filter(k => Number(effects[k] || 0) !== 0)
    .map(k => ({ key: k, label: EFFECT_LABELS[k], value: Number(effects[k]) }))
}
