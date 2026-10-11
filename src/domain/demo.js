/**
 * Demo de Vestuario (sin cuenta, sin base de datos): "Tu primer día como DT". Tres decisiones bizarras mueven cuatro medidores,
 * con eso se juega un partido (relato con jugadas) y un penal final; al cierre salen los titulares del día siguiente.
 * Todo es ficticio y determinista (misma partida, mismo resultado). Funciones puras.
 */
import { seededRandom } from './cupMatch'
import { rivalNames } from './rivalNames'

export const DEMO_CLUB = 'Potrero Unidos'
const RIVALS = ['Atlético Los Ñandúes', 'Sportivo Cañada Seca', 'Unión Barrio Sur', 'Defensores de la Siesta']

export const DEMO_START = Object.freeze({ caja: 50, barra: 50, dirigencia: 50, vestuario: 50, suerte: 0 })

export const METERS = [
  { key: 'caja', label: 'Caja' },
  { key: 'barra', label: 'Barra' },
  { key: 'dirigencia', label: 'Dirigencia' },
  { key: 'vestuario', label: 'Vestuario' }
]

export const DEMO_DECISIONS = [
  {
    id: 'barra',
    title: 'La barra te espera en la puerta',
    text: 'Faltan dos horas para el partido. Tres muchachos con bombo y un cartel de "Aguante el DT (si gana)" te frenan en la entrada del club.',
    options: [
      { id: 'entradas', label: 'Les das 20 entradas', effects: { barra: 20, caja: -10, dirigencia: -5 }, reaction: 'Aplausos, cánticos y una factura de la secretaría que nadie quiere firmar.' },
      { id: 'no-cedes', label: 'Los saludás y no cedés', effects: { barra: -10, vestuario: 5, dirigencia: 5 }, reaction: 'Uno de ellos anotó tu patente. "Es por si hace falta mandarte una postal".' },
      { id: 'asado', label: 'Los invitás a un asado', effects: { barra: 10, caja: -5, vestuario: 5 }, reaction: 'Se comieron hasta el chorizo del utilero. Prometieron cantar toda la tarde.' }
    ]
  },
  {
    id: 'sobre',
    title: 'El dirigente y el sobre',
    text: 'El vicepresidente te lleva a un costado y te muestra un sobre abultado. "Es para los viáticos", dice, mirando para otro lado.',
    options: [
      { id: 'aceptas', label: 'Aceptás el sobre', effects: { caja: 25, dirigencia: -15, vestuario: -10 }, reaction: 'La caja respira. Tu conciencia, un poquito menos. "Nunca vi ese sobre", dijo alguien.' },
      { id: 'devolves', label: 'Lo devolvés con una sonrisa', effects: { dirigencia: 10, caja: -5 }, reaction: 'El vice se lo guardó rápido. Te miraba como si le hubieras robado el postre.' },
      { id: 'conferencia', label: 'Lo mostrás en la conferencia', effects: { barra: 15, dirigencia: -25, vestuario: 5 }, reaction: 'La hinchada ovacionó. En el palco se atragantaron con un sándwich de miga.' }
    ]
  },
  {
    id: 'arbitro',
    title: 'El árbitro te saluda de más',
    text: 'El árbitro del partido te abraza en el túnel y te susurra: "Cualquier cosa, yo estoy para ayudar". Todavía lleva puesta la camiseta del rival.',
    options: [
      { id: 'camiseta', label: 'Le regalás una camiseta firmada', effects: { suerte: 2, dirigencia: -5, caja: -5 }, reaction: 'Se la puso debajo del uniforme. Dice que te va a "tener presente".' },
      { id: 'ignoras', label: 'Lo ignorás', effects: { vestuario: 5 }, reaction: 'Se quedó con la mano en el aire. Los jugadores vieron la escena y se rieron.' },
      { id: 'denuncias', label: 'Lo denunciás ante el delegado', effects: { suerte: -2, barra: 5, dirigencia: 5 }, reaction: 'Te anotaron en un cuaderno. El árbitro ahora te mira con mucha atención.' }
    ]
  }
]

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export function applyEffects(stats, effects = {}) {
  const next = { ...stats }
  for (const [key, delta] of Object.entries(effects)) {
    next[key] = key === 'suerte' ? clamp((next[key] || 0) + delta, -2, 2) : clamp((next[key] || 0) + delta, 0, 100)
  }
  return next
}

