/**
 * Eventos que dependen del clima del club. Tono sobrio: se sugiere más de lo que se muestra, y la corrupción
 * aparece como trámite administrativo, no como mafia de película.
 *
 * Efectos de cada opción (todos opcionales): budget, fans, board, locker (moral del vestuario), morale (moral de cada
 * jugador), reputation, barra (escalones, positivo sube), favors (favores aceptados), board_owed (favores que le debés
 * a la dirigencia), board_set (fija la confianza), action (DENOUNCE, RESIGN, GAMBLE_DISMISSAL).
 * `requires` condiciona una opción: { board: 55 } pide confianza mínima de la dirigencia.
 */

const barraOptions = ({ cede, refuse, board, denounce }) => [
  {
    id: 'CEDE',
    label: cede.label,
    description: cede.description,
    cost: cede.cost,
    effects: { fans: -1, locker: 3, favors: 1, barra: -1 }
  },
  {
    id: 'REFUSE',
    label: refuse.label,
    description: refuse.description,
    cost: 0,
    effects: { locker: 2, barra: 1 }
  },
  {
    id: 'BOARD_HANDLES',
    label: board.label,
    description: board.description,
    cost: 0,
    effects: { barra: -1, board_owed: 1 }
  },
  {
    id: 'DENOUNCE',
    label: denounce.label,
    description: denounce.description,
    cost: 0,
    requires: { board: 55 },
    effects: { fans: 4, locker: 4, board: -10, barra: 4, action: 'DENOUNCE' }
  }
]

export const BARRA_EVENTS = {
  ASKS: {
    template_code: 'EVT_BARRA_ASKS',
    title: 'Piden entradas y plata para el viaje',
    description: 'Dos referentes de la barra te esperan a la salida del entrenamiento. Educados, sin levantar la voz. Piden entradas para el domingo y algo para el micro de visitante. "Entre todos hacemos el club", te dicen, y se quedan mirando cómo respondés.',
    category: 'COMMUNITY',
    severity: 'MEDIUM',
    options: barraOptions({
      cede: { label: 'Darles las entradas y algo para el micro', description: 'Se calma la cosa, pero la próxima vez van a pedir más.', cost: 600 },
      refuse: { label: 'Decirles que no hay entradas de favor', description: 'Algunos referentes del plantel lo valoran. La barra no.' },
      board: { label: 'Mandarlos a hablar con la dirigencia', description: 'Te sacás el problema de encima, pero la dirigencia te lo va a cobrar.' },
      denounce: { label: 'Avisar a la dirigencia que no vas a negociar con ellos', description: 'Hay que tener la dirigencia de tu lado. Se va a enterar todo el mundo.' }
    })
  },
  PRESSURES: {
    template_code: 'EVT_BARRA_PRESSURES',
    title: 'Un banderazo en la puerta del predio',
    description: 'Sábado a la mañana. Hay una bandera colgada en el alambrado: "Cambien o se van". Un grupo mira el entrenamiento desde afuera. No gritan. Uno de ellos te saluda con la cabeza.',
    category: 'COMMUNITY',
    severity: 'HIGH',
    options: barraOptions({
      cede: { label: 'Reunirte con ellos y arreglar', description: 'Prometés entradas y una mano con los gastos. Se bajan por ahora.', cost: 1200 },
      refuse: { label: 'No reunirte', description: 'Mantenés tu posición. Mañana puede haber más gente.' },
      board: { label: 'Que lo resuelva el presidente', description: 'Va a mandar a alguien a hablar. Después te va a pedir algo a cambio.' },
      denounce: { label: 'Pedir a la dirigencia que denuncie las amenazas', description: 'Es lo correcto, pero el clima se pone espeso.' }
    })
  },
  SQUEEZES: {
    template_code: 'EVT_BARRA_SQUEEZES',
    title: 'Aparecieron en el entrenamiento',
    description: 'Veinte tipos esperan en la puerta del predio. Pasan al campo mientras el plantel hace los pases. Uno le dice a un pibe, en voz baja: "Cambien, o no cobran". Los jugadores terminan la práctica sin mirar a nadie.',
    category: 'LOCKER_ROOM',
    severity: 'CRITICAL',
    options: barraOptions({
      cede: { label: 'Pagarles lo que piden', description: 'El vestuario respira. Ahora saben que se puede.', cost: 2500 },
      refuse: { label: 'Cortar el entrenamiento y no negociar', description: 'El plantel se queda tenso. La barra lo toma como una afrenta.' },
      board: { label: 'Llamar al presidente', description: 'Va a mandar a alguien. Nadie te explica a quién.' },
      denounce: { label: 'Hacer la denuncia formal', description: 'Hay que sostenerla con la dirigencia. No hay vuelta atrás.' }
    })
  },
  INVASION: {
    template_code: 'EVT_BARRA_INVASION',
    title: 'Entraron al vestuario después del partido',
    description: 'Todavía no se habían sacado las camisetas cuando se abrió la puerta. Entraron sin golpear. Hablaron con dos jugadores, mirándolos de cerca. Te pidieron que salgas. Saliste.',
    category: 'LOCKER_ROOM',
    severity: 'CRITICAL',
    options: barraOptions({
      cede: { label: 'Aceptar sus condiciones', description: 'Entradas, plata, y un jugador que ellos eligieron. Es el costo de la paz.', cost: 4000 },
      refuse: { label: 'No ceder', description: 'El plantel entiende que estás solo.' },
      board: { label: 'Dejar que la dirigencia negocie', description: 'Lo van a manejar en silencio. Quedás en deuda.' },
      denounce: { label: 'Denunciar lo ocurrido', description: 'Se arma un escándalo y queda todo registrado.' }
    })
  }
}

