/**
 * Historias de política de liga: la federación cambia las reglas, la tele manda y los amigos del poder se salvan.
 * Mismo formato que arcCatalog.js (cuatro capítulos, marcas de recuerdo y desenlace con variantes).
 * Son relatos: lo que elegís mueve hinchada, dirigencia, vestuario, caja, reputación y favores, pero no cambia el
 * formato real del campeonato ni los descensos de la liga.
 * Todos los nombres son inventados. {presidente} es el del club y {periodista} el que cubre al club.
 * El presidente de la federación es Don Anselmo Ferraro: un personaje ficticio que reaparece en varias historias.
 */

const o = (id, label, description, effects = {}, extra = {}) => ({ id, label, description, effects, ...extra })
const chapter = (title, description, options, memory = {}) => ({ title, description, options, memory })

export const LEAGUE_ARCS = [
  {
    id: 'torneo_grupos',
    title: 'El torneo de dos grupos',
    tagline: 'La federación inventa una "zona de la gloria" y una "zona del consuelo".',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'Anuncian un campeonato nuevo, de dos grupos',
        'Don Anselmo Ferraro, presidente de la federación, anuncia con corbata de gala un campeonato "revolucionario" de dos grupos, con una zona de la gloria y otra del consuelo. Nadie entiende cómo se arman los grupos, pero {periodista} ya preguntó en cuál te tocaría a vos.',
        [
          o('A', 'Aplaudir la idea en público', 'Es lo que se espera de un club prolijo. Don Anselmo toma nota.', { board: 3, fans: -2 }, { flag: 'APLAUDE' }),
          o('B', 'Decir que es un invento para la tele', 'Decís lo que piensa la tribuna. La federación, no tanto.', { fans: 4, board: -3, reputation: 1 }, { flag: 'CRITICA' }),
          o('C', 'No opinar y mirar el fixture', 'Hablás de tu equipo y de nada más.', { locker: 1 }, { flag: 'SILENCIO' })
        ]
      ),
      chapter(
        'Sale el sorteo y tu grupo es el del consuelo',
        'El sorteo se hizo a puertas cerradas con una bolsa de tela. Tu club cayó en la zona del consuelo, junto con equipos que "casualmente" no le caen simpáticos a la federación. En la zona de la gloria quedaron los de siempre.',
        [
          o('A', 'Pedir una auditoría del sorteo', 'Todos te miran como a un aguafiestas. Algunos te dan la razón.', { fans: 3, board: -2, reputation: 1 }, { flag: 'AUDITORIA' }),
          o('B', 'Aceptarlo y ganar la zona', 'La mejor respuesta es la cancha. Y es la más difícil.', { locker: 3, fans: 1 }, { flag: 'ACEPTA' }),
          o('C', 'Pedirle a {presidente} que hable con Ferraro', 'Quizás con una buena charla se arregle. Quizás.', { board_owed: 1, board: 1 }, { flag: 'LOBBY' })
        ],
        { APLAUDE: 'Habías aplaudido el torneo y ahora te toca vivirlo.', CRITICA: 'Habías dicho que era un invento y el sorteo parece una respuesta.', SILENCIO: 'Habías preferido no opinar y la federación no te lo agradeció.' }
      ),
      chapter(
        'La zona del consuelo gana partidos... y lo tapan',
        'Tu zona juega mejor de lo que esperaban y de golpe cambian las reglas: "los puntos de la zona del consuelo valen la mitad por razones de equidad". Los números no cierran, el hincha tampoco, y {periodista} pide una explicación con un micrófono en la mano.',
        [
          o('A', 'Salir a pelear la regla en los medios', 'Subís el tono. La federación te mira con ganas de multarte.', { fans: 5, board: -3, reputation: 2 }, { flag: 'PELEA' }),
          o('B', 'Presentar un reclamo formal', 'Papeles, firmas y paciencia. Nadie dice que va a servir.', { board: 1, reputation: 1 }, { cost: 200, flag: 'RECLAMO' }),
          o('C', 'Jugar como si nada y ganar igual', 'La respuesta de los grandes. El plantel se contagia.', { locker: 4, fans: 2 }, { flag: 'IGUAL' })
        ],
        { AUDITORIA: 'La auditoría que pediste dejó mal parado a más de uno.', ACEPTA: 'Habías decidido ganar la zona y estás en el camino.', LOBBY: 'Habías pedido que {presidente} hablara con Ferraro, y no resultó.' }
      ),
      chapter(
        'La final de la zona del consuelo',
        'Llegaste a la final de la zona del consuelo, un partido que la federación quiere transmitir a las tres de la tarde en un día de semana para que no lo vea nadie. El premio es una copa de plástico y la "gloria moral". {presidente} pregunta si vale la pena.',
        [
          o('A', 'Jugarla con todo y festejar fuerte', 'Una copa es una copa, aunque sea de plástico.', { fans: 5, locker: 3, board: 1 }, { ending: 'Ganaste la final de la zona del consuelo. Levantaste una copa de plástico con la misma cara que si fuera la Libertadores, y la tribuna se la guardó para siempre.', variants: [{ if: 'PELEA', ending: 'Después de pelear la regla en los medios, ganaste la final de la zona del consuelo. Levantaste una copa de plástico mirando a Ferraro a los ojos.' }, { if: 'IGUAL', ending: 'Jugaste como si nada y ganaste la final de la zona del consuelo. Levantaste una copa de plástico sin decir una palabra, que fue lo más elocuente de todo.' }] }),
          o('B', 'Mandar a los suplentes y guardar a los titulares', 'Cuidás a los tuyos para el torneo de verdad. Algunos no lo entienden.', { board: 2, fans: -3, locker: -1 }, { ending: 'Mandaste a los suplentes a la final del consuelo. Perdieron con dignidad, la federación sacó una foto y la tribuna prefirió mirar para otro lado.' }),
          o('C', 'No presentarte en señal de protesta', 'Un gesto fuerte. La federación lo anota.', { fans: 4, reputation: 2, board: -4, budget: -500 }, { ending: 'No te presentaste a la final del consuelo en señal de protesta. Te multaron, la hinchada hizo un banderazo y un periodista escribió que fue "el gesto más coherente de la temporada".', variants: [{ if: 'RECLAMO', ending: 'Después del reclamo que nadie leyó, no te presentaste a la final del consuelo. Te multaron, la hinchada hizo un banderazo y en la federación nadie supo qué responder.' }] })
        ]
      )
    ]
  },
  {
    id: 'descenso_amigos',
    title: 'Las reglas del descenso',
    tagline: 'A mitad de campeonato cambian el reglamento, y se salvan los amigos del presidente.',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'Corre el rumor de un reglamento nuevo',
        'En el bar de la esquina cuentan que Don Anselmo Ferraro prepara un cambio en el reglamento de descensos "para cuidar la estabilidad de los clubes tradicionales". {periodista} lo escuchó de una fuente "muy cercana a la federación", que además le vendía los choripanes.',
        [
          o('A', 'Pedir información oficial', 'Mandás una nota formal. Te contestan con un saludo muy cordial.', { board: 1, reputation: 1 }, { flag: 'FORMAL' }),
          o('B', 'Tomarlo como un chisme y seguir', 'Tenés un partido el domingo y eso es lo que importa. Los periodistas lo notan.', { locker: 1, reputation: -1 }, { flag: 'CHISME' }),
          o('C', 'Preguntarle a {presidente} qué sabe', 'Te contesta con un "más adelante te cuento" muy sospechoso.', { board_owed: 1 }, { flag: 'PRESI' })
        ]
      ),
      chapter(
        'El reglamento cambia con el campeonato empezado',
        'Es oficial: ahora el descenso se define con un promedio de "tres temporadas ponderadas por tradición". Los clubes con más historia cuentan doble. Los que se salvan coinciden, casualmente, con los amigos de Don Anselmo. Tu club quedó en el medio.',
        [
          o('A', 'Denunciarlo públicamente', 'La tribuna te aplaude. La federación te anota en la lista negra.', { fans: 5, board: -3, reputation: 2 }, { flag: 'DENUNCIA' }),
          o('B', 'Buscar aliados entre los clubes perjudicados', 'Una reunión de cafeterías con muy buenas intenciones.', { reputation: 1, board: 1, locker: 1 }, { flag: 'ALIADOS' }),
          o('C', 'Pedir ser incluido entre los amigos', 'Si no podés con ellos, ¿por qué no unirte? Algo te cobran.', { board: 3, fans: -4, favors: 1 }, { flag: 'AMIGO' })
        ],
        { FORMAL: 'La nota que mandaste con tiempo hoy te sirve de prueba.', CHISME: 'Habías dicho que era un chisme y no lo era.', PRESI: 'Te quedó la sensación de que {presidente} sabía más de lo que decía.' }
      ),
      chapter(
        'Una cena con Don Anselmo',
        'Don Anselmo Ferraro te invita a cenar en un restaurante de manteles largos. Es muy amable. Habla de "familia futbolera", de "cuidarnos entre nosotros" y deja una carpeta sobre la mesa sin abrirla. El mozo se retira con mucho tacto.',
        [
          o('A', 'Aceptar la carpeta y escuchar', 'Dentro hay un acuerdo que parece un favor pero tiene dueño.', { budget: 1500, board: 2, favors: 1, fans: -3 }, { flag: 'ACEPTA_CARPETA' }),
          o('B', 'Agradecer la cena y pagar la tuya', 'Un gesto de independencia que Ferraro no olvida.', { reputation: 2, board: -2, fans: 2 }, { cost: 80, flag: 'PAGA' }),
          o('C', 'Grabar la conversación con el celular', 'Una prueba por si hace falta. Un riesgo si lo descubren.', { reputation: 1, board: -1 }, { flag: 'GRABA' })
        ],
        { DENUNCIA: 'Ferraro ya sabía que lo habías denunciado y lo mencionó dos veces.', ALIADOS: 'Los aliados que juntaste se enteraron de la cena.', AMIGO: 'Ferraro te recibió como a uno de los suyos.' }
      ),
      chapter(
        'Se juega la última fecha con el descenso en juego',
        'Última fecha. Los amigos de Don Anselmo se salvaron en el escritorio y los demás se juegan la categoría en la cancha. {presidente} te mira como diciendo "depende de lo que hagas". El estadio está lleno y el árbitro es "uno de los de confianza".',
        [
          o('A', 'Jugar limpio y a ganar', 'Sin trampas y sin miedo. Que el resultado hable.', { fans: 5, locker: 3, reputation: 2 }, { ending: 'Jugaste limpio la última fecha. El que mandaba en la federación mandó, pero la tribuna te recordó como el que no se dejó arrodillar.', variants: [{ if: 'DENUNCIA', ending: 'Después de denunciar el reglamento, jugaste limpio la última fecha. La tribuna cantó tu nombre aunque la federación hizo como que no escuchaba.' }, { if: 'ALIADOS', ending: 'Con los aliados que juntaste mirando desde la tribuna, jugaste limpio la última fecha. Una foto de los clubes perjudicados saludando quedó en la historia.' }] }),
          o('B', 'Aceptar el favor y jugar tranquilo', 'Un empate arreglado y todos felices. Casi todos.', { budget: 2000, board: 4, fans: -6, reputation: -3, favors: 1 }, { ending: 'Aceptaste el favor y la última fecha fue un trámite. Te salvaste, pero en la tribuna ya circula un meme con tu cara y la de Ferraro.', variants: [{ if: 'ACEPTA_CARPETA', ending: 'Con la carpeta ya aceptada, la última fecha fue un trámite. Te salvaste, pero en la tribuna ya circula un meme con tu cara y la de Ferraro.' }, { if: 'AMIGO', ending: 'Como ya eras de los amigos, la última fecha fue un trámite. Te salvaste, pero en el barrio nadie te saluda igual.' }] }),
          o('C', 'Mostrar la grabación en conferencia', 'Un escándalo. Y no hay vuelta atrás.', { reputation: 4, fans: 6, board: -6, budget: -1000 }, { ending: 'Mostraste la grabación en conferencia. Hubo escándalo, una investigación y una multa. Tu club descendió con la cabeza alta y un periodista te llamó "el hombre que dijo lo que todos sabían".', variants: [{ if: 'GRABA', ending: 'Mostraste la grabación que habías hecho en la cena. Hubo escándalo, una investigación y una multa. Tu club descendió con la cabeza alta y Ferraro dejó de mandar saludos.' }] })
        ]
      )
    ]
  },
  {
    id: 'tv_horarios',
    title: 'El horario de la tele',
    tagline: 'La televisión manda y el partido se juega a las diez de la noche.',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'La tele pide tu partido para el lunes a la noche',
        'Un productor de una señal de cable con camisa floreada llama a {presidente} para pedir tu partido "en horario prime time". Es un lunes a las 22:30. Ofrece plata, un mejor sponsor en la camiseta y un compromiso: "Salen bien en cámara".',
        [
          o('A', 'Aceptar el horario', 'La caja agradece. Los hinchas que trabajan, no tanto.', { budget: 1800, fans: -3, board: 2 }, { flag: 'ACEPTA_HORARIO' }),
          o('B', 'Pedir un horario más humano', 'Negociás. La tele suspira.', { budget: 600, fans: 1 }, { flag: 'NEGOCIA' }),
          o('C', 'Rechazar el pedido', 'La tribuna se alegra. La caja, un poco menos.', { fans: 4, board: -2 }, { flag: 'RECHAZA' })
        ]
      ),
      chapter(
        'Los hinchas se quejan del horario',
        'La barra se junta en la puerta del club con un bombo y una bandera que dice "El fútbol es del que lo va a ver". {periodista} cubre en vivo. Un abuelo con una radio a transistores aclara que "a esa hora tiene que dormir".',
        [
          o('A', 'Recibirlos y escucharlos', 'Les ofrecés una charla en el club. Se siente bien y cuesta poco.', { fans: 3, board: -1 }, { flag: 'ESCUCHA' }),
          o('B', 'Repartir entradas para el horario', 'Una entrada gratis a quien va caminando. Funciona a medias.', { fans: 2, budget: -400 }, { flag: 'ENTRADAS' }),
          o('C', 'Responder que es la ley de la tele', 'Una respuesta honesta y fría.', { board: 1, fans: -4 }, { flag: 'FRIO' })
        ],
        { ACEPTA_HORARIO: 'La plata de la tele ya entró y la gente lo sabe.', NEGOCIA: 'Lograste algo mejor, pero aun así no conforma a todos.', RECHAZA: 'Habías dicho que no al horario y la tele insiste.' }
      ),
      chapter(
        'Un jugador se duerme en el banco',
        'En el partido del lunes a la noche, tu suplente más joven se queda dormido en el banco con la cámara de televisión enfocándolo. El video da la vuelta a todas las redes con la leyenda "así es el fútbol de la tele". El jugador pide perdón entre risas.',
        [
          o('A', 'Reírte con él y hacer humor del tema', 'El plantel se contagia. Los programas de la tele te llaman.', { locker: 3, fans: 3 }, { flag: 'HUMOR' }),
          o('B', 'Multarlo para dar el ejemplo', 'Una decisión seria que no cae muy bien.', { locker: -3, board: 2 }, { flag: 'MULTA' }),
          o('C', 'Pedirle a la tele que cambie el horario', 'Usás el video como argumento.', { board: 1, fans: 2 }, { flag: 'ARGUMENTO' })
        ],
        { ESCUCHA: 'Habías escuchado a la barra y te lo agradecieron.', ENTRADAS: 'Las entradas que regalaste generaron simpatía.', FRIO: 'La respuesta fría de la otra semana todavía duele.' }
      ),
      chapter(
        'La tele renueva y quiere más',
        'La señal de cable quiere renovar y pide que todos tus partidos de local sean en horarios "televisivos". A cambio, ofrece una cifra que hace temblar el escritorio de {presidente}. El plantel mira de reojo.',
        [
          o('A', 'Firmar por tres años', 'Mucha plata y poca vida social para los hinchas.', { budget: 3000, board: 4, fans: -5 }, { ending: 'Firmaste con la tele por tres años. La caja está llena, el estadio vacío los lunes a la noche y el abuelo de la radio ya se mudó de club.', variants: [{ if: 'ACEPTA_HORARIO', ending: 'Como ya habías aceptado el primer horario, firmaste con la tele por tres años. La caja está llena y el estadio vacío los lunes a la noche.' }] }),
          o('B', 'Firmar con horarios razonables', 'Menos plata, más humanidad.', { budget: 1200, fans: 3, board: 1 }, { ending: 'Firmaste con la tele con horarios razonables. Se cobró menos, se jugó a la tarde y los viejos volvieron a la popular con sus termos.', variants: [{ if: 'NEGOCIA', ending: 'Con la negociación del primer día, firmaste con horarios razonables. Se cobró menos, pero el estadio se llenó.' }] }),
          o('C', 'No renovar y volver a la tarde', 'Se vuelve a jugar como siempre.', { fans: 6, board: -3, budget: -500 }, { ending: 'No renovaste con la tele. Volvieron los partidos a la tarde, los choripanes y el abuelo de la radio, que te saludó desde la platea.', variants: [{ if: 'RECHAZA', ending: 'Después de rechazar el horario desde el principio, no renovaste. Volvieron los partidos a la tarde y la tribuna te lo agradeció.' }] })
        ],
        { HUMOR: 'El humor con el que lo tomaste le dio simpatía al club.', MULTA: 'La multa al suplente todavía se comenta.', ARGUMENTO: 'El video que usaste como argumento fue un golpe maestro.' }
      )
    ]
  },
  {
    id: 'veedor_arbitros',
    title: 'El árbitro de confianza',
    tagline: 'Una designación sospechosa y un veedor que anota todo en una libretita.',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'Te designan un árbitro con fama de local... pero de otro',
        'Sale la designación para tu próximo partido: un árbitro que ya dirigió al rival siete veces y que siempre les cobra de más. Un veedor de la federación te saluda con una libretita y una sonrisa de dentista.',
        [
          o('A', 'Pedir un cambio de árbitro', 'Una nota firme y respetuosa. Te contestan con una nota firme y respetuosa.', { board: 1, reputation: 1 }, { flag: 'PIDE_CAMBIO' }),
          o('B', 'Callarte y jugar', 'Sabés que nada va a cambiar. Mejor concentrarse. Callar tiene su costo.', { locker: 2, reputation: -1 }, { flag: 'CALLA' }),
          o('C', 'Hablar con el veedor', 'Te escucha, toma nota y no dice nada.', { board: 1 }, { flag: 'VEEDOR' })
        ]
      ),
      chapter(
        'El partido se juega y hay un penal dudoso',
        'A los 87 minutos, el árbitro cobra un penal dudoso para el rival. En el banco todos gritan. El veedor toma nota. {periodista} te acerca el micrófono antes de que respires.',
        [
          o('A', 'Protestar con respeto', 'Una queja elegante y firme.', { fans: 2, board: 1 }, { flag: 'RESPETO' }),
          o('B', 'Estallar y hacerte expulsar', 'La tribuna te aplaude. La federación, un poco menos.', { fans: 4, board: -2, locker: 1 }, { flag: 'ESTALLA' }),
          o('C', 'Aceptar la decisión y felicitar al árbitro', 'Un gesto de señor que sorprende a todos.', { reputation: 2, fans: -2 }, { flag: 'SEÑOR' })
        ],
        { PIDE_CAMBIO: 'Habías pedido el cambio y lo tuvieron en cuenta, a su manera.', CALLA: 'Habías decidido callar y hoy te toca hablar.', VEEDOR: 'La charla con el veedor volvió como un boomerang.' }
      ),
      chapter(
        'Un video de la libretita del veedor',
        'Alguien filtra una foto de la libretita del veedor: tiene anotados los nombres de los árbitros, cuánto cobran y con qué clubes "conviene tener cuidado". Tu club figura con un asterisco. Todos hablan de eso menos el veedor, que desapareció.',
        [
          o('A', 'Difundir la foto', 'Un escándalo que ayuda a la tribuna y complica a la federación.', { fans: 5, reputation: 2, board: -3 }, { flag: 'DIFUNDE' }),
          o('B', 'Entregarla a la dirigencia', 'Una vía formal. A veces las cosas se pierden en los cajones.', { board: 2, board_owed: 1 }, { flag: 'ENTREGA' }),
          o('C', 'Borrar la foto y olvidarte', 'Evitás líos. Te queda un nudo en el estómago.', { locker: 1, reputation: -1 }, { flag: 'BORRA' })
        ],
        { RESPETO: 'Habías protestado con respeto y quedó registrado.', ESTALLA: 'La expulsión de la otra semana pesa en el expediente.', SEÑOR: 'Felicitaste al árbitro y ahora él aparece en la libretita.' }
      ),
      chapter(
        'La federación te cita a declarar',
        'La federación te cita a declarar por "conductas impropias". El tribunal de disciplina tiene seis integrantes, de los cuales cuatro cenaron con Don Anselmo la semana pasada. Te explican las reglas con una paciencia sospechosa.',
        [
          o('A', 'Presentarte con abogado y todo en regla', 'Una defensa seria y aburrida.', { board: 1, reputation: 2, budget: -300 }, { ending: 'Te presentaste con abogado y todo en regla. Te dieron una suspensión corta y la libretita del veedor nunca volvió a aparecer.', variants: [{ if: 'ENTREGA', ending: 'Con lo que habías entregado a la dirigencia, te presentaste con abogado y todo en regla. Te dieron una suspensión corta y el presidente del club salió a defenderte.' }] }),
          o('B', 'Presentarte con la foto y que decidan', 'Una jugada de riesgo con mucho eco.', { fans: 6, reputation: 3, board: -4 }, { ending: 'Te presentaste con la foto de la libretita. El tribunal se puso nervioso, la prensa se prendió y tu nombre quedó en los carteles de la tribuna.', variants: [{ if: 'DIFUNDE', ending: 'Como ya habías difundido la foto, te presentaste con la libretita en la mano. El tribunal se puso nervioso y tu nombre quedó en los carteles de la tribuna.' }] }),
          o('C', 'No ir y mandar un abogado', 'Evitás la escena. No evitás la sospecha.', { board: -1, fans: -1 }, { ending: 'Mandaste a tu abogado y te quedaste en el club. La causa se archivó con un llamado de atención y una sonrisa.', variants: [{ if: 'BORRA', ending: 'Como habías borrado la foto, mandaste a tu abogado. La causa se archivó y vos seguiste durmiendo, pero no tanto.' }] })
        ]
      )
    ]
  },
  {
    id: 'clausura_sorpresa',
    title: 'La clausura sorpresa',
    tagline: 'Un inspector clausura la tribuna por un trámite que nadie recuerda haber firmado.',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'Llega un inspector con un sello',
        'Un lunes a la mañana aparece un inspector con carpeta, casco y un sello que dice "CLAUSURADO". Dice que a la tribuna popular le falta un "certificado de evacuación en caso de hipotética emergencia hipotética". Mira el cielo y anota algo.',
        [
          o('A', 'Pedir ver el reglamento', 'Cortés y firme. El inspector duda.', { board: 1, reputation: 1 }, { flag: 'REGLAMENTO' }),
          o('B', 'Llamar a {presidente}', 'Para que resuelva con "sus contactos".', { board_owed: 1, board: 1 }, { flag: 'PRESI' }),
          o('C', 'Sacarle una foto y subirla a las redes', 'El episodio se hace viral en diez minutos.', { fans: 3, board: -2 }, { flag: 'REDES' })
        ]
      ),
      chapter(
        'La tribuna cerrada y la barra enojada',
        'Sin la popular, el club juega ante la mitad de los hinchas. La barra amenaza con ir igual y se ven escaleras apoyadas en el paredón. {periodista} escribe que "la clausura huele a mensaje de la federación".',
        [
          o('A', 'Hablar con la barra para calmar los ánimos', 'Conversación larga con muchos mates.', { fans: 2, barra: 1, favors: 1 }, { flag: 'CALMA' }),
          o('B', 'Reforzar la seguridad y pedir calma', 'Policía, vallas y una cara seria.', { board: 2, fans: -2, budget: -400 }, { flag: 'SEGURIDAD' }),
          o('C', 'Mover el partido a una cancha neutral', 'Una solución rara que cuesta plata.', { fans: -3, budget: -600 }, { flag: 'NEUTRAL' })
        ],
        { REGLAMENTO: 'Pedir el reglamento te dio una pista valiosa.', PRESI: 'Llamar a {presidente} abrió una puerta, pero tiene precio.', REDES: 'La foto del inspector todavía circula por todas partes.' }
      ),
      chapter(
        'El certificado aparece... en un cajón',
        'Un empleado administrativo encuentra el certificado de evacuación en un cajón, firmado y sellado, con fecha de hace tres años. Nadie sabe cómo llegó ahí ni por qué el inspector no lo vio. El inspector, de repente, tiene otro compromiso.',
        [
          o('A', 'Presentarlo y exigir una disculpa', 'Una exigencia que la federación no espera.', { reputation: 2, fans: 2, board: -1 }, { flag: 'DISCULPA' }),
          o('B', 'Presentarlo y dejar pasar', 'Querés volver a jugar y listo.', { board: 1, fans: 1 }, { flag: 'DEJA_PASAR' }),
          o('C', 'Presentarlo y pedir una indemnización', 'Un reclamo creativo. La federación se pone nerviosa.', { budget: 800, board: -2, reputation: 1 }, { flag: 'INDEMNIZA' })
        ],
        { CALMA: 'La charla con la barra mantuvo el estadio en orden.', SEGURIDAD: 'El refuerzo de seguridad dejó una imagen seria.', NEUTRAL: 'Mudar el partido dejó a muchos hinchas sin poder ir.' }
      ),
      chapter(
        'Reabren la tribuna',
        'Se levanta la clausura. La popular se llena de bombos, banderas y un olor a choripán que se siente desde la calle. El inspector manda una carta con un "disculpe las molestias" escrito a mano y un sello torcido.',
        [
          o('A', 'Inaugurar con una fiesta popular', 'Choripán, bandas y entradas a mitad de precio.', { fans: 6, budget: -300, locker: 2 }, { ending: 'Reabriste la popular con una fiesta. Hubo choripán para todos, una banda que tocó dos horas y un cartel que decía "Gracias por bancarnos".', variants: [{ if: 'CALMA', ending: 'Con la barra tranquila, reabriste la popular con una fiesta. Hubo choripán para todos y un cartel que decía "Gracias por bancarnos".' }] }),
          o('B', 'Reabrir sin ruido y seguir jugando', 'Un volver a la normalidad sin protagonismo.', { board: 2, fans: 1 }, { ending: 'Reabriste la tribuna sin ruido. El inspector nunca volvió y el sello quedó en una vitrina de la secretaría.', variants: [{ if: 'DEJA_PASAR', ending: 'Después de dejar pasar el asunto, reabriste la tribuna sin ruido. El inspector nunca volvió.' }] }),
          o('C', 'Colgar una bandera contra la federación', 'Un mensaje claro. No gusta a todos.', { fans: 5, board: -3, reputation: 2 }, { ending: 'Colgaste una bandera contra la federación sobre la popular. Fue tapa en tres diarios y la hinchada la guardó como una reliquia.', variants: [{ if: 'DISCULPA', ending: 'Después de exigir la disculpa, colgaste una bandera contra la federación. Fue tapa en tres diarios y la hinchada la guardó como una reliquia.' }, { if: 'INDEMNIZA', ending: 'Con el reclamo de indemnización todavía sin respuesta, colgaste una bandera contra la federación. Fue tapa en tres diarios.' }] })
        ]
      )
    ]
  },
  {
    id: 'ventana_pases',
    title: 'La ventana que se cerró antes',
    tagline: 'La federación adelanta el cierre de pases justo cuando ibas a fichar.',
    category: 'FINANCIAL_CRISIS',
    chapters: [
      chapter(
        'Estás por cerrar un refuerzo',
        'Tenés todo listo para sumar a un volante que viene recomendado. Falta una firma y una foto con la camiseta. Don Anselmo Ferraro, presidente de la federación, anuncia por redes un "ajuste de calendario" de la ventana de pases, sin precisar fechas.',
        [
          o('A', 'Cerrar el pase ya mismo', 'Apurás los papeles y mandás a alguien con el contrato.', { budget: -800, locker: 1 }, { flag: 'APURA' }),
          o('B', 'Esperar a que aclaren la fecha', 'Un poco de prudencia que puede salir caro: el plantel se impacienta.', { locker: -1 }, { flag: 'ESPERA' }),
          o('C', 'Consultar a un abogado de la federación', 'Un viejo conocido que sabe cómo funcionan las cosas.', { board: 1, favors: 1 }, { flag: 'ABOGADO' })
        ]
      ),
      chapter(
        'La federación adelanta el cierre',
        'Sale el comunicado: la ventana cierra mañana a las 18:00 "por razones de organización". Algunos clubes grandes ya cerraron sus refuerzos el día anterior. Casualidad, dicen. En tu club el fax no funciona.',
        [
          o('A', 'Mandar los papeles en moto', 'Un mensajero y mucha adrenalina. Llegás justo o no llegás.', { budget: -300, locker: 1 }, { flag: 'MOTO' }),
          o('B', 'Reclamar la fecha', 'Pedís una prórroga con una nota firme.', { board: 1, reputation: 1 }, { flag: 'PRORROGA' }),
          o('C', 'Cambiar de refuerzo a último momento', 'Buscás una alternativa disponible. No es lo mismo, pero sirve.', { fans: -1, locker: -1 }, { flag: 'ALTERNATIVA' })
        ],
        { APURA: 'Habías apurado los papeles y por eso estás mejor parado.', ESPERA: 'Esperar te hizo llegar con menos margen.', ABOGADO: 'El abogado de la federación te avisó con un guiño, pero tarde.' }
      ),
      chapter(
        'El refuerzo llegó... o casi',
        'Entre papeles, motos y una cara de desesperación, el refuerzo llegó a un minuto de las seis. O eso dice un sello medio borroso. En la federación lo revisan con lupa. {periodista} ya preguntó si el pase "tiene problemas".',
        [
          o('A', 'Defender el pase con documentación', 'Todo en regla. O casi todo.', { board: 1, reputation: 1 }, { flag: 'DEFIENDE' }),
          o('B', 'Presentarlo igual y esperar', 'Lo que tenga que pasar, pasará. La dirigencia se pone nerviosa.', { fans: 1, board: -1 }, { flag: 'ESPERA2' }),
          o('C', 'Pedir ayuda a {presidente}', 'Una llamada a un contacto que debe favores.', { board_owed: 1, board: 2 }, { flag: 'AYUDA' })
        ],
        { MOTO: 'La moto fue la heroína de la jornada.', PRORROGA: 'Habías pedido la prórroga y te contestaron con un silencio educado.', ALTERNATIVA: 'El refuerzo alternativo rinde, pero no es el que querías.' }
      ),
      chapter(
        'La federación resuelve el pase',
        'La federación anuncia su decisión sobre tu refuerzo en un comunicado de tres líneas y una firma ilegible. El volante espera en un banco del predio con un mate y la camiseta puesta debajo del buzo, por las dudas.',
        [
          o('A', 'Aceptar la decisión y seguir adelante', 'Sea cual sea, te adaptás.', { board: 1, locker: 1 }, { ending: 'Aceptaste la decisión de la federación y seguiste adelante. El volante jugó, el plantel se adaptó y la ventana quedó en el recuerdo como una anécdota.', variants: [{ if: 'APURA', ending: 'Como habías apurado los papeles desde el principio, el volante jugó sin problemas. La ventana quedó como una anécdota.' }, { if: 'MOTO', ending: 'Gracias a la moto de último momento, el volante jugó sin problemas. Todavía hoy se la nombra en el vestuario con respeto.' }] }),
          o('B', 'Apelar con todos los papeles', 'Una pelea larga, de abogados y firmas.', { reputation: 2, budget: -500, board: -1 }, { ending: 'Apelaste con todos los papeles. La federación tardó tres meses en contestar y el volante entrenó con el plantel mientras tanto, como un fantasma de buena onda.', variants: [{ if: 'DEFIENDE', ending: 'Con la documentación ya presentada, apelaste y ganaste. El volante pudo jugar y Ferraro mandó un saludo sin firma.' }] }),
          o('C', 'Hacer que juegue como juvenil prestado', 'Una solución creativa. La federación se hace la distraída.', { locker: 2, fans: 2, board: -2 }, { ending: 'Hiciste que el volante juegue como juvenil prestado. Nadie dijo nada, la prensa hizo como que no veía y la tribuna se divirtió con el invento.', variants: [{ if: 'AYUDA', ending: 'Con la ayuda de el presidente del club, hiciste que el volante juegue como juvenil prestado. Nadie dijo nada y la tribuna se divirtió con el invento.' }] })
        ]
      )
    ]
  }
]