const CHIP_LABELS = { caja: 'Caja', barra: 'Barra', dirigencia: 'Dirigencia', vestuario: 'Vestuario', suerte: 'Árbitro' }
const CHIP_ORDER = ['caja', 'barra', 'dirigencia', 'vestuario', 'suerte']

/** Qué cambió con una decisión, para mostrarlo como etiquetas */
export const chipsFor = (effects = {}) => CHIP_ORDER.filter(k => effects[k]).map(k => ({ key: k, label: CHIP_LABELS[k], delta: effects[k] }))

/** Fuerza del equipo: el vestuario unido y la hinchada empujan; la dirigencia casi no juega */
export const teamStrength = (stats) => 50 + (stats.vestuario - 50) * 0.3 + (stats.barra - 50) * 0.15 + (stats.dirigencia - 50) * 0.05

const poisson = (rand, lambda) => {
  const limit = Math.exp(-lambda)
  let k = 0
  let p = 1
  do { k++; p *= rand() } while (p > limit && k < 8)
  return Math.min(6, k - 1)
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)]

const FILLER = [
  'El Potrero se la banca: córner y mucho barro en la pelota.',
  'Del banco gritan tanto que el árbitro les pide que se calmen.',
  'Se pierde un gol increíble. Hasta el que vende choripanes se agarró la cabeza.',
  'Pelota al palo y el dirigente del palco cambia de color.',
  'Falta fuerte en el medio: el árbitro no cobra nada y mira el reloj.',
  'Atajada notable. En la tribuna cantan el nombre del arquero.',
  'Un hincha invade la cancha con una bandera y se lleva el aplauso.'
]

export function playDemoMatch(seed, stats) {
  const rand = seededRandom(`demo:${seed}`)
  const str = teamStrength(stats)
  const edge = (str - 50) * 0.025 + (stats.suerte || 0) * 0.35
  const me = poisson(rand, clamp(1.3 + edge, 0.3, 3.2))
  const rival = poisson(rand, clamp(1.3 - edge, 0.3, 3.2))
  const rivalName = pick(rand, RIVALS)
  const mine = rivalNames(`${seed}:me`, 11)
  const theirs = rivalNames(`${seed}:rival`, 11)
  const name = (n) => `${n.first_name} ${n.last_name}`

  const events = []
  const used = new Set([1, 90])
  const minute = () => { let m; do { m = 3 + Math.floor(rand() * 86) } while (used.has(m)); used.add(m); return m }
  events.push({ minute: 1, type: 'start', text: `Arranca el partido entre ${DEMO_CLUB} y ${rivalName}. El árbitro ya te guiñó un ojo.` })
  for (let i = 0; i < me; i++) events.push({ minute: minute(), type: 'goal-me', text: `¡GOOOL de ${DEMO_CLUB}! ${name(mine[1 + Math.floor(rand() * 10)])} la manda adentro y el banco explota.` })
  for (let i = 0; i < rival; i++) events.push({ minute: minute(), type: 'goal-rival', text: `Gol de ${rivalName}: ${name(theirs[1 + Math.floor(rand() * 10)])} aprovecha un rebote. En el palco, silencio sepulcral.` })
  for (let i = 0; i < 3; i++) events.push({ minute: minute(), type: 'play', text: pick(rand, FILLER) })
  events.sort((a, b) => a.minute - b.minute)
  events.push({ minute: 90, type: 'end', text: `Final: ${DEMO_CLUB} ${me} - ${rival} ${rivalName}.` })
  return { club: DEMO_CLUB, rival: rivalName, score: { me, rival }, events, shooter: name(mine[10]), seed }
}

