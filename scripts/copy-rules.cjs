// Reglas de redacción compartidas por el barrido (scripts/fix-copy.cjs) y el test estático (tests/static/copy.test.js)

// Palabras que SÍ van con mayúscula en medio de un texto (nombres propios, siglas, marcas del juego)
const KEEP = new Set([
  'Copa', 'Gloria', 'Continental', 'Salón', 'Fama', 'Torneo', 'Regional', 'Tier', 'Argentina', 'Sub', 'FIFA', 'DT', 'XP', 'OVR',
  'Conmebol', 'UEFA', 'Apertura', 'Clausura', 'Potrero', 'Pases', 'Club', 'Atlético', 'Presidente', 'América', 'Europa', 'Estadio',
  'Tiki-Taka', 'Gegenpressing', 'Del', 'Al', 'Ídolo', 'Rep', 'Pro', 'Uruguay', 'Chile', 'Colombia', 'Brasil', 'Buenos', 'Aires',
  'Premier', 'Liga', 'Mundial', 'Selección', 'Nacional'
])
// Se mantienen como están las primeras palabras de frases y las de estas expresiones fijas
const SMALL = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'en', 'a', 'al', 'por', 'para', 'con', 'sin', 'un', 'una'])

const isCap = (w) => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+[.,:;!?]?$/.test(w)

/** Pasa a minúscula las palabras con mayúscula inicial que no son la primera ni nombres propios */
const sentenceCase = (text) => {
  const words = text.split(/(\s+)/)
  let first = true
  let changed = false
  const out = words.map((tok) => {
    if (/^\s+$/.test(tok) || tok === '') return tok
    const wasFirst = first
    first = false
    if (/^[•|—–·-]$/.test(tok)) { first = true; return tok }
    if (wasFirst) return tok
    const bare = tok.replace(/[.,:;!?)]+$/, '')
    if (isCap(tok) && !KEEP.has(bare)) {
      changed = true
      return tok[0].toLowerCase() + tok.slice(1)
    }
    return tok
  })
  return changed ? out.join('') : text
}

// ¿Texto con al menos 2 palabras en Title Case seguidas (excluida la primera)? (para no tocar frases normales)
const looksTitleCase = (text) => {
  const ws = text.trim().replace(/^[•·|\-–—]\s*/, '').split(/\s+/)
  if (ws.length < 2) return false
  let n = 0
  for (let i = 1; i < ws.length; i++) {
    const bare = ws[i].replace(/[.,:;!?)]+$/, '')
    if (isCap(ws[i]) && !KEEP.has(bare) && !SMALL.has(bare.toLowerCase())) n++
  }
  return n >= 1 && ws.every((w, i) => i === 0 || isCap(w) || SMALL.has(w.toLowerCase()) || /^[\d$%+\-–·•&().,:;!?¿¡]+$/.test(w) || KEEP.has(w))
}


module.exports = { KEEP, SMALL, isCap, sentenceCase, looksTitleCase }
