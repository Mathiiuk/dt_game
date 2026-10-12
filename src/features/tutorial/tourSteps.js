/**
 * Tutorial de bienvenida: recorre todas las secciones del juego, explica qué se hace en cada una y por dónde empezar.
 * Datos puros: cada paso lleva la ruta que se abre, el ítem de menú que se resalta y el texto en párrafos.
 */
export const TOUR_STEPS = [
  {
    id: 'bienvenida',
    route: '/dashboard',
    title: '¡Bienvenido, DT!',
    body: [
      'Este recorrido te muestra cada sección del juego y para qué sirve. Dura unos cinco minutos y podés saltearlo cuando quieras.',
      'Vas a ver todo en orden: primero lo que hacés cada semana (inicio, calendario, táctica, plantel, entrenamiento), después la competencia, el club y tu carrera.'
    ]
  },
  {
    id: 'inicio',
    route: '/dashboard',
    nav: '/dashboard',
    title: 'Inicio: tu tablero de la semana',
    body: [
      'Acá ves el próximo partido, el estado del club y las decisiones que te esperan. Las decisiones llegan como historias: leés la situación, elegís una opción y mirás cómo cambian la caja, la hinchada, la dirigencia o el vestuario.',
      'Desde el inicio también avanzás la semana. Si hay un partido pendiente, primero hay que jugarlo.'
    ]
  },
  {
    id: 'calendario',
    route: '/calendar',
    nav: '/calendar',
    title: 'Calendario: el paso del tiempo',
    body: [
      'El juego avanza semana a semana. En el calendario ves qué partidos vienen, contra quién, de local o de visitante, y cómo se ordena la temporada: pretemporada, torneo y cierre.',
      'Mirá siempre quién te toca antes de decidir la táctica o el entrenamiento de la semana.'
    ]
  },
  {
    id: 'tactica',
    route: '/tactics',
    nav: '/tactics',
    title: 'Táctica: la pizarra es tuya',
    body: [
      'Elegís la formación, ubicás a los once en sus puestos y definís cómo querés jugar: más ofensivo o más cuidadoso, con presión alta o baja, con ritmo rápido o paciente.',
      'Un jugador fuera de su puesto rinde menos. También podés elegir especialistas para las pelotas paradas. Probá los cambios antes del partido y ajustá según el rival.'
    ]
  },
  {
    id: 'plantel',
    route: '/squad',
    nav: '/squad',
    title: 'Plantel: tus jugadores',
    body: [
      'Acá está toda la gente del club: posición, nivel, edad, estado físico, contrato y sueldo. Filtrás por línea (arqueros, defensores, mediocampistas, delanteros) y mirás el detalle de cada uno.',
      'Es el lugar para renovar contratos antes de que venzan, ver quién está lesionado y decidir a quién poner en el mercado.'
    ]
  },
  {
    id: 'entrenamiento',
    route: '/training',
    nav: '/training',
    title: 'Entrenamiento: crecer sin cansar',
    body: [
      'Cada semana definís qué trabaja el plantel: más carga física, más táctica o más descanso. También podés atender a jugadores en particular.',
      'Un equipo cansado juega mal y se lesiona más. Equilibrá la carga según los partidos que vienen.'
    ]
  },
  {
    id: 'tabla',
    route: '/standings',
    nav: '/standings',
    title: 'Tabla: dónde estás',
    body: [
      'La tabla de posiciones marca con colores quiénes ascienden y quiénes descienden. Con "Todas las ligas" ves las cinco divisiones, con resultados, goleadores y asistentes, y con "Pirámide" ves cómo se ordenan las categorías.',
      'Si la Asamblea votó un reglamento especial, aparece arriba de la tabla.'
    ]
  },
  {
    id: 'copa',
    route: '/international-cup',
    nav: '/international-cup',
    title: 'Copa continental',
    body: [
      'Un torneo internacional de clubes que se juega aparte de la liga. Los partidos que te tocan aparecen cuando llega su fecha y se juegan igual que los de liga.',
      'Es una buena forma de ganar prestigio y premios extra.'
    ]
  },
  {
    id: 'reto',
    route: '/reto',
    nav: '/reto',
    title: 'Reto del día',
    body: [
      'Todos los días hay tres dilemas bizarros iguales para todos los DT y un objetivo, por ejemplo terminar con la Barra en 65 o más. Elegís una opción en cada dilema y el servidor calcula tus puntos.',
      'Tenés un solo intento por día. Después ves qué pasó con cada decisión, tu puesto en la tabla del día (de todos o solo de tus amigos) y podés compartir tu resultado.'
    ]
  },
  {
    id: 'amigos',
    route: '/friends',
    nav: '/friends',
    title: 'Liga de amigos',
    body: [
      'Armá una sala con hasta diez amigos y un código de invitación. Quien la arma elige el formato (liga o Copa Mundial), cuántos equipos juegan, si se completa con bots y el plazo de cada fecha. En cada fecha elegís tu planteo (presión, equilibrado o contra) y pronosticás los partidos en el prode.',
      'Además hay travesuras de la AFA con mangos que ganás jugando: un sobre, un árbitro amigo, un mote o una denuncia. Solo mueven puntos de la sala, nunca tu plantel ni tu caja.'
    ]
  },
  {
    id: 'seleccion',
    route: '/national-team',
    nav: '/national-team',
    title: 'Selección: doble carrera',
    body: [
      'Con el tiempo y buenos resultados podés dirigir una selección nacional a la vez que tu club. Acá ves el plantel de la selección y sus próximos compromisos.',
      'Es una carrera paralela: lo que hacés con la selección suma a tu historia como DT.'
    ]
  },
  {
    id: 'club',
    route: '/club',
    nav: '/club',
    title: 'Club: staff, cantera e historia',
    body: [
      'Acá manejás el cuerpo técnico, las divisiones inferiores, la historia del club y el vestuario. La cantera te da juveniles propios para subir al plantel o vender más adelante.',
      'Mejorar la academia aumenta las chances de que salgan buenos jugadores.'
    ]
  },
  {
    id: 'mercado',
    route: '/market',
    nav: '/market',
    title: 'Mercado: fichar y vender',
    body: [
      'Hacés ofertas por jugadores de otros clubes, sumás jugadores libres y recibís ofertas por los tuyos. Los ojeadores te dan informes para no comprar a ciegas.',
      'Antes de ofertar mirá el sueldo: si te pasás del tope salarial, vas a tener que vender a alguien.'
    ]
  },
  {
    id: 'finanzas',
    route: '/finances',
    nav: '/finances',
    title: 'Finanzas: que no falte la caja',
    body: [
      'Ves los ingresos (socios, patrocinios, televisión, tienda y taquilla de los partidos de local) y los gastos (sueldos y mantenimiento). El tope salarial te dice cuánto margen tenés para fichar y renovar.',
      'También podés mejorar el estadio, el centro médico y la tienda, y ajustar el precio de la entrada. Revisá el balance seguido: un club en rojo pierde margen para todo.'
    ]
  },
  {
    id: 'carrera',
    route: '/manager',
    nav: '/manager',
    title: 'Carrera del DT',
    body: [
      'Tu trayectoria como director técnico: reputación, títulos, ofertas de otros clubes, logros y el Salón de la Fama.',
      'Los buenos resultados abren puertas y la dirigencia puede despedirte si no se cumplen los objetivos.'
    ]
  },
  {
    id: 'final',
    route: '/dashboard',
    title: '¡A dirigir!',
    body: [
      'Eso es todo. Empezá por el inicio: leé las decisiones pendientes, revisá la táctica y jugá tu primer partido.',
      'Si querés volver a ver este recorrido, lo encontrás en la sección "Más", en el menú del juego.'
    ]
  }
]

export const TOUR_VERSION = 1