/** El penal del final: sale bien con una buena barra (calidad desde 0,55) */
export function applyPenalty(match, quality) {
  const scored = quality >= 0.55
  const score = { me: match.score.me + (scored ? 1 : 0), rival: match.score.rival }
  const events = match.events.filter(e => e.type !== 'end')
  events.push(scored
    ? { minute: 91, type: 'penalty-goal', text: `¡Penal de ${match.shooter}! La clavó en el ángulo y el Potrero se vuelve loco.` }
    : { minute: 91, type: 'penalty-miss', text: `Penal de ${match.shooter}... ¡al medio de la tribuna! Hasta el árbitro se rió.` })
  events.push({ minute: 93, type: 'end', text: `Final: ${DEMO_CLUB} ${score.me} - ${score.rival} ${match.rival}.` })
  return { ...match, score, events, penalty: scored ? 'goal' : 'miss' }
}

const WIN = ['Debut de película', 'Una tarde para enmarcar', 'El Potrero tiene DT']
const DRAW = ['Empate con sabor a escándalo', 'Un punto y mil rumores', 'Nadie ganó, todos hablan']
const LOSS = ['Debut con tormenta', 'Una derrota que se discute en la peluquería', 'Se pinchó la pelota']

export function headlines({ match, stats }) {
  const rand = seededRandom(`headline:${match.seed}`)
  const { me, rival } = match.score
  const result = me > rival
    ? `${pick(rand, WIN)}: ${match.club} ${me}, ${rival} ${match.rival}`
    : me === rival
      ? `${pick(rand, DRAW)}: ${match.club} ${me}, ${rival} ${match.rival}`
      : `${pick(rand, LOSS)}: ${match.club} ${me}, ${rival} ${match.rival}`
  const extremes = ['caja', 'barra', 'dirigencia', 'vestuario'].sort((a, b) => Math.abs(stats[b] - 50) - Math.abs(stats[a] - 50))
  const k = extremes[0]
  const high = stats[k] >= 50
  const LINES = {
    caja: [['Se pagó el viaje del equipo con la rifa del club'], ['Milagro en las cuentas: apareció plata de un origen que nadie quiere preguntar']],
    barra: [['La barra juró venganza: "a este DT no lo saludamos más"'], ['La barra copó el club y pidió figurar en el cuerpo técnico']],
    dirigencia: [['El vicepresidente jura que "nunca vio ningún sobre" y pide que no se hable más'], ['La dirigencia respira tranquila: "este DT no da problemas (todavía)"']],
    vestuario: [['Clima raro en el vestuario: dos jugadores se miran de reojo'], ['Vestuario unido: hubo asado y hasta el utilero cantó']]
  }
  const second = pick(rand, LINES[k][high ? 1 : 0])
  const third = stats.suerte > 0
    ? 'Polémica: el árbitro se fue del estadio con una camiseta firmada bajo el brazo'
    : stats.suerte < 0
      ? 'El árbitro denunciado aseguró que "a mí no me regalan nada" y pidió custodia policial'
      : 'El árbitro se fue sin hacer declaraciones (ni preguntas)'
  return [result, second, third]
}

export function verdictFor(match, stats) {
  const { me, rival } = match.score
  const list = me > rival ? WIN : me === rival ? DRAW : LOSS
  const title = list[(me + rival) % list.length]
  const base = me > rival
    ? 'Ganaste en tu primer día y la hinchada ya canta tu nombre.'
    : me === rival
      ? 'Te vas con un punto y con más preguntas que respuestas.'
      : 'Perdiste, pero en el fútbol siempre hay revancha.'
  const extra = stats.dirigencia <= 30 ? ' La dirigencia ya está hablando de tu continuidad.' : stats.barra >= 70 ? ' La barra te quiere tanto que da un poco de miedo.' : stats.caja <= 30 ? ' La caja está flaca: habrá que ajustar el cinturón.' : ''
  return { title, text: base + extra }
}
