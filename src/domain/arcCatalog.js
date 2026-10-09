/**
 * Historias de cuatro capítulos (unas 8 a 10 fechas) con tono de humor y sabor a potrero argentino.
 * Cada capítulo es un evento con opciones; lo que elegís queda como "marca" y los capítulos siguientes lo recuerdan.
 * Las opciones del último capítulo traen el `ending` que queda en el Epílogo de la temporada y, opcionalmente, `variants`:
 * [{ if: 'MARCA', ending }] que cambian el final según el camino elegido antes (ver endingFor en domain/arcs.js).
 * Los nombres de personas son inventados: las historias homenajean anécdotas del fútbol argentino sin nombrar a nadie.
 * Marcadores de texto: {presidente}, {periodista}, {barra} (ver domain/characters.js).
 */

import { LEAGUE_ARCS } from './arcCatalogLiga'

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
  },
  {
    id: 'robot',
    title: 'El técnico de aluminio',
    tagline: 'Un robot con inteligencia artificial dirigió tres partidos y pidió aumento.',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'La dirigencia compra un DT robot',
        'Un ingeniero del barrio le ofrece a {presidente} un robot técnico: "Analiza cuatrocientos mil partidos por segundo y no se calienta nunca". Cuesta lo mismo que un pase de tercera. {presidente} ya firmó. El robot llega en una caja con un manual en japonés y una calcomanía que dice "No mojar".',
        [
          o('A', 'Aceptarlo y darle el vestuario', 'El robot pide wifi, un enchufe y que nadie le toque los cables.', { board: 2, locker: -1 }, { cost: 800, flag: 'ROBOT_DT' }),
          o('B', 'Rechazarlo y devolverlo', 'El ingeniero se va llorando con la caja al hombro.', { board: -1, reputation: 1 }, { flag: 'DEVUELTO' }),
          o('C', 'Probarlo solo en la reserva', 'Que dirija a los pibes, a ver qué pasa.', { locker: 1 }, { flag: 'RESERVA' })
        ]
      ),
      chapter(
        'El robot da la charla técnica',
        'El robot habla primero en binario, después en español con acento alemán, y finalmente proyecta un holograma de un 4-3-3 que parece una constelación. Los jugadores aplauden por educación. El capitán levanta la mano y pregunta si el robot tiene familia. El robot responde: "Tengo un hermano en una fábrica de heladeras".',
        [
          o('A', 'Seguir sus indicaciones al pie de la letra', 'El robot pide que el nueve juegue "en diagonal cuántica".', { locker: -2, board: 1 }, { flag: 'OBEDECE' }),
          o('B', 'Ignorarlo y hacer lo de siempre', 'El robot se queda mirando la pizarra como un perro al timbre.', { locker: 2, board: -1 }, { flag: 'IGNORA' }),
          o('C', 'Preguntarle al robot quién es Messi', 'El robot responde: "Error 404, ídolo no encontrado".', { fans: 3, locker: 1 }, { flag: 'MESSI' })
        ],
        { ROBOT_DT: 'Como le diste el vestuario, ahora el robot cree que manda.', RESERVA: 'En la reserva el robot dirigió tres partidos y no perdió ninguno. Preocupante.', DEVUELTO: 'Lo devolviste, pero el ingeniero volvió con un modelo más caro.' }
      ),
      chapter(
        'El robot se enamora de la utilera',
        'El robot empieza a dejarle mensajes en la pizarra a Doña Rosa, la utilera de setenta años: "Tus medias huelen a victoria". El plantel está fascinado. Doña Rosa dice que "el robot es un caballero, a diferencia de otros". El robot le regala un ramo de cables trenzados.',
        [
          o('A', 'Dejarlo: es una historia de amor', 'El robot le escribe poesía en código fuente.', { locker: 3, fans: 1 }, { flag: 'AMOR' }),
          o('B', 'Desconectarle el módulo de emociones', 'El robot queda mirando el techo y dice "gracias por todo".', { locker: -2 }, { flag: 'APAGADO' }),
          o('C', 'Organizar la boda del robot y Doña Rosa', 'El buffet pone los choripanes y el robot pone la música.', { fans: 4, budget: 300 }, { cost: 300, flag: 'BODA' })
        ],
        { OBEDECE: 'Como le hiciste caso en la charla, el robot se tomó confianza.', IGNORA: 'Como lo ignoraste, el robot empezó a mandarte notas con errores.', MESSI: 'Después de lo de Messi, el robot se pone nostálgico cada tanto.' }
      ),
      chapter(
        'El robot pide aumento y se va a la competencia',
        'El robot, asesorado por un representante de saco brillante, pide aumento, oficina propia y que le cambien el aceite cada semana. El club rival le ofrece más y un cargador inalámbrico. {presidente} te mira como diciendo "esto lo trajiste vos".',
        [
          o('A', 'Renegociarle el contrato', 'Le das oficina, pero le seguís pagando en enchufes.', { board: 2, budget: -500 }, { cost: 500, ending: 'El robot se quedó con oficina propia. Atiende con número de turno y da charlas motivacionales a las inferiores.' }),
          o('B', 'Dejarlo ir', 'Que triunfe en otro lado. O que se oxide.', { fans: -2, locker: -1, budget: 300 }, { ending: 'El robot se fue al club rival. Allá perdió siete partidos seguidos y lo usan de perchero en el vestuario visitante.' }),
          o('C', 'Venderlo a una fábrica de heladeras', 'Por lo menos se reencuentra con su hermano.', { budget: 1200, fans: 1 }, { ending: 'Vendiste el robot a una fábrica. Dicen que en la línea de montaje cuenta chistes en binario y nadie se ríe.' })
        ],
        { AMOR: 'El robot y Doña Rosa siguen juntos, aunque él no sabe dar la mano.', APAGADO: 'Después de apagarlo, Doña Rosa no le dirigió la palabra por un mes.', BODA: 'La boda fue un caos. El robot tiró el ramo y cayó en la casa del vecino.' }
      )
    ]
  },
  {
    id: 'colectivo',
    title: 'El partido en el colectivo',
    tagline: 'Se rompió el micro. Fueron en la línea 60 y ganaron igual.',
    category: 'FINANCIAL_CRISIS',
    chapters: [
      chapter(
        'Se rompe el micro a mitad de camino',
        'A mitad de camino al partido, el micro se funde. El chofer dice que no arranca ni empujado. Falta una hora y media para el partido más importante del año. Pasa un colectivo de la línea 60 con la leyenda "La Chancha" pintada a mano. El utilero levanta la mano como si fuera una señal divina.',
        [
          o('A', 'Tomar el colectivo', 'Veinticinco jugadores, dos bolsos cada uno y un arquero de 120 kilos.', { fans: 1, locker: 1 }, { cost: 150, flag: 'COLECTIVO' }),
          o('B', 'Pedir prestado un camión de verduras', 'El del mercado dice que sí, pero hay que viajar con la carga.', { locker: 2 }, { flag: 'CAMION' }),
          o('C', 'Caminar los últimos ocho kilómetros', 'Entrada en calor extremo. El preparador físico se desmaya.', { locker: -1, fans: 1 }, { flag: 'CAMINA' })
        ]
      ),
      chapter(
        'Veinticinco jugadores en un colectivo',
        'Entran todos, con los bolsos, los botines y el arquero de 120 kilos. Una señora con changuito se queja. Un nene pide fotos. El colectivero, hincha del club, dice que "si ganan, no cobro el boleto". El cobrador, hincha del rival, dice que "si pierden, cobra doble".',
        [
          o('A', 'Que el plantel cante en el colectivo', 'Se arma un cantito que dura treinta cuadras.', { locker: 3, fans: 2 }, { flag: 'CANTICO' }),
          o('B', 'Que viajen en silencio y concentrados', 'Como profesionales. El colectivero se ofende.', { locker: -1, board: 1 }, { flag: 'SILENCIO' }),
          o('C', 'Que el utilero cuente chistes por micrófono', 'Usa el micrófono del colectivo. Tiene un repertorio de 1978.', { fans: 3, locker: 1 }, { flag: 'MICROFONO' })
        ],
        { COLECTIVO: 'El colectivo de la línea 60 salió con demora y todo.', CAMION: 'El camión de verduras llegó, pero con olor a cebolla.', CAMINA: 'El que caminó los ocho kilómetros llegó con ampollas y con bronca.' }
      ),
      chapter(
        'El partido se juega al lado de la terminal',
        'Llegan tarde y el árbitro ya había suspendido el partido... pero resulta que la cancha está al lado de la terminal. El colectivero, hincha del club, estaciona el colectivo frente al alambrado y espera con la puerta abierta, bocina lista. La liga permite jugar si los dos equipos están presentes. El rival llegó en micro nuevo.',
        [
          o('A', 'Jugar con el colectivo estacionado en la tribuna', 'El colectivero toca bocina en cada gol.', { fans: 3, locker: 2 }, { flag: 'BOCINA' }),
          o('B', 'Pedir que muevan el colectivo', 'El árbitro dice que el colectivo tapa la visual.', { board: 1, fans: -1 }, { flag: 'MUEVEN' }),
          o('C', 'Invitar al rival a viajar con ustedes la vuelta', 'Gestos de hidalguía que nadie pidió.', { reputation: 2, locker: -1 }, { flag: 'HIDALGO' })
        ],
        { CANTICO: 'El cantito del colectivo se escuchó en todo el estadio.', SILENCIO: 'El silencio del viaje se rompió con un gol en contra, y nadie lo festejó.', MICROFONO: 'Los chistes del utilero quedaron grabados en la memoria del colectivero.' }
      ),
      chapter(
        'El colectivero quiere ser DT',
        'El colectivero resulta ser ex futbolista frustrado: jugó en la reserva de un grande y se rompió la rodilla a los veinte. Pide dirigir un partido. El plantel lo quiere. El presidente no sabe qué hacer. El hombre ya se puso un silbato y una gorra que dice "DT por un día".',
        [
          o('A', 'Dejarlo dirigir un amistoso', 'Con ayuda del ayudante y un mapa de la cancha.', { fans: 4, locker: 3 }, { ending: 'El colectivero dirigió el amistoso y ganó 3 a 0. Ahora maneja el colectivo con una gorra que dice "Invicto".' }),
          o('B', 'Darle un puesto de utilero honorario', 'Sin dirección, pero con chaleco.', { locker: 2, fans: 1 }, { cost: 100, ending: 'El colectivero es utilero honorario. Guarda las pelotas y cada tanto pide patear un tiro libre. No se lo dan.' }),
          o('C', 'Comprarle un colectivo al club', 'Si el micro se rompe, al menos hay plan B.', { budget: -1500, fans: 3 }, { cost: 1500, ending: 'El club tiene un colectivo propio, pintado con los colores. Lo maneja el mismo colectivero, ahora con contrato.' })
        ],
        { BOCINA: 'La bocina del colectivo fue el mejor aliento del partido.', MUEVEN: 'Mover el colectivo fue un trámite de cuarenta minutos.', HIDALGO: 'El gesto con el rival quedó como anécdota, pero nadie lo repitió.' }
      )
    ]
  },
  {
    id: 'campo_empanada',
    title: 'El campo con forma de empanada',
    tagline: 'El arquitecto leyó mal el plano y la cancha quedó con repulgue.',
    category: 'COMMUNITY',
    chapters: [
      chapter(
        'El arquitecto leyó mal el plano',
        'El municipio pone plata para arreglar la cancha. El arquitecto, que trabajaba de noche, confunde los planos y dibuja un campo con un borde curvo, como un repulgue. La obra ya empezó. Los albañiles preguntan si "eso va así". El arquitecto dice que sí, con poca convicción.',
        [
          o('A', 'Frenar la obra', 'Antes de que sea irreversible.', { board: 2, fans: -1 }, { flag: 'FRENA' }),
          o('B', 'Que siga: total, total', 'Una cancha rara es una cancha igual.', { fans: 2, board: -1 }, { flag: 'SIGUE' }),
          o('C', 'Preguntar a la liga si está permitido', 'La liga responde con un "depende".', { reputation: 1 }, { flag: 'CONSULTA' })
        ]
      ),
      chapter(
        'El córner que está en otro estadio',
        'El campo queda con un vértice tan raro que un córner cae en el estacionamiento del club de al lado. El banderín se clava en una maceta ajena. El vecino, hincha del rival, pone un cartel: "Córner en territorio enemigo".',
        [
          o('A', 'Negociar con el vecino', 'Un cafecito y un acuerdo de caballeros.', { reputation: 2 }, { flag: 'VECINO' }),
          o('B', 'Pintar el córner de blanco igual', 'Que quede claro que es nuestro.', { fans: 3, board: -1 }, { flag: 'PINTADO' }),
          o('C', 'Pedirle a la liga que quite ese córner', 'La liga lo evalúa en cuatro meses.', { board: 1 }, { flag: 'QUITAR' })
        ],
        { FRENA: 'Frenaste la obra y el arquitecto te debe un favor.', SIGUE: 'La obra siguió y el repulgue quedó cada vez más pronunciado.', CONSULTA: 'La liga te mandó un reglamento de 84 páginas.' }
      ),
      chapter(
        'La FIFA quiere inspeccionar',
        'Una comisión internacional quiere inspeccionar el campo "por su valor arquitectónico único". Vienen con cámaras, drones y un señor de corbata que no habla español. {periodista} cubre todo. El buffet vende empanadas como loco.',
        [
          o('A', 'Mostrar el campo con orgullo', 'Explicás que el repulgue "es identidad".', { fans: 4, board: 2 }, { flag: 'ORGULLO' }),
          o('B', 'Tapar los defectos con lonas', 'Como sea. Que no se vea el córner del vecino.', { board: 1, locker: -1 }, { cost: 200, flag: 'LONAS' }),
          o('C', 'Aprovechar para vender empanadas al turismo', 'El buffet factura más que en un clásico.', { budget: 700, fans: 2 }, { flag: 'TURISMO' })
        ],
        { VECINO: 'Con el vecino llegaste a un acuerdo: el córner es zona neutral.', PINTADO: 'El córner pintado de blanco generó una queja formal del club vecino.', QUITAR: 'La liga todavía evalúa quitarlo. Tardará tres temporadas.' }
      ),
      chapter(
        'El campo es patrimonio nacional',
        'El municipio declara el campo "patrimonio arquitectónico deportivo". No se puede modificar ni un centímetro. El club queda con una cancha única, un córner en otro predio y una hinchada que ya canta "el repulgue no se toca".',
        [
          o('A', 'Poner una placa y cobrar entrada turística', 'La cancha más rara del país, con guía incluido.', { budget: 1000, fans: 3 }, { ending: 'La placa dice: "Aquí se juega raro desde 2024". El tour incluye el córner del vecino y una empanada de regalo.' }),
          o('B', 'Seguir jugando como si nada', 'Total, nadie mira la forma de la cancha.', { fans: 2, locker: 2 }, { ending: 'El equipo se acostumbró tanto al repulgue que cuando juega de visitante se pierde en las canchas cuadradas.' }),
          o('C', 'Construir una tribuna sobre el repulgue', 'Arquitectura de autor. Y de albañil.', { fans: 4, budget: 500 }, { cost: 500, ending: 'La tribuna del repulgue es la más divertida del estadio. Los hinchas se resbalan en curva y se ríen todos.' })
        ],
        { ORGULLO: 'Tu explicación del repulgue como identidad quedó en los diarios.', LONAS: 'Las lonas volaron con el primer viento fuerte.', TURISMO: 'El turismo dejó más plata que tres sponsors juntos.' }
      )
    ]
  },
  {
    id: 'espia',
    title: 'El utilero que era espía',
    tagline: 'Cincuenta años lavando camisetas y pasando información a tres clubes.',
    category: 'LOCKER_ROOM',
    chapters: [
      chapter(
        'Don Rodolfo, el utilero de siempre',
        'Don Rodolfo tiene cincuenta años en el club. Conoce todos los rincones, todos los secretos y todos los chismes. Un día, {periodista} te muestra una foto vieja: Don Rodolfo, de joven, con la camiseta de tres clubes rivales en la misma temporada. Sonríe en las tres fotos.',
        [
          o('A', 'Confrontarlo en privado', 'Sin escándalo. Que explique.', { locker: 1, board: 1 }, { flag: 'CONFRONTA' }),
          o('B', 'Ignorar la foto', 'Habrá una explicación. O no.', { locker: 1 }, { flag: 'IGNORA' }),
          o('C', 'Poner una cámara en la utilería', 'Vigilancia de barrio. Con cinta adhesiva.', { cost: 200, board: 1 }, { flag: 'CAMARA' })
        ]
      ),
      chapter(
        'Desaparecen los planes de la pizarra',
        'El plan táctico del partido aparece fotografiado en el grupo de WhatsApp del club rival. La foto es idéntica, con el mismo dibujo de la flecha torcida que hizo el ayudante. Don Rodolfo fue el único que estuvo en el vestuario esa noche. También el único que sabe usar la fotocopiadora.',
        [
          o('A', 'Sacarlo del vestuario sin acusarlo', 'Un cambio de tareas. Silencioso.', { locker: -1, board: 2 }, { flag: 'SACA' }),
          o('B', 'Hacer una reunión con todo el plantel', 'Que se aclare todo delante de todos.', { locker: 2, board: -1 }, { flag: 'REUNION' }),
          o('C', 'Darle un plan falso a ver qué pasa', 'Una trampa con flechas que no llevan a ningún lado.', { reputation: 2, locker: 1 }, { flag: 'TRAMPA' })
        ],
        { CONFRONTA: 'Don Rodolfo lloró, abrazó a todos y no dijo nada concreto.', IGNORA: 'Ignoraste la foto, pero la foto no te ignoró a vos.', CAMARA: 'La cámara grabó a Don Rodolfo hablando solo con las camisetas.' }
      ),
      chapter(
        'Don Rodolfo pide hablar',
        'Don Rodolfo toca la puerta de tu oficina con un cuaderno viejo. Adentro hay cincuenta años de notas: formaciones, lesiones, charlas, nombres. "Nunca le hice mal a nadie", dice. "Solo escucho. Y a veces, cuando me preguntan, cuento". El cuaderno tiene tapas de tres colores distintos.',
        [
          o('A', 'Quedarte con el cuaderno', 'Información de medio siglo. Un tesoro.', { board: 2, reputation: 2 }, { flag: 'CUADERNO' }),
          o('B', 'Devolvérselo y pedirle que se quede', 'Cincuenta años son cincuenta años.', { locker: 4, fans: 1 }, { flag: 'QUEDA' }),
          o('C', 'Publicarlo como libro del club', 'Un éxito editorial y un escándalo.', { budget: 1500, board: -2, fans: 3 }, { flag: 'LIBRO' })
        ],
        { SACA: 'Al sacarlo del vestuario, el club perdió también su memoria.', REUNION: 'En la reunión, el plantel lo defendió a muerte. Y vos quedaste como el malo.', TRAMPA: 'Con el plan falso, el rival se preparó para un 4-2-4 inexistente y perdió 5 a 0.' }
      ),
      chapter(
        'El homenaje',
        'Don Rodolfo cumple cincuenta y un años en el club. El plantel quiere hacerle algo. {presidente} quiere que se vaya. Los hinchas, que se quede. Hay una bandera con su cara y una cámara de seguridad apuntándole al mismo tiempo.',
        [
          o('A', 'Homenajearlo y renovarle el pase', 'Que se quede hasta que él quiera.', { fans: 5, locker: 4, board: -2 }, { ending: 'Don Rodolfo sigue en el club. Ahora usa un chaleco que dice "Utilero, espía y leyenda". Nadie sabe bien qué significa, pero todos lo abrazan.' }),
          o('B', 'Despedirlo con una plaqueta', 'Un reconocimiento y una puerta.', { board: 2, locker: -3 }, { ending: 'Se fue con plaqueta, cuaderno y lágrimas. Hoy escribe cartas al club que nadie contesta, pero todos leen.' }),
          o('C', 'Nombrarlo embajador del club', 'Que viaje, cuente y represente. Con sueldo.', { budget: -300, fans: 3, locker: 2 }, { cost: 300, ending: 'Don Rodolfo es embajador. En cada club que visita, alguien le pregunta por el cuaderno y él sonríe sin contestar.' })
        ],
        { CUADERNO: 'El cuaderno quedó en la biblioteca del club, con candado.', QUEDA: 'Don Rodolfo se quedó, pero ahora mira distinto a todos.', LIBRO: 'El libro se vendió en todo el país. La dirigencia quedó en offside.' }
      )
    ]
  },
  {
    id: 'poeta',
    title: 'El nueve que hablaba en verso',
    tagline: 'Hace goles de chilena y los festeja con décimas.',
    category: 'LOCKER_ROOM',
    chapters: [
      chapter(
        'Llega un nueve con cuaderno',
        'Se presenta un nueve alto, flaco y con un cuaderno en la mano. Dice que juega "inspirado por las musas". En la primera práctica hace dos goles y después recita una décima sobre el arquero rival. El plantel no sabe si aplaudir o llamar a alguien.',
        [
          o('A', 'Ficharlo igual', 'Un nueve que hace goles y versos no se consigue todos los días.', { locker: 2, fans: 1 }, { cost: 300, flag: 'FICHADO' }),
          o('B', 'Pedirle que deje el cuaderno', 'Acá se juega, no se recita.', { locker: -1, board: 1 }, { flag: 'SIN_CUADERNO' }),
          o('C', 'Publicar sus versos en las redes del club', 'Contenido gratuito y viral.', { fans: 3 }, { flag: 'REDES' })
        ]
      ),
      chapter(
        'El gol de chilena con décima incluida',
        'Hace un gol de chilena espectacular y, antes de que el estadio termine de gritar, recita: "La pelota fue paloma, el arco fue su ventana, y yo, pobre nueve de barrio, la mandé de chilena temprana". El estadio se queda en silencio. Después, ovación. El rival pide que se calle.',
        [
          o('A', 'Abrazarlo en la cancha', 'Un gesto que el plantel no olvida.', { locker: 3, fans: 2 }, { flag: 'ABRAZO' }),
          o('B', 'Pedirle que festeje "normal"', 'El espectáculo es el gol, no el poema.', { locker: -2, board: 1 }, { flag: 'NORMAL' }),
          o('C', 'Grabar todos sus festejos', 'Para un disco que se venda en el buffet.', { budget: 400, fans: 3 }, { flag: 'DISCO' })
        ],
        { FICHADO: 'El cuaderno del nueve ya es parte del vestuario.', SIN_CUADERNO: 'Sin cuaderno, el nueve juega mejor pero festeja peor.', REDES: 'Los versos del nueve se viralizaron en todo el país.' }
      ),
      chapter(
        'Le ofrecen un programa de radio',
        'Una radio del barrio le ofrece al nueve un programa nocturno: "Goles y versos, con el poeta del área". El plantel lo escucha religiosamente. {periodista} dice que es "el fenómeno más raro del fútbol argentino desde el arquero que atajaba con un solo guante".',
        [
          o('A', 'Dejarlo hacer el programa', 'Con la condición de que no hable mal de nadie.', { fans: 4, locker: 1 }, { flag: 'RADIO' }),
          o('B', 'Prohibirle los medios', 'Que se concentre en el arco rival.', { locker: -2, board: 1 }, { flag: 'PROHIBE' }),
          o('C', 'Que el programa se haga desde el vestuario', 'Con los jugadores de invitados.', { fans: 3, locker: 3, budget: 200 }, { flag: 'VESTUARIO' })
        ],
        { ABRAZO: 'El abrazo en la cancha quedó como imagen del año.', NORMAL: 'El nueve festejó normal, pero se le notó la tristeza.', DISCO: 'El disco de festejos se agotó en dos semanas.' }
      ),
      chapter(
        'El poeta se lesiona el alma',
        'El nueve se lesiona la rodilla en un partido y queda afuera seis meses. En vez de bajonearse, escribe un poemario entero: "El área es un estado del alma". El club no sabe si publicarlo, venderlo o usarlo como charla técnica. {presidente} quiere una decisión.',
        [
          o('A', 'Publicarlo con el sello del club', 'Un poemario que puede pagar una pretemporada.', { budget: 1200, fans: 3 }, { ending: 'El poemario se llama "El área es un estado del alma" y se vende en la boletería. El club financió una pretemporada con las regalías.' }),
          o('B', 'Usarlo como charla motivacional', 'Que lea un poema antes de cada partido.', { locker: 4, fans: 1 }, { ending: 'El nueve lee un poema antes de cada partido. El equipo gana más, pero nadie sabe si por el poema o por vergüenza.' }),
          o('C', 'No publicarlo: volvé a la cancha', 'Primero el fútbol, después la poesía.', { locker: -1, board: 2 }, { ending: 'No se publicó. El nueve volvió a la cancha seis meses después, hizo dos goles y recitó la décima más larga de su carrera.' })
        ],
        { RADIO: 'El programa del nueve se escucha hasta en el club rival.', PROHIBE: 'Le prohibiste los medios y empezó a recitar en la ducha.', VESTUARIO: 'El programa desde el vestuario fue un caos hermoso.' }
      )
    ]
  },
  {
    id: 'vecina',
    title: 'La vecina del balcón',
    tagline: 'Doña Mirta ve todo desde el primer piso y lo cuenta en el almacén.',
    category: 'COMMUNITY',
    chapters: [
      chapter(
        'Doña Mirta construye un balcón sobre la cancha',
        'La casa de Doña Mirta linda con el predio. Pide permiso para "levantar un balcón chiquito para regar las plantas". A la semana el balcón tiene dos sillas, una sombrilla, un mate y una vista perfecta del entrenamiento. El plantel ya la saluda con la mano. {presidente} quiere saber si hay que cobrarle alquiler o mandarle una carta documento.',
        [
          o('A', 'Dejarle el balcón', 'Una vecina más en el predio. Con mate y todo.', { fans: 2, locker: 1 }, { flag: 'BALCON' }),
          o('B', 'Pedirle que lo baje', 'Es propiedad del club hasta el metrosésenta.', { board: 1, fans: -1 }, { flag: 'BAJAR' }),
          o('C', 'Alquilarle el balcón para la tribuna oficial', 'Que el club lo use y ella cobre entrada.', { budget: 300, board: -1, fans: 1 }, { flag: 'ALQUILA' })
        ]
      ),
      chapter(
        'Doña Mirta ve algo que no debería ver',
        'Desde el balcón, Doña Mirta ve al cinco reunirse a escondidas con un dirigente del club rival en la esquina del almacén. Al día siguiente lo sabe todo el barrio. El cinco niega todo, pero Doña Mirta tiene fotos, un video y una grabación de audio con calidad de radio AM. El vestuario está que arde.',
        [
          o('A', 'Creerle a Doña Mirta', 'Le das bola a la vecina y el cinco se pone loco.', { locker: -2, fans: 3 }, { flag: 'CREE' }),
          o('B', 'Bancar al cinco', 'Un jugador se defiende en la cancha, no en el almacén.', { locker: 2, fans: -2 }, { flag: 'BANCA' }),
          o('C', 'Pedirle las fotos y guardarlas', 'Por las dudas. Nunca se sabe.', { reputation: 1 }, { flag: 'FOTOS' })
        ],
        { BALCON: 'Doña Mirta vio todo desde su balcón, cómoda y con mate.', BAJAR: 'Aunque le pediste que bajara el balcón, Doña Mirta sigue mirando desde la ventana.', ALQUILA: 'Con el balcón alquilado, Doña Mirta se siente parte del club.' }
      ),
      chapter(
        'Doña Mirta quiere ser veedora oficial',
        'Ahora Doña Mirta quiere una credencial: "Veedora oficial del club". Pide acceso a los entrenamientos, una silla en el banco, una remera con su nombre y que la dejen hablar en la conferencia de prensa. El plantel la adora. La liga no sabe qué reglamento aplicarle a una vecina con credencial.',
        [
          o('A', 'Darle la credencial', 'Total, ya ve todo igual.', { fans: 3, locker: 2, board: -1 }, { flag: 'CREDENCIAL' }),
          o('B', 'Ofrecerle un lugar en el buffet', 'Que trabaje de verdad, no de veedora.', { budget: 200, fans: 1 }, { flag: 'BUFFET' }),
          o('C', 'Negarle todo', 'El club no es un balcón con chorizos.', { board: 2, fans: -2 }, { flag: 'NIEGA' })
        ],
        { CREE: 'Desde que le creíste, Doña Mirta se siente la dueña del club.', BANCA: 'Como bancaste al cinco, Doña Mirta te mira con desconfianza.', FOTOS: 'Las fotos están guardadas en un sobre. Doña Mirta sabe que las tenés.' }
      ),
      chapter(
        'El balcón se cae',
        'Una tormenta fuerte y el balcón de Doña Mirta se viene abajo con sombrilla, sillas y termo incluidos. Por suerte ella estaba en el almacén. Ahora el club tiene que decidir: reconstruirlo, hacer una tribuna popular en su lugar o dejar que el barrio se quede sin su mirador. Doña Mirta llora con el mate vacío en la mano.',
        [
          o('A', 'Reconstruirlo con plata del club', 'Con baranda nueva y una placa que diga "Balcón Doña Mirta".', { budget: -500, fans: 4 }, { cost: 500, ending: 'El balcón de Doña Mirta se reconstruyó con baranda nueva y una placa. Ella sigue ahí, con mate, y ahora cobra entrada a las visitas.', variants: [{ if: 'BALCON', ending: 'Como le habías dejado el balcón desde el principio, se reconstruyó con baranda nueva y una placa. Doña Mirta sigue ahí, con mate, y ahora cobra entrada a las visitas.' }, { if: 'BAJAR', ending: 'Aunque le habías pedido que lo bajara, el balcón se reconstruyó con baranda nueva y una placa. Doña Mirta sigue ahí, con mate, y ahora cobra entrada a las visitas.' }] }),
          o('B', 'Hacer una tribuna popular en su lugar', 'Más gente, más aliento, menos vecina.', { fans: 3, budget: 500 }, { ending: 'Donde estaba el balcón hay una tribuna popular. Doña Mirta tiene su butaca en la primera fila y desde ahí sigue opinando de todo.', variants: [{ if: 'BALCON', ending: 'Como le habías dejado el balcón, ahora en su lugar hay una tribuna popular. Doña Mirta tiene su butaca en la primera fila y desde ahí sigue opinando de todo.' }, { if: 'BAJAR', ending: 'Aunque le habías pedido que lo bajara, ahora en su lugar hay una tribuna popular. Doña Mirta tiene su butaca en la primera fila y desde ahí sigue opinando de todo.' }] }),
          o('C', 'Que lo reconstruya la comisión vecinal', 'Que se arreglen entre vecinos.', { board: 1, fans: -1 }, { ending: 'La comisión vecinal reconstruyó el balcón a pulmón. Doña Mirta lo inauguró con un asado y no te invitó.', variants: [{ if: 'BALCON', ending: 'Como le habías dejado el balcón, la comisión vecinal lo reconstruyó a pulmón. Doña Mirta lo inauguró con un asado y no te invitó.' }, { if: 'BAJAR', ending: 'Aunque le habías pedido que lo bajara, la comisión vecinal lo reconstruyó a pulmón. Doña Mirta lo inauguró con un asado y no te invitó.' }] })
        ],
        { CREDENCIAL: 'Con la credencial en mano, Doña Mirta se cree parte del cuerpo técnico.', BUFFET: 'Desde el buffet, Doña Mirta sigue viendo todo y ahora cobra.', NIEGA: 'Todavía no te perdona que le hayas negado la credencial.' }
      )
    ]
  },
  {
    id: 'quiosco',
    title: 'El quiosquero que dirigía mejor que vos',
    tagline: 'Don Alcides vende caramelos y sabe más de táctica que todo el cuerpo técnico.',
    category: 'LOCKER_ROOM',
    chapters: [
      chapter(
        'Don Alcides da un consejo y el equipo gana',
        'Don Alcides atiende el quiosco de la esquina del predio desde hace cuarenta años. Un día, mientras te vende un cigarrillo, te dice: "Poné al pibe por la izquierda y al cinco de líbero, que el nueve rival es zurdo y se marea". Le hacés caso por no discutir. Ganan 2 a 0. El plantel empieza a mirar el quiosco con otros ojos.',
        [
          o('A', 'Agradecerle y pedirle más consejos', 'Un café con Don Alcides todas las mañanas.', { locker: 1, reputation: 1 }, { flag: 'CONSEJOS' }),
          o('B', 'Ignorarlo: fue casualidad', 'Un quiosquero no sabe de fútbol.', { board: 1, locker: -1 }, { flag: 'IGNORA' }),
          o('C', 'Comprarle todos los caramelos del quiosco', 'En agradecimiento. Y por cábala.', { cost: 50, fans: 1 }, { flag: 'CARAMELOS' })
        ]
      ),
      chapter(
        'El plantel empieza a consultarle a Don Alcides',
        'Los jugadores pasan por el quiosco antes de cada práctica. Don Alcides les dice cómo pararse, cómo pegarle a la pelota y cómo hablarle a la suegra. El ayudante, que estudió un curso de entrenador, está al borde del colapso nervioso. El grupo de WhatsApp del plantel se llama "Los pibes de Don Alcides".',
        [
          o('A', 'Dejarlo: suma al grupo', 'Un quiosquero con carisma no le hace mal a nadie.', { locker: 3, fans: 1 }, { flag: 'SUMA' }),
          o('B', 'Pedirle que no hable de táctica', 'Que venda caramelos y listo.', { locker: -2, board: 1 }, { flag: 'CORTAR' }),
          o('C', 'Ponerlo de ayudante honorario', 'Con chaleco y todo. Sin sueldo.', { locker: 2, board: -1 }, { cost: 100, flag: 'AYUDANTE' })
        ],
        { CONSEJOS: 'Don Alcides ya te tiene confianza y te dice todo lo que piensa.', IGNORA: 'Don Alcides no te dice nada más, pero los jugadores van igual.', CARAMELOS: 'Los caramelos de Don Alcides son la cábala oficial del plantel.' }
      ),
      chapter(
        'Don Alcides se pelea con el ayudante',
        'En plena práctica, Don Alcides cruza el alambrado, agarra la pizarra y corrige al ayudante delante de todos: "Así no, pibe, así se para una línea de cuatro". El ayudante se saca el silbato y lo desafía a dirigir un partido. El plantel hace ronda. Hay apuestas en el buffet.',
        [
          o('A', 'Dejar que dirija un amistoso', 'Que se saque las ganas. Y que aprenda.', { locker: 2, fans: 2 }, { flag: 'DIRIGE' }),
          o('B', 'Bancar al ayudante', 'El cuerpo técnico es el cuerpo técnico.', { locker: -1, board: 1 }, { flag: 'BANCA_AYUDANTE' }),
          o('C', 'Hacer un duelo de pizarras', 'Uno dibuja, el otro borra. Gana el que convence al plantel.', { fans: 3, locker: 1 }, { flag: 'DUELO' })
        ],
        { SUMA: 'Como lo dejaste sumar, Don Alcides se siente parte del cuerpo técnico.', CORTAR: 'Desde que le pediste que no hable de táctica, Don Alcides atiende con mala cara.', AYUDANTE: 'Con el chaleco de ayudante honorario, Don Alcides se cree el dueño del predio.' }
      ),
      chapter(
        'El club le ofrece un cargo',
        'Don Alcides se jubila del quiosco y el club le ofrece un puesto formal: "Asesor táctico honorario". La liga no sabe si permitirlo. El ayudante amenaza con renunciar. El plantel amenaza con no entrenar si Don Alcides no está. {presidente} te mira esperando una decisión.',
        [
          o('A', 'Nombrarlo asesor táctico con oficina', 'Una oficina con ventana al campo de juego.', { locker: 4, board: -2, fans: 2 }, { cost: 200, ending: 'Don Alcides tiene oficina con ventana al campo. Dirige desde ahí, con un café y un cigarrillo, y el equipo no perdió más.' }),
          o('B', 'Mantenerlo solo como quiosquero honorario', 'Un lugar en el buffet y un cartel con su nombre.', { locker: 1, board: 1 }, { ending: 'Don Alcides tiene su quiosco reconstruido en el predio, con cartel y todo. Sigue dando consejos, pero ya no cobra.' }),
          o('C', 'Dejarlo ir con una plaqueta', 'Un homenaje y una puerta.', { locker: -3, fans: -1 }, { ending: 'Don Alcides se fue con plaqueta. El equipo perdió los siguientes cuatro partidos y nadie sabe por qué.' })
        ],
        { DIRIGE: 'Como lo dejaste dirigir, Don Alcides ya no tiene miedo a la pizarra.', BANCA_AYUDANTE: 'Como bancaste al ayudante, Don Alcides te mira de reojo.', DUELO: 'El duelo de pizarras terminó en empate y en un asado.' }
      )
    ]
  },
  {
    id: 'choripan',
    title: 'La guerra de los choripanes',
    tagline: 'Dos familias, un solo carrito y una hinchada partida al medio.',
    category: 'FINANCIAL_CRISIS',
    chapters: [
      chapter(
        'Dos carritos en la puerta del estadio',
        'Los Ramírez y los Sosa venden choripanes en la puerta del estadio desde hace treinta años. Se odian con elegancia. Hoy los dos quieren el mismo lugar: la esquina de la tribuna popular. La hinchada se divide: los que compran en Ramírez y los que compran en Sosa. Hay banderas, cantitos y un olor a chorizo que no deja pensar.',
        [
          o('A', 'Darle el lugar a los Ramírez', 'Los más viejos. Los más caros.', { fans: 1, board: 1 }, { flag: 'RAMIREZ' }),
          o('B', 'Darle el lugar a los Sosa', 'Los nuevos. Los más ricos.', { fans: 2, board: -1 }, { flag: 'SOSA' }),
          o('C', 'Que se turnen por partido', 'Una solución salomónica que no va a durar.', { fans: 1, reputation: 1 }, { flag: 'TURNOS' })
        ]
      ),
      chapter(
        'Sabotaje en el carrito',
        'Alguien le puso algo raro al chimichurri de los Sosa. La hinchada sospecha de los Ramírez. Los Ramírez sospechan de los Sosa, que se sabotearon solos para culpar a los Ramírez. El buffet del club vende el doble. {periodista} titula: "Guerra de choripanes en el barrio".',
        [
          o('A', 'Investigar el sabotaje', 'Con lupa, con dedo y con testigos.', { board: 1, reputation: 1 }, { flag: 'INVESTIGA' }),
          o('B', 'Reírte y hacer una degustación', 'Que la hinchada elija al mejor choripán.', { fans: 3, locker: 1 }, { cost: 100, flag: 'DEGUSTA' }),
          o('C', 'Prohibir los dos carritos', 'Nadie vende. Fin del problema.', { board: 2, fans: -3 }, { flag: 'PROHIBE' })
        ],
        { RAMIREZ: 'Los Ramírez tienen el lugar, pero los Sosa no se rinden.', SOSA: 'Los Sosa tienen el lugar, y los Ramírez pusieron el grito en el cielo.', TURNOS: 'Con los turnos por partido, cada domingo hay una guerra distinta.' }
      ),
      chapter(
        'Los hijos de las dos familias se enamoran',
        'El hijo de los Ramírez y la hija de los Sosa se enamoraron en el buffet del club. Se escriben por WhatsApp, se ven a escondidas y se mandan choripanes con mensajitos adentro. Las dos familias están al borde de la tragedia. El barrio entero sigue la novela con más atención que el torneo.',
        [
          o('A', 'Bendecir el romance', 'Si se aman, que vendan juntos.', { fans: 4, locker: 2 }, { flag: 'ROMANCE' }),
          o('B', 'Separarlos: es una vergüenza', 'Las familias primero.', { board: 2, fans: -3 }, { flag: 'SEPARA' }),
          o('C', 'Hacer una boda en el estadio', 'Con choripanes para todos.', { fans: 5, budget: 500 }, { cost: 500, flag: 'BODA' })
        ],
        { INVESTIGA: 'La investigación no llegó a nada, pero la hinchada ya eligió bando.', DEGUSTA: 'La degustación fue un éxito. Ganó el carrito del buffet, que ni competía.', PROHIBE: 'Con los carritos prohibidos, la hinchada empezó a llevar su propio chorizo de casa.' }
      ),
      chapter(
        'El club tiene que elegir un solo carrito',
        'La liga exige un solo puesto de venta por puerta. {presidente} quiere quedarse con el que más comisión pague. Las dos familias están en la puerta de tu oficina. Una trae choripanes. La otra trae una carpeta con abogados. El barrio entero espera tu decisión como si fuera una final.',
        [
          o('A', 'Quedarte con los Ramírez', 'Los de siempre, con su chorizo de siempre.', { fans: 1, board: 1 }, { ending: 'Se quedaron los Ramírez. Los Sosa pusieron un carrito frente a la casa de {presidente}, por las dudas.' }),
          o('B', 'Quedarte con los Sosa', 'Los nuevos, con más plata y más salsa.', { budget: 600, fans: -1, board: 2 }, { ending: 'Se quedaron los Sosa. Los Ramírez se pusieron a vender empanadas al lado, por orgullo.' }),
          o('C', 'Que los dos vendan juntos, sociedad obligada', 'Una sociedad que va a durar lo que un choripán caliente.', { fans: 4, budget: 300 }, { ending: 'Ramírez y Sosa ahora venden juntos. Se pelean todos los días, pero el choripán es el mejor del barrio.' })
        ],
        { ROMANCE: 'El romance de los pibes sigue, aunque las familias no se hablan.', SEPARA: 'Los separaste y ahora se ven a escondidas en el buffet, peor que antes.', BODA: 'La boda en el estadio fue un caos: los invitados se sentaron por familia y no se hablaron.' }
      )
    ]
  },
  {
    id: 'romance',
    title: 'La hija del presidente y el nueve',
    tagline: 'Amor prohibido, transferencia pendiente y un vestuario que lo sabe todo.',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'Descubrís el romance en el estacionamiento',
        'Salís tarde del predio y ves al nueve del equipo abrazado a la hija de {presidente} detrás de una camioneta. Se besan como en una novela de la tarde. El nueve te ve, se pone blanco y balbucea: "DT, es que...". La hija te mira desafiante. Al otro día, {presidente} te llama a su oficina sin decir para qué.',
        [
          o('A', 'Guardar el secreto', 'Lo que pasa en el estacionamiento queda en el estacionamiento.', { locker: 2 }, { flag: 'SECRETO' }),
          o('B', 'Contarle todo a {presidente}', 'Antes de que se entere por otro lado.', { board: 3, locker: -3 }, { flag: 'CHISME' }),
          o('C', 'Hablar con el nueve', 'Que sepa lo que se le viene.', { locker: 1, reputation: 1 }, { flag: 'HABLA' })
        ]
      ),
      chapter(
        '{presidente} sospecha y arma un operativo',
        '{presidente} contrata a un detective privado para seguir al nueve. El detective es un ex jugador del club, hincha fanático, y en vez de seguirlo se pone a mirar los partidos con él. Al final del mes presenta un informe que dice: "El nueve es un fenómeno, pero come mucho".',
        [
          o('A', 'Dejar que el detective siga', 'Total, no va a descubrir nada nuevo.', { fans: 2, board: 1 }, { flag: 'DETECTIVE' }),
          o('B', 'Avisarle al nueve', 'Que se cuide. O que se sincere.', { locker: 3, board: -2 }, { flag: 'AVISA' }),
          o('C', 'Contratar a otro detective vos', 'Para saber lo que el detective no dice.', { reputation: 1, cost: 300 }, { flag: 'CONTRA' })
        ],
        { SECRETO: 'Guardaste el secreto, pero el nueve te mira con gratitud.', CHISME: 'Le contaste todo a {presidente} y el vestuario se enteró en diez minutos.', HABLA: 'Hablaste con el nueve y te pidió tiempo para pensarlo.' }
      ),
      chapter(
        'El plantel cubre a los tortolitos',
        'El vestuario entero sabe del romance y armó un operativo: uno distrae a {presidente}, otro le tapa la vista, otro hace de campana. La hija del presidente ahora va a la cancha con la camiseta del nueve y el plantel la saluda con la mano. {periodista} ya huele la primicia.',
        [
          o('A', 'Dejar que el plantel los cubra', 'Una causa noble y colectiva.', { locker: 4, fans: 1 }, { flag: 'CUBREN' }),
          o('B', 'Pedirle al plantel que se meta en el partido', 'Acá se juega, no se hace de celestina.', { locker: -2, board: 1 }, { flag: 'NO_CUBREN' }),
          o('C', 'Ayudarlos vos mismo', 'Un pase al estadio, una entrada escondida, un guiño.', { locker: 2, fans: 2, board: -2 }, { flag: 'AYUDA' })
        ],
        { DETECTIVE: 'El detective del club sigue mirando partidos con el nueve.', AVISA: 'Le avisaste al nueve, y ahora te debe una.', CONTRA: 'Con tu detective propio, sabés más que {presidente} sobre su propia hija.' }
      ),
      chapter(
        'Boda o transferencia',
        '{presidente} junta coraje y te llama: "O el nueve se va, o se casa con mi hija. Elegí vos". El nueve espera en el pasillo con un anillo y una oferta de Europa en la otra mano. La hija está en la puerta con un vestido y una valija. El vestuario entero mira desde la ventana.',
        [
          o('A', 'Que se case y se quede', 'Amor, goles y una familia en el club.', { fans: 5, locker: 4, board: -3 }, { ending: 'Se casaron en el estadio, con el plantel de testigo. El nueve hizo dos goles ese domingo y {presidente} lloró en el palco.', variants: [{ if: 'SECRETO', ending: 'Como guardaste el secreto desde el principio, se casaron en el estadio con el plantel de testigo. El nueve hizo dos goles ese domingo y {presidente} lloró en el palco.' }, { if: 'AYUDA', ending: 'Como los ayudaste desde el principio, se casaron en el estadio con el plantel de testigo. El nueve hizo dos goles ese domingo y {presidente} lloró en el palco.' }] }),
          o('B', 'Que se vaya a Europa y a otra cosa', 'Un nueve se reemplaza. Un yerno, no.', { budget: 2500, board: 4, fans: -3 }, { ending: 'El nueve se fue a Europa con el anillo en el bolsillo. La hija de {presidente} no le habla ni al padre ni a vos.' }),
          o('C', 'Que se case y se vaya con la bendición', 'Los dos, juntos, a Europa.', { budget: 1500, fans: 2, board: 1 }, { ending: 'Se casaron y se fueron a Europa. Desde allá mandan fotos con la camiseta del club y un bebé con la pelota bajo el brazo.' })
        ],
        { CUBREN: 'El plantel cubrió a los tortolitos hasta el final.', NO_CUBREN: 'El plantel no cubrió nada y {periodista} publicó todo.', AYUDA: 'Como los ayudaste vos, la hija de {presidente} te manda saludos todos los domingos.' }
      )
    ]
  },
  {
    id: 'comedor',
    title: 'El comedor de la villa',
    tagline: 'La olla popular alimenta al barrio y descubre al próximo crack.',
    category: 'COMMUNITY',
    chapters: [
      chapter(
        'El comedor pide ayuda al club',
        'Doña Norma, que hace la olla popular en la villa desde hace veinte años, aparece en el predio con un pibe de doce años y una olla vacía. Pide al club que le donen lo que sobre del buffet. El pibe, descalzo, mira la cancha con una cara que no se olvida. El utilero ya le está buscando botines.',
        [
          o('A', 'Donar todo lo que sobre del buffet', 'Comida para el barrio y un pibe en la cancha.', { fans: 3, locker: 1 }, { flag: 'DONA' }),
          o('B', 'Donar solo los domingos', 'Una vez por semana, con foto y todo.', { fans: 1, board: 1 }, { flag: 'DOMINGOS' }),
          o('C', 'Decir que no hay nada', 'La tesorería no da para más.', { fans: -3, board: 1 }, { flag: 'NIEGA' })
        ]
      ),
      chapter(
        'El pibe del comedor la rompe',
        'El pibe que vino con Doña Norma empieza a entrenar en las inferiores. A la semana gambetea a todos. Al mes ya le dicen "el Piojo". El problema: vive en la villa, a diez kilómetros del predio, y no tiene cómo venir. Doña Norma pide que el club le ponga un transporte.',
        [
          o('A', 'Pagarle el transporte', 'Una combi que lo traiga y lo lleve.', { cost: 400, locker: 2, fans: 2 }, { flag: 'COMBI' }),
          o('B', 'Que duerma en la pensión', 'Lejos de la familia, pero cerca de la cancha.', { locker: 1, fans: -1 }, { cost: 300, flag: 'PENSION' }),
          o('C', 'Que venga solo como pueda', 'El que quiere, puede.', { fans: -1, locker: -1 }, { flag: 'SOLO' })
        ],
        { DONA: 'Con la donación, Doña Norma ya es hincha del club.', DOMINGOS: 'La donación de los domingos alcanza, pero no sobra.', NIEGA: 'Le dijiste que no y Doña Norma se fue con la olla vacía y la cara seria.' }
      ),
      chapter(
        'La cocinera es la madre de un rival',
        'Doña Norma, la del comedor, resulta ser la madre de un jugador del club rival, un volante que la rompe. Ella no lo dice, pero {periodista} lo descubre. El barrio entero comenta: "La madre del rival cocina para el club". El plantel no sabe cómo tomarlo. Doña Norma sigue revolviendo la olla como si nada.',
        [
          o('A', 'Bancarla igual', 'La comida es comida. El fútbol es fútbol.', { fans: 3, reputation: 2, locker: 1 }, { flag: 'BANCA_NORMA' }),
          o('B', 'Pedirle que elija', 'O cocina para acá o para allá.', { locker: -2, fans: -2 }, { flag: 'ELIGE' }),
          o('C', 'Invitar al hijo a comer', 'Un plato de guiso y una charla de barrio.', { fans: 2, locker: 2, reputation: 1 }, { flag: 'INVITA' })
        ],
        { COMBI: 'La combi del club pasa por la villa todas las mañanas.', PENSION: 'El pibe duerme en la pensión, pero extraña la olla de Doña Norma.', SOLO: 'El pibe viene como puede, y a veces no viene.' }
      ),
      chapter(
        'El comedor quiere ser sponsor del club',
        'Doña Norma junta plata entre los vecinos y ofrece al club un patrocinio: "Comedor La Esperanza" en la camiseta, a cambio de comida para el plantel y un lugar en la tribuna. La plata es poca, pero el barrio entero apoya. {presidente} quiere saber qué hacés.',
        [
          o('A', 'Aceptar el sponsor', 'El nombre del comedor en la camiseta y guiso para todos.', { fans: 5, budget: 200, locker: 2 }, { ending: 'La camiseta dice "Comedor La Esperanza" y el plantel come guiso de Doña Norma antes de cada partido. No perdieron más de local.' }),
          o('B', 'Aceptar solo la comida, sin sponsor', 'El guiso sí, el nombre no.', { locker: 3, fans: 2, board: 1 }, { ending: 'El plantel come guiso de Doña Norma, pero la camiseta sigue limpia. El barrio igual lo celebra como un triunfo.' }),
          o('C', 'Rechazar: el club necesita plata de verdad', 'Un sponsor de barrio no paga las cuentas.', { board: 3, fans: -5 }, { ending: 'Rechazaste al comedor. Doña Norma siguió cocinando, pero el barrio ya no canta tu nombre.' })
        ],
        { BANCA_NORMA: 'Como bancaste a Doña Norma, el comedor es territorio neutral.', ELIGE: 'Le pediste que elija y eligió a su hijo. El comedor sigue, pero ella no te saluda.', INVITA: 'El hijo de Doña Norma vino a comer y se quedó tres horas charlando.' }
      )
    ]
  },
  {
    id: 'coima_panaderia',
    title: 'El árbitro que cobraba en facturas de panadería',
    tagline: 'Un sobre con facturas, un pan dulce y un penal que no se cobró.',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'Se aparece el hombre del maletín',
        'Un hombre con saco y maletín te espera en el buffet. No dice "coima", dice "colaboración". Pide que el club le compre facturas de panadería por servicios de "asesoría arbitral". El próximo partido es clave. {presidente} ya sabe y te guiña un ojo.',
        [
          o('A', 'Aceptar: son facturas nomás', 'Pan dulce, facturas y un penal a favor.', { board: 1, fans: -1 }, { cost: 200, flag: 'FACTURAS' }),
          o('B', 'Rechazar y denunciarlo', 'Que la liga se entere. El hombre se ríe.', { reputation: 2, board: -2 }, { flag: 'DENUNCIA' }),
          o('C', 'Negociar por facturas de la cantina', 'Así queda todo en familia.', { board: 1, locker: 1 }, { flag: 'CANTINA' })
        ]
      ),
      chapter(
        'La panadería del barrio factura para el club',
        'La panadería de Don Alfredo empieza a emitir facturas por cientos de kilos de facturas que nadie vio. El contador pregunta. {presidente} dice que es "marketing". El plantel come facturas de verdad y está contento.',
        [
          o('A', 'Seguir con las facturas', 'El contador cobra su parte y calla.', { board: 2, budget: 300 }, { flag: 'SIGUE_FACTURAS' }),
          o('B', 'Cortar todo y devolver la plata', 'Don Alfredo no entiende nada.', { reputation: 2, board: -1 }, { cost: 200, flag: 'CORTA' }),
          o('C', 'Involucrar a {presidente} en la firma', 'Que firme él. Por las dudas.', { board: 1, board_owed: 1 }, { flag: 'FIRMA_PRESI' })
        ],
        { FACTURAS: 'El hombre del maletín ya tiene las facturas listas.', DENUNCIA: 'Lo denunciaste, pero la liga nunca encontró el maletín.', CANTINA: 'Las facturas de la cantina ahora incluyen pan dulce.' }
      ),
      chapter(
        'El penal que no se cobró',
        'Partido clave, 0 a 0, falta clara en el área. El árbitro mira para otro lado. La hinchada explota. {periodista} te pregunta en la conferencia si el club "colaboró" con la terna. El hombre del maletín te manda un mensaje: "Todo en orden".',
        [
          o('A', 'Negar todo', 'No sé de qué me habla.', { board: 1, fans: -2 }, { flag: 'NIEGA_PENAL' }),
          o('B', 'Confesar y devolver la plata', 'Un arranque de honestidad.', { reputation: 3, board: -2, fans: 1 }, { cost: 300, flag: 'CONFIESA' }),
          o('C', 'Culpar al línea', 'El línea estaba en el banderín equivocado.', { board: 1, fans: 1, reputation: -2 }, { flag: 'CULPA_LINEA' })
        ],
        { SIGUE_FACTURAS: 'Las facturas siguen llegando, ahora con más pan dulce.', CORTA: 'Cortaste las facturas, pero el hombre del maletín ya tenía copias.', FIRMA_PRESI: 'Con la firma de {presidente}, todo parece más legal.' }
      ),
      chapter(
        'La AFIP y la liga investigan',
        'La AFIP detecta facturas de panadería por servicios inexistentes. La liga abre expediente. {presidente} quiere quemar papeles. El hombre del maletín desapareció. Don Alfredo, el panadero, está en la puerta con una bandeja de facturas recién horneadas.',
        [
          o('A', 'Devolver todo y pedir perdón', 'Plata, facturas y dignidad.', { budget: -500, reputation: 3, board: -2 }, { ending: 'Devolviste todo y pediste perdón. La liga te suspendió seis meses, pero el barrio te recuerda como el único que devolvió la plata.', variants: [{ if: 'CONFIESA', ending: 'Como ya habías confesado lo del penal, devolviste todo y pediste perdón. La liga te suspendió seis meses, pero el barrio te recuerda como el único que devolvió la plata.' }, { if: 'DENUNCIA', ending: 'Como habías denunciado al hombre del maletín, devolviste todo y pediste perdón. La liga te suspendió seis meses, pero el barrio te recuerda como el único que devolvió la plata.' }] }),
          o('B', 'Quemar las facturas en el buffet', 'Con un asado de por medio.', { board: 1, fans: -2, reputation: -3 }, { ending: 'Quemaste las facturas en el buffet. La AFIP igual tenía copias y el club pagó una multa gigante. El asado quedó rico.' }),
          o('C', 'Culpar al contador', 'Él firmaba todo.', { board: 2, locker: -2, reputation: -2 }, { ending: 'Culpaste al contador. Fue preso dos días y después contó todo. La liga te inhabilitó de por vida, pero el hombre del maletín nunca apareció.' })
        ]
      )
    ]
  },
  {
    id: 'tribuna_fantasma',
    title: 'La tribuna que nunca se construyó',
    tagline: 'Licitación, sobreprecio y una empresa que existe solo en un galpón con un perro.',
    category: 'FINANCIAL_CRISIS',
    chapters: [
      chapter(
        'Llega la plata para la tribuna',
        'El municipio gira fondos para una tribuna nueva. Un dirigente propone a "Hormigón del Sur", empresa amiga. {presidente} quiere firmar ya. Los albañiles del barrio se ofrecen a hacerla más barata.',
        [
          o('A', 'Firmar con Hormigón del Sur', 'La empresa del primo del concejal.', { board: 2, budget: 500 }, { flag: 'EMPRESA_AMIGA' }),
          o('B', 'Llamar a licitación pública', 'Que todos participen. Tarda seis meses.', { reputation: 2, board: -1 }, { flag: 'LICITACION' }),
          o('C', 'Contratar a los albañiles del barrio', 'Más barato, más lento, más digno.', { fans: 3, board: -2, cost: 300 }, { flag: 'ALBAÑILES' })
        ]
      ),
      chapter(
        'La empresa es un galpón con un perro',
        'Vas a visitar Hormigón del Sur: un galpón vacío, un perro flaco y un cartel que dice "Oficina Central". El dirigente dice que "están de viaje". El perro te mira como pidiendo que lo saques de ahí.',
        [
          o('A', 'Seguir adelante: total, ya está firmado', 'El perro firma como testigo.', { board: 2, fans: -1 }, { flag: 'SIGUE_EMPRESA' }),
          o('B', 'Denunciar en la municipalidad', 'Con fotos del perro.', { reputation: 2, board: -2 }, { flag: 'DENUNCIA_EMPRESA' }),
          o('C', 'Pedir facturas de materiales', 'A ver qué aparece.', { board: 1, reputation: 1 }, { flag: 'FACTURAS_MATERIAL' })
        ],
        { EMPRESA_AMIGA: 'La empresa amiga ya cobró el anticipo.', LICITACION: 'La licitación sigue abierta, pero ya hay un ganador sospechoso.', ALBAÑILES: 'Los albañiles del barrio empezaron a medir el terreno.' }
      ),
      chapter(
        'La tribuna es un dibujo',
        'Inauguran un cartel gigante que dice "Próximamente Tribuna". Atrás no hay nada. La plata se esfumó. {periodista} publica una foto del galpón con el perro. El municipio pide explicaciones. {presidente} dice que "la inflación retrasó la obra".',
        [
          o('A', 'Culpar al municipio', 'Nos giraron tarde.', { board: 1, fans: -2 }, { flag: 'CULPA_MUNI' }),
          o('B', 'Devolver la plata que queda', 'Poco, pero algo.', { budget: -300, reputation: 2, board: -1 }, { flag: 'DEVUELVE_TRIBUNA' }),
          o('C', 'Hacer una tribuna de cartón pintado', 'Para la foto. Dura hasta la primera lluvia.', { fans: 1, board: -2, reputation: -2 }, { cost: 100, flag: 'CARTON' })
        ],
        { SIGUE_EMPRESA: 'El perro del galpón ahora tiene collar del club.', DENUNCIA_EMPRESA: 'La denuncia avanza, pero el dirigente ya renunció.', FACTURAS_MATERIAL: 'Las facturas de materiales eran de una ferretería que cerró en 1998.' }
      ),
      chapter(
        'La justicia quiere saber',
        'La justicia cita a {presidente}, al dirigente y a vos. El perro del galpón fue adoptado por un vecino y ahora se llama "Soborno". La tribuna sigue sin construirse. El barrio espera una definición.',
        [
          o('A', 'Devolver todo y renunciar', 'Un gesto que no te devuelve la tribuna, pero te devuelve algo.', { reputation: 3, board: -3 }, { ending: 'Devolviste todo y renunciaste. La tribuna nunca se construyó, pero el perro Soborno ahora vive en el predio y ladra cada vez que alguien habla de licitaciones.' }),
          o('B', 'Ir a juicio y bancar', 'Que hable la Justicia.', { board: 1, fans: 1, budget: -200 }, { ending: 'Fuiste a juicio. La causa se durmió, la tribuna nunca se hizo y el cartel de "Próximamente" quedó como monumento nacional a la corrupción.' }),
          o('C', 'Comprar silencio con entradas gratis', 'Un palco para el juez.', { fans: -2, board: 2, reputation: -3 }, { ending: 'Compraste silencio con entradas. El juez fue a todos los partidos, la tribuna nunca se hizo y el barrio te silbó hasta el final.' })
        ]
      )
    ]
  },
  {
    id: 'puntero_plan',
    title: 'El puntero del barrio',
    tagline: 'Cargos, bolsones y una lista de socios que votan sin saber.',
    category: 'BOARD_PRESS',
    chapters: [
      chapter(
        'El puntero ofrece gente a cambio de cargos',
        'Un puntero político del barrio te ofrece llenar la cancha con gente y conseguir votos para {presidente} si le das cargos en el club. "Diez empleados, todos mis primos", dice. Trae una lista escrita a mano en papel de almacén.',
        [
          o('A', 'Aceptar: los votos son votos', 'Diez primos y una tribuna llena.', { board: 3, fans: 1 }, { flag: 'ACEPTA_PUNTERO' }),
          o('B', 'Rechazar: el club no es un partido', 'El puntero se ríe y se va.', { reputation: 2, board: -2 }, { flag: 'RECHAZA_PUNTERO' }),
          o('C', 'Negociar: solo bolsones, sin cargos', 'Comida sí, empleos no.', { fans: 2, board: 1 }, { cost: 200, flag: 'BOLSONES' })
        ]
      ),
      chapter(
        'Los cargos son para los primos',
        'Nombran a diez primos del puntero. Uno es "asesor de césped" y no sabe qué es el césped. Otro es "director de logística" y se pierde en el predio. El club se llena de gente que no trabaja y el plantel mira de costado.',
        [
          o('A', 'Dejarlos: son los votos', 'Cada primo es un voto.', { board: 3, locker: -2 }, { flag: 'DEJA_PRIMOS' }),
          o('B', 'Auditar los cargos', 'A ver qué hace cada uno.', { reputation: 2, board: -1, locker: 1 }, { flag: 'AUDITA' }),
          o('C', 'Ponerlos a trabajar de verdad', 'El de césped corta el pasto.', { locker: 3, board: -2, fans: 1 }, { flag: 'TRABAJAN' })
        ],
        { ACEPTA_PUNTERO: 'El puntero ya tiene la llave del vestuario.', RECHAZA_PUNTERO: 'Lo rechazaste, pero el puntero prometió volver.', BOLSONES: 'Los bolsones llegaron, pero los cargos también.' }
      ),
      chapter(
        'Elecciones en el club',
        'Se vienen las elecciones. El puntero quiere meter una lista propia. {presidente} quiere reelegir. Te ofrecen la presidencia si traicionás a uno de los dos. El buffet está lleno de boletas y de promesas.',
        [
          o('A', 'Apoyar al puntero', 'Los primos votan en bloque.', { board: 3, fans: -2, locker: -1 }, { flag: 'APOYA_PUNTERO' }),
          o('B', 'Apoyar a {presidente}', 'La continuidad, con sus vicios.', { board: 2, fans: 1 }, { flag: 'APOYA_PRESI' }),
          o('C', 'Armar tu propia lista', 'Con los jugadores y los utileros.', { fans: 4, locker: 3, board: -3 }, { flag: 'LISTA_PROPIA' })
        ],
        { DEJA_PRIMOS: 'Los primos siguen cobrando y no trabajan.', AUDITA: 'La auditoría encontró diez cargos fantasma.', TRABAJAN: 'Los primos ahora trabajan, pero te odian.' }
      ),
      chapter(
        'La asamblea',
        'Llega la asamblea. El puntero trae micros llenos de gente. {presidente} trae abogados. Vos traés al plantel, que se sienta en las primeras filas. La votación es a mano alzada. Hay bolsones en la puerta.',
        [
          o('A', 'Ganar con el puntero', 'Diez primos, una tribuna y cero dignidad.', { board: 4, fans: -3 }, { ending: 'Ganaste con el puntero. El club tiene diez empleados nuevos, todos primos, y una tribuna llena de gente que no sabe dónde está.' }),
          o('B', 'Perder y denunciar', 'Que quede en actas.', { reputation: 3, board: -2, fans: 2 }, { ending: 'Perdiste la asamblea y denunciaste todo. La liga intervino, el club quedó acéfalo y el barrio te hizo una bandera.' }),
          o('C', 'Compartir cargos con todos', 'Un club repartido, pero club al fin.', { board: 1, locker: 1, fans: 1 }, { ending: 'Repartiste cargos entre todos. El club funciona a medias, pero nadie se pelea y los bolsones alcanzan para todos.' })
        ]
      )
    ]
  },
  {
    id: 'valija_vestuario',
    title: 'La valija del vestuario',
    tagline: 'Apareció una valija con plata y una nota: "Para el que haga lo que sabe".',
    category: 'LOCKER_ROOM',
    chapters: [
      chapter(
        'Encuentran una valija con plata',
        'Después de la práctica, el utilero encuentra una valija negra en el vestuario. Adentro hay fajos de billetes y una nota: "Para el que haga lo que sabe". El plantel entero mira la valija. El capitán dice: "Nadie toca nada". El nueve ya está calculando cuánto le toca.',
        [
          o('A', 'Quedársela y repartir', 'Un premio por la campaña.', { locker: 2, board: -2, budget: 1500 }, { flag: 'REPARTE' }),
          o('B', 'Avisar a {presidente}', 'Que el club se haga cargo.', { board: 2, locker: -1 }, { flag: 'AVISA_PRESI' }),
          o('C', 'Llamar a la policía', 'Antes de que sea un problema.', { reputation: 2, locker: -2 }, { flag: 'POLICIA' })
        ]
      ),
      chapter(
        'Nadie sabe de quién es la valija',
        'Aparecen mensajes anónimos en el grupo de WhatsApp: "El que hable, pierde". Un jugador quiere repartir la plata. Otro quiere devolverla. El utilero dice que él no la puso. {barra} dice que la valija "es del barrio". La nota tenía una letra conocida.',
        [
          o('A', 'Repartir la plata entre el plantel', 'Todos contentos, todos callados.', { locker: 4, board: -3, budget: 1000 }, { flag: 'REPARTE_PLATA' }),
          o('B', 'Guardarla en la sede hasta saber', 'En la caja fuerte, con dos candados.', { board: 2, locker: 1 }, { flag: 'GUARDA_SEDE' }),
          o('C', 'Investigar quién la dejó', 'Preguntar en el barrio, en la cancha, en todos lados.', { reputation: 2, locker: -1 }, { flag: 'INVESTIGA_VALIJA' })
        ],
        { REPARTE: 'El plantel ya se repartió la plata y nadie sabe de dónde salió.', AVISA_PRESI: '{presidente} dice que la valija es "un adelanto de sponsor".', POLICIA: 'La policía se llevó la valija y el plantel entero te mira mal.' }
      ),
      chapter(
        'El rival ofrece más plata',
        'Un hombre de traje ofrece el doble para que el equipo pierda el clásico. Muestra una valija igual. "La otra era una muestra", dice. El capitán escucha. El nueve ya está pensando en el auto. El ayudante vomita en un tacho.',
        [
          o('A', 'Aceptar: es mucha plata', 'Un partido, una valija, una vida.', { budget: 3000, locker: -4, board: 3 }, { flag: 'ACEPTA_RIVAL' }),
          o('B', 'Grabarlo y denunciarlo', 'Con el celular en el bolsillo.', { reputation: 3, locker: 2, board: -2 }, { flag: 'GRABA_DENUNCIA' }),
          o('C', 'Devolver la valija y echar al hombre', 'Un gesto de dignidad.', { locker: 3, fans: 2, board: -1 }, { flag: 'DEVUELVE_VALIJA' })
        ],
        { REPARTE_PLATA: 'Con la plata repartida, el plantel está más unido y más nervioso.', GUARDA_SEDE: 'La valija está en la sede, pero alguien la buscó de noche.', INVESTIGA_VALIJA: 'La investigación te llevó a una casa de apuestas del barrio.' }
      ),
      chapter(
        'La liga y la justicia',
        'La liga abre expediente. La justicia cita a declarar. {presidente} quiere echar a todo el plantel. El hombre de la valija desapareció. La hinchada quiere saber la verdad. El clásico se juega igual.',
        [
          o('A', 'Confesar todo', 'La verdad, aunque duela.', { reputation: 4, board: -3, locker: 1 }, { ending: 'Confesaste todo. La liga te suspendió, el plantel se salvó por un tecnicismo y el barrio te recuerda como el único que no se quedó con la valija.', variants: [{ if: 'GRABA_DENUNCIA', ending: 'Como ya habías grabado al hombre de la valija, confesaste todo. La liga te suspendió, el plantel se salvó por un tecnicismo y el barrio te recuerda como el único que no se quedó con la valija.' }, { if: 'POLICIA', ending: 'Como habías llamado a la policía desde el principio, confesaste todo. La liga te suspendió, el plantel se salvó por un tecnicismo y el barrio te recuerda como el único que no se quedó con la valija.' }] }),
          o('B', 'Negar todo', 'Nadie vio nada.', { board: 2, locker: -2, reputation: -3 }, { ending: 'Negaste todo. La causa se archivó, el plantel siguió jugando y la valija apareció de nuevo al año siguiente, con más plata y la misma nota.' }),
          o('C', 'Echar a los jugadores y quedarte con la plata', 'Una solución radical.', { budget: 2000, locker: -5, fans: -4, board: 1 }, { ending: 'Echaste a los jugadores y te quedaste con la plata. El equipo descendió, el club quebró y la valija te sigue el rastro en sueños.' })
        ]
      )
    ]
  },
  // Política de liga: la federación cambia las reglas, la tele manda y los amigos del poder se salvan
  ...LEAGUE_ARCS
]

export const arcById = (id) => ARC_CATALOG.find(a => a.id === id) || null