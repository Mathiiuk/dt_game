/**
 * Rueda de prensa relámpago: cada pregunta tiene cuenta regresiva, la sala reacciona a cada respuesta y al final hay una
 * ronda de "Completá la frase del DT" con los clichés de siempre. Funciones puras.
 */
import { answerConsequences } from './press'

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
      { text: 'seguir trabajando, esto recién empieza', fit: 'best' },
      { text: 'festejar hasta el martes', fit: 'ok' },
      { text: 'pedirle perdón al rival por haberle ganado', fit: 'bad' }] },
    { prompt: 'Te preguntan por el rival: "Fue un partido ______."', options: [
      { text: 'muy parejo, ganamos por detalles', fit: 'best' },
      { text: 'de otro planeta: les dimos una lección', fit: 'bad' },
      { text: 'raro, con la pelota quemando', fit: 'ok' }] },
    { prompt: 'Sobre el próximo partido: "Vamos ______."', options: [
      { text: 'partido a partido, sin mirar la tabla', fit: 'best' },
      { text: 'a salir campeones, que lo anoten', fit: 'bad' },
      { text: 'con humildad y con ganas', fit: 'ok' }] },
    { prompt: 'Sobre el plantel: "Los muchachos ______."', options: [
      { text: 'entienden lo que les pido y lo hacen en la cancha', fit: 'best' },
      { text: 'hacen lo que quieren, yo solo miro', fit: 'bad' },
      { text: 'merecen un asado', fit: 'ok' }] }
  ],
  D: [
    { prompt: 'Después de empatar, el DT dice: "Un punto ______."', options: [
      { text: 'que sirve, pero nos quedó gusto a poco', fit: 'best' },
      { text: 'es un robo: merecíamos ganar por goleada', fit: 'bad' },
      { text: 'es un punto, nada más', fit: 'ok' }] },
    { prompt: 'Sobre el árbitro: "No quiero ______."', options: [
      { text: 'hablar del árbitro, hablemos de lo nuestro', fit: 'best' },
      { text: 'dejar pasar que nos robaron, y lo voy a repetir', fit: 'bad' },
      { text: 'opinar, pero algo hay', fit: 'ok' }] },
    { prompt: 'Sobre el equipo: "Nos faltó ______."', options: [
      { text: 'ser más claros en el último pase', fit: 'best' },
      { text: 'jugadores, directamente', fit: 'bad' },
      { text: 'un poco de suerte', fit: 'ok' }] },
    { prompt: 'Sobre la tabla: "Hay que ______."', options: [
      { text: 'sumar de a tres, que lo demás viene solo', fit: 'best' },
      { text: 'empezar a mirar para abajo, che', fit: 'bad' },
      { text: 'no hacer cuentas', fit: 'ok' }] }
  ],
  L: [
    { prompt: 'Después de perder, el DT dice: "Hay que ______."', options: [
      { text: 'dar la cara, corregir y seguir', fit: 'best' },
      { text: 'echarle la culpa al pasto', fit: 'bad' },
      { text: 'dar vuelta la página rápido', fit: 'ok' }] },
    { prompt: 'Te preguntan por el once: "Asumo ______."', options: [
      { text: 'la responsabilidad: la decisión fue mía', fit: 'best' },
      { text: 'que los jugadores no estuvieron a la altura', fit: 'bad' },
      { text: 'que hay que hacer cambios', fit: 'ok' }] },
    { prompt: 'Sobre la hinchada: "Les pido ______."', options: [
      { text: 'que nos sigan bancando, los necesitamos', fit: 'best' },
      { text: 'que no silben, que es peor', fit: 'bad' },
      { text: 'paciencia, nada más', fit: 'ok' }] },
    { prompt: 'Sobre tu futuro: "Estoy ______."', options: [
      { text: 'concentrado en el próximo partido, nada más', fit: 'best' },
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
export const phraseResult = (option) => ({ fans: FIT_FANS[option.fit] ?? 0, line: FIT_LINE[option.fit] || FIT_LINE.ok })
