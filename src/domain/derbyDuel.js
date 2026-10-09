// Duelo de bocones: antes de un clásico, el DT rival tira tres declaraciones y el DT elige cómo contestar.
// Reglas puras. Cada tipo de provocación tiene una respuesta que gana, una que empata y una que cae en la trampa.
// El resultado mueve un poco la moral del plantel y deja una línea en el relato; el partido en sí no se toca.

export const DUEL_ROUNDS = 3
export const DERBY_MODULUS = 7 // de cada 7 rivales, uno es clásico (unos 2 o 3 por liga de 19)

/** Hash estable de un texto (el mismo par de clubes da siempre lo mismo) */
const hash = (text = '') => { let h = 5381; for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0; return h }

/** ¿Es clásico? Sale del par de clubes, no del orden: ida y vuelta son igual de picantes */
export function isDerby(clubId, rivalId) {
  if (!clubId || !rivalId || clubId === rivalId) return false
  return hash([String(clubId), String(rivalId)].sort().join('|')) % DERBY_MODULUS === 0
}

/** ¿El partido (con sus dos clubes) es un clásico? Sin partido o sin alguno de los dos clubes, no */
export function fixtureIsDerby(fixture, clubId) {
  if (!fixture || !clubId) return false
  const rivalId = fixture.home_team_id === clubId ? fixture.away_team_id : fixture.home_team_id
  return isDerby(clubId, rivalId)
}

export const TONES = ['BRAVE', 'COOL', 'RESPECT']
export const TONE_LABEL = { BRAVE: 'Plantarse', COOL: 'Con calma', RESPECT: 'Con respeto' }

/** Qué tipo de provocación es cada ronda y cuánto vale cada respuesta (+1 gana, 0 empata, -1 cae en la trampa) */
export const JAB_TYPES = ['PROVOKE', 'MIND_GAME', 'FLATTERY']
const SCORE = {
  PROVOKE: { COOL: 1, RESPECT: 0, BRAVE: -1 }, // la provocación directa se contesta sin morder el anzuelo
  MIND_GAME: { BRAVE: 1, COOL: 0, RESPECT: -1 }, // el juego mental se contesta con carácter
  FLATTERY: { RESPECT: 1, BRAVE: 0, COOL: -1 } // el elogio falso se devuelve con respeto; ignorarlo es soberbia
}

export const scoreAnswer = (type, tone) => SCORE[type]?.[tone] ?? 0

const JABS = {
  PROVOKE: [
    '{rival}: «Dicen que tu equipo llega con miedo. Normal: acá se pierde la categoría.»',
    '{rival}: «Los clásicos no se juegan, se ganan. Y ustedes no saben ganar.»',
    '{rival}: «Ojalá traigan a los hinchas, así tienen a quién saludar cuando se vayan perdiendo.»'
  ],
  MIND_GAME: [
    '{rival}: «Ya sabemos cómo van a jugar. Les hicimos la tarea de memoria.»',
    '{rival}: «Tengo un par de sorpresas para el domingo. A vos te falta plantel para las tuyas.»',
    '{rival}: «Pregúntenle a su técnico por qué todavía no ganó nada en un clásico.»'
  ],
  FLATTERY: [
    '{rival}: «Qué lindo equipo el tuyo, de verdad. Es una pena que los clásicos pesen tanto.»',
    '{rival}: «Te admiro, DT. Por eso me da pena lo que les vamos a hacer.»',
    '{rival}: «Ustedes ya hicieron mucho con lo que tienen. Mañana pueden relajarse, que no pasa nada.»'
  ]
}

const REPLIES = {
  BRAVE: ['Que vengan. En la cancha hablamos.', 'Si quieren pelea, la tienen. Nosotros no nos escondemos.', 'Me quedo tranquilo: mis jugadores no le temen a nadie.'],
  COOL: ['Cada uno habla de lo suyo. Yo me ocupo de mi equipo.', 'Gracias por la preocupación. Nos vemos el domingo.', 'No voy a entrar en ese juego. Hablamos después del partido.'],
  RESPECT: ['Es un gran rival y lo respetamos. Va a ser un lindo partido.', 'Les deseo suerte, pero la vamos a pelear hasta el final.', 'Aprecio sus palabras. Vamos a dar lo mejor, como siempre.']
}

const shuffle = (list, rng) => {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(rng() * (i + 1))); [out[i], out[j]] = [out[j], out[i]] }
  return out
}
const pick = (list, rng) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))]

/** Las tres rondas: cada tipo de provocación una vez, en orden al azar, con una frase al azar y tres respuestas */
export function buildDuel(rivalName = 'El técnico rival', rng = Math.random) {
  return shuffle(JAB_TYPES, rng).map(type => ({
    type,
    jab: pick(JABS[type], rng).replace('{rival}', rivalName),
    options: TONES.map(tone => ({ tone, label: TONE_LABEL[tone], text: pick(REPLIES[tone], rng) }))
  }))
}

/** Gana el duelo quien suma 2 o más, lo pierde quien queda en -2 o menos */
export function duelOutcome(scores = []) {
  const total = scores.reduce((n, s) => n + s, 0)
  return { total, result: total >= 2 ? 'WIN' : total <= -2 ? 'LOSE' : 'DRAW' }
}

export const DUEL_MORALE = { WIN: 3, DRAW: 0, LOSE: -2 }

/** La línea que queda en el relato al arrancar el clásico */
export function duelKickoffLine(result, rivalName = 'el rival') {
  if (result === 'WIN') return `Clásico con ambiente: ganaste el duelo de declaraciones y el plantel sale con el pecho inflado. ${rivalName} salió con una sonrisa forzada.`
  if (result === 'LOSE') return `Clásico con ambiente: ${rivalName} ganó la guerra de declaraciones y en el vestuario se nota la bronca.`
  return `Clásico con ambiente: las declaraciones con ${rivalName} quedaron parejas. Ahora habla la pelota.`
}
