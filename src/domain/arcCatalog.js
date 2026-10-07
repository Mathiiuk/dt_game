/**
 * Historias de cuatro capítulos (unas 8 a 10 fechas) con tono de humor y sabor a potrero argentino.
 * Cada capítulo es un evento con opciones; lo que elegís queda como "marca" y los capítulos siguientes lo recuerdan.
 * Las opciones del último capítulo traen el `ending` que queda en el Epílogo de la temporada y, opcionalmente, `variants`:
 * [{ if: 'MARCA', ending }] que cambian el final según el camino elegido antes (ver endingFor en domain/arcs.js).
 * Los nombres de personas son inventados: las historias homenajean anécdotas del fútbol argentino sin nombrar a nadie.
 * Marcadores de texto: {presidente}, {periodista}, {barra} (ver domain/characters.js).
 */

const o = (id, label, description, effects = {}, extra = {}) => ({ id, label, description, effects, ...extra })
const chapter = (title, description, options, memory = {}) => ({ title, description, options, memory })

export const ARC_CATALOG = [
  {
    id: 'pibe',
    title: 'El pibe del potrero',
    tagline: 'Un zurdo de barrio que juega descalzo y se la lleva atada.',
    category: 'COMMUNITY',
    chapters: [
      chapter(
        'Un pibe que la rompe en el potrero',
        'Un ojeador de las inferiores te cuenta de un zurdo de dieciséis años que hace jueguito con un limón y gambetea a tres con la pelota pegada al pie. Mide uno sesenta y juega descalzo. "Pará, que se lo lleva un grande", te susurra, mirando para los costados.',
        [
          o('A', 'Traerlo a las inferiores ya', 'Una prueba, una cama en la pensión y una promesa. El barrio ya habla de él.', { fans: 2, locker: 1 }, { cost: 400, flag: 'FICHADO' }),
          o('B', 'Dejarlo madurar un año', 'Que crezca tranquilo. Con suerte nadie se entera.', {}, { flag: 'ESPERA' }),
          o('C', 'Mandarlo a probarse al club de al lado', 'Es lo más prudente. Quizás.', { fans: -1 }, { flag: 'PERDIDO' })
        ]
      ),
      chapter(
        'Aparece el padre... y un señor de traje brillante',
        'Llega el padre del pibe con un hombre de saco brillante que se presenta como "representante de futuros cracks". Pide contrato largo, un departamento y que el nene juegue de diez "sí o sí". El pibe mira el piso y patea una piedrita.',
        [
          o('A', 'Firmarle un contrato digno', 'Poco dinero, mucha confianza. El representante frunce la nariz.', { board: 1, locker: -1 }, { cost: 600, flag: 'CONTRATO' }),
          o('B', 'Decirles que juega por mérito', 'Nadie tiene lugar asegurado en este vestuario.', { locker: 2, board: -1 }, { flag: 'MERITO' }),
          o('C', 'Que lo negocie la dirigencia', 'Vos no querés saber nada de comisiones. {presidente} sí.', { board_owed: 1 }, { flag: 'DIRIGENCIA' })
        ],
        { FICHADO: 'Lo trajiste vos, así que la responsabilidad es tuya.', PERDIDO: 'Se lo dejaste al vecino, pero el pibe volvió por su cuenta con la pelota bajo el brazo.' }
      ),
      chapter(
        'Debut con gambeta de video',
        'Entra a los ochenta minutos y le hace un caño a un marcador de dos metros. La tribuna se levanta como un solo hombre. {periodista} dice en la radio que es "el heredero del potrero". Ahora todos quieren una foto con él, incluso el que vende choripanes.',
        [
          o('A', 'Ponerlo de titular el domingo', 'La gente lo pide a gritos. Los más grandes del plantel, un poco menos.', { fans: 5, locker: -2 }, { flag: 'TITULAR' }),
          o('B', 'Cuidarlo: que no se le suba', 'Que siga entrenando como uno más.', { locker: 1, fans: 1 }, { flag: 'CUIDADO' }),
          o('C', 'Sacar camisetas con su nombre', 'Una plata rápida, y algún celo en el vestuario.', { budget: 900, locker: -2, fans: 2 }, { flag: 'MERCH' })
        ],
        { CONTRATO: 'El contrato que firmó le dio la tranquilidad para animarse.', MERITO: 'Se ganó el lugar sin regalos, y lo sabe todo el vestuario.' }
      ),
      chapter(
        'Una oferta de Europa con muchos ceros',
        'Un club cuyo nombre nadie sabe pronunciar ofrece una cifra con una cantidad indecente de ceros. El pibe llora en el vestuario: "Yo quiero ser campeón acá". {presidente} te mira desde la puerta con cara de "vendelo".',
        [
          o('A', 'Venderlo y salvar la caja', 'La plata entra, el pibe se va.', { budget: 3000, fans: -6, locker: -2, board: 4 }, { ending: 'Vendiste al pibe. Se fue llorando y a los tres meses ya hablaba con acento raro.', variants: [{ if: 'FICHADO', ending: 'Vendiste al pibe que habías traído vos. Se fue abrazando a los utileros y a los tres meses ya hablaba con acento raro.' }, { if: 'PERDIDO', ending: 'Vendiste al pibe que habías mandado a probarse al vecino. Se fue como llegó, con la pelota bajo el brazo y la sensación de que te lo sacabas de encima.' }] }),
          o('B', 'Que se quede, aunque no convenga', 'La dirigencia no lo entiende. La tribuna sí.', { fans: 6, locker: 3, board: -4 }, { ending: 'El pibe se quedó. Cada vez que toca la pelota, la popular canta su nombre.', variants: [{ if: 'FICHADO', ending: 'El pibe que trajiste vos se quedó. Cada vez que toca la pelota, la popular canta su nombre y después te mira a vos.' }, { if: 'PERDIDO', ending: 'El pibe que casi dejás ir se quedó. Cada vez que toca la pelota, la popular canta su nombre y alguien murmura que se te escapaba.' }] }),
          o('C', 'Venderlo con cláusula de recompra', 'Algo de plata y una puerta abierta. El barrio dice que vuelve.', { budget: 1800, fans: -2, board: 2 }, { ending: 'Lo vendiste con cláusula de recompra. En el barrio ya se arma la bandera para cuando vuelva.', variants: [{ if: 'FICHADO', ending: 'Lo vendiste con cláusula de recompra, el pibe que trajiste vos. En el barrio ya se arma la bandera para cuando vuelva, con tu nombre en una esquina.' }, { if: 'PERDIDO', ending: 'Lo vendiste con cláusula de recompra, aunque antes casi lo dejás ir. En el barrio ya se arma la bandera para cuando vuelva.' }] })
        ],
        { TITULAR: 'Desde que es titular, no hay club que no pregunte por él.', MERCH: 'Las camisetas con su nombre se vendieron como pan caliente y hoy todos saben quién es.' }
      )
    ]
  },
  {
    id: 'arquero',
    title: 'El arquero que no era de este mundo',
    tagline: 'Sale jugando, se cree delantero y a veces se la lleva puesta.',
    category: 'LOCKER_ROOM',
    chapters: [
      chapter(
        'Tu arquero se va al área rival... en la práctica',
        'En el partidito del martes tu arquero deja el arco y se va a jugar de nueve. "A mí me gusta la pelota", se defiende. El ayudante se agarra la cabeza con las dos manos. El segundo arquero mira desde el banco con cara de "¿y yo?".',
        [
          o('A', 'Dejarlo: es parte de su juego', 'A veces la locura funciona. Otras, no.', { locker: 2 }, { flag: 'LIBRE' }),
          o('B', 'Frenarlo: los arqueros atajan', 'Se acabó el cuento. El arquero te mira ofendido.', { locker: -1, board: 1 }, { flag: 'FRENADO' }),
          o('C', 'Hacerlo cobrar los penales', 'Si quiere patear, que patee. Pero los que cuentan.', { fans: 2, locker: 1 }, { flag: 'PENALES' })
        ]
      ),
      chapter(
        'Un blooper que da la vuelta al mundo',
        'Un centro tonto, un rebote, y la pelota se le escapa entre las piernas con una gracia involuntaria. El video se viraliza con música de circo. {periodista} lo apoda "el Pulpo Manco". Tu arquero se encierra en el baño del vestuario.',
        [
          o('A', 'Bancarlo públicamente', 'Un error lo tiene cualquiera. Que te quede claro.', { locker: 3, fans: -1 }, { flag: 'BANCADO' }),
          o('B', 'Mandarlo un partido al banco', 'Que piense un poco. Y que el suplente tenga su minuto de gloria.', { locker: -2, board: 1 }, { flag: 'BANCO' }),
          o('C', 'Hacerle una cargada en la conferencia', 'Reírte con él antes de que se rían de él.', { fans: 3, locker: 1 }, { flag: 'CARGADA' })
        ],
        { LIBRE: 'Salió jugando con los pies, como siempre, y esa vez le salió mal.', FRENADO: 'Hacés lo que te pidieron y atajás, ¿no? Bueno, esa vez no.' }
      ),
      chapter(
        'Quiere patear el penal que decide el partido',
        'Faltan diez minutos. Penal a favor. Tu arquero camina despacito hacia el punto y le pide la pelota al capitán, que no dice que no. "Dejame, DT", te grita desde media cancha. La tribuna no sabe si reírse o rezar.',
        [
          o('A', 'Que patee', 'Todo o nada. O muchísimo ruido.', { fans: 3, locker: 2 }, { flag: 'PATEA' }),
          o('B', 'Que lo patee el goleador', 'La razón gana. El arquero se enoja.', { locker: -1, board: 1 }, { flag: 'GOLEADOR' })
        ],
        { BANCADO: 'Después de que lo bancaste, está dispuesto a todo por vos.', CARGADA: 'La cargada lo soltó y ahora quiere más protagonismo.' }
      ),
      chapter(
        'El futuro del arquero',
        'Se terminó el año y el arquero te pide una charla. Tiene una oferta de otro club, un contrato que vence y una bandera con su cara en la popular que nadie sabe quién colgó. "Quiero quedarme, pero que me dejen ser yo", dice.',
        [
          o('A', 'Hacerle un homenaje con camiseta y bandera', 'Que quede en la historia como el loco del club.', { fans: 4, budget: 600 }, { ending: 'El arquero tiene hoy su propia bandera en la popular. Nadie sabe si es héroe o accidente, pero es de ellos.', variants: [{ if: 'PATEA', ending: 'Después de aquel penal que pateó, el arquero tiene su propia bandera en la popular. Nadie sabe si es héroe o accidente, pero es de ellos.' }, { if: 'GOLEADOR', ending: 'Aunque le sacaste el penal, el arquero tiene su propia bandera en la popular. Nadie sabe si es héroe o accidente, pero es de ellos.' }] }),
          o('B', 'Renovarle sin cláusulas raras', 'Confianza total, sin cuentos.', { locker: 3, board: -1 }, { cost: 500, ending: 'Renovó sin cláusulas. Dicen que ya piensa en meter un gol de arco a arco.', variants: [{ if: 'PATEA', ending: 'Renovó sin cláusulas y ya cobra los penales de práctica. Dicen que piensa en meter un gol de arco a arco.' }, { if: 'GOLEADOR', ending: 'Renovó sin cláusulas, aunque todavía te recuerda el penal. Dicen que piensa en meter un gol de arco a arco.' }] }),
          o('C', 'Dejarlo ir a otro club', 'Una buena plata y un vestuario más tranquilo.', { fans: -3, locker: -1, budget: 800 }, { ending: 'Se fue el arquero atrevido. El club ganó tranquilidad y perdió la mejor anécdota del año.', variants: [{ if: 'PATEA', ending: 'Se fue el arquero atrevido, el del penal. El club ganó tranquilidad y perdió la mejor anécdota del año.' }, { if: 'GOLEADOR', ending: 'Se fue el arquero atrevido, el del penal que no pateó. El club ganó tranquilidad y perdió la mejor anécdota del año.' }] })
        ],
        { PATEA: 'Pateó aquel penal y todavía discuten si fue gol o fue milagro.', GOLEADOR: 'Le sacaste el penal y todavía te lo recuerda.' }
      )
    ]
  },
  {
    id: 'mano',
    title: 'La mano que lo cambió todo',
    tagline: 'Fair play, viveza criolla y un gol que nunca se olvida.',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'Un gol raro en la práctica',
        'En el partido de práctica, tu delantero la mete con la mano, se da vuelta y le dice al ayudante: "Fue un poquito la mano de Dios, ¿no?". Se ríe. Todo el plantel mira cómo reaccionás.',
        [
          o('A', 'Anularlo y retarlo', 'Hay reglas. Hasta en la práctica.', { locker: -1, board: 1 }, { flag: 'SERIO' }),
          o('B', 'Reírte: el fútbol es picardía', 'Se arma una risa general. Los más serios te miran feo.', { locker: 3, board: -1 }, { flag: 'PICARO' }),
          o('C', 'Anularlo con humor', 'Lo anulás, pero hacés un chiste. Todos contentos.', { locker: 1 }, { flag: 'HUMOR' })
        ]
      ),
      chapter(
        'Pasa en el partido: gol con la mano y el árbitro no ve nada',
        'Un partido oficial, un centro, y tu delantero repite: la toca con la mano y la mete. El árbitro cobra gol. El rival estalla y {periodista} se frota las manos: "¿Fair play o viveza criolla?". Todos esperan lo que decís.',
        [
          o('A', 'Reconocerlo en la conferencia', 'Fue mano y lo decís. Mucha gente lo va a valorar, otra no tanto.', { fans: -1, board: 3, reputation: 3 }, { flag: 'RECONOCES' }),
          o('B', 'Callarte: "Lo cobró el árbitro"', 'No es tu trabajo hacerle el laburo al juez.', { fans: 3, board: -2, reputation: -2 }, { flag: 'CALLAS' }),
          o('C', 'Decir que fue "la mano de Dios, otra vez"', 'Una frase para la historia. Y para el escándalo.', { fans: 5, board: -3 }, { flag: 'MANO_DE_DIOS' })
        ],
        { SERIO: 'Ya lo habías retado por una mano en la práctica.', PICARO: 'En la práctica te habías reído de lo mismo.', HUMOR: 'En la práctica lo habías resuelto con un chiste.' }
      ),
      chapter(
        'El rival te invita a cenar',
        'El técnico del equipo rival organiza una cena de homenaje con una plaquita que dice "Al fair play". Es una indirecta con ocho copas de vino. Todos los diarios van a estar. Hay que decidir cómo aparecer.',
        [
          o('A', 'Ir de corbata y mucha humildad', 'Aguantás las bromas y te llevás una plaquita.', { board: 2, fans: 1 }, { flag: 'HUMILDE' }),
          o('B', 'No ir', 'Te perdés la cena y te ganás un par de titulares.', { board: -1 }, { flag: 'AUSENTE' }),
          o('C', 'Ir con una caja de alfajores "por las dudas"', 'Un gesto de buen humor. Quedó como una leyenda local.', { fans: 3 }, { cost: 200, flag: 'ALFAJORES' })
        ],
        { RECONOCES: 'Lo reconociste en voz alta y por eso te invitan.', CALLAS: 'Te callaste y el rival no te lo perdona.', MANO_DE_DIOS: 'Lo de la mano de Dios quedó grabado en la memoria colectiva.' }
      ),
      chapter(
        'El video vuelve a la tele',
        'Un programa de la tele arma un especial con "los goles más polémicos de todos los tiempos". El de tu delantero está en el podio. Lo llaman, te llaman, y {presidente} quiere que aproveches la ocasión para el club.',
        [
          o('A', 'Ir al programa a contar la historia', 'Un rato de fama, un par de anécdotas y mucho sentido del humor.', { fans: 3, reputation: 2 }, { ending: 'Fuiste al programa y contaste la historia con humor. Todavía te frenan en la calle para preguntarte por "la mano".', variants: [{ if: 'SERIO', ending: 'Como tomaste la polémica en serio desde el principio, fuiste al programa y contaste la historia con humor. Todavía te frenan en la calle para preguntarte por "la mano".' }, { if: 'HUMOR', ending: 'Como desde el principio le pusiste humor, fuiste al programa y contaste la historia con humor. Todavía te frenan en la calle para preguntarte por "la mano".' }] }),
          o('B', 'Hacer una camiseta con la frase', 'La plata no hace daño. A los puristas, sí.', { budget: 700, fans: 2 }, { ending: 'Salió una camiseta con la frase de la mano. Se vendió más que cualquier otra y los puristas no volvieron a hablarte.', variants: [{ if: 'SERIO', ending: 'Como tomaste la polémica en serio desde el principio, salió una camiseta con la frase de la mano. Se vendió más que cualquier otra y los puristas no volvieron a hablarte.' }, { if: 'HUMOR', ending: 'Como desde el principio le pusiste humor, salió una camiseta con la frase de la mano. Se vendió más que cualquier otra y los puristas no volvieron a hablarte.' }] }),
          o('C', 'Pedir que no usen la imagen', 'Preferís que el pasado quede donde está.', { board: 1, fans: -1 }, { ending: 'Pediste que sacaran el video. Lo sacaron, pero ya lo habían visto todos.', variants: [{ if: 'SERIO', ending: 'Como tomaste la polémica en serio desde el principio, pediste que sacaran el video. Lo sacaron, pero ya lo habían visto todos.' }, { if: 'HUMOR', ending: 'Como desde el principio le pusiste humor, pediste que sacaran el video. Lo sacaron, pero ya lo habían visto todos.' }] })
        ],
        { HUMILDE: 'La cena te dejó con la imagen limpia.', AUSENTE: 'No fuiste a la cena y los diarios te lo recuerdan.', ALFAJORES: 'Los alfajores de la cena hicieron más ruido que tus declaraciones.' }
      )
    ]
  },
  {
    id: 'asado',
    title: 'El asado de los jueves',
    tagline: 'Una tradición que une al vestuario... o lo hace estallar.',
    category: 'LOCKER_ROOM',
    chapters: [
      chapter(
        'El plantel quiere hacer un asado',
        'Los referentes proponen un asado todos los jueves en el predio. "Es para unirnos", dice el capitán con un chorizo en cada mano. El preparador físico se desmaya un poquito. El nutricionista no dice nada, pero toma nota.',
        [
          o('A', 'Aprobarlo, con ensalada', 'Mucha unión y un poco de culpa.', { locker: 4 }, { cost: 200, flag: 'APROBADO' }),
          o('B', 'Prohibirlo: somos profesionales', 'Los referentes se miran. Después te miran a vos.', { locker: -3, board: 1 }, { flag: 'PROHIBIDO' }),
          o('C', 'Ir y atender la parrilla vos', 'Cuando el DT hace el asado, el vestuario se rinde.', { locker: 6, fans: 1 }, { cost: 100, flag: 'PARRILLERO' })
        ]
      ),
      chapter(
        'El asado se agranda',
        'Ya no son solo jugadores: vienen familias, un tío con guitarra, un nene con una pelota y un señor que dice ser "primo del presidente" y no se va nunca. La cola para el chorizo da vuelta a la manzana del predio.',
        [
          o('A', 'Cerrarlo a plantel y cuerpo técnico', 'Se vuelve una cosa familiar. Un poco menos de gloria.', { locker: 1 }, { flag: 'CERRADO' }),
          o('B', 'Abrirlo a la hinchada una vez por mes', 'Un golazo de relaciones públicas, y un gasto en carbón.', { fans: 4, locker: -1 }, { cost: 300, flag: 'ABIERTO' }),
          o('C', 'Dejar que siga como está', 'El caos organizado. Todos se divierten, menos la dirigencia.', { locker: 2, board: -1 }, { flag: 'LIBRE' })
        ],
        { APROBADO: 'Lo aprobaste con una condición: ensalada.', PROHIBIDO: 'Primero lo prohibiste, pero se hizo igual en la casa del capitán.', PARRILLERO: 'Con vos en la parrilla, la fama del asado no deja de crecer.' }
      ),
      chapter(
        'Un jugador se pasa de vino',
        'Una sobremesa larga, un vaso de más y un jugador dice algo feo sobre el presidente. Alguien lo grabó. Para el lunes lo sabe todo el club, incluido {presidente}, que quiere que hagas algo.',
        [
          o('A', 'Hablar con él en privado', 'Sin escándalo. Pero el mensaje queda claro.', { locker: 1 }, { flag: 'PRIVADO' }),
          o('B', 'Multarlo', 'Una multa ejemplar. El plantel lo siente.', { budget: 300, locker: -3, board: 1 }, { flag: 'MULTA' }),
          o('C', 'Que pida disculpas con un asado para la dirigencia', 'Quizás es lo más argentino que podías hacer.', { locker: 1, board: 3 }, { flag: 'DISCULPAS' })
        ],
        { CERRADO: 'Era un asado cerrado, y alguien filtró la grabación igual.', ABIERTO: 'Con tanta gente, tarde o temprano alguien iba a grabar.', LIBRE: 'Nadie controlaba quién entraba y la grabación se filtró.' }
      ),
      chapter(
        'La mística del jueves',
        'Pasó el tiempo y el asado del jueves ya es una leyenda: se dice que el equipo gana más cuando comparte la mesa. Los medios preguntan por la "mística de la parrilla". {presidente} quiere que decidas qué hacer con la tradición.',
        [
          o('A', 'Mantenerlo para siempre', 'Una institución del club. Con humo incluido.', { locker: 4, fans: 2 }, { ending: 'El asado del jueves quedó como una institución del club. Hay hasta un cartel con el horario.', variants: [{ if: 'APROBADO', ending: 'Como habías dado el visto bueno desde el primer día, el asado del jueves quedó como una institución del club. Hay hasta un cartel con el horario.' }, { if: 'PROHIBIDO', ending: 'Aunque al principio lo prohibiste, el asado del jueves quedó como una institución del club. Hay hasta un cartel con el horario.' }] }),
          o('B', 'Pasarlo al sábado, con las familias', 'Más gente, más tranquilidad y menos resaca.', { locker: 2, fans: 3 }, { ending: 'El asado se mudó al sábado con las familias. Ya hay lista de espera.', variants: [{ if: 'APROBADO', ending: 'Como habías dado el visto bueno desde el primer día, el asado se mudó al sábado con las familias. Ya hay lista de espera.' }, { if: 'PROHIBIDO', ending: 'Aunque al principio lo prohibiste, el asado se mudó al sábado con las familias. Ya hay lista de espera.' }] }),
          o('C', 'Cerrar el ciclo con un gran asado final', 'Un último gran evento y a otra cosa.', { locker: 5 }, { cost: 300, ending: 'Cerraron el ciclo con un asado enorme. Todavía se habla de las achuras.', variants: [{ if: 'APROBADO', ending: 'Como habías dado el visto bueno desde el primer día, cerraron el ciclo con un asado enorme. Todavía se habla de las achuras.' }, { if: 'PROHIBIDO', ending: 'Aunque al principio lo prohibiste, cerraron el ciclo con un asado enorme. Todavía se habla de las achuras.' }] })
        ],
        { PRIVADO: 'Lo hablaste en privado y el asado siguió como si nada.', MULTA: 'La multa ahuyentó a la mitad de los invitados.', DISCULPAS: 'El asado de las disculpas terminó siendo el mejor de todos.' }
      )
    ]
  },
  {
    id: 'hincha',
    title: 'El último hincha del ascenso',
    tagline: 'Don Anselmo no falta a ningún partido desde 1962.',
    category: 'COMMUNITY',
    chapters: [
      chapter(
        'Don Anselmo toca la puerta del predio',
        'Noventa y un años, bastón y una camiseta que alguna vez fue celeste y hoy es de varios colores. Dice que no se perdió ningún partido desde el ascenso del 62. "Solo quiero ver ganar al equipo una vez más antes de irme", dice, y se sienta en el cordón de la vereda.',
        [
          o('A', 'Invitarlo a la práctica', 'Se queda toda la mañana y no para de hacer comentarios.', { locker: 2, fans: 2 }, { flag: 'INVITADO' }),
          o('B', 'Darle un lugar en el banco', 'La tribuna lo ve con el equipo y se emociona.', { fans: 3, board: -1 }, { flag: 'BANCO' }),
          o('C', 'Pedirle consejos tácticos', 'Te cuenta cómo se jugaba en su época, que era mejor.', { locker: 1, reputation: 1 }, { flag: 'CONSEJOS' })
        ]
      ),
      chapter(
        'Don Anselmo tiene una cábala',
        'Insiste en que hay que hacer un ritual antes de cada partido: tocar el palo izquierdo, dar tres vueltas al córner y no hablar con nadie de apellido Pérez. Hay un defensor Pérez en el plantel. Está confundido.',
        [
          o('A', 'Seguir la cábala al pie de la letra', 'Un poco de fe no le hace mal a nadie. Al defensor Pérez, sí.', { locker: 2, fans: 1 }, { flag: 'CABALA' }),
          o('B', 'Decirle que ya no hay cábalas', 'Con respeto, pero firme.', { fans: -1 }, { flag: 'SIN_CABALA' }),
          o('C', 'Cambiarla un poquito, a ver si funciona', 'El abuelo hace una mueca pero acepta.', { locker: -1, fans: 1 }, { flag: 'CABALA_MIX' })
        ],
        { INVITADO: 'Desde que fue a la práctica, se cree parte del cuerpo técnico.', BANCO: 'Desde que se sentó en el banco, se siente titular.', CONSEJOS: 'Cada tanto te manda un papelito con una táctica de 1964.' }
      ),
      chapter(
        'Un periodista quiere entrevistarlo',
        '{periodista}, de {medio}, quiere hacerle una nota al "hincha más viejo del club". En cámara, Don Anselmo se suelta: "Esto antes era un club, no una sociedad". Hay silencio en el predio. La nota sale esa misma noche.',
        [
          o('A', 'Dejarlo hablar', 'Dice cosas que hay que escuchar. A la dirigencia no le gusta.', { fans: 5, board: -3 }, { flag: 'HABLA' }),
          o('B', 'Cortar la nota', 'Sin escándalo. Aunque el abuelo se enoja.', { fans: -2, board: 1 }, { flag: 'CORTA' }),
          o('C', 'Que hable con el presidente al lado', 'Una charla a dos voces. Un poco más civilizada.', { fans: 2, board: 1 }, { flag: 'JUNTOS' })
        ],
        { CABALA: 'Siguió su cábala hasta en cámara, tocando el palo mientras hablaba.', SIN_CABALA: 'Todavía se acuerda de que no lo dejaste hacer su cábala.', CABALA_MIX: 'Dice que la cábala cambiada no tiene el mismo sabor.' }
      ),
      chapter(
        'El domingo de Don Anselmo',
        'Se acerca un partido importante y Don Anselmo, con su bastón, aparece en la puerta del vestuario. "Quiero estar en el partido", dice. "Aunque sea de lejos". El plantel lo espera con una emoción rara. Hay que decidir cómo cerrar esta historia.',
        [
          o('A', 'Dedicarle el partido', 'El equipo sale con su foto. La tribuna entera canta.', { fans: 5, locker: 3 }, { ending: 'El equipo salió con la foto de Don Anselmo. Dicen que dijo: "Ahora sí me puedo ir... pero el domingo que viene vengo igual".', variants: [{ if: 'INVITADO', ending: 'Como lo habías invitado a la práctica desde el principio, el equipo salió con la foto de Don Anselmo. Dicen que dijo: "Ahora sí me puedo ir... pero el domingo que viene vengo igual".' }, { if: 'BANCO', ending: 'Como lo sentaste en el banco desde el comienzo, el equipo salió con la foto de Don Anselmo. Dicen que dijo: "Ahora sí me puedo ir... pero el domingo que viene vengo igual".' }] }),
          o('B', 'Llevarlo al vestuario a dar la charla', 'Tres minutos de silencio, un par de lágrimas y una frase para el bronce.', { locker: 5 }, { ending: 'Don Anselmo dio la charla en el vestuario. Nadie recuerda qué dijo, pero salieron a ganar como si fuera una final.', variants: [{ if: 'INVITADO', ending: 'Como lo habías invitado a la práctica desde el principio, don Anselmo dio la charla en el vestuario. Nadie recuerda qué dijo, pero salieron a ganar como si fuera una final.' }, { if: 'BANCO', ending: 'Como lo sentaste en el banco desde el comienzo, don Anselmo dio la charla en el vestuario. Nadie recuerda qué dijo, pero salieron a ganar como si fuera una final.' }] }),
          o('C', 'Nombrarlo hincha ilustre con placa', 'Un homenaje formal, con foto y discurso.', { fans: 3, board: 2 }, { cost: 150, ending: 'Hay una placa con su nombre en la tribuna. Don Anselmo se sienta debajo cada domingo.', variants: [{ if: 'INVITADO', ending: 'Como lo habías invitado a la práctica desde el principio, hay una placa con su nombre en la tribuna. Don Anselmo se sienta debajo cada domingo.' }, { if: 'BANCO', ending: 'Como lo sentaste en el banco desde el comienzo, hay una placa con su nombre en la tribuna. Don Anselmo se sienta debajo cada domingo.' }] })
        ],
        { HABLA: 'Su nota todavía se comenta en el club.', CORTA: 'Todavía te reprocha haberle cortado la nota.', JUNTOS: 'Dicen que la nota con el presidente fue de las más civilizadas.' }
      )
    ]
  },
  {
    id: 'cabala',
    title: 'La camiseta de la suerte',
    tagline: 'Don Pocho, el utilero, jura que con esa camiseta se ganó el ascenso.',
    category: 'LOCKER_ROOM',
    chapters: [
      chapter(
        'Don Pocho trae su camiseta de la suerte',
        'El utilero del club, Don Pocho, tiene cuarenta años de predio y una camiseta de la suerte llena de remiendos, agujeros y un olor sospechoso. "Con esta ganamos el ascenso", jura. Pide que el equipo se la ponga debajo del uniforme.',
        [
          o('A', 'Dejarlo: no cuesta nada', 'Una cábala más. Y una lavada urgente.', { locker: 2 }, { flag: 'USADA' }),
          o('B', 'Prohibir la cábala', 'Don Pocho agacha la cabeza y se guarda la camiseta en el bolsillo.', { locker: -2, board: 1 }, { flag: 'PROHIBIDA' }),
          o('C', 'Hacer una réplica oficial y venderla', 'Una oportunidad comercial con aroma a historia.', { budget: 500, locker: 1 }, { flag: 'REPLICA' })
        ]
      ),
      chapter(
        'Gana el equipo... y empieza la superstición',
        'Ganan, y ahora cada jugador tiene su ritual: el cinco entra con el pie derecho, el nueve no se corta el pelo, el arquero no pisa las líneas. Un volante exige ser capitán "porque me da suerte". La lista de manías ocupa una hoja entera.',
        [
          o('A', 'Respetar todas las cábalas', 'Todos contentos. El ayudante, desbordado.', { locker: 3, board: -1 }, { flag: 'TODAS' }),
          o('B', 'Límite de dos cábalas por cabeza', 'Una medida salomónica. Algunos protestan.', { locker: 0, board: 1 }, { flag: 'LIMITE' }),
          o('C', 'Prohibirlas todas', 'Se acabó la fantasía. Los jugadores se ponen supersticiosos con tu decisión.', { locker: -3, board: 1 }, { flag: 'NINGUNA' })
        ],
        { USADA: 'La camiseta de Don Pocho sigue puesta debajo del uniforme.', PROHIBIDA: 'Aunque prohibiste la camiseta, la usan a escondidas.', REPLICA: 'Con la réplica oficial se vendió media cancha.' }
      ),
      chapter(
        'La camiseta desaparece antes del clásico',
        'Don Pocho entra al vestuario llorando: la camiseta no está. Sospecha de un hincha rival. El equipo se desmorona de nervios. Faltan dos días para el clásico, y la situación es de crisis nacional dentro del predio.',
        [
          o('A', 'Hacerle una nueva con la bandera del club', 'Una camiseta nueva, con carga emocional.', { locker: 3 }, { cost: 200, flag: 'NUEVA' }),
          o('B', 'Decir que "no hay cábalas, hay trabajo"', 'Un mensaje de profesionalismo. A medias creíble.', { locker: -1, board: 2, reputation: 1 }, { flag: 'TRABAJO' }),
          o('C', 'Hacer que Don Pocho pida ayuda en la conferencia', 'La ciudad entera se pone a buscarla.', { fans: 3, locker: 2 }, { flag: 'BUSQUEDA' })
        ],
        { TODAS: 'Con tantas cábalas, no es raro que algo se pierda.', LIMITE: 'Con el límite de cábalas, esta era la más importante.', NINGUNA: 'Como habías prohibido las cábalas, nadie quiere admitir que la extrañaba.' }
      ),
      chapter(
        'La camiseta aparece (o no)',
        'Después del clásico, llega un paquete a la puerta del predio: la camiseta, lavada y planchada, con una nota que dice "perdón, fue una broma". El rival se hizo cargo. Don Pocho llora otra vez. Ahora hay que decidir qué hacer con la reliquia.',
        [
          o('A', 'Guardarla en una vitrina del club', 'Un pedazo de historia, con candado.', { fans: 3, budget: 400 }, { ending: 'La camiseta de Don Pocho vive en una vitrina del club. La hinchada se saca fotos con ella.' }),
          o('B', 'Devolvérsela a Don Pocho para que la siga usando', 'Hay cosas que no se tocan.', { locker: 4 }, { ending: 'Don Pocho se quedó con su camiseta. Dicen que sigue ganando partidos, aunque nadie lo pueda probar.' }),
          o('C', 'Subastarla a beneficio del club', 'Una plata para las inferiores.', { budget: 1200, fans: -1 }, { ending: 'Subastaste la camiseta. Se vendió por una fortuna y Don Pocho todavía no te habla.' })
        ],
        { NUEVA: 'La camiseta nueva que le hiciste fue un golazo.', TRABAJO: 'Insististe en que no había cábalas, pero el vestuario tenía otra opinión.', BUSQUEDA: 'Toda la ciudad salió a buscarla gracias a la conferencia.' }
      )
    ]
  },
  {
    id: 'sponsor',
    title: 'El sponsor ocurrente',
    tagline: 'Una fábrica de empanadas quiere ponerle su nombre al estadio.',
    category: 'FINANCIAL_CRISIS',
    chapters: [
      chapter(
        'Una fábrica de empanadas ofrece plata',
        'Un empresario de bigote ancho llega al club con una carpeta y una bandeja de empanadas calientes. Quiere ponerle su nombre al estadio: "Estadio Empanadas El Gaucho, el único donde se come mientras se gana". Ofrece plata en efectivo y se queda a ver el entrenamiento.',
        [
          o('A', 'Aceptar', 'La caja lo agradece. Los hinchas, no tanto.', { budget: 2000, fans: -3, board: 2 }, { flag: 'ACEPTADO' }),
          o('B', 'Rechazar: la cancha tiene historia', 'Una decisión que la tribuna aplaude.', { fans: 3, board: -2 }, { flag: 'RECHAZADO' }),
          o('C', 'Negociar un nombre mixto', 'Una cosa del medio, con humor.', { budget: 1000 }, { flag: 'MIXTO' })
        ]
      ),
      chapter(
        'El sponsor pide cambios',
        'El empresario ya se siente dueño: pide una mascota gigante con forma de empanada llamada "Don Empa", que se festeje cada gol con una empanada de utilería y que en la camiseta vaya el logo en tamaño "bien visible". El plantel mira el boceto con la boca abierta.',
        [
          o('A', 'Aceptar la mascota', 'Un disfraz de dos metros y un baile ridículo. El plantel se ríe.', { budget: 500, fans: -1, locker: -1 }, { flag: 'MASCOTA' }),
          o('B', 'Mascota sí, camiseta no', 'Negociás lo que se puede. El empresario suspira.', { budget: 200 }, { flag: 'SOLO_MASCOTA' }),
          o('C', 'Cortar el vínculo', 'Rompés el contrato y devolvés la plata.', { fans: 2 }, { cost: 300, flag: 'CORTADO' })
        ],
        { ACEPTADO: 'El estadio ya tiene el nombre del sponsor en el cartel.', RECHAZADO: 'Dijiste que no al nombre, pero el empresario no se rindió.', MIXTO: 'El nombre mixto quedó escrito en un cartel que nadie sabe leer.' }
      ),
      chapter(
        'Don Empa se pelea con la mascota del rival',
        'Un video muestra a "Don Empa" bailando en el córner y dándole un empujón a un oso de peluche del equipo rival. La liga manda una multa. Los medios hablan de "violencia entre mascotas". {periodista} está en su salsa.',
        [
          o('A', 'Pagar la multa y pedir perdón', 'Un gesto serio. Con un poco de humor.', { fans: 3 }, { cost: 300, flag: 'PERDON' }),
          o('B', 'Defender a la mascota', 'Estaba "con el espíritu del club".', { fans: 4, board: -2 }, { flag: 'DEFIENDE' }),
          o('C', 'Despedir a Don Empa', 'Una salida elegante para la empanada.', { fans: -2, locker: 1 }, { flag: 'DESPIDE' })
        ],
        { MASCOTA: 'La mascota que aceptaste dio mucho de qué hablar.', SOLO_MASCOTA: 'La mascota que conservaste ahora es noticia.', CORTADO: 'Cortaste con el sponsor, pero la mascota ya era famosa.' }
      ),
      chapter(
        'Fin del contrato con las empanadas',
        'El contrato del sponsor llega a su fin. El empresario pide hablar con vos: "Me debés una respuesta". En la mesa hay una bandeja de empanadas, un contrato nuevo y una cara de ansiedad que no se puede disimular.',
        [
          o('A', 'Renovar por tres años', 'Mucha plata, poca dignidad.', { budget: 2500, board: 3, fans: -2 }, { ending: 'Renovaste con las empanadas por tres años. La caja respira y la popular sigue sin tragarse el nombre del estadio.' }),
          o('B', 'No renovar y volver al nombre de siempre', 'Una decisión sentimental. Y valiente.', { fans: 4, board: -1 }, { ending: 'Volvió el nombre de siempre al estadio. El empresario hizo una cena de despedida con empanadas gratis.' }),
          o('C', 'Hacer la "Empanada Cup" amistosa', 'Un torneo de verano con el nombre del sponsor y una plata extra.', { budget: 800, fans: 3 }, { ending: 'Se jugó la Empanada Cup. Ganó el local en los penales y todos se fueron con la panza llena.' })
        ],
        { PERDON: 'El pedido de perdón por Don Empa salió bien.', DEFIENDE: 'Todavía se discute si defender a la mascota fue un acierto.', DESPIDE: 'Despedir a Don Empa dejó un vacío en la tribuna.' }
      )
    ]
  },
  {
    id: 'niebla',
    title: 'El arquero en la niebla',
    tagline: 'Se suspendió el partido. Nadie le avisó al arquero.',
    category: 'LOCKER_ROOM',
    chapters: [
      chapter(
        'Una niebla que no deja ver ni el banderín',
        'A los sesenta minutos baja una niebla tan espesa que desde el banco no ves ni al ayudante, que está sentado al lado tuyo. El árbitro duda. Tu arquero, desde su arco, grita: "¡Tranquilos que por acá no pasa nadie!".',
        [
          o('A', 'Pedir que se suspenda', 'Lo más sensato. La tribuna abuchea a una nube.', { board: 1 }, { flag: 'PIDE' }),
          o('B', 'Que siga: vamos ganando', 'Si no se ve nada, mejor: así no ven cómo defendemos.', { fans: 2, board: -1 }, { flag: 'SIGUE' }),
          o('C', 'Mandar al utilero con una linterna', 'Una solución creativa. Ilumina tres metros.', { locker: 1, fans: 1 }, { cost: 50, flag: 'LINTERNA' })
        ]
      ),
      chapter(
        'El arquero que nadie fue a buscar',
        'El árbitro suspende el partido y todos se van al vestuario. Todos menos uno. Veinte minutos después, un policía encuentra a tu arquero agachado en el área, atento, gritando "¡Achiquen!" a la nada. Creía que el equipo estaba atacando y por eso no le llegaba la pelota.',
        [
          o('A', 'Pedirle perdón delante de todos', 'Lo recibís con un aplauso. Está ofendido igual.', { locker: 2 }, { flag: 'APLAUSO' }),
          o('B', 'Echarle la culpa al ayudante', 'Alguien tenía que contar las cabezas. No eras vos.', { locker: -1, board: 1 }, { flag: 'CULPA' }),
          o('C', 'Decir que era una prueba de concentración', 'La aprobó con un diez. Nadie te cree, pero suena bien.', { reputation: 1, locker: 1 }, { flag: 'PRUEBA' })
        ],
        { PIDE: 'Pediste la suspensión, pero nadie se acordó de avisarle al arco.', SIGUE: 'Querías que el partido siguiera, y él te tomó la palabra mejor que nadie.', LINTERNA: 'El utilero de la linterna pasó a dos metros del arco y no lo vio.' }
      ),
      chapter(
        'La prensa se entera',
        '{periodista} lo cuenta en {medio} y el país entero se ríe. Lo bautizan "el último centinela". Un programa de la tarde quiere llevarlo con una máquina de humo para recrear la escena. El arquero está encantado; el capitán, no tanto.',
        [
          o('A', 'Dejarlo ir a la tele', 'Va con guantes, buzo y una linterna de utilería.', { fans: 3, locker: -1 }, { flag: 'TELE' }),
          o('B', 'Prohibir entrevistas', 'Lo que pasa en la niebla queda en la niebla.', { board: 1, fans: -1 }, { flag: 'MUDO' }),
          o('C', 'Armar la campaña "Acá nadie abandona"', 'Afiches con el arquero solo en la bruma. Quedan hermosos.', { budget: 400, fans: 2 }, { flag: 'CAMPANA' })
        ],
        { APLAUSO: 'Lo recibiste con un aplauso, pero el arquero lo contó igual.', CULPA: 'El ayudante todavía no te perdona que le echaste la culpa.', PRUEBA: 'Lo de la "prueba de concentración" ya circula como meme.' }
      ),
      chapter(
        'Se reprograma el partido',
        'Se reprograma el partido suspendido y el pronóstico dice: niebla. Otra vez. Tu arquero llega al estadio con un silbato, una bengala de náutica y un cartel que dice "AVÍSENME". El vestuario espera tu decisión.',
        [
          o('A', 'Atarle una soga del arco al banco', 'Si se suspende, tirás de la soga.', { locker: 3, fans: 2 }, { ending: 'Le ataste una soga del arco al banco. Esta vez nadie se olvidó de él, y la soga quedó colgada en el museo del club.' }),
          o('B', 'Nombrarlo capitán por un día', 'Si es el último en irse, que sea el primero en salir.', { locker: 4, fans: 2 }, { ending: 'El arquero salió de capitán. Ese día se fue último del vestuario, de la cancha y hasta del estacionamiento.' }),
          o('C', 'Pedirle a la liga que se juegue de día', 'Lo pedís formalmente. Y, contra todo pronóstico, te lo aceptan.', { board: 2, reputation: 1 }, { ending: 'Se jugó al mediodía, a pleno sol. El arquero atajó con anteojos oscuros y no se perdió de vista ni un segundo.' })
        ],
        { TELE: 'Desde que fue a la tele, lo reconocen hasta en la verdulería.', MUDO: 'Le prohibiste hablar, pero la anécdota llegó igual por las redes.', CAMPANA: 'Los afiches de "Acá nadie abandona" están pegados en todo el barrio.' }
      )
    ]
  },
  {
    id: 'primo',
    title: 'El primo del crack',
    tagline: 'Una llamada, un apellido famoso y un fichaje que duró veinte minutos.',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'Llama el mejor jugador del mundo... o eso dice',
        'Suena el teléfono del club. Del otro lado, una voz que se presenta como el mejor jugador del mundo te recomienda a su primo: "Es mejor que yo, pero más tímido". La voz tiene un eco raro, como si hablara desde un locutorio. {presidente} ya está emocionado.',
        [
          o('A', 'Traerlo a una prueba', 'No perdés nada probando. Eso creés.', { board: 1 }, { flag: 'PRUEBA' }),
          o('B', 'Ficharlo sin verlo', 'Con ese apellido, ¿qué puede salir mal?', { fans: 2, board: 2 }, { cost: 500, flag: 'DIRECTO' }),
          o('C', 'Pedir un video primero', 'Te mandan un VHS de un partido en la playa, filmado desde muy lejos.', { reputation: 1 }, { flag: 'VIDEO' })
        ]
      ),
      chapter(
        'El primo llega al predio',
        'Llega con un botín de cada marca. En el calentamiento se tropieza con un cono y le pide disculpas al cono. Dice que está "un poco falto de ritmo" porque viene "de una gira por Asia". Nadie encuentra esa gira en ningún lado.',
        [
          o('A', 'Darle una semana más', 'Quizás es el viaje. O el jet lag. O la vida.', { locker: -1 }, { flag: 'PACIENCIA' }),
          o('B', 'Mandarlo a la reserva', 'Que demuestre allá lo que dice que es.', { locker: 1 }, { flag: 'RESERVA' }),
          o('C', 'Llamar al crack para confirmar', 'Atiende una señora que dice que ahí vive "la Chola" y corta.', { board: -1, reputation: 1 }, { flag: 'LLAMADA' })
        ],
        { PRUEBA: 'Lo trajiste a prueba, y la prueba fue... particular.', DIRECTO: 'Ya está firmado, así que ahora hay que hacerlo jugar.', VIDEO: 'El video en la playa no te había preparado para esto.' }
      ),
      chapter(
        'Debuta por obligación',
        'Se lesionan dos delanteros en el mismo partido y el primo es el único que queda en el banco. Entra. Corre en diagonal, hacia ningún lado, como si escuchara otra música. A los veinte minutos lo tenés que sacar porque se metió en la jugada del partido de la cancha de al lado.',
        [
          o('A', 'Defenderlo en la conferencia', '"Le faltó adaptación", decís, sin mirar a cámara.', { locker: 1, reputation: -2 }, { flag: 'DEFENSA' }),
          o('B', 'Admitir el papelón', 'Te reís de vos mismo antes de que lo hagan los demás.', { fans: 2, reputation: 1, board: -1 }, { flag: 'ADMITE' }),
          o('C', 'Culpar al presidente', 'Fue {presidente} el que atendió el teléfono. Técnicamente.', { fans: 1, board: -3 }, { flag: 'CULPA_PRESI' })
        ],
        { PACIENCIA: 'La semana extra no sirvió de mucho.', RESERVA: 'En la reserva había hecho un gol. En contra.', LLAMADA: 'Después de la llamada a la Chola, ya sospechabas algo.' }
      ),
      chapter(
        'Se descubre la verdad',
        '{periodista} investiga y descubre que el primo no es primo, que la voz del teléfono era un compañero de facultad del muchacho y que el crack famoso jamás oyó hablar de tu club. El muchacho, en cambio, dice que "vivir el sueño veinte minutos valió la pena".',
        [
          o('A', 'Rescindir y despedirlo con un abrazo', 'Fue un caradura simpático. Tiene su mérito.', { locker: 2, fans: 1 }, { ending: 'Rescindiste el contrato con un abrazo. El muchacho hoy da charlas motivacionales sobre "cómo cumplir tus sueños sin saber jugar".' }),
          o('B', 'Hacerle juicio', 'Que devuelva la plata. Lo poco que se gastó.', { budget: 500, fans: -1, board: 2 }, { ending: 'Le hiciste juicio y te devolvió la plata en cuotas. La última llegó con una tarjeta: "Saludos de su primo".' }),
          o('C', 'Contratarlo para vender abonos', 'Si convenció a todo un club, puede vender cualquier cosa.', { budget: 1200, fans: 2 }, { ending: 'Lo pusiste a vender abonos. Rompió el récord de socios en un mes, y algunos todavía creen que el crack es su primo.' })
        ],
        { DEFENSA: 'Lo defendiste en conferencia, y ahora te toca dar explicaciones.', ADMITE: 'Admitiste el papelón antes que nadie, y eso te cubre un poco.', CULPA_PRESI: 'El presidente todavía no te perdona que lo culpaste.' }
      )
    ]
  },
  {
    id: 'kaiser',
    title: 'El jugador que nunca jugó',
    tagline: 'Nueve clubes, cero partidos y un carisma imbatible.',
    category: 'LOCKER_ROOM',
    chapters: [
      chapter(
        'Llega un delantero con mucho chamuyo',
        'Se presenta un delantero con anteojos oscuros, cadena de oro y un currículum de nueve clubes en cuatro países. "Vengo a ser feliz", dice. A los cinco minutos el plantel entero lo adora. Nadie recuerda haberlo visto jugar nunca.',
        [
          o('A', 'Ficharlo: el vestuario lo quiere', 'Hay jugadores que suman desde otro lado.', { locker: 3 }, { cost: 300, flag: 'FICHADO' }),
          o('B', 'Pedirle que haga una práctica', 'Acepta encantado. A los dos minutos "siente un tirón".', { locker: 1 }, { flag: 'TIRON' }),
          o('C', 'Llamar a sus clubes anteriores', 'Todos lo recuerdan con cariño. Ninguno lo vio jugar.', { reputation: 1 }, { flag: 'REFERENCIAS' })
        ]
      ),
      chapter(
        'Siempre está lesionado',
        'Lleva un mes en el club y ya tuvo un desgarro, una contractura, una "molestia en el alma" y un esguince en la oreja. Se pasa el día en la camilla hablando por un celular que, según el kinesiólogo, es de juguete. Pero el vestuario nunca estuvo tan unido.',
        [
          o('A', 'Mandarle un médico de confianza', 'El médico sale del consultorio fascinado con sus historias.', { locker: 1 }, { cost: 100, flag: 'MEDICO' }),
          o('B', 'Ponerlo en la lista de concentrados', 'Que sienta la presión del partido.', { locker: -1 }, { flag: 'CONCENTRA' }),
          o('C', 'Nombrarlo administrador del grupo de WhatsApp', 'Es lo único en lo que nadie lo supera.', { locker: 3 }, { flag: 'WHATSAPP' })
        ],
        { FICHADO: 'Lo fichaste por su carisma, y el carisma está intacto.', TIRON: 'Desde aquel tirón en la práctica, no volvió a pisar el césped.', REFERENCIAS: 'Las referencias decían que era "un gran compañero". Ahora entendés por qué.' }
      ),
      chapter(
        'Por fin lo tenés que poner',
        'Faltan diez minutos, vas perdiendo y no quedan cambios: entra él. Antes de tocar la pelota se trepa al alambrado a "saludar a su gente", la tribuna rival lo insulta, él contesta y el árbitro lo echa. Sale ovacionado por los propios sin haber tocado la pelota.',
        [
          o('A', 'Multarlo', 'Paga con un cheque. Nadie sabe de qué banco.', { locker: -2, board: 1, budget: 200 }, { flag: 'MULTA' }),
          o('B', 'Reírte con él', '"Por lo menos no se lesionó", decís en la conferencia.', { fans: 3, locker: 2, board: -1 }, { flag: 'RISA' }),
          o('C', 'Preguntarle si alguna vez jugó al fútbol', 'Te pone la mano en el hombro: "Jugué a algo más grande: la vida".', { reputation: 1, locker: 1 }, { flag: 'PREGUNTA' })
        ],
        { MEDICO: 'El médico que le mandaste ahora es su mejor amigo.', CONCENTRA: 'En la concentración contó tantas anécdotas que nadie durmió.', WHATSAPP: 'El grupo de WhatsApp organizó una bandera para su debut.' }
      ),
      chapter(
        'Se le vence el contrato',
        'En toda su estadía jugó cero minutos efectivos, pero el plantel amenaza con no entrenar si se va. {presidente} pide que decidas. Él espera en la puerta con anteojos oscuros, aunque está nublado.',
        [
          o('A', 'Renovarlo como "jugador de vestuario"', 'Un puesto que no existe, para un jugador que tampoco.', { locker: 5, board: -3 }, { cost: 400, ending: 'Lo renovaste como "jugador de vestuario". Sigue sin jugar, pero el equipo no perdió nunca más un asado.' }),
          o('B', 'Despedirlo con una fiesta', 'Se va como vivió: rodeado de amigos.', { locker: 2, fans: 2 }, { cost: 200, ending: 'Se fue con una fiesta de despedida. Dio un discurso de cuarenta minutos sobre goles que nadie vio.' }),
          o('C', 'Darle un puesto en relaciones públicas', 'Si sabe vender algo, es humo.', { budget: 1000, fans: 2, locker: 2 }, { ending: 'Ahora es jefe de relaciones públicas. Consiguió tres sponsors en un mes sin mostrar nunca un papel.' })
        ],
        { MULTA: 'El cheque de la multa todavía no se pudo cobrar.', RISA: 'Tu frase de "por lo menos no se lesionó" ya es leyenda.', PREGUNTA: 'Su respuesta sobre "la vida" está pintada en la pared del vestuario.' }
      )
    ]
  },
  {
    id: 'pelota_playa',
    title: 'El gol de la pelota inflable',
    tagline: 'Una pelota de playa desde la tribuna y un gol que el reglamento no sabe explicar.',
    category: 'COMMUNITY',
    chapters: [
      chapter(
        'La hinchada lleva pelotas de playa',
        'Para alentar, la hinchada infla cuarenta pelotas de playa con los colores del club. Quedan lindísimas en la tribuna. Algunas caen a la cancha y el utilero las devuelve como si fueran souvenirs. {barra} dice que es "folclore".',
        [
          o('A', 'Prohibirlas', 'Las pelotas, en la playa.', { fans: -2, board: 1 }, { flag: 'PROHIBE' }),
          o('B', 'Dejarlas: que sea fiesta', 'Colores, alegría y nada que pueda salir mal.', { fans: 2 }, { flag: 'FIESTA' }),
          o('C', 'Venderlas oficiales en el buffet', 'Con escudo y todo.', { budget: 300, fans: 1 }, { flag: 'OFICIALES' })
        ]
      ),
      chapter(
        'El gol que nadie entiende',
        'Un remate flojito del rival va derecho a las manos de tu arquero, pero en el camino choca con una pelota de playa que estaba quieta en el área. La de verdad cambia de dirección y se mete. El árbitro lo cobra. Tu arquero mira al inflable como si lo hubiera traicionado un amigo.',
        [
          o('A', 'Reclamar con el reglamento en la mano', 'Lo leés en voz alta. No dice nada de inflables.', { board: 1, reputation: 1 }, { flag: 'RECLAMO' }),
          o('B', 'Tomarlo con humor', '"Le ganamos a todos, menos al inflable".', { fans: 2, locker: 1 }, { flag: 'HUMOR' }),
          o('C', 'Pinchar la pelota de playa en vivo', 'Explota con un ruido que asusta a medio estadio.', { fans: 3, reputation: -1 }, { flag: 'PINCHADA' })
        ],
        { PROHIBE: 'Las habías prohibido, pero alguien entró una igual.', FIESTA: 'La fiesta de los inflables tuvo su precio.', OFICIALES: 'Era una de las pelotas oficiales que vendía tu propio buffet.' }
      ),
      chapter(
        'El video da la vuelta al mundo',
        'El gol aparece en noticieros de países donde no saben ni dónde queda el tuyo. Una fábrica de juguetes quiere sacar pelotas inflables "edición gol histórico". {periodista} propone que el inflable sea elegido figura del partido.',
        [
          o('A', 'Aceptar la línea de juguetes', 'Plata fácil. Y un poco de vergüenza.', { budget: 900, fans: -1 }, { flag: 'JUGUETES' }),
          o('B', 'Donar el inflable a una escuela', 'Que por lo menos sirva para algo bueno.', { fans: 3, reputation: 1 }, { flag: 'ESCUELA' }),
          o('C', 'Ignorar todo', 'Ya va a pasar. Seguro.', { locker: 1 }, { flag: 'IGNORA' })
        ],
        { RECLAMO: 'Tu reclamo con el reglamento también se volvió viral.', HUMOR: 'Tu frase sobre el inflable ya está estampada en remeras.', PINCHADA: 'El momento en que lo pinchaste tiene más vistas que el gol.' }
      ),
      chapter(
        'La revancha',
        'Se juega la revancha contra el mismo rival. Su hinchada llega con pelotas de playa "para que se sientan como en casa". Tu plantel está picado y el inflable original, según dicen, está en una vitrina del club rival.',
        [
          o('A', 'Salir a la cancha con un inflable cada uno', 'Si no podés contra ellos, sumate.', { fans: 4, locker: 3 }, { ending: 'El plantel salió con pelotas de playa y se las regaló a los chicos de la tribuna. Ganaron, y nadie volvió a burlarse.' }),
          o('B', 'Pedir que no entre ningún inflable', 'Fútbol serio, como corresponde.', { board: 2, fans: -1 }, { ending: 'No entró ningún inflable. El partido fue aburridísimo y la gente lo extrañó.' }),
          o('C', 'Ofrecer un canje: tu arquero por el inflable', 'Una broma de mal gusto. O no tanto.', { fans: 3, locker: -2 }, { ending: 'Ofreciste canjear al arquero por la pelota de playa. El rival dijo que no; el arquero dice que lo pensaron demasiado.' })
        ],
        { JUGUETES: 'Los inflables "edición gol histórico" se venden hasta en el club rival.', ESCUELA: 'El inflable donado está colgado en una escuela como trofeo.', IGNORA: 'Ignoraste todo, pero el inflable no te ignoró a vos.' }
      )
    ]
  },
  {
    id: 'tarta',
    title: 'El suplente que se comió la tarta',
    tagline: 'Un arquero de 120 kilos, una tarta de carne y una casa de apuestas atenta.',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'Un partido de Copa contra un gigante',
        'Por la Copa te toca un grande y la tele transmite todo. El tercer arquero, un señor de ciento veinte kilos que además corta el pasto del predio, va al banco. Lleva una bolsita sospechosa. "Es por si me baja la presión", explica.',
        [
          o('A', 'Revisarle la bolsita', 'Control de aduana en el banco de suplentes.', { board: 1, locker: -1 }, { flag: 'REVISA' }),
          o('B', 'Confiar en él', 'Cuarenta años en el club. ¿Qué podría hacer?', { locker: 2 }, { flag: 'CONFIA' }),
          o('C', 'Sentarlo al lado tuyo', 'Así lo controlás de cerca.', {}, { flag: 'AL_LADO' })
        ]
      ),
      chapter(
        'La tarta en cámara',
        'Faltan diez minutos, vas perdiendo por dos y ya no quedan cambios. El suplente saca una tarta de carne entera y se la come en el banco, mirando a cámara. El país entero lo ve. Ahí te enterás de que una casa de apuestas pagaba ocho a uno a que "un suplente come una tarta en vivo".',
        [
          o('A', 'Preguntarle si apostó', 'Dice que no. Pero un primo suyo, sí.', { board: 1 }, { flag: 'PREGUNTA' }),
          o('B', 'Defenderlo: tenía hambre', 'Es un ser humano. Con apetito.', { locker: 2, board: -2 }, { flag: 'HAMBRE' }),
          o('C', 'Decir en conferencia que estaba rica', 'Te ofreció un pedazo. Para descomprimir, lo contás.', { fans: 3, reputation: -1 }, { flag: 'PEDAZO' })
        ],
        { REVISA: 'Revisaste la bolsita, pero la tarta estaba en el bolsillo de la campera.', CONFIA: 'Confiaste en él. La tarta también.', AL_LADO: 'Estaba sentado al lado tuyo. Hasta te ofreció.' }
      ),
      chapter(
        'Investiga la liga',
        'La liga abre una investigación por "conducta extradeportiva vinculada a apuestas". {periodista} lo bautiza "el tartagate". Los sponsors se ponen nerviosos y {presidente} quiere un responsable. Al arquero, mientras tanto, lo invitan a un programa de cocina.',
        [
          o('A', 'Que renuncie y pida perdón', 'Una salida digna. Con olor a horno.', { board: 3, locker: -2 }, { flag: 'RENUNCIA' }),
          o('B', 'Bancarlo hasta el final', 'Es del club. Con tarta y todo.', { locker: 3, board: -2, fans: 1 }, { flag: 'BANCA' }),
          o('C', 'Proponer que pague con cien tartas para un comedor', 'Justicia gastronómica.', { fans: 3, board: 1 }, { cost: 150, flag: 'COMEDOR' })
        ],
        { PREGUNTA: 'Lo del primo apostador ya era un secreto a voces.', HAMBRE: 'Tu defensa del "tenía hambre" no ayudó demasiado.', PEDAZO: 'Tu chiste sobre la tarta se repitió en todos los noticieros.' }
      ),
      chapter(
        'Atajadas al horno',
        'Final inesperado: al arquero le ofrecen conducir un programa de cocina llamado "Atajadas al horno". Pide permiso para usar la camiseta del club en el estudio. Una panadería del barrio quiere sacar la "tarta del arquero".',
        [
          o('A', 'Sacar la tarta oficial del club', 'Con escudo de masa y todo.', { budget: 1500, fans: 2, board: 1 }, { ending: 'Salió la "tarta del arquero" con el escudo del club. Se vende en el buffet y no queda una los días de partido.' }),
          o('B', 'Prohibirle usar la camiseta', 'El club no es una rotisería.', { board: 2, fans: -2 }, { ending: 'No lo dejaste usar la camiseta. Igual el programa fue un éxito y al final de cada receta te manda saludos.' }),
          o('C', 'Ir de invitado al programa', 'Delantal, harina y cero idea de cocinar.', { fans: 4, reputation: 1 }, { ending: 'Fuiste al programa a cocinar con él. La tarta salió cruda, pero el rating fue récord.' })
        ],
        { RENUNCIA: 'Aunque renunció, sigue sintiendo la camiseta.', BANCA: 'Lo bancaste cuando nadie lo hacía, y no se lo olvida.', COMEDOR: 'Las cien tartas para el comedor lo hicieron todavía más querido.' }
      )
    ]
  },
  {
    id: 'alambrado',
    title: 'El fichaje pagado con alambrado',
    tagline: 'No hay plata, pero hay un delantero y un club que necesita rejas.',
    category: 'FINANCIAL_CRISIS',
    chapters: [
      chapter(
        'No hay un peso para fichar',
        'Necesitás un nueve y la tesorería tiene tres monedas y un vale del almacén. Un club del ascenso tiene un delantero alto y torpe que hace goles de rebote. Su presidente dice: "Plata no queremos. ¿Tienen alambrado?". Al club le sobran cuarenta metros de alambre olímpico.',
        [
          o('A', 'Cambiarlo por el alambrado', 'El fichaje más barato de la historia.', { board: 2, fans: 1 }, { flag: 'ALAMBRE' }),
          o('B', 'Ofrecer camisetas viejas', 'Hay un depósito lleno, de un sponsor que ya ni existe.', { locker: -1 }, { flag: 'CAMISETAS' }),
          o('C', 'Ofrecer un asado anual de por vida', '{presidente} pone cara de que eso también es plata.', { board: -1, locker: 1 }, { flag: 'ASADO' })
        ]
      ),
      chapter(
        'El delantero se entera de cuánto valía',
        'El nueve llega, hace dos goles en el debut y se entera por {periodista} de cómo lo pagaron. "¿Ni siquiera alambre de púas?", pregunta, dolido. El vestuario lo bautiza "el Olímpico". Él no sabe si reírse o llorar.',
        [
          o('A', 'Explicarle que importa lo que rinde, no lo que costó', 'Una charla motivacional de manual.', { locker: 2 }, { flag: 'CHARLA' }),
          o('B', 'Subirle el sueldo para compensar', 'Ahora vale un poco más que una reja.', { locker: 1 }, { cost: 400, flag: 'AUMENTO' }),
          o('C', 'Abrazar el apodo y sacar una remera', 'Si el chiste ya está, que deje algo.', { budget: 400, fans: 2, locker: -1 }, { flag: 'REMERA' })
        ],
        { ALAMBRE: 'Cuarenta metros de alambre olímpico: eso valía para el mercado.', CAMISETAS: 'Lo pagaste con camisetas viejas que tenían manchas de 1998.', ASADO: 'Lo pagaste con un asado anual, y el otro club ya mandó la fecha.' }
      ),
      chapter(
        'El otro club reclama',
        'El club que te lo vendió dice que lo que mandaste llegó "en mal estado" y quiere al jugador de vuelta o un arco nuevo. El delantero es tu goleador. {presidente} no quiere juicios y la liga no sabe qué reglamento aplicarle a un pago de ferretería.',
        [
          o('A', 'Mandarles un arco nuevo', 'Con red y todo. Fin del tema.', { board: 1 }, { cost: 500, flag: 'ARCO' }),
          o('B', 'Ir a la liga con fotos del alambre', 'Presentás un álbum entero como prueba.', { reputation: 1, board: -1 }, { flag: 'LIGA' }),
          o('C', 'Proponer un amistoso: el que gana se queda con todo', 'Fútbol para resolver lo que el fútbol rompió.', { fans: 3, locker: 1 }, { flag: 'AMISTOSO' })
        ],
        { CHARLA: 'Tu charla le levantó el ánimo, pero no el precio.', AUMENTO: 'Con el aumento, ya vale más que el alambrado.', REMERA: 'La remera del Olímpico se agotó en un día.' }
      ),
      chapter(
        'Lo quiere un club grande',
        'El Olímpico terminó goleador del torneo y un club grande ofrece plata de verdad, en billetes. El delantero te pide una sola cosa: "Que esta vez valga más que una reja".',
        [
          o('A', 'Venderlo por plata contante y sonante', 'Por fin una transferencia normal.', { budget: 3000, fans: -3, board: 4 }, { ending: 'Lo vendiste por una fortuna. Con la plata, el club se compró alambrado nuevo, por las dudas.' }),
          o('B', 'Renovarle con una cláusula enorme', 'Que nadie se lo lleve barato.', { locker: 3, fans: 3, board: -1 }, { cost: 600, ending: 'Le renovaste con una cláusula gigante. En letra chica dice: "No negociable por materiales de construcción".' }),
          o('C', 'Venderlo a cambio de una tribuna', 'Si funcionó una vez...', { fans: 4, budget: 500, board: 1 }, { ending: 'Lo vendiste a cambio de una tribuna prefabricada. Se llama "Tribuna Olímpico" y es la que más alienta del estadio.' })
        ],
        { ARCO: 'El arco nuevo cerró el tema con el otro club.', LIGA: 'La liga falló a tu favor gracias al álbum de fotos del alambre.', AMISTOSO: 'Ganaste el amistoso, y él hizo los tres goles.' }
      )
    ]
  },
  {
    id: 'camiseta_prestada',
    title: 'Las camisetas prestadas',
    tagline: 'Dos equipos vestidos iguales y una sola solución: la carnicería del pueblo.',
    category: 'FINANCIAL_CRISIS',
    chapters: [
      chapter(
        'Llegan de visitante... con la misma camiseta',
        'Viajás cuatrocientos kilómetros y en el vestuario descubrís que los dos equipos trajeron camiseta blanca. El utilero jura que le dijeron "vengan de blanco". El árbitro dice que así no se juega. Falta media hora.',
        [
          o('A', 'Pedirle prestadas las suyas al club del pueblo', 'Un club amateur de la esquina tiene un juego verde a rayas.', { fans: 1 }, { flag: 'PUEBLO' }),
          o('B', 'Proponer jugar en cuero', 'El árbitro lo piensa seriamente. Dice que no.', { locker: 1, board: -1 }, { flag: 'CUERO' }),
          o('C', 'Dar vuelta las camisetas y pintar números con fibra', 'Arte urbano de emergencia.', { locker: 2 }, { cost: 50, flag: 'FIBRA' })
        ]
      ),
      chapter(
        'Las camisetas son de otro tamaño',
        'Las que consiguen son talle niño o talle "abuelo de 1974". Al nueve le llega al ombligo; al arquero, a las rodillas. Adelante dicen "Carnicería Don Tito" en letras rojas. La tele no deja de enfocarlas.',
        [
          o('A', 'Jugar así y hacerse los distraídos', 'Acá no pasa nada. Nada.', { locker: 1, fans: 2 }, { flag: 'DISTRAIDOS' }),
          o('B', 'Pedir que se postergue el partido', 'Con dignidad, aunque sea.', { board: 1, fans: -2 }, { flag: 'POSTERGA' }),
          o('C', 'Dar las indicaciones por talle', '"¡Vos, el XXL, marcá al nueve!".', { locker: 3 }, { flag: 'TALLES' })
        ],
        { PUEBLO: 'El club del pueblo prestó todo lo que tenía, incluido lo que no servía.', CUERO: 'Como no te dejaron jugar en cuero, hubo que conseguir camisetas a las corridas.', FIBRA: 'La fibra se corrió en el calentamiento y hubo que salir a buscar otro juego.' }
      ),
      chapter(
        'La carnicería se hace famosa',
        'Las fotos del partido recorren el país y la "Carnicería Don Tito" se vuelve conocida en todos lados. Don Tito llama: quiere ser sponsor oficial. Ofrece poca plata, pero vacío y chorizo gratis para el plantel durante un año.',
        [
          o('A', 'Aceptar la carne como pago', 'El vestuario aplaude. La tesorería, no.', { locker: 4, board: -1 }, { flag: 'CARNE' }),
          o('B', 'Pedirle plata en serio', 'Los chorizos no pagan la luz.', { budget: 600, locker: -1 }, { flag: 'PLATA' }),
          o('C', 'Negociar mitad y mitad', 'Un poco de plata, un poco de achuras.', { budget: 300, locker: 2 }, { flag: 'MITAD' })
        ],
        { DISTRAIDOS: 'Jugaron haciéndose los distraídos, y eso hizo todo más gracioso.', POSTERGA: 'La liga no aceptó postergar, y se jugó igual con las camisetas prestadas.', TALLES: 'Las indicaciones por talle quedaron para la historia.' }
      ),
      chapter(
        'Tres juegos de camisetas, por las dudas',
        'La liga multa al club y exige tres juegos oficiales de camisetas. No hay plata para tanto. El club del pueblo pide que le devuelvan las suyas. Don Tito pide una foto. Hay que cerrar el tema.',
        [
          o('A', 'Adoptar el verde a rayas como tercera camiseta', 'Homenaje y solución en uno.', { fans: 4, budget: 800 }, { ending: 'El verde a rayas del club del pueblo es la tercera camiseta oficial. Es la más vendida y nadie entiende por qué.' }),
          o('B', 'Devolverlas con una donación', 'Lo que se presta, se devuelve mejor.', { fans: 2, reputation: 2 }, { cost: 300, ending: 'Devolviste las camisetas con una donación. El club del pueblo estrenó juego nuevo con tu escudo en la manga.' }),
          o('C', 'Contratar un segundo utilero', 'Uno lleva las camisetas, el otro controla al primero.', { locker: -1, board: 2 }, { cost: 200, ending: 'Ahora hay dos utileros. Todavía discuten de qué color había que venir.' })
        ],
        { CARNE: 'El plantel come vacío todas las semanas, pero la caja sigue vacía.', PLATA: 'Don Tito pagó en plata, pero dejó de mandar chorizos.', MITAD: 'El acuerdo mitad y mitad dejó a todos más o menos contentos.' }
      )
    ]
  },
  {
    id: 'canasto',
    title: 'El DT en el canasto de la ropa',
    tagline: 'Te suspendieron cuatro fechas. Al canasto no lo suspendió nadie.',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'Te suspenden por protestar',
        'Le gritaste al línea algo que no se puede repetir y te dan cuatro fechas: ni banco, ni vestuario, ni charla técnica. {periodista} pregunta cómo pensás dirigir. Tu ayudante, que nunca dirigió nada, transpira.',
        [
          o('A', 'Confiar en el ayudante', 'Es su gran oportunidad. Él no está tan seguro.', { locker: 1 }, { flag: 'AYUDANTE' }),
          o('B', 'Apelar la sanción', 'Abogados, formularios y esperanza.', { board: -1, reputation: 1 }, { cost: 200, flag: 'APELA' }),
          o('C', 'Decir "voy a estar más cerca que nunca"', 'Una frase misteriosa. El vestuario sonríe.', { locker: 2, fans: 1 }, { flag: 'MISTERIO' })
        ]
      ),
      chapter(
        'El plan del canasto',
        'El utilero propone algo: meterte en el canasto de la ropa sucia y entrarte al vestuario en el entretiempo. "Lo hacían en Europa", jura. El canasto huele a botín mojado y tiene un agujerito para respirar. El plan es ridículo. Y puede funcionar.',
        [
          o('A', 'Meterte en el canasto', 'Entre medias usadas y vendas viejas.', { locker: 3 }, { flag: 'CANASTO' }),
          o('B', 'Dirigir por walkie-talkie desde la tribuna', 'Tecnología de los noventa al servicio de la táctica.', { locker: 1, board: -1 }, { flag: 'WALKIE' }),
          o('C', 'Ver el partido desde el techo de una vecina', 'La señora te cobra una gaseosa y te presta una reposera.', { fans: 2 }, { cost: 20, flag: 'TECHO' })
        ],
        { AYUDANTE: 'El ayudante dirigió el primer partido y pidió volver a su puesto.', APELA: 'La apelación fue rechazada en un trámite de cuatro minutos.', MISTERIO: 'Tu frase misteriosa estaba a punto de cobrar sentido.' }
      ),
      chapter(
        'Casi te descubren',
        'En el entretiempo, un veedor de la liga entra al vestuario justo durante la charla. Silencio total. El capitán estornuda y nadie mira hacia donde estás. El veedor olfatea: "Qué olor raro hay acá". Todo el plantel se aguanta la risa.',
        [
          o('A', 'Quedarte quieto', 'Respirás por el agujerito. Despacio.', { locker: 2 }, { flag: 'QUIETO' }),
          o('B', 'Salir y entregarte', 'Con dignidad, y con una media en la cabeza.', { board: 2, locker: -1, reputation: 1 }, { flag: 'ENTREGA' }),
          o('C', 'Hacer ruido de gato', 'Maullás. No te sale nada bien.', { locker: 3, fans: 1 }, { flag: 'GATO' })
        ],
        { CANASTO: 'Ahí estabas, dentro del canasto, entre medias usadas.', WALKIE: 'El walkie-talkie se acopló con una radio de taxis justo en ese momento, y tuviste que bajar corriendo.', TECHO: 'Bajaste del techo para dar la charla y te escondiste en un placard.' }
      ),
      chapter(
        'La historia sale a la luz',
        'Un jugador lo cuenta en una entrevista esa misma semana. {periodista} te bautiza "el DT de la ropa sucia". La liga amenaza con más sanciones, la hinchada fabrica un canasto gigante de cartón y {presidente} quiere saber qué vas a decir.',
        [
          o('A', 'Negarlo todo', 'Nunca hubo canasto. Ni medias. Ni nada.', { board: 1, fans: -1 }, { ending: 'Lo negaste todo. Nadie te creyó, y desde entonces la hinchada lleva un canasto a cada partido.' }),
          o('B', 'Contarlo con orgullo', 'Es la mejor anécdota de tu carrera.', { fans: 5, board: -3 }, { ending: 'Lo contaste con orgullo en una conferencia. La liga te multó, pero el canasto ya está en el museo del club.' }),
          o('C', 'Subastar el canasto para una causa benéfica', 'Que el olor sirva para algo.', { fans: 3, budget: 600 }, { ending: 'Subastaste el canasto a beneficio. Lo compró un hincha que ahora guarda ahí su ropa de cancha.' })
        ],
        { QUIETO: 'Te quedaste quieto y el veedor se fue sin ver nada.', ENTREGA: 'Te entregaste, y el veedor no podía parar de reírse.', GATO: 'Tu maullido fue tan malo que el veedor dejó un platito de leche.' }
      )
    ]
  },
  {
    id: 'camara',
    title: 'La cámara que seguía la pelada',
    tagline: 'Transmisión automática, inteligencia artificial y un juez de línea calvo.',
    category: 'FINANCIAL_CRISIS',
    chapters: [
      chapter(
        'Una cámara que filma sola',
        'Para ahorrar en la transmisión, {presidente} quiere comprar una cámara automática que "sigue la pelota con inteligencia artificial". Promete que se paga sola en un mes. El camarógrafo de toda la vida mira la caja con desconfianza.',
        [
          o('A', 'Aprobar la compra', 'El futuro llegó, y viene en caja.', { budget: 400, board: 2 }, { flag: 'COMPRA' }),
          o('B', 'Probarla primero en un amistoso', 'Prudencia tecnológica.', { board: 1 }, { flag: 'PRUEBA' }),
          o('C', 'Quedarse con el camarógrafo de siempre', 'Cuesta más, pero sabe dónde está la pelota.', { fans: 1, board: -1 }, { cost: 200, flag: 'HUMANO' })
        ]
      ),
      chapter(
        'El partido de la pelada',
        'En el partido oficial, la cámara confunde la pelota con la cabeza brillante del juez de línea. Durante noventa minutos, los hinchas en sus casas ven un primer plano perfecto de una pelada corriendo por la banda. Los goles no los ve nadie.',
        [
          o('A', 'Pedirle al línea que use gorra', 'El línea se niega: dice que es discriminación capilar.', { reputation: -1 }, { flag: 'GORRA' }),
          o('B', 'Reírte y subir el video completo', 'Noventa minutos de pelada en alta definición.', { fans: 4, board: -1 }, { flag: 'VIDEO' }),
          o('C', 'Pedir la devolución de la cámara', 'Con la garantía en la mano.', { board: 1 }, { flag: 'DEVOLUCION' })
        ],
        { COMPRA: 'Compraste la cámara sin probarla, y se notó.', PRUEBA: 'En el amistoso había funcionado de diez: ese día el línea tenía gorra.', HUMANO: 'El camarógrafo de siempre estaba de licencia justo ese día, y hubo que usar la cámara prestada.' }
      ),
      chapter(
        'El línea es una estrella',
        'El video de la pelada tiene millones de reproducciones. El juez de línea recibe cartas de fans, una marca de champú lo quiere para una publicidad y {periodista} lo entrevista. Un sponsor ofrece pagar por poner su logo... en la cabeza del línea.',
        [
          o('A', 'Aceptar el sponsor capilar', 'Publicidad en movimiento. Muy en movimiento.', { budget: 1000, reputation: -2 }, { flag: 'LOGO' }),
          o('B', 'Invitar al línea a un partido como homenaje', 'Palco, plaqueta y aplausos.', { fans: 3 }, { flag: 'HOMENAJE' }),
          o('C', 'Pedirle al fabricante que actualice el software', 'Un mail muy serio, con capturas.', { board: 1 }, { cost: 100, flag: 'SOFTWARE' })
        ],
        { GORRA: 'El línea se negó a la gorra y salió en todos los diarios.', VIDEO: 'El video completo que subiste fue el más visto del año.', DEVOLUCION: 'Pediste devolver la cámara, pero el video ya estaba en todos lados.' }
      ),
      chapter(
        'La revancha de la cámara',
        'Llega el partido decisivo de la temporada y la cámara vuelve a su lugar. El fabricante promete que "ya distingue cabezas de pelotas". El árbitro designado, por pura casualidad, es completamente pelado.',
        [
          o('A', 'Confiar en la tecnología', 'Lo prometieron por escrito.', { board: 2, fans: -1 }, { ending: 'Confiaste en la cámara. Esta vez siguió la pelota... salvo en el gol, que siguió al árbitro festejando.' }),
          o('B', 'Volver al camarógrafo de siempre', 'Hay cosas que no se automatizan.', { fans: 3, locker: 1 }, { cost: 200, ending: 'Volvió el camarógrafo de siempre. Filmó todo perfecto y en el entretiempo hizo un primer plano de la pelada, por cariño.' }),
          o('C', 'Transmitir las dos señales', 'Una para la pelota, otra para la pelada.', { fans: 5, budget: 500 }, { ending: 'Transmitiste las dos señales. La de la pelada tuvo más audiencia que la del partido.' })
        ],
        { LOGO: 'El logo en la cabeza del línea dio plata, pero también vergüenza.', HOMENAJE: 'El homenaje al línea fue emotivo y algo brillante.', SOFTWARE: 'El fabricante juró que la actualización estaba lista.' }
      )
    ]
  },
  {
    id: 'fuga',
    title: 'La fuga de la concentración',
    tagline: 'Sábanas anudadas, un primer piso y un cumpleaños de quince imperdible.',
    category: 'LOCKER_ROOM',
    chapters: [
      chapter(
        'Concentración en un hotel de ruta',
        'Antes del partido más importante del año, el plantel concentra en un hotel de ruta. A las doce de la noche el ayudante pasa lista: faltan cuatro. De la ventana del primer piso cuelga una soga hecha con sábanas anudadas, flameando como una bandera de rendición.',
        [
          o('A', 'Esperarlos despierto en el lobby', 'Con los brazos cruzados y un café frío.', { board: 1 }, { flag: 'LOBBY' }),
          o('B', 'Salir a buscarlos con el micro del club', 'Discreto no es, pero es rápido.', { locker: -1 }, { cost: 50, flag: 'MICRO' }),
          o('C', 'Hacerte el dormido y anotar todo', 'La venganza es un plato que se sirve en la práctica.', { locker: 1 }, { flag: 'DORMIDO' })
        ]
      ),
      chapter(
        'Estaban en un cumpleaños de quince',
        'Resulta que estaban en el cumpleaños de quince de la sobrina del cinco, a tres cuadras. Bailaron el vals, se sacaron fotos con la cumpleañera y uno se quedó a cantar con el animador. Las fotos ya circulan por todo el barrio.',
        [
          o('A', 'Que no jueguen el domingo', 'Una sanción ejemplar. Te quedás sin cuatro titulares.', { locker: -3, board: 2 }, { flag: 'SANCION' }),
          o('B', 'Hablarlo en grupo', 'Ronda de sinceridad en el vestuario.', { locker: 2 }, { flag: 'GRUPO' }),
          o('C', 'Pedir ver las fotos', 'Las ves todas. Bailan bastante bien.', { locker: 3, board: -1 }, { flag: 'FOTOS' })
        ],
        { LOBBY: 'Los esperaste en el lobby hasta las cuatro de la mañana.', MICRO: 'El micro del club estacionado frente al salón de fiestas no pasó desapercibido.', DORMIDO: 'Te hiciste el dormido, pero tenés la lista completa.' }
      ),
      chapter(
        'La cumpleañera quiere conocer al DT',
        'La quinceañera y su familia aparecen en el predio con una torta y un cartel: "Gracias por prestarnos a los chicos". La madre te invita al próximo cumple, el padre quiere entradas y {periodista} quiere una foto de todos juntos.',
        [
          o('A', 'Recibirlos con todo', 'Torta, fotos y recorrida por el vestuario.', { fans: 4, board: -1 }, { flag: 'RECIBE' }),
          o('B', 'Agradecer y cerrar el tema', 'Cordial, breve y sin fotos.', { board: 1 }, { flag: 'CIERRA' }),
          o('C', 'Regalarle una camiseta firmada', 'Firmada por los cuatro fugados, claro.', { fans: 2, locker: 1 }, { cost: 100, flag: 'CAMISETA' })
        ],
        { SANCION: 'Los sancionaste, y la familia de la quinceañera se enteró.', GRUPO: 'Lo hablaste en grupo y se pidieron perdón entre todos.', FOTOS: 'Viste las fotos y hasta elegiste tu favorita.' }
      ),
      chapter(
        'El domingo decisivo',
        'Llega el partido. Los cuatro fugados juran que van a dejar todo "por el vals". El hotel de ruta mandó la factura de las sábanas. Hay que decidir qué pasa con las concentraciones de ahora en más.',
        [
          o('A', 'Concentrar en el predio con candado', 'Y con rejas en las ventanas.', { board: 3, locker: -2 }, { ending: 'Ahora se concentra en el predio con candado. Igual, la última vez encontraron una escalera.' }),
          o('B', 'Eliminar la concentración', 'Que duerman en su casa, como gente grande.', { locker: 5, board: -3 }, { ending: 'Eliminaste la concentración. El equipo duerme en su casa y llega más descansado que nunca. Por ahora.' }),
          o('C', 'Concentrar directamente en el salón de fiestas', 'Si se van a escapar para allá, mejor ir de una.', { locker: 4, fans: 2 }, { cost: 300, ending: 'La concentración se hace en el salón de fiestas del barrio. El animador ya es parte del cuerpo técnico.' })
        ],
        { RECIBE: 'La visita de la quinceañera llenó el predio de gente.', CIERRA: 'Cerraste el tema, pero la torta te la comiste igual.', CAMISETA: 'La quinceañera ahora va a la cancha con la camiseta firmada.' }
      )
    ]
  },
  {
    id: 'penales',
    title: 'La tanda de penales infinita',
    tagline: 'Patearon todos, dos veces, y la noche no terminaba más.',
    category: 'COMMUNITY',
    chapters: [
      chapter(
        'Empate y a los penales',
        'Partido de eliminación, empate y a los penales. Patean los cinco: empate. Patean los once: empate. Empieza la segunda vuelta. El arquero rival ya te saluda por tu nombre y la tribuna mira el reloj: se va el último colectivo.',
        [
          o('A', 'Que patee tu arquero', 'Hace años que lo pide.', { locker: 1, fans: 2 }, { flag: 'ARQUERO' }),
          o('B', 'Mantener el orden de la lista', 'El orden es el orden.', { board: 1 }, { flag: 'LISTA' }),
          o('C', 'Que patee el que tenga más fe', 'Levanta la mano el utilero. No puede patear.', { locker: 2 }, { flag: 'FE' })
        ]
      ),
      chapter(
        'Se hace de noche... de verdad',
        'Van cuarenta penales y se empieza a apagar un reflector. El de los choripanes se quedó sin pan. Una señora de la platea saca un termo y les ofrece mate a los jugadores. El árbitro se sienta en la pelota entre penal y penal.',
        [
          o('A', 'Aceptar los mates', 'Hidratación ancestral.', { locker: 2, fans: 2 }, { flag: 'MATES' }),
          o('B', 'Pedir que arreglen el reflector', 'Sube un electricista con una escalera que tiembla.', { board: 1 }, { cost: 100, flag: 'REFLECTOR' }),
          o('C', 'Proponer definir con una moneda', 'El reglamento dice que no. El árbitro lo piensa un rato.', { fans: -1, reputation: -1 }, { flag: 'MONEDA' })
        ],
        { ARQUERO: 'Tu arquero metió el suyo y ahora pide patear otra vez.', LISTA: 'La lista ya dio dos vueltas y está llena de tachones.', FE: 'El utilero sigue con la mano levantada.' }
      ),
      chapter(
        'Se termina... ¿o no?',
        'Al penal cuarenta y tres alguien erra. Hay festejo, abrazos y lágrimas. Diez minutos después alguien revisa la planilla: contaron mal y falta un penal. Hay que volver a la cancha. Medio plantel está en la ducha.',
        [
          o('A', 'Sacar a los jugadores de la ducha', 'Con toalla y todo.', { locker: -1 }, { flag: 'DUCHA' }),
          o('B', 'Que patee el que esté vestido', 'Es el preparador físico. No puede, pero la intención está.', { locker: 2, fans: 2 }, { flag: 'VESTIDO' }),
          o('C', 'Reclamar que ya terminó', 'El festejo cuenta, ¿no?', { board: 1, reputation: 1 }, { flag: 'RECLAMO' })
        ],
        { MATES: 'Con los mates de la señora, nadie quería irse.', REFLECTOR: 'El reflector arreglado iluminaba un solo arco.', MONEDA: 'La propuesta de la moneda te persiguió toda la noche.' }
      ),
      chapter(
        'El récord',
        'Por fin termina la tanda más larga de la historia del club. La federación pregunta si alguien anotó todo, {periodista} quiere hacer un documental y la señora del termo quiere ser socia vitalicia.',
        [
          o('A', 'Hacer socia vitalicia a la señora del termo', 'Se lo ganó. Cebó como cien mates.', { fans: 4 }, { ending: 'La señora del termo es socia vitalicia. En cada tanda de penales baja a la cancha con el mate, por cábala.' }),
          o('B', 'Pintar un mural con todos los penales', 'Uno por uno, con nombre y resultado.', { fans: 3, locker: 1 }, { cost: 300, ending: 'Hay un mural con todos los penales de aquella noche. El de tu arquero está pintado más grande, a pedido de él.' }),
          o('C', 'Aceptar el documental', 'Tres horas de material. Sin cortes.', { budget: 900, fans: 2 }, { ending: 'Salió el documental. Dura lo mismo que la tanda y lo pasan en la tele de madrugada, para dormir.' })
        ],
        { DUCHA: 'Los sacaste de la ducha, y uno pateó en ojotas.', VESTIDO: 'El preparador físico casi patea, y lo tuvieron que frenar entre tres.', RECLAMO: 'Tu reclamo no prosperó, pero quedó en el acta.' }
      )
    ]
  },
  {
    id: 'perro',
    title: 'El perro que se metió a la cancha',
    tagline: 'Entró un perro callejero, se robó la pelota y no se fue nunca más.',
    category: 'COMMUNITY',
    chapters: [
      chapter(
        'Un perro invade el partido',
        'A los veinte minutos entra un perro callejero, flaco y feliz, y se lleva la pelota con la boca. Lo persiguen tres jugadores, el árbitro y un policía. El perro los gambetea a todos. La tribuna lo ovaciona más que al equipo.',
        [
          o('A', 'Pedir que lo saquen con cuidado', 'Despacito y con cariño.', { board: 1 }, { flag: 'SACAN' }),
          o('B', 'Dejar que se quede en el banco', 'Se acomoda al lado del ayudante como si nada.', { fans: 3, board: -1 }, { flag: 'BANCO' }),
          o('C', 'Tirarle un pedazo de chorizo', 'El método más efectivo de la historia del fútbol.', { fans: 2 }, { cost: 10, flag: 'CHORIZO' })
        ]
      ),
      chapter(
        'El perro vuelve todos los días',
        'Aparece en todas las prácticas. Se sienta al lado del arco, ladra cuando el equipo pierde la pelota y le muerde el short a uno solo: al que menos corre. El plantel lo bautiza "Gambeta". El preparador físico dice que es mejor ayudante que el ayudante.',
        [
          o('A', 'Adoptarlo como mascota del club', 'Vacunas, collar con escudo y cucha en el predio.', { fans: 3, locker: 2 }, { cost: 100, flag: 'ADOPTADO' }),
          o('B', 'Llevarlo a un refugio', 'Lo más responsable. Gambeta no opina igual.', { fans: -2, board: 1 }, { flag: 'REFUGIO' }),
          o('C', 'Nombrarlo asistente de campo', 'Sin sueldo, pero con credencial.', { locker: 3 }, { flag: 'ASISTENTE' })
        ],
        { SACAN: 'Lo sacaron con cuidado, pero conoce otra entrada.', BANCO: 'Desde que se sentó en el banco, se siente parte del plantel.', CHORIZO: 'Volvió buscando más chorizo.' }
      ),
      chapter(
        'Gambeta es una estrella',
        'Gambeta tiene más seguidores que el club. Una marca de alimento balanceado ofrece un contrato, {barra} armó una bandera con su cara y aparece un vecino diciendo que el perro es suyo y que se llama "Firulais".',
        [
          o('A', 'Firmar con la marca de alimento', 'Gambeta, cara oficial del alimento balanceado.', { budget: 1200, fans: 1 }, { flag: 'MARCA' }),
          o('B', 'Hablar con el vecino', 'Una charla de mate sobre custodia compartida.', { fans: 2, reputation: 1 }, { flag: 'VECINO' }),
          o('C', 'Darle a Gambeta un carnet de socio', 'Con foto y todo. El vecino no puede discutir con un carnet.', { fans: 4, board: -1 }, { flag: 'CARNET' })
        ],
        { ADOPTADO: 'Desde que lo adoptaron, tiene cucha con su nombre.', REFUGIO: 'Lo llevaste al refugio y se escapó para volver al predio.', ASISTENTE: 'Con su credencial de asistente, entra a cualquier lado.' }
      ),
      chapter(
        'El último partido de Gambeta',
        'Gambeta está viejito y lento, pero sigue yendo a cada partido. El club propone un homenaje antes del último partido de la temporada. El plantel quiere que salga con ellos a la cancha. El vecino quiere salir en la foto.',
        [
          o('A', 'Que salga de la mano del capitán', 'Bueno, de la correa.', { fans: 5, locker: 3 }, { ending: 'Gambeta salió a la cancha con el capitán. Le robó la pelota al árbitro antes del saque y el estadio entero se puso de pie.' }),
          o('B', 'Hacerle una estatua en la puerta', 'Bronce, escudo y una pelota en la boca.', { fans: 4 }, { cost: 400, ending: 'Hay una estatua de Gambeta en la puerta del estadio. Los perros del barrio la visitan todos los días, no siempre con respeto.' }),
          o('C', 'Darle el carnet de socio número uno', 'El más antiguo de todos, aunque llegó último.', { fans: 3, board: 1 }, { ending: 'Gambeta tiene el carnet de socio número uno. Dicen que en las elecciones del club vota mejor que muchos.' })
        ],
        { MARCA: 'El contrato con el alimento lo dejó un poco más gordito.', VECINO: 'El vecino terminó compartiendo la tenencia, y viene a todos los partidos.', CARNET: 'El carnet de socio de Gambeta está colgado en el buffet.' }
      )
    ]
  }
]

export const arcById = (id) => ARC_CATALOG.find(a => a.id === id) || null