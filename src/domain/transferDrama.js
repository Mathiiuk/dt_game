/**
 * Pedido de salida con ruido: cuando llega una oferta por uno de tus jugadores, su representante puede hacer lío.
 * Cuanto más hostil o codicioso es, más probable. El DT decide entre escuchar, mejorarle el contrato o plantarse. Funciones puras.
 */

const DRAMA_CHANCE = { AGGRESSIVE: 0.7, GREEDY: 0.55, FAIR: 0.25, PROTECTIVE: 0.15 }
const NO_AGENT_CHANCE = 0.2

export const WAGE_RAISE = 1.15

/** Probabilidad de que el representante haga ruido por una oferta, según su carácter */
export const dramaChance = (personality) => DRAMA_CHANCE[personality] ?? NO_AGENT_CHANCE

export const transferDramaCode = (playerId) => `EVT_TRANSFER_DRAMA_${playerId}`

const money = (n) => `$${Math.round(n).toLocaleString('es-AR')}`

const STORIES = {
  AGGRESSIVE: ({ agent, player, buyer, amount }) =>
    `${agent} filtró a la prensa que ${buyer} ofreció ${money(amount)} por ${player} y que "acá no lo valoran". {periodista} ya lo publicó y en el vestuario no se habla de otra cosa.`,
  GREEDY: ({ agent, player, buyer, amount }) =>
    `${agent} te llama a las once de la noche: ${buyer} ofreció ${money(amount)} por ${player}, y él "tiene que pensar en el futuro de su representado". Se entiende perfecto que el futuro tiene un número con muchos ceros.`,
  FAIR: ({ agent, player, buyer, amount }) =>
    `${agent} pide verte: ${buyer} ofreció ${money(amount)} por ${player}. Sin dramas, solo quiere saber qué piensa el club antes de que se entere todo el barrio.`,
  PROTECTIVE: ({ agent, player, buyer, amount }) =>
    `${agent} se acerca con cara de preocupación: ${buyer} ofreció ${money(amount)} por ${player}, y la familia quiere saber si en el club lo cuidan y le dan minutos.`,
  DEFAULT: ({ agent, player, buyer, amount }) =>
    `${agent} se hace presente en el predio: ${buyer} ofreció ${money(amount)} por ${player} y quiere saber qué piensa el club.`
}

/**
 * Evento del pedido de salida. `wage` es el sueldo semanal actual del jugador.
 * Las opciones llevan `player_id` y una acción (`RAISE_WAGE`, `PLAYER_UNHAPPY`) que resuelve el servidor.
 */
export function transferDramaTemplate({ playerId, playerName, agentName = 'El representante', personality = null, buyerName = 'Un club', amount = 0, wage = 100 }) {
  const story = (STORIES[personality] || STORIES.DEFAULT)({ agent: agentName, player: playerName, buyer: buyerName, amount })
  const raised = Math.round(wage * WAGE_RAISE)
  return {
    template_code: transferDramaCode(playerId),
    title: `El representante de ${playerName} hace ruido`,
    description: story,
    category: 'BOARD_PRESS',
    severity: 'MEDIUM',
    options: [
      {
        id: 'LISTEN',
        label: 'Escuchar la oferta sin comprometerte',
        description: 'La oferta sigue sobre la mesa unas semanas. Vos decidís si la aceptás.',
        cost: 0,
        effects: {}
      },
      {
        id: 'RAISE',
        label: `Mejorarle el contrato (de ${money(wage)} a ${money(raised)} por semana)`,
        description: 'Se calma, rinde mejor y se queda contento. La masa salarial sube y los demás se enteran.',
        cost: 0,
        effects: { action: 'RAISE_WAGE', player_id: playerId, locker: -1 }
      },
      {
        id: 'STAND_FIRM',
        label: 'Plantarte: no se vende',
        description: 'La hinchada lo aplaude, pero el jugador se queda con la cabeza en otro lado y el representante no te lo va a olvidar.',
        cost: 0,
        effects: { action: 'PLAYER_UNHAPPY', player_id: playerId, fans: 2, locker: -1 }
      }
    ]
  }
}
