/**
 * Relato de un partido de la sala a partir de lo que dejó el servidor (goles con minuto, planteos y penales).
 * Mismo partido => mismo relato. Solo usa los nombres de los equipos de la sala.
 */
import { seededRandom } from './cupMatch'
import { stanceById } from './friendPlans'

const pick = (rand, list) => list[Math.floor(rand() * list.length)]

const GOAL_LINES = [
  '¡Gol de {t}! La pelota entró y el árbitro, por una vez, no se hizo el distraído.',
  '¡Gol de {t}! Lo gritó hasta el que vende choripanes.',
  '¡Gol de {t}! Y en la tribuna ya hay quien dice que lo vio venir.',
  '¡Gol de {t}! El arquero todavía busca la pelota en el córner equivocado.',
  '¡Gol de {t}! Se armó el desparramo.'
]
const STANCE_LINES = {
  PRESION: '{t} salió con presión alta, a morder en cada pelota.',
  EQUILIBRADO: '{t} se paró equilibrado, sin sacar los pies del plato.',
  CONTRA: '{t} se cerró atrás y esperó la contra.'
}
const HEADLINES_WIN = ['{w} se llevó el partido y la AFA pide revisar todo', '{w} ganó y nadie sabe bien cómo', '{w} se quedó con los tres puntos y un sobre sospechoso', 'Fiesta para {w}: {l} se fue masticando bronca']
const HEADLINES_DRAW = ['{h} y {a} se repartieron los puntos y las sospechas', 'Empate de manual entre {h} y {a}: todos conformes (dicen)']
const HEADLINES_NIL = ['{h} y {a} no se hicieron daño: el 0 a 0 más aburrido del año']

export function matchStory(f, { home, away }) {
  if (f.home_goals == null || f.away_goals == null) return { headline: '', lines: [] }
  const rand = seededRandom(`friend-story:${f.id}`)
  const lines = []
  for (const [team, stance] of [[home, f.home_stance], [away, f.away_stance]]) {
    const s = stanceById(stance)
    if (s) lines.push(STANCE_LINES[s.id].replace('{t}', team))
  }
  for (const g of [...(f.minutes || [])].sort((a, b) => a.m - b.m)) {
    lines.push(`${g.m}' ${pick(rand, GOAL_LINES).replace('{t}', g.s === 'H' ? home : away)}`)
  }
  const tied = f.home_goals === f.away_goals
  if (tied && f.winner_slot != null) {
    const homeWon = f.winner_slot === f.home_slot
    lines.push(`Se fueron a los penales y ganó ${homeWon ? home : away} por ${homeWon ? f.pens_home : f.pens_away} a ${homeWon ? f.pens_away : f.pens_home}.`)
  }
  lines.push(`Final: ${home} ${f.home_goals} - ${f.away_goals} ${away}.`)

  let headline
  if (f.home_goals === 0 && f.away_goals === 0 && f.winner_slot == null) headline = pick(rand, HEADLINES_NIL)
  else if (tied && f.winner_slot == null) headline = pick(rand, HEADLINES_DRAW)
  else {
    const homeWon = f.winner_slot != null ? f.winner_slot === f.home_slot : f.home_goals > f.away_goals
    headline = pick(rand, HEADLINES_WIN).replace('{w}', homeWon ? home : away).replace('{l}', homeWon ? away : home)
  }
  return { headline: headline.replace('{h}', home).replace('{a}', away), lines }
}
