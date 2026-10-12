import { SITE } from './site'
import { MORE_GUIDES } from './guidesMore'

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
    featured: true,
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
    featured: true,
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
    featured: true,
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
    featured: true,
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
    path: '/guias',
    featured: true,
    label: 'Todas las guías',
    group: 'guias',
    title: 'Guías de Vestuario | Táctica, fichajes, finanzas y más',
    description: 'Guías para jugar mejor a Vestuario: formaciones, fichajes, entrenamiento, finanzas, ascensos y liga con amigos.',
    h1: 'Guías para dirigir mejor',
    intro: 'Todo lo que conviene saber antes de tomar decisiones: cómo armar el equipo, cuidar la plata del club y hacer crecer tu carrera.',
    sections: [
      { heading: 'Para armar el equipo', body: ['Empezá por las formaciones: entender qué cambia entre un 4-4-2 y un 4-3-3 te ayuda a elegir el dibujo que mejor le queda a tu plantel. Después mirá cómo fichar sin gastar de más.'] },
      { heading: 'Para cuidar el club', body: ['El entrenamiento, las lesiones y las finanzas deciden si tu proyecto dura una temporada o diez. Estas guías te muestran qué mirar cada semana.'] },
      { heading: 'Para crecer', body: ['Ascender de categoría y jugar con amigos son dos formas de darle sentido a la carrera.'] }
    ],
    related: ['/guias/formacion-4-4-2', '/guias/formacion-4-3-3', '/guias/como-fichar-jugadores', '/guias/entrenamiento-y-lesiones', '/guias/finanzas-del-club', '/guias/como-ascender-de-categoria', '/guias/liga-con-amigos', '/guias/simulador-de-futbol-argentino', '/guias/formacion-4-2-3-1', '/guias/formacion-5-3-2', '/guias/cantera-y-juveniles', '/guias/pelota-parada-y-penales', '/guias/prensa-y-dirigencia', '/guias/copas-y-torneos']
  },
  {
    path: '/guias/formacion-4-4-2',
    label: 'Formación 4-4-2',
    group: 'guias',
    title: 'Formación 4-4-2: cómo usarla bien | Vestuario',
    description: 'Cuándo conviene el 4-4-2 clásico, qué le pide a cada línea y cómo ajustarlo en Vestuario según tu plantel.',
    h1: 'Formación 4-4-2: el equilibrio de siempre',
    intro: 'El 4-4-2 es el dibujo más conocido del fútbol: cuatro defensores, cuatro mediocampistas y dos delanteros. En Vestuario es una buena base para empezar porque reparte bien al plantel.',
    sections: [
      { heading: 'Cómo se arma', body: ['Cuatro en el fondo (dos laterales y dos centrales), cuatro en el medio (dos por las bandas y dos por el centro) y dos delanteros que se acompañan. Todos los puestos tienen una tarea clara, lo que hace fácil ubicar a cada jugador donde mejor rinde.', 'Un consejo práctico: antes de confirmar los once, revisá la calificación de cada jugador en su puesto. Si un titular rinde mucho menos fuera de su lugar natural, mejor sentar a otro y no forzar la alineación.'] },
      { heading: 'Cuándo conviene', body: ['Funciona cuando tenés buenos laterales y mediocampistas de banda, o cuando tus dos mejores jugadores son delanteros. También es ideal si recién arrancás y tu plantel es parejo: no depende de una figura en un puesto raro.', 'Otra ventaja: es fácil de leer. Si algo no funciona, podés encontrar el problema rápido, porque cada línea hace lo que tiene que hacer y no hay posiciones raras que esconden errores.'] },
      { heading: 'Sus puntos débiles', body: ['Con solo dos mediocampistas centrales, un rival que se junte por el medio puede superarte en cantidad. Si te pasa, probá bajar un delantero o cambiar a una formación con un volante más.', 'Tampoco te olvides del cansancio: los mediocampistas de banda recorren mucho y se desgastan antes. Rotarlos en las semanas con varios partidos evita que el equipo se caiga en el segundo tiempo.'] },
      { heading: 'Cómo ajustarlo', body: ['Dentro del 4-4-2 podés jugar de muchas maneras: más ofensivo con presión alta y ritmo rápido, o más cuidadoso con una línea baja y salida paciente. La formación es el esqueleto; las instrucciones le dan la personalidad.'] },
      { heading: 'Un error común', body: ['Poner a un mediocampista de banda de lateral "porque se parece" le saca rendimiento. En Vestuario un jugador fuera de su puesto rinde menos, así que mirá siempre la posición natural antes de armar los once.'] }
    ],
    related: ['/guias/formacion-4-3-3', '/tacticas', '/demo']
  },
  {
    path: '/guias/formacion-4-3-3',
    label: 'Formación 4-3-3',
    group: 'guias',
    title: 'Formación 4-3-3: ataque por afuera | Vestuario',
    description: 'Cómo funciona el 4-3-3 ofensivo, qué jugadores necesita y cómo evitar que te lastimen a la contra en Vestuario.',
    h1: 'Formación 4-3-3: ataque y presión',
    intro: 'El 4-3-3 sacrifica un mediocampista para sumar un delantero. Es el dibujo de los equipos que quieren la pelota y atacan por las bandas.',
    sections: [
      { heading: 'Cómo se arma', body: ['Cuatro defensores, tres mediocampistas (un volante defensivo y dos de ida y vuelta) y un tridente: dos extremos y un centrodelantero. Los extremos abren la cancha y el delantero centro encuentra los espacios.', 'Los laterales también importan: en este dibujo suben para dar amplitud, así que conviene que tengan buen pase y resistencia. Si tu lateral solo sabe defender, el equipo pierde opciones por afuera.'] },
      { heading: 'Qué jugadores necesita', body: ['Extremos rápidos, un nueve que defina bien y mediocampistas con resistencia, porque cubren mucho terreno. Si tu plantel es lento arriba, este dibujo se siente vacío.', 'Un detalle que se suele pasar por alto es el volante defensivo. Es el que tapa el hueco que dejan los dos mediocampistas cuando salen. Un jugador ordenado en ese puesto vale oro y protege a la defensa.'] },
      { heading: 'El riesgo de la contra', body: ['Con tres delanteros y tres en el medio, los laterales quedan muy exigidos cuando el rival sale rápido. Un volante defensivo ordenado y una línea de fondo que no se vaya toda al ataque son la clave.'] },
      { heading: 'Presión alta y ritmo', body: ['El 4-3-3 combina bien con presión alta: robás cerca del arco rival y atacás con pocos pases. Pero cansa; cuidá el estado físico del plantel durante la semana y rotá a los extremos.', 'Probá combinarlo con ritmo alto durante una semana y mirá las estadísticas del partido. Si ves que el equipo genera muchas chances pero llega cansado al final, bajá un cambio y cuidá la energía.'] },
      { heading: 'Cuándo cambiarlo', body: ['Si vas ganando y querés cerrar el partido, pasar a una línea de cinco o sumar un volante le da firmeza. Si estás perdiendo, el 4-3-3 es una buena opción para empujar sin descuidar el equilibrio.', 'Los cambios durante el partido también cuentan: un lateral fresco o un delantero de recambio pueden darte la ventaja que el dibujo inicial no logró.'] }
    ],
    related: ['/guias/formacion-4-4-2', '/tacticas', '/demo']
  },
  {
    path: '/guias/como-fichar-jugadores',
    featured: true,
    label: 'Cómo fichar jugadores',
    group: 'guias',
    title: 'Cómo fichar jugadores sin gastar de más | Vestuario',
    description: 'Guía para fichar en el mercado de pases de Vestuario: ojeadores, jugadores libres, ofertas, contratos y tope salarial.',
    h1: 'Cómo fichar jugadores sin fundir al club',
    intro: 'Un buen fichaje cambia una temporada; uno malo te deja pagando un sueldo que no podés sostener. Esta guía te muestra cómo comprar con la cabeza.',
    sections: [
      { heading: 'Primero, qué te falta', body: ['Antes de abrir el mercado, mirá el plantel por puestos. No necesitás al mejor jugador del juego: necesitás al que arregla tu punto débil. Un lateral derecho correcto vale más que una tercera figura en ataque.', 'Mirá también la edad. Un jugador de veintiún años cuesta más pero vale más en el tiempo; uno de treinta y cinco es barato pero se va a deteriorar. Mezclá las dos cosas según lo que necesite tu proyecto.'] },
      { heading: 'Mandá a los ojeadores', body: ['No conocés a fondo a los jugadores de otros clubes hasta que los observás. Los informes de los ojeadores te evitan comprar a ciegas. Es una inversión chica que te ahorra errores caros.', 'Dale un tiempo al informe y compará varias opciones antes de decidir. A veces el segundo o tercer candidato rinde igual que el primero y cuesta mucho menos.'] },
      { heading: 'Los jugadores libres', body: ['Los que no tienen club no cuestan transferencia, solo sueldo. Para un club con poca plata son la mejor puerta de entrada: podés conseguir experiencia sin comprometer la caja.'] },
      { heading: 'Negociá con números en la mano', body: ['Cada jugador tiene precio, sueldo y fecha de vencimiento del contrato. Antes de ofertar, calculá cuánto sube tu masa salarial; si te pasás del tope, vas a tener que vender a alguien para equilibrar.', 'Una buena regla: no gastes más de lo que podés sostener durante toda la temporada. Es preferible fichar a alguien correcto con un sueldo razonable que a una estrella que te deje sin margen para el resto.'] },
      { heading: 'No te olvides de vender', body: ['Los jugadores que no juegan cobran igual. Vender a tiempo libera sueldo y da plata para reforzar donde hace falta. Las ofertas que te llegan por tus jugadores son una buena fuente de ingresos si las sabés usar.'] }
    ],
    related: ['/mercado-de-pases', '/guias/finanzas-del-club', '/cantera']
  },
  {
    path: '/guias/entrenamiento-y-lesiones',
    label: 'Entrenamiento y lesiones',
    group: 'guias',
    title: 'Entrenamiento y lesiones: cuidar al plantel | Vestuario',
    description: 'Cómo organizar el entrenamiento semanal, evitar el cansancio y manejar las lesiones de tu plantel en Vestuario.',
    h1: 'Entrenamiento y lesiones: cuidar al plantel',
    intro: 'Un equipo cansado juega mal y un jugador lesionado no juega. Entre fecha y fecha, la semana de entrenamiento es donde se ganan (o se pierden) los partidos.',
    sections: [
      { heading: 'El plan semanal', body: ['Cada semana definís qué trabaja el plantel: más carga física, más táctica o más descanso. Un plan equilibrado mejora a los jugadores sin dejarlos agotados el día del partido.', 'Probá cambiar el foco según el rival: si viene un partido duro, priorizá la táctica y el descanso; si tenés una semana tranquila, aprovechá para cargar más trabajo físico y mejorar a los jugadores jóvenes.'] },
      { heading: 'El estado físico importa', body: ['El cansancio acumulado baja el rendimiento y aumenta el riesgo de lesión. Si tenés varios partidos seguidos, bajá la carga y rotá a los titulares más exigidos.', 'Prestá atención a los que juegan todos los minutos. Un titular indiscutido sin descanso suele ser el primero en lesionarse justo antes de un partido clave.'] },
      { heading: 'Cuando alguien se lesiona', body: ['Las lesiones tienen una duración y un tratamiento. Mirá el parte médico antes de armar los once: poner a un lesionado o a medio recuperar puede empeorar el cuadro y hacer que falte más tiempo.', 'Si la lesión es larga, evaluá si conviene buscar un reemplazo en el mercado o subir a un juvenil. Esperar sin hacer nada suele ser lo más caro en puntos.'] },
      { heading: 'Juveniles y veteranos', body: ['Los jóvenes mejoran con minutos y entrenamiento; los veteranos, con los años, empiezan a bajar. Repartí la carga distinto según la edad y empezá a preparar el recambio con la cantera.'] },
      { heading: 'Plantel corto, riesgo alto', body: ['Si tenés pocos jugadores por puesto, una lesión te obliga a improvisar. Tener al menos un suplente natural en cada línea te cuida de sustos, y los juveniles pueden dar una mano en emergencias.', 'Y no olvides el descanso entre partidos: dos fechas seguidas con los mismos once es una invitación a la lesión. Una rotación pensada rinde más que un equipo agotado.'] }
    ],
    related: ['/tacticas', '/cantera', '/guias/finanzas-del-club']
  },
  {
    path: '/guias/finanzas-del-club',
    label: 'Finanzas del club',
    group: 'guias',
    title: 'Finanzas del club: caja, sueldos y tope | Vestuario',
    description: 'Cómo entender la caja, los ingresos, la masa salarial y el tope salarial de tu club en Vestuario para no quedar en rojo.',
    h1: 'Finanzas del club: que no te falte la caja',
    intro: 'Un club sin plata no puede fichar, renovar ni pagar. Entender la caja y la masa salarial es tan importante como la táctica.',
    sections: [
      { heading: 'De dónde entra la plata', body: ['El club recibe plata por socios, patrocinios, recaudación de los partidos como local, ventas de jugadores y premios al final de la temporada. Cuanto más arriba estés en las categorías, más crecen los ingresos fijos.', 'Una forma de crecer es la cantera: formar jugadores propios cuesta poco y, si salen buenos, podés venderlos por buena plata o mantenerlos con sueldos bajos.'] },
      { heading: 'A dónde se va', body: ['La mayor parte son sueldos. También hay gastos del club y las inversiones que decidas, como mejorar instalaciones. Mirá el balance de cada semana para detectar un número que crece sin control.', 'Cuidado con los contratos largos de jugadores que ya no rinden: siguen cobrando aunque no jueguen y son la principal fuga silenciosa de la caja.'] },
      { heading: 'El tope salarial', body: ['La dirigencia fija un tope para lo que podés gastar en sueldos. Pasarte limita tus fichajes y renovaciones. Revisá la barra del tope antes de ofertar: es el mejor indicador de cuánto margen te queda.', 'Pensalo como un presupuesto y no como un límite a esquivar. Un club que se mantiene dentro del tope tiene margen para reaccionar ante una lesión o una oportunidad del mercado.'] },
      { heading: 'Ajustá antes de llegar al rojo', body: ['Si la caja baja, vendé a un jugador que no juega, no renueves contratos caros o esperá a una fecha de local con buena recaudación. Un club en negativo pierde margen para todo y la dirigencia te lo hace notar.'] },
      { heading: 'Premios y ascensos', body: ['Al terminar la temporada, la posición final da un premio. Ascender además aumenta el presupuesto salarial y los ingresos del año siguiente, así que a veces conviene aguantar un año para dar el salto.'] }
    ],
    related: ['/guias/como-fichar-jugadores', '/guias/como-ascender-de-categoria', '/carrera-del-dt']
  },
  {
    path: '/guias/como-ascender-de-categoria',
    featured: true,
    label: 'Cómo ascender de categoría',
    group: 'guias',
    title: 'Cómo ascender de categoría paso a paso | Vestuario',
    description: 'Cómo escalar de la última categoría a Primera en Vestuario: plantel, objetivos, ascensos, descensos y reglamentos que cambian cada año.',
    h1: 'Cómo ascender de categoría',
    intro: 'Vestuario tiene cinco divisiones con veinte clubes cada una. Se empieza en la última y el sueño es llegar a Primera. Así se hace.',
    sections: [
      { heading: 'La pirámide', body: ['Hay cinco categorías. Normalmente suben los primeros de cada tabla y bajan los últimos, pero el reglamento de cada año lo votan los directores técnicos y puede cambiar cuántos suben y cuántos bajan.', 'Mirá la tabla de vez en cuando para saber en qué zona estás: hay marcas que muestran quiénes suben y quiénes bajan, y cambian cuando el reglamento del año es distinto.'] },
      { heading: 'Construí una base', body: ['Los mejores equipos de una categoría baja no tienen estrellas: tienen un plantel parejo, una táctica clara y pocos lesionados. Resolvé primero los puestos flojos antes de pensar en el fichaje bomba.', 'Una buena práctica es dejar un par de lugares para juveniles con proyección. Así el plantel se renueva solo y no dependés siempre del mercado.'] },
      { heading: 'Cuidá la regularidad', body: ['En una liga larga ganan los que no regalan puntos. Los partidos de local pesan mucho, y las últimas fechas pueden valer más según el reglamento del año. Rotá cuando haga falta y no te relajes con los rivales chicos.', 'Prestá especial atención a las rachas: tres derrotas seguidas pueden bajar la confianza del vestuario y de la dirigencia. Hablá en la conferencia de prensa y ajustá el planteo antes de que sea tarde.'] },
      { heading: 'Qué pasa al ascender', body: ['Subir te da un presupuesto salarial mayor y más ingresos, pero también rivales más fuertes. Preparate: el primer año en la categoría nueva suele ser de adaptación y el objetivo es afianzarte.'] },
      { heading: 'Y si descendés', body: ['No es el fin. Bajar recorta presupuesto pero te da una liga más accesible para reconstruir. Muchos clubes grandes de la historia pasaron por ahí.', 'Lo importante es no tomar decisiones de pánico: vender a todos o cambiar el planteo cada semana suele empeorar las cosas. Un proyecto con paciencia vuelve a subir.'] }
    ],
    related: ['/guias/finanzas-del-club', '/carrera-del-dt', '/guias/liga-con-amigos']
  },
  {
    path: '/guias/liga-con-amigos',
    featured: true,
    label: 'Liga con amigos',
    group: 'guias',
    title: 'Liga con amigos: armá tu torneo | Vestuario',
    description: 'Cómo armar una sala de hasta 10 amigos en Vestuario: liga propia, bots, reglamentos bizarros y travesuras de la AFA.',
    h1: 'Liga con amigos: tu propio torneo',
    intro: 'Cada uno juega su carrera, pero la sala los junta en una liga propia. Hasta diez directores técnicos, con tabla, muro de noticias y travesuras.',
    sections: [
      { heading: 'Armá la sala', body: ['Quien arma la sala le pone nombre y recibe un código de invitación. Los amigos entran con ese código y su propio club. Cada cuenta sigue siendo independiente: la sala solo comparte nombre, puntos y noticias.', 'Podés estar en más de una sala a la vez, por ejemplo una con amigos del trabajo y otra con la familia, y compartir el mismo club en todas.'] },
      { heading: 'Configurá el torneo', body: ['El creador decide cuántos equipos juegan (de 4 a 20), si se completa con bots, qué tan fuertes son, si es solo ida o ida y vuelta, y el reglamento. Podés elegir uno clásico o uno bizarro, como el que no suma puntos en los 0-0.', 'Si son pocos amigos, completá con bots parejos para que haya más partidos y rivales variados. Si son muchos, un torneo corto de solo ida mantiene todo ágil.'] },
      { heading: 'Se juega fecha por fecha', body: ['No hace falta que estén todos conectados: cada fecha tiene un plazo de 12, 24 o 48 horas. Cada DT elige su planteo (presión, equilibrado o contra, un piedra-papel-tijera) y pronostica los partidos en el prode. Cuando todos eligieron o vence el plazo, la fecha se juega con la fuerza real de cada plantel más el efecto de los planteos. Cada partido tiene su relato y su titular. Cuidar a tu equipo durante la semana se nota en la tabla de la sala.'] },
      { heading: 'Las travesuras de la AFA', body: ['Con mangos que ganás jugando podés mandar un sobre, apostar por un árbitro amigo, ponerle un mote a un amigo o denunciar al líder. Solo mueven puntos de la sala y el muro de noticias: nunca tocan tu plantel ni tu caja.', 'Cada travesura cuesta mangos y tiene azar, así que no conviene abusar: un sobre puede salir mal y devolverse en contra. Elegí bien cuándo arriesgar.'] },
      { heading: 'Un ganador con historia', body: ['Al terminar el torneo hay campeón y un resumen en el muro. Después podés armar otro con otras reglas y revancha.'] }
    ],
    related: ['/guias/como-ascender-de-categoria', '/juego', '/demo']
  },
  {
    path: '/guias/simulador-de-futbol-argentino',
    label: 'Simulador de fútbol argentino',
    group: 'guias',
    title: 'Simulador de fútbol argentino online | Vestuario',
    description: 'Vestuario es un simulador de director técnico con humor argentino: dirigentes, barra, árbitros y decisiones difíciles. Jugalo gratis desde el navegador.',
    h1: 'Un simulador de fútbol con humor argentino',
    intro: 'Vestuario no es solo ganar partidos. También es lidiar con la dirigencia, la hinchada y todo lo que pasa en un club de fútbol de barrio.',
    sections: [
      { heading: 'Más que un partido', body: ['Entre fecha y fecha tomás decisiones: qué responder en la conferencia de prensa, cómo manejar un pedido de la barra o qué hacer con una oferta dudosa. Cada elección cambia el humor del vestuario, la plata del club o la confianza de la dirigencia.', 'Esas decisiones no tienen una respuesta correcta: lo que ayuda hoy puede complicar mañana, y ahí está la gracia de ser DT en lugar de simplemente jugar.'] },
      { heading: 'Historias que se arman solas', body: ['El juego va contando la temporada con titulares, anécdotas y personajes. Dos DT nunca viven el mismo año, y lo que decidís hoy puede volver como problema (o como premio) tres meses después.', 'Hay temporadas tranquilas y otras en las que todo se complica a la vez: una racha mala, un reclamo de la hinchada y un pedido de la dirigencia. Saber priorizar es parte del juego.'] },
      { heading: 'Una carrera completa', body: ['Empezás en la última categoría con un club de barrio y apuntás a Primera. Hay cantera, mercado de pases, finanzas, copas, la selección y un salón de la fama para tu legado.', 'Podés quedarte toda la vida en un mismo club o irte a otro cuando llega una oferta. Tu historia, tus títulos y tus ídolos quedan registrados.'] },
      { heading: 'Gratis y desde el navegador', body: ['Se juega en el celular o la computadora, sin descargar nada, y se puede instalar como app. La carrera queda guardada en tu cuenta.', 'No hace falta una computadora potente ni descargar archivos pesados: funciona en cualquier celular moderno con conexión a internet.'] },
      { heading: 'Empezá cuando quieras', body: ['Si querés ver de qué va, la demo te mete en tu primer día como DT en tres minutos y sin cuenta. Creás tu DT, fundás tu club y dirigís el primer partido en pocos minutos. Si te engancha, la carrera sigue temporada tras temporada.', 'Y si preferís jugar acompañado, podés armar una liga con amigos y competir con reglas bizarras, con bots o sin ellos.'] }
    ],
    related: ['/juego', '/como-jugar', '/guias']
  },
  ...MORE_GUIDES,
  {
    path: '/demo',
    featured: true,
    label: 'Probá la demo',
    group: 'juego',
    event: 'game_info_click',
    title: 'Demo gratis: tu primer día como DT | Vestuario',
    description: 'Probá Vestuario en tres minutos y sin cuenta: tres decisiones bizarras, un partido con penal y los titulares del día siguiente.',
    h1: 'Tu primer día como DT',
    intro: 'Tres decisiones, un partido y los titulares del día siguiente. Dura tres minutos y no pide cuenta.',
    sections: [
      { heading: 'Cómo es', body: ['Dirigís al Potrero Unidos, un club de barrio. Antes del partido se te cruzan la barra, un dirigente y el árbitro, y cada respuesta mueve tu caja, la barra, la dirigencia y el vestuario.'] },
      { heading: 'Y después', body: ['Con esas decisiones se juega el partido, con relato y un penal en el que te toca patear. Al final te enterás de qué dicen los diarios de vos.'] }
    ],
    related: ['/como-jugar', '/guias']
  },
  {
    path: '/faq',
    featured: true,
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
    featured: true,
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
    featured: true,
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
    featured: true,
    label: 'Privacidad',
    group: 'legal',
    title: 'Política de privacidad | Vestuario',
    description: 'Qué datos guarda Vestuario, para qué se usan y cómo pedir que se eliminen.',
    h1: 'Política de privacidad',
    intro: 'Vestuario guarda la menor cantidad de datos posible para que puedas jugar y continuar tu carrera.',
    sections: [
      { heading: 'Qué datos guardamos', body: ['Los datos de tu cuenta (nombre y correo electrónico), una contraseña que se guarda cifrada y los datos de tu partida: tu DT, tu club y el avance de tu carrera. También guardamos tu elección sobre aparecer o no en la tabla pública de los mejores DT.'] },
      { heading: 'Para qué los usamos', body: ['Para que puedas iniciar sesión, guardar tu carrera y recuperar el acceso si olvidás la contraseña. No vendemos tus datos ni los compartimos con terceros con fines publicitarios.'] },
      { heading: 'Medición de uso', body: ['Podemos registrar eventos de uso generales, como visitas, registros y clics en los botones, para entender cómo se usa el sitio. Esos eventos no incluyen tu nombre ni tu correo.'] },
      { heading: 'Cookies y Google Tag Manager', body: ['Usamos Google Tag Manager para medir el uso del sitio. Las cookies de medición y publicidad solo se activan si tocás "Aceptar" en el aviso; con "Solo necesarias" quedan desactivadas. Podés cambiar tu elección borrando los datos del sitio en tu navegador.'] },
      { heading: 'Uso sin conexión', body: ['Para que el juego abra rápido y se pueda mirar sin internet, guardamos en tu dispositivo una copia de los últimos datos de tu club que viste (plantel, tabla, calendario) por hasta 24 horas. Esa copia es solo tuya: se borra al cerrar sesión o al eliminar tu cuenta, y si entra otra persona en el mismo dispositivo.'] },
      { heading: 'Notificaciones', body: ['Si activás los avisos en un dispositivo, guardamos una dirección técnica de ese dispositivo (la que entrega el navegador) y qué tipos de aviso querés recibir. Solo las usamos para avisarte de tu sala de amigos, de tu club o de novedades del juego, nunca de noche, y no las compartimos. Podés apagarlos desde la sección "Más" del juego o en los ajustes de tu navegador. Si eliminás tu cuenta, se borran.'] },
      { heading: 'Tabla pública de los mejores DT: solo si lo aceptás', body: [
        'La portada muestra una tabla con los DT que más puntos de legado juntaron en su carrera. Aparecés únicamente si lo aceptás: al crear tu DT hay una casilla que arranca sin tildar, y después podés activarlo o desactivarlo cuando quieras en "Más", en el apartado Privacidad.',
        'Si lo aceptás, se publica el nombre y apellido que elegiste para tu DT, sus puntos de legado, sus títulos y sus victorias, y recién cuando jugó al menos 10 partidos. Nunca se publican tu correo, tu contraseña, el nombre de tu club ni otros datos de tu cuenta.',
        'Si lo aceptás, tu DT también tiene una página propia (vestuario.com.ar/dt/…) con esos mismos datos y su puesto, que podés compartir. Esa página no se indexa en buscadores y deja de existir cuando retirás tu consentimiento.',
        'En la tabla también figuran cinco leyendas: los DT argentinos más ganadores de la historia, con su cantidad de títulos. Son figuras públicas del fútbol que se muestran solo con ese dato; no son usuarios del juego y no se guarda nada de ellas más que su nombre y sus títulos.',
        `Podés retirar tu consentimiento en cualquier momento y dejás de aparecer enseguida. También dejás de aparecer si eliminás tu cuenta, y si cambiás el nombre de tu DT se muestra el nuevo. ${contactLine}`
      ] },
      { heading: 'Tus derechos', body: [`Podés pedir en cualquier momento que corrijamos o eliminemos tus datos y tu cuenta. ${contactLine}`] }
    ],
    related: ['/terminos', '/contacto']
  },
  {
    path: '/terminos',
    featured: true,
    label: 'Términos',
    group: 'legal',
    title: 'Términos y condiciones | Vestuario',
    description: 'Condiciones de uso de Vestuario, el juego de Director Técnico de fútbol.',
    h1: 'Términos y condiciones',
    intro: 'Al crear una cuenta y jugar a Vestuario aceptás estas condiciones.',
    sections: [
      { heading: 'El juego', body: ['Vestuario es un juego de simulación. Los jugadores, sus nombres y los resultados son inventados por el juego. Los clubes llevan nombres de instituciones deportivas argentinas solo para ambientar la historia: Vestuario no tiene relación ni acuerdo con ningún club, liga ni federación, y esos nombres no implican patrocinio ni aprobación.'] },
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
  { key: 'guias', label: 'Guías' },
  { key: 'soporte', label: 'Soporte' },
  { key: 'legal', label: 'Legal' }
].map(group => ({ ...group, links: PUBLIC_PAGES.filter(p => p.group === group.key && p.featured) }))
