/**
 * Lee el plantel de un club del wikitexto de su página: las plantillas `{{Jugador de fútbol | nombre=... | num=... | pos=... }}`
 * de la sección "Plantel". Funciones puras (la descarga la hace scripts/data/fetch-squads.mjs).
 */
const cleanName = (raw) => {
  let name = String(raw || '').trim()
  const link = name.match(/\[\[([^\]]+)\]\]/)
  if (link) name = link[1].includes('|') ? link[1].split('|').pop() : link[1]
  return name.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim()
}

export function parseWikiSquad(wikitext) {
  const text = String(wikitext || '')
  // Solo la sección del plantel: desde su título hasta el siguiente título de sección que no sea una subsección del plantel
  const start = text.search(/==+\s*Plantel/i)
  if (start < 0) return []
  const rest = text.slice(start)
  const next = rest.slice(5).search(/\n==\s*(?!Plantel)[^=\n]+==\s*\n/)
  const section = next >= 0 ? rest.slice(0, next + 5) : rest

  const players = []
  const re = /\{\{\s*Jugador de fútbol([\s\S]*?)\n?\s*\}\}(?!\})/gi
  let m
  while ((m = re.exec(section)) !== null) {
    const body = m[1]
    // El valor llega hasta la próxima barra, salvo las barras de adentro de un enlace [[A|B]]
    const field = (key) => body.match(new RegExp(`\\|\\s*${key}\\s*=\\s*((?:\\[\\[[^\\]]*\\]\\]|[^|\\n])*)`, 'i'))?.[1]
    const name = cleanName(field('nombre'))
    const pos = String(field('pos') || '').trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚ]/g, '')
    const num = parseInt(String(field('num') || '').trim(), 10)
    if (!name || !pos) continue
    players.push({ name, num: Number.isFinite(num) ? num : null, pos })
  }
  return players
}