export const EMERGENCY_MEETING = {
  template_code: 'EVT_EMERGENCY_MEETING',
  title: 'Reunión de emergencia con la dirigencia',
  description: 'El presidente te cita un domingo a la noche, en su oficina. Están todos. Nadie te ofrece un café. "La situación se nos fue de las manos", dice. "Necesitamos que hagas algo, o hacemos nosotros."',
  category: 'BOARD_PRESS',
  severity: 'CRITICAL',
  options: [
    {
      id: 'GIVE_IN',
      label: 'Ceder en todo lo que piden',
      description: 'Plata, entradas y el jugador que quieren. Sobrevivís, pero la dirigencia queda con poca confianza y la barra se acostumbra.',
      cost: 1500,
      effects: { favors: 3, board_set: 20, barra: -2 }
    },
    {
      id: 'STAND_FIRM',
      label: 'Plantarte: 50% te echan, 50% te dan 3 partidos de plazo',
      description: 'Si el equipo no da los puntos que piden en tres partidos, se acaba.',
      cost: 0,
      effects: { action: 'GAMBLE_DISMISSAL' }
    },
    {
      id: 'RESIGN',
      label: 'Renunciar',
      description: 'Te vas por tu propia decisión. No es lo mismo que te echen.',
      cost: 0,
      effects: { action: 'RESIGN' }
    }
  ]
}

export const BOARD_FAVOR_DUE = {
  template_code: 'EVT_BOARD_FAVOR_DUE',
  title: 'El presidente te cobra el favor',
  description: 'Hace unas semanas la dirigencia te sacó un problema de encima. Hoy el presidente te llama al pasillo. "Necesito un favor chiquito", te dice, y te pide que su sobrino juegue algunos minutos.',
  category: 'BOARD_PRESS',
  severity: 'MEDIUM',
  options: [
    {
      id: 'PAY_FAVOR',
      label: 'Hacerle el favor',
      description: 'La dirigencia queda conforme. El vestuario ve que hay privilegios.',
      cost: 0,
      effects: { board: 5, locker: -4, board_owed: -1 }
    },
    {
      id: 'DECLINE_FAVOR',
      label: 'Decirle que no',
      description: 'Se acuerda de lo que le debés.',
      cost: 0,
      effects: { board: -6, locker: 2, board_owed: -1 }
    }
  ]
}

const corrupt = (code, title, description, accept, decline) => ({
  template_code: code,
  title,
  description,
  category: 'FINANCIAL_CRISIS',
  severity: 'HIGH',
  climates: ['CRISIS', 'CHAOS'],
  weight: 1,
  when: (state) => (state.favors || 0) < 8,
  options: [
    { id: 'ACCEPT', label: accept.label, description: accept.description, cost: 0, effects: { favors: 1, ...accept.effects } },
    { id: 'DECLINE', label: decline.label, description: decline.description, cost: 0, effects: decline.effects || {} }
  ]
})

