/**
 * Rueda de prensa relámpago: cada pregunta tiene cuenta regresiva, la sala reacciona a cada respuesta y al final hay una
 * ronda de "Completá la frase del DT" con los clichés de siempre. Funciones puras.
 */
import { answerConsequences } from './press'
import { seededRandom } from './cupMatch'

export const PRESS_SECONDS = 12

/** Si se acaba el tiempo contestás nervioso: la respuesta más cauta (pragmática) o, si no hay, la última */
export function timeoutOption(options = []) {
  return options.find(o => o.tone === 'PRAGMATIC') || options[options.length - 1] || null
}

const REACTIONS = {
  W: {
    PRAISING: 'La sala asiente: palabras medidas para un buen día.',
    COMBATIVE: 'Algunos cronistas levantan las cejas: ganando, ¿para qué pelear?',
    SELF_CRITICAL: 'Raro: ganás y te exigís más. En el palco lo anotan con simpatía.',
    PRAGMATIC: 'Respuesta de manual. Nadie se enoja, nadie se acuerda.'
  },
  D: {
    PRAISING: 'La sala duda: ¿tanto elogio para un empate?',
    COMBATIVE: 'Se arma un murmullo. El periodista de al lado ya está escribiendo.',
    SELF_CRITICAL: 'Aplausos tímidos: reconocer que faltó es bien visto.',
    PRAGMATIC: 'Un punto es un punto, dicen todos al salir.'
  },
  L: {
    PRAISING: 'Los hinchas lo escuchan por la radio y agradecen que alguien los banque.',
    COMBATIVE: 'Un silencio incómodo. En la dirigencia nadie parpadea.',
    SELF_CRITICAL: 'La sala se calma: da la cara, y eso se valora.',
    PRAGMATIC: 'Respuesta fría tras una derrota: no suma ni resta, pero se nota.'
  }
}

/** Cómo reacciona la sala a una respuesta y qué pasa con la hinchada y la dirigencia (solo el signo: el monto lo calcula la API) */
export function roomReaction({ tone, outcome }) {
  const { fans, board } = answerConsequences({ tone, outcome })
  return {
    line: (REACTIONS[outcome] || REACTIONS.D)[tone] || 'La sala toma nota.',
    fans: Math.sign(fans),
    board: Math.sign(board)
  }
}

