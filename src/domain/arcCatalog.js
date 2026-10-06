/**
 * Historias de cuatro capítulos (unas 8 a 10 fechas) con tono de humor y sabor a potrero argentino.
 * Cada capítulo es un evento con opciones; lo que elegís queda como "marca" y los capítulos siguientes lo recuerdan.
 * Las opciones del último capítulo traen el `ending` que queda en el Epílogo de la temporada.
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
          o('A', 'Venderlo y salvar la caja', 'La plata entra, el pibe se va.', { budget: 3000, fans: -6, locker: -2, board: 4 }, { ending: 'Vendiste al pibe. Se fue llorando y a los tres meses ya hablaba con acento raro.' }),
          o('B', 'Que se quede, aunque no convenga', 'La dirigencia no lo entiende. La tribuna sí.', { fans: 6, locker: 3, board: -4 }, { ending: 'El pibe se quedó. Cada vez que toca la pelota, la popular canta su nombre.' }),
          o('C', 'Venderlo con cláusula de recompra', 'Algo de plata y una puerta abierta. El barrio dice que vuelve.', { budget: 1800, fans: -2, board: 2 }, { ending: 'Lo vendiste con cláusula de recompra. En el barrio ya se arma la bandera para cuando vuelva.' })
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
          o('A', 'Hacerle un homenaje con camiseta y bandera', 'Que quede en la historia como el loco del club.', { fans: 4, budget: 600 }, { ending: 'El arquero tiene hoy su propia bandera en la popular. Nadie sabe si es héroe o accidente, pero es de ellos.' }),
          o('B', 'Renovarle sin cláusulas raras', 'Confianza total, sin cuentos.', { locker: 3, board: -1 }, { cost: 500, ending: 'Renovó sin cláusulas. Dicen que ya piensa en meter un gol de arco a arco.' }),
          o('C', 'Dejarlo ir a otro club', 'Una buena plata y un vestuario más tranquilo.', { fans: -3, locker: -1, budget: 800 }, { ending: 'Se fue el arquero atrevido. El club ganó tranquilidad y perdió la mejor anécdota del año.' })
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
          o('A', 'Ir al programa a contar la historia', 'Un rato de fama, un par de anécdotas y mucho sentido del humor.', { fans: 3, reputation: 2 }, { ending: 'Fuiste al programa y contaste la historia con humor. Todavía te frenan en la calle para preguntarte por "la mano".' }),
          o('B', 'Hacer una camiseta con la frase', 'La plata no hace daño. A los puristas, sí.', { budget: 700, fans: 2 }, { ending: 'Salió una camiseta con la frase de la mano. Se vendió más que cualquier otra y los puristas no volvieron a hablarte.' }),
          o('C', 'Pedir que no usen la imagen', 'Preferís que el pasado quede donde está.', { board: 1, fans: -1 }, { ending: 'Pediste que sacaran el video. Lo sacaron, pero ya lo habían visto todos.' })
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
          o('A', 'Mantenerlo para siempre', 'Una institución del club. Con humo incluido.', { locker: 4, fans: 2 }, { ending: 'El asado del jueves quedó como una institución del club. Hay hasta un cartel con el horario.' }),
          o('B', 'Pasarlo al sábado, con las familias', 'Más gente, más tranquilidad y menos resaca.', { locker: 2, fans: 3 }, { ending: 'El asado se mudó al sábado con las familias. Ya hay lista de espera.' }),
          o('C', 'Cerrar el ciclo con un gran asado final', 'Un último gran evento y a otra cosa.', { locker: 5 }, { cost: 300, ending: 'Cerraron el ciclo con un asado enorme. Todavía se habla de las achuras.' })
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
          o('A', 'Dedicarle el partido', 'El equipo sale con su foto. La tribuna entera canta.', { fans: 5, locker: 3 }, { ending: 'El equipo salió con la foto de Don Anselmo. Dicen que dijo: "Ahora sí me puedo ir... pero el domingo que viene vengo igual".' }),
          o('B', 'Llevarlo al vestuario a dar la charla', 'Tres minutos de silencio, un par de lágrimas y una frase para el bronce.', { locker: 5 }, { ending: 'Don Anselmo dio la charla en el vestuario. Nadie recuerda qué dijo, pero salieron a ganar como si fuera una final.' }),
          o('C', 'Nombrarlo hincha ilustre con placa', 'Un homenaje formal, con foto y discurso.', { fans: 3, board: 2 }, { cost: 150, ending: 'Hay una placa con su nombre en la tribuna. Don Anselmo se sienta debajo cada domingo.' })
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
  }
]

export const arcById = (id) => ARC_CATALOG.find(a => a.id === id) || null
