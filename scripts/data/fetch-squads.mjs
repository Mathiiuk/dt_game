// Arma los planteles de los clubes de la IA a partir de Wikipedia (es), con los NOMBRES CAMBIADOS.
//   node scripts/data/fetch-squads.mjs            → escribe scripts/data/squads.generated.json (se puede cortar y retomar)
// De cada plantel se toman puesto y número para armar 12 plazas; el nombre real nunca se guarda: se guarda el nombre cambiado
// (src/domain/playerNames.js). Fuente: Wikipedia en español (texto bajo licencia CC BY-SA 4.0). Pocos pedidos, con pausa y reintentos.
import fs from 'node:fs'
import { HISTORICAL_CLUBS_BY_TIER } from '../../src/domain/historicalClubs.js'
import { parseWikiSquad } from '../../src/domain/wikiSquad.js'
import { alterName, pickSquad } from '../../src/domain/playerNames.js'

const OUT = new URL('./squads.generated.json', import.meta.url)
const UA = 'dt-game-squads/1.0 (proyecto de fans, Mathiiuk/dt_game; uso unico para armar planteles con nombres cambiados)'
const PAUSE_MS = 4000
const MIN_PLAYERS = 14

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const result = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { source: 'Wikipedia (es), CC BY-SA 4.0; nombres cambiados', clubs: {} }
const save = () => fs.writeFileSync(OUT, JSON.stringify(result, null, 1))

async function api(params) {
  const url = `https://es.wikipedia.org/w/api.php?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
  for (let attempt = 0; attempt < 12; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip' } })
    if (res.ok) return res.json()
    const wait = res.status === 429 ? 30000 + attempt * 20000 : 5000 * (attempt + 1)
    console.log(`  ${res.status}: espero ${Math.round(wait / 1000)} s`)
    await sleep(wait)
  }
  throw new Error('Wikipedia no responde')
}

async function squadFor(name) {
  const data = await api({
    action: 'query', generator: 'search', gsrsearch: `${name} club de fútbol Argentina plantel`, gsrlimit: '3',
    prop: 'revisions', rvprop: 'content', rvslots: 'main'
  })
  const pages = (data.query?.pages || []).sort((a, b) => a.index - b.index)
  for (const page of pages) {
    if (/Uruguay|Chile|Paraguay|Perú|Colombia|femenino|Selección/i.test(page.title)) continue
    const text = page.revisions?.[0]?.slots?.main?.content || ''
    const players = parseWikiSquad(text)
    if (players.length >= MIN_PLAYERS) return { title: page.title, players }
  }
  return null
}

const names = [...new Set(Object.values(HISTORICAL_CLUBS_BY_TIER).flat().map(c => c.name))]
let done = 0
for (const name of names) {
  done++
  if (result.clubs[name]) continue
  console.log(`[${done}/${names.length}] ${name}`)
  try {
    const found = await squadFor(name)
    if (!found) { result.clubs[name] = null; console.log('  sin plantel en la página') } else {
      const twelve = pickSquad(found.players)
      // Solo el nombre cambiado: el real no se guarda
      result.clubs[name] = { page: found.title, players: twelve.map(p => ({ name: alterName(p.name), pos: p.pos })) }
      console.log(`  ${found.title}: ${twelve.length} plazas`)
    }
  } catch (e) {
    console.log('  error:', e.message)
    break
  }
  save()
  await sleep(PAUSE_MS)
}
save()
const ok = Object.values(result.clubs).filter(Boolean).length
console.log(`Listo: ${ok} clubes con plantel de ${names.length}`)