// Completá la frase del DT: en cada situación hay una frase de manual que cae bien (best), una pasable (ok) y una desubicada (bad)
const PROMPTS = {
  W: [
    { prompt: 'Después de ganar, el DT siempre dice: "Hay que ______."', options: [
      { text: 'seguir trabajando, esto recién empieza', fit: 'best', cliche: 'W1' },
      { text: 'festejar hasta el martes', fit: 'ok' },
      { text: 'pedirle perdón al rival por haberle ganado', fit: 'bad' }] },
    { prompt: 'Te preguntan por el rival: "Fue un partido ______."', options: [
      { text: 'muy parejo, ganamos por detalles', fit: 'best', cliche: 'W2' },
      { text: 'de otro planeta: les dimos una lección', fit: 'bad' },
      { text: 'raro, con la pelota quemando', fit: 'ok' }] },
    { prompt: 'Sobre el próximo partido: "Vamos ______."', options: [
      { text: 'partido a partido, sin mirar la tabla', fit: 'best', cliche: 'W3' },
      { text: 'a salir campeones, que lo anoten', fit: 'bad' },
      { text: 'con humildad y con ganas', fit: 'ok' }] },
    { prompt: 'Sobre el plantel: "Los muchachos ______."', options: [
      { text: 'entienden lo que les pido y lo hacen en la cancha', fit: 'best', cliche: 'W4' },
      { text: 'hacen lo que quieren, yo solo miro', fit: 'bad' },
      { text: 'merecen un asado', fit: 'ok' }] }
  ],
  D: [
    { prompt: 'Después de empatar, el DT dice: "Un punto ______."', options: [
      { text: 'que sirve, pero nos quedó gusto a poco', fit: 'best', cliche: 'D1' },
      { text: 'es un robo: merecíamos ganar por goleada', fit: 'bad' },
      { text: 'es un punto, nada más', fit: 'ok' }] },
    { prompt: 'Sobre el árbitro: "No quiero ______."', options: [
      { text: 'hablar del árbitro, hablemos de lo nuestro', fit: 'best', cliche: 'D2' },
      { text: 'dejar pasar que nos robaron, y lo voy a repetir', fit: 'bad' },
      { text: 'opinar, pero algo hay', fit: 'ok' }] },
    { prompt: 'Sobre el equipo: "Nos faltó ______."', options: [
      { text: 'ser más claros en el último pase', fit: 'best', cliche: 'D3' },
      { text: 'jugadores, directamente', fit: 'bad' },
      { text: 'un poco de suerte', fit: 'ok' }] },
    { prompt: 'Sobre la tabla: "Hay que ______."', options: [
      { text: 'sumar de a tres, que lo demás viene solo', fit: 'best', cliche: 'D4' },
      { text: 'empezar a mirar para abajo, che', fit: 'bad' },
      { text: 'no hacer cuentas', fit: 'ok' }] }
  ],
  L: [
    { prompt: 'Después de perder, el DT dice: "Hay que ______."', options: [
      { text: 'dar la cara, corregir y seguir', fit: 'best', cliche: 'L1' },
      { text: 'echarle la culpa al pasto', fit: 'bad' },
      { text: 'dar vuelta la página rápido', fit: 'ok' }] },
    { prompt: 'Te preguntan por el once: "Asumo ______."', options: [
      { text: 'la responsabilidad: la decisión fue mía', fit: 'best', cliche: 'L2' },
      { text: 'que los jugadores no estuvieron a la altura', fit: 'bad' },
      { text: 'que hay que hacer cambios', fit: 'ok' }] },
    { prompt: 'Sobre la hinchada: "Les pido ______."', options: [
      { text: 'que nos sigan bancando, los necesitamos', fit: 'best', cliche: 'L3' },
      { text: 'que no silben, que es peor', fit: 'bad' },
      { text: 'paciencia, nada más', fit: 'ok' }] },
    { prompt: 'Sobre tu futuro: "Estoy ______."', options: [
      { text: 'concentrado en el próximo partido, nada más', fit: 'best', cliche: 'L4' },
      { text: 'listo para irme si me lo piden, ya lo hablé con mi señora', fit: 'bad' },
      { text: 'tranquilo, trabajando', fit: 'ok' }] }
  ]
}

const FIT_FANS = { best: 1, ok: 0, bad: -1 }
const FIT_LINE = {
  best: 'La frase de manual: la sala sonríe y la hinchada la comparte.',
  ok: 'Pasable. Nadie se acuerda de lo que dijiste.',
  bad: 'Frase desubicada: el periodista ya preparó el titular.'
}

/** Ronda de "Completá la frase": una situación del resultado y tres opciones en orden mezclado. `rng` devuelve de 0 a 1. */
export function phraseRound(outcome, rng = Math.random) {
  const list = PROMPTS[outcome] || PROMPTS.D
  const round = list[Math.floor(rng() * list.length)]
  const options = round.options.map((o, i) => ({ ...o, key: `${i}` }))
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }
  return { prompt: round.prompt, options }
}

/** Efecto de la frase elegida: ±1 de hinchada y una línea para la sala */
export const phraseResult = (option) => ({ fans: FIT_FANS[option.fit] ?? 0, line: FIT_LINE[option.fit] || FIT_LINE.ok, cliche: option.fit === 'best' ? option.cliche || null : null })

// ---------------------------------------------------------------------------------------------------------------------
// Bingo del DT: una cartilla por temporada con 9 clichés. Cada vez que elegís la frase "de manual" se tacha el cliché
// (si está en tu cartilla). Línea completa: premio chico; cartilla llena: premio grande.

const capitalize = (text) => text[0].toUpperCase() + text.slice(1)

/** Los 12 clichés posibles: las frases de manual de la ronda de "Completá la frase" */
export const BINGO_CLICHES = Object.values(PROMPTS).flat().map(p => {
  const best = p.options.find(o => o.fit === 'best')
  return { id: best.cliche, text: capitalize(best.text) }
})

export const BINGO_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]

/** Cartilla de la temporada: 9 de los 12 clichés en un orden fijo para ese club y esa temporada */
export function bingoCard(seed) {
  const rand = seededRandom(`bingo:${seed}`)
  const ids = BINGO_CLICHES.map(c => c.id)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  return ids.slice(0, 9)
}

