import { SITE } from './site'

/**
 * Páginas públicas secundarias. La Home es la portada (corta, sin scroll); estas páginas llevan el contenido
 * que explica el juego. Cada una tiene un solo H1, texto visible y enlaces a las páginas relacionadas.
 *
 * `event` es el evento de analítica que se registra al entrar desde un enlace público.
 */
const contactLine = SITE.contactEmail
  ? `Escribinos a ${SITE.contactEmail} y te respondemos lo antes posible.`
  : 'Estamos preparando el canal de contacto y lo vamos a publicar en esta página.'

export const PUBLIC_PAGES = [
  {
    path: '/juego',
    label: 'El juego',
    group: 'juego',
    event: 'game_info_click',
    title: 'El juego | Vestuario, juego de Director Técnico de fútbol',
    description: 'Conocé Vestuario: un juego de fútbol donde vos sos el DT. Armás el plantel, definís la táctica, dirigís los partidos y hacés crecer tu club y tu carrera.',
    h1: 'Un juego de fútbol donde vos sos el DT',
    intro: 'En Vestuario no manejás a los jugadores con un control: tomás las decisiones del Director Técnico. Quién juega, cómo se para el equipo, a quién comprás, qué decís en la conferencia de prensa. El resultado de cada partido sale de esas decisiones.',
    sections: [
      { heading: 'Empezás desde abajo', body: ['Creás tu DT, fundás un club de barrio y arrancás en la última categoría, con un plantel modesto y una cancha humilde. De ahí en adelante todo depende de vos: ascender, sostenerte o pelear el descenso.'] },
      { heading: 'Cada semana, decisiones', body: ['Entre partido y partido entrenás al plantel, ajustás la táctica, atendés lesiones, negociás contratos y mirás el mercado de pases. También te toca cuidar el ánimo del vestuario, la paciencia de la dirigencia y el humor de la hinchada.'] },
      { heading: 'Una carrera larga', body: ['Los buenos resultados te dan reputación y abren ofertas de clubes más grandes, copas internacionales y hasta la selección. Las temporadas pasan, los jugadores crecen y se retiran, y tu nombre queda en la historia de cada club que dirigiste.'] },
      { heading: 'Se juega desde el navegador', body: ['Vestuario funciona en el celular y en la computadora, sin descargar nada. Si querés, podés instalarlo como una app desde el navegador.'] }
    ],
    related: ['/como-jugar', '/tacticas', '/carrera-del-dt']
  },
  {
    path: '/como-jugar',
    label: 'Cómo jugar',
    group: 'juego',
    title: 'Cómo jugar | Vestuario',
    description: 'Cómo se juega Vestuario paso a paso: creá tu Director Técnico, fundá tu club, armá el equipo y dirigí tu primer partido.',
    h1: 'Cómo jugar a Vestuario',
    intro: 'Empezar lleva pocos minutos. Estos son los pasos desde que creás tu cuenta hasta tu primer partido.',
    sections: [
      { heading: '1. Creá tu DT', body: ['Elegís el nombre y el perfil de tu Director Técnico. Su origen define en qué es fuerte al empezar: la táctica, el trato con los jugadores, la negociación o el trabajo con juveniles.'] },
      { heading: '2. Fundá tu club', body: ['Le ponés nombre, colores, ciudad y estadio. Arrancás con un plantel inicial y un presupuesto chico: es un club de barrio y hay que hacerlo crecer.'] },
      { heading: '3. Armá el equipo', body: ['Elegís la formación, ubicás a cada jugador en su puesto y definís cómo querés jugar. Un jugador fuera de su posición rinde menos, así que conviene mirar bien el plantel.'] },
      { heading: '4. Jugá el partido', body: ['Durante el partido seguís el relato, hacés cambios y ajustás el planteo. Al terminar ves las calificaciones, la recaudación y cómo quedó la tabla.'] },
      { heading: '5. Avanzá la semana', body: ['Entre fechas entrenás, revisás el mercado de pases, la cantera y las finanzas. Después avanzás a la próxima fecha y la temporada sigue.'] }
    ],
    related: ['/tacticas', '/mercado-de-pases', '/faq']
  },
  {
    path: '/tacticas',
    label: 'Tácticas',
    group: 'juego',
    event: 'tactics_click',
    title: 'Tácticas y formaciones | Vestuario',
    description: 'La pizarra táctica de Vestuario: elegí la formación, ubicá a los once en la cancha y definí el estilo de juego de tu equipo.',
    h1: 'Tácticas: la pizarra es tuya',
    intro: 'La táctica es la decisión que más pesa en cada partido. En la pizarra armás los once, elegís el dibujo y definís cómo va a jugar tu equipo.',
    sections: [
      { heading: 'Formaciones', body: ['Podés pararte con distintos dibujos y cambiar de uno a otro cuando quieras. Cada formación reparte distinto a los jugadores entre defensa, mediocampo y ataque.'] },
      { heading: 'Cada jugador en su puesto', body: ['El plantel usa doce posiciones, del arquero al delantero centro. Un jugador rinde según el puesto en el que lo ponés: un lateral de mediocampista central no juega igual que en su lugar.'] },
      { heading: 'Entrenamiento y estado físico', body: ['Lo que entrenás durante la semana influye en cómo llega el equipo: la carga, el cansancio y las lesiones también son parte del planteo.'] }
    ],
    related: ['/como-jugar', '/cantera', '/juego']
  },
  {
    path: '/mercado-de-pases',
    label: 'Mercado de pases',
    group: 'juego',
    event: 'market_click',
    title: 'Mercado de pases y fichajes | Vestuario',
    description: 'Comprá, vendé y negociá en el mercado de pases de Vestuario: fichajes, jugadores libres, ojeadores, contratos y representantes.',
    h1: 'Mercado de pases: comprar, vender y negociar',
    intro: 'El plantel no se arma solo. En el mercado de pases buscás refuerzos, vendés jugadores y negociás cada contrato con la plata que tenga el club.',
    sections: [
      { heading: 'Fichajes y jugadores libres', body: ['Podés hacer ofertas por jugadores de otros clubes o sumar jugadores libres. También te van a llegar ofertas por los tuyos: aceptar o rechazar es decisión del DT.'] },
      { heading: 'Ojeadores', body: ['No conocés a fondo a los jugadores ajenos hasta que los mandás a observar. Los ojeadores te dan informes para no comprar a ciegas.'] },
      { heading: 'Contratos y sueldos', body: ['Cada jugador tiene contrato, sueldo y fecha de vencimiento. Renovar a tiempo, cuidar la masa salarial y tratar con los representantes es parte del trabajo.'] }
    ],
    related: ['/cantera', '/carrera-del-dt', '/juego']
  },
  {
    path: '/cantera',
    label: 'Cantera',
    group: 'juego',
    title: 'Cantera y juveniles | Vestuario',
    description: 'Formá a tus propios jugadores en la cantera de Vestuario: divisiones inferiores, juveniles y promoción al primer equipo.',
    h1: 'Cantera: los juveniles del club',
    intro: 'Un club que no puede comprar tiene que formar. La cantera te da juveniles propios para subir al primer equipo o vender más adelante.',
    sections: [
      { heading: 'Divisiones inferiores', body: ['Cada temporada aparece una nueva camada de juveniles. Mejorar las instalaciones de la academia aumenta las chances de que salgan mejores jugadores.'] },
      { heading: 'Promover al primer equipo', body: ['Cuando un juvenil está listo, lo subís al plantel. Si te falta gente para completar el equipo, los chicos también pueden dar una mano antes de tiempo.'] },
      { heading: 'Crecimiento', body: ['Los jugadores jóvenes mejoran con minutos y entrenamiento; los veteranos, con los años, empiezan a bajar. Planificar el recambio es parte de la carrera.'] }
    ],
    related: ['/mercado-de-pases', '/tacticas', '/juego']
  },
  {
    path: '/carrera-del-dt',
    label: 'Carrera del DT',
    group: 'juego',
    event: 'career_click',
    title: 'Carrera del DT | Vestuario',
    description: 'Tu carrera como Director Técnico en Vestuario: del club de barrio a los grandes, los títulos, la selección y el salón de la fama.',
    h1: 'La carrera del DT: del barrio a la gloria',
    intro: 'Vestuario no termina en un campeonato. Lo que construís es una carrera: empezás como un DT desconocido y cada temporada suma a tu historia.',
    sections: [
      { heading: 'Reputación y ofertas', body: ['Los resultados hacen crecer tu reputación. Con ella llegan ofertas de otros clubes: quedarte a hacer historia o irte a uno más grande es tu decisión.'] },
      { heading: 'Dirigencia, prensa e hinchada', body: ['La dirigencia te fija objetivos y puede despedirte si no se cumplen. Lo que decís en las conferencias de prensa y cómo le va al equipo cambia el humor de la hinchada.'] },
      { heading: 'Ascensos, copas y selección', body: ['Los torneos tienen ascensos y descensos. Si te va bien llegan las copas internacionales y, con el tiempo, la chance de dirigir una selección.'] },
      { heading: 'Legado', body: ['Los títulos, los récords y los ídolos que dejás quedan en la historia de cada club. Cuando tu DT se retira, su carrera queda en el salón de la fama y podés empezar una nueva.'] }
    ],
    related: ['/juego', '/como-jugar', '/faq']
  },
  {
    path: '/faq',
    label: 'FAQ',
    group: 'soporte',
    event: 'faq_click',
    faq: true,
    title: 'Preguntas frecuentes | Vestuario',
    description: 'Preguntas frecuentes sobre Vestuario, el juego de Director Técnico de fútbol: qué es, dónde se juega y cómo empezar una carrera.',
    h1: 'Preguntas frecuentes',
    intro: 'Las dudas más comunes antes de empezar.',
    sections: [
      { heading: '¿Qué es Vestuario?', body: ['Vestuario es un juego de Director Técnico de fútbol. No manejás a los jugadores en la cancha: armás el plantel, elegís la táctica, negociás pases y dirigís la carrera de tu DT.'] },
      { heading: '¿Tiene algo que ver con ropa o indumentaria?', body: ['No. El nombre viene del vestuario de un equipo de fútbol, el lugar donde el DT habla con sus jugadores antes de salir a la cancha.'] },
      { heading: '¿Dónde se juega?', body: ['Desde el navegador, en el celular o en la computadora. No hace falta descargar nada y se puede instalar como app.'] },
      { heading: '¿Cómo empiezo?', body: ['Creás tu cuenta, armás tu DT, fundás tu club y ya podés dirigir el primer partido.'] },
      { heading: '¿Manejo a los jugadores durante el partido?', body: ['No. Durante el partido tomás decisiones de DT: cambios y ajustes del planteo. El resultado depende del plantel, la táctica y esas decisiones.'] },
      { heading: '¿Se guarda mi carrera?', body: ['Sí. La carrera queda guardada en tu cuenta y la podés continuar desde cualquier dispositivo iniciando sesión.'] }
    ],
    related: ['/como-jugar', '/soporte', '/contacto']
  },
  {
    path: '/contacto',
    label: 'Contacto',
    group: 'soporte',
    title: 'Contacto | Vestuario',
    description: 'Cómo contactar al equipo de Vestuario, el juego de Director Técnico de fútbol.',
    h1: 'Contacto',
    intro: 'Si querés hacernos llegar una consulta, una propuesta o un comentario sobre el juego, esta es la vía.',
    sections: [
      { heading: 'Escribinos', body: [contactLine] },
      { heading: '¿Tenés un problema con el juego?', body: ['Antes de escribir, fijate en las preguntas frecuentes y en la página de soporte: puede que la respuesta ya esté ahí.'] }
    ],
    related: ['/soporte', '/faq']
  },
  {
    path: '/soporte',
    label: 'Soporte',
    group: 'soporte',
    title: 'Soporte | Vestuario',
    description: 'Ayuda para jugar a Vestuario: problemas para entrar a tu cuenta, recuperar la contraseña y continuar tu carrera.',
    h1: 'Soporte',
    intro: 'Soluciones a los problemas más comunes.',
    sections: [
      { heading: 'No puedo entrar a mi cuenta', body: ['Revisá que el correo esté bien escrito. Si no recordás la contraseña, en la pantalla de inicio de sesión tocá "¿Olvidaste tu contraseña?" y te mandamos un enlace para cambiarla.'] },
      { heading: 'Me bloqueó por muchos intentos', body: ['Después de varios intentos fallidos el acceso se bloquea unos minutos por seguridad. Esperá y probá de nuevo, o recuperá la contraseña.'] },
      { heading: 'No veo los últimos cambios', body: ['Si tenés el juego instalado como app y aparece un aviso de actualización, aceptalo. Si no, cerrá y volvé a abrir el juego.'] },
      { heading: 'Otro problema', body: [contactLine] }
    ],
    related: ['/faq', '/contacto']
  },
  {
    path: '/privacidad',
    label: 'Privacidad',
    group: 'legal',
    title: 'Política de privacidad | Vestuario',
    description: 'Qué datos guarda Vestuario, para qué se usan y cómo pedir que se eliminen.',
    h1: 'Política de privacidad',
    intro: 'Vestuario guarda la menor cantidad de datos posible para que puedas jugar y continuar tu carrera.',
    sections: [
      { heading: 'Qué datos guardamos', body: ['Los datos de tu cuenta (nombre y correo electrónico), una contraseña que se guarda cifrada y los datos de tu partida: tu DT, tu club y el avance de tu carrera.'] },
      { heading: 'Para qué los usamos', body: ['Para que puedas iniciar sesión, guardar tu carrera y recuperar el acceso si olvidás la contraseña. No vendemos tus datos ni los compartimos con terceros con fines publicitarios.'] },
      { heading: 'Medición de uso', body: ['Podemos registrar eventos de uso generales, como visitas y clics en los botones de la portada, para entender cómo se usa el sitio. Esos eventos no incluyen tu nombre ni tu correo.'] },
      { heading: 'Tus derechos', body: [`Podés pedir en cualquier momento que corrijamos o eliminemos tus datos y tu cuenta. ${contactLine}`] }
    ],
    related: ['/terminos', '/contacto']
  },
  {
    path: '/terminos',
    label: 'Términos',
    group: 'legal',
    title: 'Términos y condiciones | Vestuario',
    description: 'Condiciones de uso de Vestuario, el juego de Director Técnico de fútbol.',
    h1: 'Términos y condiciones',
    intro: 'Al crear una cuenta y jugar a Vestuario aceptás estas condiciones.',
    sections: [
      { heading: 'El juego', body: ['Vestuario es un juego de simulación. Los clubes, jugadores y resultados que aparecen en tu carrera son ficticios y se generan dentro del juego.'] },
      { heading: 'Tu cuenta', body: ['Sos responsable de mantener tu contraseña en reserva y de lo que se haga con tu cuenta. Una persona, una cuenta: no está permitido usar programas automáticos ni aprovechar errores para sacar ventaja.'] },
      { heading: 'Cambios y disponibilidad', body: ['El juego está en desarrollo: puede cambiar, sumar o quitar funciones, y tener interrupciones. Hacemos lo posible por cuidar tu carrera, pero no podemos garantizar que el servicio esté siempre disponible.'] },
      { heading: 'Contacto', body: [contactLine] }
    ],
    related: ['/privacidad', '/contacto']
  }
]

export const PUBLIC_PATHS = ['/', ...PUBLIC_PAGES.map(p => p.path)]

export const getPublicPage = (path) => PUBLIC_PAGES.find(p => p.path === path)

// Grupos del footer, en el orden en que se muestran
export const FOOTER_GROUPS = [
  { key: 'juego', label: 'Juego' },
  { key: 'soporte', label: 'Soporte' },
  { key: 'legal', label: 'Legal' }
].map(group => ({ ...group, links: PUBLIC_PAGES.filter(p => p.group === group.key) }))