export const CLIMATE_EVENTS = [
  // Cuando todo fluye
  {
    template_code: 'EVT_SPONSOR_UPGRADE',
    title: 'Un comercio del barrio quiere poner más plata en la camiseta',
    description: 'El dueño de la ferretería que ya está en la manga pasó por el club con una carpeta. Dice que desde que el equipo anda bien le suben las ventas y quiere ampliar el acuerdo.',
    category: 'FINANCIAL_CRISIS',
    severity: 'LOW',
    climates: ['FLOWS'],
    weight: 2,
    options: [
      { id: 'ACCEPT', label: 'Aceptar el acuerdo ampliado', description: 'Entra plata y el nombre del comercio queda más grande en la camiseta.', cost: 0, effects: { budget: 3000, fans: 1 } },
      { id: 'NEGOTIATE', label: 'Pedir que una parte vaya a las inferiores', description: 'Entra menos, pero los pibes del club lo van a notar.', cost: 0, effects: { budget: 1500, fans: 2, locker: 2 } }
    ]
  },
  {
    template_code: 'EVT_OVATION',
    title: 'La tribuna te canta el nombre',
    description: 'Terminó el entrenamiento abierto y los hinchas que se quedaron en el alambrado empezaron a cantar. No es habitual. Hay chicos con la camiseta puesta esperando una foto.',
    category: 'COMMUNITY',
    severity: 'LOW',
    climates: ['FLOWS'],
    weight: 2,
    options: [
      { id: 'DEDICATE_PLAYERS', label: 'Dedicárselo a los jugadores', description: 'Mérito del grupo. El vestuario se pone contento.', cost: 0, effects: { locker: 6 } },
      { id: 'DEDICATE_FANS', label: 'Salir a saludar y sacarte fotos', description: 'Se hace tarde, pero la gente se va feliz.', cost: 0, effects: { fans: 4 } }
    ]
  },
  {
    template_code: 'EVT_MEMBERS_CAMPAIGN',
    title: 'Una campaña para sumar socios',
    description: 'La comisión de socios propone aprovechar el buen momento: carnet con descuento para los pibes del barrio y una jornada de puertas abiertas.',
    category: 'COMMUNITY',
    severity: 'LOW',
    climates: ['FLOWS', 'TENSION'],
    weight: 1,
    options: [
      { id: 'INVEST', label: 'Apoyar la campaña (cuesta $800)', description: 'Más gente en la cancha y más cuotas.', cost: 800, effects: { fans: 5, board: 2 } },
      { id: 'SKIP', label: 'Dejarlo para más adelante', description: 'No es el momento de gastar.', cost: 0, effects: {} }
    ]
  },
  // Primeros murmullos
  {
    template_code: 'EVT_PLAYER_COMPLAINT',
    title: 'Un titular reclama que le paguen lo que vale',
    description: 'Te frena en el pasillo del vestuario uno de los que siempre juega. Habló con su representante y sabe lo que cobran otros de su nivel. No levanta la voz: "Solo quiero que me tengan en cuenta".',
    category: 'LOCKER_ROOM',
    severity: 'MEDIUM',
    climates: ['TENSION', 'CRISIS'],
    weight: 2,
    options: [
      { id: 'PAY', label: 'Darle un premio ahora (cuesta $600)', description: 'Queda conforme. Los demás se enteran.', cost: 600, effects: { locker: 2 } },
      { id: 'PROMISE', label: 'Prometerle que lo vas a ver en la renovación', description: 'Por ahora alcanza, aunque no le cierra del todo.', cost: 0, effects: { locker: -1 } },
      { id: 'REFUSE', label: 'Decirle que se ocupe de jugar', description: 'Se va con bronca.', cost: 0, effects: { locker: -4 } }
    ]
  },
  {
    template_code: 'EVT_DIRECTIVO_FAVOR',
    title: 'Un dirigente te pide una gauchada',
    description: 'Un vocal de la comisión se acerca en el entretiempo de un amistoso. "Un conocido tiene un pibe que juega bien, ¿lo podés mirar?". Lo dice como un comentario, pero espera una respuesta.',
    category: 'BOARD_PRESS',
    severity: 'LOW',
    climates: ['TENSION', 'CRISIS'],
    weight: 2,
    options: [
      { id: 'ACCEPT', label: 'Mirarlo en una práctica', description: 'Un gesto que no cuesta nada. El dirigente lo recuerda.', cost: 0, effects: { board: 3, locker: -1 } },
      { id: 'DECLINE', label: 'Decirle que las pruebas son para todos', description: 'Mantenés el criterio, pero queda un mal gesto.', cost: 0, effects: { board: -2 } }
    ]
  },
  // Crisis
  {
    template_code: 'EVT_PRESIDENT_SQUEEZE',
    title: 'El presidente te pide resultados esta semana',
    description: 'Te cita en su oficina. Hay un café sobre el escritorio pero no te invita a sentarte. Repasa los últimos partidos en voz baja y termina con una frase: "Necesitamos otra cosa del equipo".',
    category: 'BOARD_PRESS',
    severity: 'HIGH',
    climates: ['CRISIS', 'CHAOS'],
    weight: 3,
    options: [
      { id: 'PROMISE_RESULTS', label: 'Prometer resultados', description: 'Te dan margen, y la presión sube sobre el plantel.', cost: 0, effects: { board: 3, locker: -2 } },
      { id: 'BLAME_SQUAD', label: 'Decir que al plantel le falta jerarquía', description: 'Te sacás un peso, pero el vestuario se entera.', cost: 0, effects: { board: -2, locker: -5 } },
      { id: 'ASK_FUNDS', label: 'Pedir refuerzos y plata', description: 'Te dan algo, pero queda anotado.', cost: 0, effects: { budget: 3000, board: -5 } }
    ]
  },
  {
    template_code: 'EVT_DISMISSAL_RUMOR',
    title: 'Dicen que te van a echar',
    description: 'Un periodista deportivo de la zona publicó que la dirigencia ya habla con otro técnico. No dio fuentes, pero en el club nadie lo desmintió.',
    category: 'BOARD_PRESS',
    severity: 'MEDIUM',
    climates: ['CRISIS', 'CHAOS'],
    weight: 2,
    options: [
      { id: 'DENY', label: 'Salir a desmentirlo', description: 'La hinchada lo agradece. En el palco no gusta tu exposición.', cost: 0, effects: { fans: 2, board: -2 } },
      { id: 'IGNORE', label: 'No decir nada', description: 'El rumor se alimenta solo. En el vestuario hay nervios.', cost: 0, effects: { locker: -3 } }
    ]
  },
  {
    template_code: 'EVT_PLAYER_WANTS_OUT',
    title: 'Un referente pide irse',
    description: 'Lo viste cabizbajo toda la semana. Hoy golpea la puerta de tu oficina. "No me siento cómodo acá", dice, y no quiere dar más detalles. Hay otros que lo miran de reojo.',
    category: 'LOCKER_ROOM',
    severity: 'HIGH',
    climates: ['CRISIS', 'CHAOS'],
    weight: 2,
    options: [
      { id: 'TALK', label: 'Hablarlo en privado y pedirle que se quede', description: 'Se queda, aunque no está del todo convencido.', cost: 0, effects: { locker: 1 } },
      { id: 'LET_GO', label: 'Dejarlo ir cuando aparezca una oferta', description: 'El grupo ve que no te aferrás a nadie.', cost: 0, effects: { locker: -3, fans: -1 } }
    ]
  },
  // Corrupción
  corrupt(
    'EVT_CORRUPT_COMMISSION',
    'Un representante te ofrece una comisión',
    'Un representante que conocés de otros fichajes te espera en el bar de enfrente. Habla de un traspaso que podrías mover y de "algo para vos, sin que figure en ningún lado". Todo muy prolijo. Habla con naturalidad, como si fuera lo normal.',
    { label: 'Aceptar la comisión', description: 'Entran $2.500 a tu nombre. Si algún día revisan, vas a tener que dar explicaciones.', effects: { budget: 2500, reputation: -1 } },
    { label: 'Decir que no', description: 'Te agradece igual. En el ambiente se sabe quién acepta y quién no.', effects: { reputation: 1 } }
  ),
  corrupt(
    'EVT_CORRUPT_SPONSOR',
    'El sponsor pide facturar un servicio que no existe',
    'El gerente del sponsor te manda a la secretaría un papel para firmar: una factura por "asesoramiento deportivo" que nunca existió. A cambio, el aporte de la temporada sube. "Es un trámite", te dice la contadora sin mirarte.',
    { label: 'Firmar la factura', description: 'El club recibe más plata. El papel queda archivado con tu firma.', effects: { budget: 4000, board: 3 } },
    { label: 'No firmar', description: 'El sponsor se enfría y la dirigencia se fastidia.', effects: { board: -2 } }
  ),
  corrupt(
    'EVT_CORRUPT_PAYOFF',
    'Una parte por fuera en el próximo fichaje',
    'Un intermediario propone que cobres un porcentaje por afuera de la próxima operación. No pide nada raro, solo que cierres con quien él te diga. Es una conversación breve, en el estacionamiento.',
    { label: 'Aceptar el trato', description: 'Cobrás $3.000 y quedás atado a ese intermediario.', effects: { budget: 3000 } },
    { label: 'Rechazar', description: 'No pasa nada, aunque conviene cuidarse de ahora en más.', effects: {} }
  ),
  corrupt(
    'EVT_CORRUPT_INFLATED',
    'Un contrato inflado a cambio de un favor',
    'El representante de un jugador te pide que el club le suba el sueldo más de lo razonable. A cambio, te promete una mano para conseguir un refuerzo que necesitás. Los números no cierran, pero él ya lo sabe.',
    { label: 'Hacerle el favor', description: 'Conseguís al refuerzo ($1.500 de ahorro para el club). En el vestuario no pasa desapercibido.', effects: { budget: 1500, locker: -3 } },
    { label: 'Negarte', description: 'Mantenés los números ordenados.', effects: {} }
  )
]
