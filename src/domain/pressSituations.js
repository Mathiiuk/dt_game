// Preguntas de la conferencia que dependen de la situación (racha, ex jugador, refuerzo) y de cómo contestaste antes.
// Todas devuelven preguntas con las cuatro opciones de tono de siempre, así que el resto de la conferencia las trata igual.

const opt = (tone, text, moraleDelta, boardReaction) => ({ tone, text, moraleDelta, boardReaction })

/** Cuatro opciones, una por tono, con los efectos de siempre (elogio sube moral, autocrítica la baja un poco...) */
const options = ({ praising, combative, selfCritical, pragmatic }) => [
  opt('PRAISING', praising.text, 5, praising.board),
  opt('COMBATIVE', combative.text, 4, combative.board),
  opt('SELF_CRITICAL', selfCritical.text, -2, selfCritical.board),
  opt('PRAGMATIC', pragmatic.text, 1, pragmatic.board)
]

const pick = (list, rng) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))]

/** Tonos elegidos en las últimas conferencias, del más nuevo al más viejo (las preguntas sin responder no cuentan) */
export function toneHistory(conferences = []) {
  const tones = []
  for (const c of conferences || []) {
    const items = [...(c.press_qa_items || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    for (const item of items) if (item.chosen_tone) tones.push(item.chosen_tone)
  }
  return tones
}

/** Si las últimas tres respuestas fueron del mismo tono, el periodista se lo hace notar. Si no, null. */
export function memoryQuestion(tones = [], rng = Math.random) {
  if (tones.length < 3) return null
  const [a, b, c] = tones
  if (!(a === b && b === c)) return null

  if (a === 'COMBATIVE') {
    return {
      topic_category: 'MEDIA_RELATIONSHIP',
      question_text: pick([
        'Mister, en las últimas tres conferencias salió a pelear con todo el mundo. ¿No cree que tanta polémica le suma presión al plantel?',
        'Ya van tres conferencias seguidas en las que usted sale al cruce. ¿Está peleado con la prensa o es una estrategia?'
      ], rng),
      options: options({
        praising: { text: 'No estoy peleado con nadie. Respeto el trabajo de todos ustedes y quiero que se hable del equipo.', board: 'La directiva agradece que baje el tono.' },
        combative: { text: 'Si hay que defender a mis jugadores, lo voy a seguir haciendo las veces que haga falta.', board: 'La directiva pide que no se convierta en costumbre.' },
        selfCritical: { text: 'Puede ser que me haya pasado de tono. Voy a cuidar más las formas.', board: 'La directiva aprecia la autocrítica pública.' },
        pragmatic: { text: 'Cada semana es distinta. Hoy prefiero hablar del partido que viene.', board: 'Respuesta de manual, sin ruido.' }
      })
    }
  }
  if (a === 'SELF_CRITICAL') {
    return {
      topic_category: 'MEDIA_RELATIONSHIP',
      question_text: pick([
        'Mister, siempre se critica a sí mismo en conferencia. ¿Cuándo va a salir a defender a sus jugadores?',
        'Tres conferencias seguidas marcando errores propios. ¿No le parece que los jugadores necesitan más respaldo público?'
      ], rng),
      options: options({
        praising: { text: 'Mis jugadores merecen todo mi respaldo. Con este grupo me siento orgulloso de trabajar.', board: 'Mensaje de unidad que cae bien en el vestuario.' },
        combative: { text: 'Que quede claro: a mi equipo lo defiendo yo, y a quien lo ataque se lo digo a la cara.', board: 'La directiva pide cuidar el lenguaje.' },
        selfCritical: { text: 'Prefiero que el error sea mío. Así los chicos juegan más livianos.', board: 'La directiva valora que cargue con la responsabilidad.' },
        pragmatic: { text: 'Cada cosa en su momento. Lo importante es seguir trabajando de lunes a viernes.', board: 'Declaración sobria.' }
      })
    }
  }
  if (a === 'PRAISING') {
    return {
      topic_category: 'MEDIA_RELATIONSHIP',
      question_text: pick([
        'Mister, tres conferencias seguidas elogiando a todos. ¿No hay nada que le preocupe del equipo?',
        'Todo es positivo en sus declaraciones últimamente. ¿No se estarán acomodando en el plantel?'
      ], rng),
      options: options({
        praising: { text: 'Vamos por buen camino y no tengo por qué esconderlo. La gente lo ve en la cancha.', board: 'Optimismo bien recibido en el palco.' },
        combative: { text: 'Dicen que estamos cómodos y acá se entrena como en ningún lado. Que vengan a verlo.', board: 'La directiva prefiere evitar la provocación.' },
        selfCritical: { text: 'Hay varias cosas para mejorar, claro. Las trabajamos puertas adentro.', board: 'Equilibrio entre optimismo y exigencia.' },
        pragmatic: { text: 'Mientras el equipo responda, no hay nada que cambiar. Si hay que ajustar, lo hacemos.', board: 'Respuesta mesurada.' }
      })
    }
  }
  return null
}

/**
 * Pregunta por lo que está pasando: ex jugador del club en el rival, refuerzo de la temporada que fue la figura, o una racha.
 * @param {{ exPlayerName?: string, mvpSigningName?: string, winStreak?: number, lossStreak?: number, unbeaten?: number }} ctx
 */
export function situationQuestion(ctx = {}, rng = Math.random) {
  const { exPlayerName, mvpSigningName, winStreak = 0, lossStreak = 0, unbeaten = 0 } = ctx

  if (exPlayerName) {
    return {
      topic_category: 'EX_PLAYER',
      question_text: `Del otro lado jugó ${exPlayerName}, que hasta hace poco estaba en el club. ¿Cómo vivió el reencuentro?`,
      options: options({
        praising: { text: `Le tengo mucho cariño a ${exPlayerName.split(' ')[0]}. Dejó todo acá y me alegra que le vaya bien.`, board: 'Gesto elegante que la tribuna valora.' },
        combative: { text: 'Si quiso irse, que juegue tranquilo. Acá hay once que se ponen la camiseta con ganas.', board: 'La directiva pide no abrir heridas.' },
        selfCritical: { text: 'Quizás no supimos retenerlo. Son decisiones difíciles y las asumo.', board: 'La directiva toma nota de la autocrítica.' },
        pragmatic: { text: 'Fue un rival más. Lo que me importa es lo que hizo mi equipo.', board: 'Respuesta profesional.' }
      })
    }
  }

  if (mvpSigningName) {
    return {
      topic_category: 'NEW_SIGNING',
      question_text: `${mvpSigningName} llegó esta temporada y hoy fue de lo mejor. ¿Se cumplió lo que esperaba cuando pidió su contratación?`,
      options: options({
        praising: { text: `${mvpSigningName.split(' ')[0]} se adaptó enseguida y el grupo lo adoptó. Es un refuerzo de los que suman.`, board: 'La directiva se siente respaldada en su apuesta.' },
        combative: { text: 'Hay quienes dudaron del fichaje. Los resultados están a la vista.', board: 'La directiva prefiere no alimentar polémicas.' },
        selfCritical: { text: 'Todavía tiene que dar más. Si se acomoda, no va a ser el mismo jugador.', board: 'Exigencia valorada.' },
        pragmatic: { text: 'Es un jugador más del plantel. Lo importante es que el equipo funcione.', board: 'Mensaje de grupo.' }
      })
    }
  }

  if (lossStreak >= 3) {
    return {
      topic_category: 'BAD_RUN_CRISIS',
      question_text: pick([
        `Van ${lossStreak} derrotas seguidas y se habla de crisis. ¿Qué le dice al hincha que pide cambios?`,
        `${lossStreak} partidos sin sumar de a tres. ¿Siente que su ciclo está en discusión?`
      ], rng),
      options: options({
        praising: { text: 'Al hincha le digo que este plantel nunca dejó de dar todo y que hay que acompañar.', board: 'La directiva agradece el apoyo al plantel.' },
        combative: { text: 'Hay una campaña para desestabilizar. No voy a regalarles el título de la semana.', board: 'La directiva teme que se encienda más el clima.' },
        selfCritical: { text: 'Soy el primer responsable. Si hay que cambiar algo, empieza por mí.', board: 'La directiva aprecia la hidalguía.' },
        pragmatic: { text: 'Estamos trabajando para salir. Los resultados llegan con laburo, no con declaraciones.', board: 'Llamado a la calma institucional.' }
      })
    }
  }

  if (winStreak >= 3) {
    return {
      topic_category: 'STAR_PERFORMANCE',
      question_text: pick([
        `${winStreak} victorias al hilo. ¿Se anima a hablar de pelear por el título?`,
        `El equipo ganó ${winStreak} seguidos. ¿Es el mejor momento desde que llegó?`
      ], rng),
      options: options({
        praising: { text: 'Los chicos están en un gran momento y se lo merecen. Que la gente disfrute.', board: 'Clima de euforia en las tribunas.' },
        combative: { text: 'Antes decían que no alcanzaba. Seguimos ganando y cada uno saque sus conclusiones.', board: 'La directiva pide humildad.' },
        selfCritical: { text: 'No nos engañemos: todavía hay cosas para corregir. Una racha no es un campeonato.', board: 'Exigencia que cuida al grupo.' },
        pragmatic: { text: 'Partido a partido. Hoy toca disfrutarlo y el lunes volver a trabajar.', board: 'Prudencia valorada.' }
      })
    }
  }

  if (unbeaten >= 5) {
    return {
      topic_category: 'TACTICAL_CHOICE',
      question_text: `Ya son ${unbeaten} partidos sin perder. ¿Qué cambió en el equipo para sostener esa solidez?`,
      options: options({
        praising: { text: 'Los jugadores entendieron el plan y lo cumplen a rajatabla. El mérito es de ellos.', board: 'La directiva reconoce el trabajo del grupo.' },
        combative: { text: 'Nadie nos regaló nada. Se ganó con laburo mientras algunos dudaban.', board: 'La directiva pide moderar el tono.' },
        selfCritical: { text: 'Todavía no estoy conforme con cómo definimos los partidos. Podemos ser más contundentes.', board: 'Exigencia profesional.' },
        pragmatic: { text: 'Orden atrás, intensidad en el medio y paciencia. Nada que no se haya hecho antes.', board: 'Respuesta técnica y sobria.' }
      })
    }
  }

  return null
}
