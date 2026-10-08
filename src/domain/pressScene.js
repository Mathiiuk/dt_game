/**
 * La sala de prensa como escena: cada periodista tiene su carácter (amable, picante o chismoso), la sala tiene un humor
 * que sube y baja con lo que contestás y hay una ronda relámpago de sí o no. Funciones puras.
 */

const hash = (str) => { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }

const MOODS = [
  { id: 'AMABLE', icon: 'Smile', label: 'Amable', intros: ['se acomoda el micrófono y sonríe', 'te saluda con la mano antes de preguntar', 'te guiña un ojo: "tranquilo, es una fácil"'] },
  { id: 'PICANTE', icon: 'Flame', label: 'Picante', intros: ['levanta una ceja y afila el lápiz', 'se inclina hacia adelante con cara de "ahora sí"', 'tose fuerte para que todos presten atención'] },
  { id: 'CHISMOSO', icon: 'Search', label: 'Chismoso', intros: ['mira su libreta y baja la voz', 'dice "no es por meterme, pero..."', 'susurra algo al de al lado y te apunta con el dedo'] }
]

/** Carácter del periodista (estable para el mismo nombre) y una frase de entrada */
export function reporterOf(name = '', salt = 0) {
  const mood = MOODS[hash(name) % MOODS.length]
  return { mood: mood.id, label: mood.label, icon: mood.icon, intro: mood.intros[(hash(name) + salt) % mood.intros.length] }
}

/** Cara y gesto de la sala tras una respuesta, según cómo cayó (fans/board en -1, 0 o 1) */
export function roomFace({ fans = 0, board = 0 } = {}) {
  const score = fans + board
  if (score >= 2) return { icon: 'PartyPopper', label: 'Aplausos' }
  if (score === 1) return { icon: 'Smile', label: 'Asienten' }
  if (score === 0) return { icon: 'Meh', label: 'Silencio' }
  if (score === -1) return { icon: 'Annoyed', label: 'Murmullos' }
  return { icon: 'Angry', label: 'Abucheo' }
}

/** Humor de la sala (0 a 100): arranca neutro y se mueve con cada reacción */
export const nextRoomMood = (mood, { fans = 0, board = 0 } = {}) => Math.max(0, Math.min(100, mood + fans * 14 + board * 9))

export const TONE_ICON = { PRAISING: 'ThumbsUp', COMBATIVE: 'Flame', SELF_CRITICAL: 'ScanFace', PRAGMATIC: 'Brain' }

const Q = (prompt, yes, no) => ({ prompt, yes, no })
const POOL = [
  Q('¿Es cierto que el utilero arma la formación cuando usted no mira?', { line: 'La sala estalla de risa. El utilero ya pidió aumento.', fans: 1 }, { line: 'Respuesta seca. Alguien tose.', fans: 0 }),
  Q('¿Va a comer asado con el plantel si ganan el domingo?', { line: '"¡Con chimichurri!", grita alguien del fondo.', fans: 1 }, { line: 'Los muchachos se enteran por la tele y no les gusta.', fans: -1 }),
  Q('¿Cree que el árbitro de hoy necesita anteojos?', { line: 'Se arma un escándalo y la dirigencia se agarra la cabeza.', fans: -1 }, { line: 'Muy diplomático. Aplausos tibios.', fans: 1 }),
  Q('¿Le sacaría la cinta de capitán al que se quejó en el banco?', { line: 'El vestuario va a leer esto en el celular. Con cuidado.', fans: -1 }, { line: 'Prefiere hablarlo adentro. La tribuna lo valora.', fans: 1 }),
  Q('¿Se animaría a jugar un partido de potrero con los periodistas?', { line: 'La sala aplaude de pie. Alguien ya trae las zapatillas.', fans: 1 }, { line: '"Qué aburrido", susurra el de la radio.', fans: 0 }),
  Q('¿Le debe una disculpa al hincha que dejó de ir a la cancha?', { line: 'Humildad pura. Un jubilado se emociona en la tercera fila.', fans: 1 }, { line: 'La popular se entera y silba un poquito.', fans: -1 }),
  Q('¿Es verdad que duerme con la pizarra táctica debajo de la almohada?', { line: 'Todos ríen. Mañana sale en el diario con foto trucada.', fans: 1 }, { line: 'Nadie le cree, pero queda el misterio.', fans: 0 }),
  Q('¿Cree que ya es candidato a salir campeón?', { line: '"¡Que lo anoten!", grita uno. La dirigencia se pone nerviosa.', fans: -1 }, { line: 'Pies en la tierra. A los hinchas les encanta.', fans: 1 }),
  Q('¿Le aguanta la mirada a un presidente que pide resultados?', { line: 'Se hace un silencio digno de película.', fans: 0 }, { line: 'Mirada baja y sonrisa nerviosa: el presidente toma nota.', fans: -1 }),
  Q('¿Cantaría el himno del club acá mismo?', { line: 'Canta desafinado pero con alma. La sala corea.', fans: 1 }, { line: 'Se hace el distraído. Los periodistas se burlan.', fans: 0 })
]

/** Tres preguntas de sí o no, distintas en cada conferencia */
export function lightningRound(rng = Math.random, count = 3) {
  const pool = [...POOL]
  const out = []
  while (out.length < count && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  return out
}

/** Suma de la ronda: nunca más de 2 puntos de hinchada para arriba o para abajo */
export const lightningTotal = (answers = []) => Math.max(-2, Math.min(2, answers.reduce((n, a) => n + (a?.fans || 0), 0)))

/** Respuesta si se acaba el tiempo: sin comentarios */
export const LIGHTNING_TIMEOUT = { line: 'Se quedó callado y la sala murmura. Mejor decir algo.', fans: 0 }
