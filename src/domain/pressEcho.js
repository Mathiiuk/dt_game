// El eco de la prensa: lo que dijiste en la conferencia vuelve como una historia corta (un evento con decisión).
// Reglas puras, sin acceso a datos. Solo los tonos con carácter dejan eco: el pragmático no da de qué hablar.
// Efectos de las opciones, como en el resto de los eventos: fans, board, locker (vestuario), morale, reputation.

export const ECHO_CODE_PREFIX = 'EVT_PRESS_ECHO_'
export const echoCode = (tone) => `${ECHO_CODE_PREFIX}${tone}`

/** Probabilidad de que lo dicho tenga eco: lo combativo siempre corre más que lo prolijo */
export const ECHO_CHANCE = { COMBATIVE: 0.7, PRAISING: 0.45, SELF_CRITICAL: 0.45, PRAGMATIC: 0 }
export const echoChance = (tone) => ECHO_CHANCE[tone] ?? 0

const AFTER = { W: 'la victoria', L: 'la derrota', D: 'el empate' }
const MAX_QUOTE = 90

/** La frase entre comillas, recortada para que entre en la historia */
export const shortQuote = (text = '') => {
  const clean = String(text).replace(/\s+/g, ' ').trim()
  return clean.length > MAX_QUOTE ? `${clean.slice(0, MAX_QUOTE - 1).trimEnd()}…` : clean
}

const opt = (id, label, description, effects) => ({ id, label, description, cost: 0, effects })

/**
 * Arma el evento de eco de una respuesta, o null si ese tono no deja eco.
 * `journalist` y `outlet` son los del club (recurrentes); `rival` es el rival de ese partido.
 */
export function pressEcho({ tone, outcome = 'D', journalist = 'Un periodista', outlet = 'la prensa', quote = '', rival = 'el rival' } = {}) {
  const said = shortQuote(quote)
  const after = AFTER[outcome] || AFTER.D
  const base = { template_code: echoCode(tone), category: 'BOARD_PRESS', severity: 'MEDIUM' }

  if (tone === 'COMBATIVE') {
    return {
      ...base,
      title: `${outlet} puso tu frase en tapa`,
      description: `Después de ${after}, ${journalist}, de ${outlet}, publicó lo que dijiste: “${said}”. En ${rival} ya lo leyeron, y en el vestuario también.`,
      options: [
        opt('DOUBLE_DOWN', 'Sostener lo dicho', 'No retrocedés ni un paso. A la gente le gusta, a la dirigencia no tanto.', { locker: 4, fans: 3, board: -3, reputation: 0.5 }),
        opt('CLARIFY', 'Aclarar que fue sacado de contexto', 'Bajás el tono. Algunos lo leen como un paso atrás.', { board: 2, fans: -1, locker: -1 }),
        opt('IGNORE', 'No responder', 'Dejás que se enfríe solo.', { locker: 1 })
      ]
    }
  }
  if (tone === 'PRAISING') {
    return {
      ...base,
      title: 'El elogio se les subió a la cabeza',
      description: `Dijiste: “${said}”. Desde entonces un par de jugadores caminan distinto por el predio y ${journalist}, de ${outlet}, quiere volver sobre el tema.`,
      options: [
        opt('KEEP_FEET', 'Bajarlos a tierra en el vestuario', 'Una charla corta y seria. A nadie le gusta, a todos les sirve.', { morale: -2, locker: 3, board: 1 }),
        opt('ENJOY', 'Dejar que disfruten el momento', 'El plantel va contento. Mañana se verá si se relajan.', { morale: 4, locker: -3, fans: 1 }),
        opt('ASK_CALM', `Pedirle a ${journalist} que no exagere`, 'Un favor chico que a la prensa le cuesta olvidar.', { board: 1, reputation: -0.5 })
      ]
    }
  }
  if (tone === 'SELF_CRITICAL') {
    return {
      ...base,
      title: 'El plantel escuchó tu autocrítica',
      description: `Dijiste en ${outlet}: “${said}”. En el vestuario hay quienes valoran que cargues con la culpa y quienes sienten que los dejaste expuestos.`,
      options: [
        opt('BACK_TEAM', 'Juntar al plantel y respaldarlos', 'Les decís en la cara que los bancás. Se nota.', { morale: 3, locker: 4, board: -1 }),
        opt('KEEP_LINE', 'Mantener la línea: la culpa es tuya', 'Coherente con lo que dijiste. La dirigencia lo agradece.', { board: 2, fans: 1, locker: -2 }),
        opt('DEMAND_MORE', 'Exigir más puertas adentro', 'Si el error es de todos, el trabajo también.', { morale: -3, locker: 2, board: 2 })
      ]
    }
  }
  return null
}

/** Si lo dicho tiene eco esta vez (el azar se inyecta para poder probarlo) */
export const hasEcho = (tone, rng = Math.random) => rng() < echoChance(tone)