/** Líneas completas de la cartilla según los clichés tachados */
export function bingoLines(card, marks = []) {
  const marked = new Set(marks)
  return BINGO_LINES.filter(line => line.every(i => marked.has(card[i])))
}

/**
 * Tacha un cliché (si está en la cartilla y no estaba tachado) y calcula el premio de lo nuevo:
 * línea nueva +2 hinchada y +1 dirigencia; cartilla llena +4 y +2 extra.
 */
export function markCliche({ card, marks = [] }, cliche) {
  if (!cliche || !card.includes(cliche) || marks.includes(cliche)) return { marks, newLines: 0, full: false, reward: { fans: 0, board: 0 }, changed: false }
  const next = [...marks, cliche]
  const before = bingoLines(card, marks).length
  const after = bingoLines(card, next).length
  const full = next.filter(id => card.includes(id)).length === card.length
  const newLines = after - before
  const reward = { fans: newLines * 2 + (full ? 4 : 0), board: newLines + (full ? 2 : 0) }
  return { marks: next, newLines, full, reward, changed: true }
}

// ---------------------------------------------------------------------------------------------------------------------
// Titular o fake: tres titulares sobre tu club, uno es un rumor inventado. Marcarlo a tiempo es desmentirlo.

const FAKES = [
  ({ club }) => `${club} ficharía a una estrella europea por $5.000.000`,
  ({ club }) => `El DT de ${club} ya negocia con la selección`,
  () => 'Se suspende la próxima fecha por una invasión de patos en el predio',
  ({ club }) => `El presidente de ${club} anunció que el estadio tendrá techo retráctil`,
  ({ rival }) => `${rival} pidió que se repita el partido porque "no estaba listo"`,
  ({ club }) => `Un hincha de ${club} se casó en el círculo central con la pelota del partido`,
  ({ club }) => `${club} cambiará de camiseta por una a rayas amarillas y violetas`,
  () => 'La liga prohibiría los cantitos de cancha después de las diez de la noche'
]

/** Titular verdadero del resultado */
function resultHeadline({ club, rival, mine, theirs }) {
  if (mine > theirs) return `${club} le ganó ${mine}-${theirs} a ${rival}`
  if (mine < theirs) return `${club} cayó ${mine}-${theirs} ante ${rival}`
  return `${club} y ${rival} igualaron ${mine}-${theirs}`
}

/**
 * Ronda de "Titular o fake": dos titulares verdaderos (el resultado y otro dato del partido) y un rumor inventado, mezclados.
 * @returns {{ prompt: string, options: Array<{ key: string, text: string, fake: boolean }> }}
 */
export function headlineRound({ clubName = 'El club', rivalName = 'el rival', isHome = true, homeScore = 0, awayScore = 0, mvpName = null }, rng = Math.random) {
  const mine = isHome ? homeScore : awayScore
  const theirs = isHome ? awayScore : homeScore
  const ctx = { club: clubName, rival: rivalName }
  const second = mvpName
    ? `${mvpName} fue la figura del partido`
    : homeScore + awayScore >= 4 ? 'Partido de muchos goles' : homeScore + awayScore === 0 ? 'Partido cerrado, sin goles' : 'La fecha se jugó completa y sin suspensiones'
  const fake = FAKES[Math.floor(rng() * FAKES.length)](ctx)
  const options = [
    { text: resultHeadline({ ...ctx, mine, theirs }), fake: false },
    { text: second, fake: false },
    { text: fake, fake: true }
  ].map((o, i) => ({ ...o, key: `${i}` }))
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }
  return { prompt: 'Uno de estos titulares es un rumor inventado. ¿Cuál?', options }
}

/** Acertar es desmentir a tiempo (+1 dirigencia); errar deja correr el rumor (-1 hinchada) */
export const headlineResult = (option) => option.fake
  ? { correct: true, fans: 0, board: 1, line: 'Lo desmentiste a tiempo: la dirigencia lo valora.' }
  : { correct: false, fans: -1, board: 0, line: 'Ese era verdadero: el rumor de verdad siguió corriendo y la hinchada se confundió.' }
