// Guías de contenido adicionales (mismo formato que las de publicPages.js). Sin nombres de clubes reales.
const guide = (page) => ({ group: 'guias', ...page })

export const MORE_GUIDES = [
  guide({
    path: '/guias/formacion-4-2-3-1',
    label: 'Formación 4-2-3-1',
    title: 'Formación 4-2-3-1: el enganche y los dos pivotes | Vestuario',
    description: 'Cómo armar el 4-2-3-1 en Vestuario: dos volantes de contención, un enganche, extremos por afuera y un solo punta. Ventajas, riesgos y ajustes.',
    h1: 'Formación 4-2-3-1: dos pivotes y un enganche',
    intro: 'El 4-2-3-1 pone dos mediocampistas de contención delante de la defensa, tres jugadores creativos detrás de un único delantero y mucha gente cerca de la pelota. Es un dibujo equilibrado que protege el medio sin renunciar al ataque.',
    sections: [
      { heading: 'Cómo se arma', body: ['Cuatro defensores, dos volantes centrales que cuidan la zona, tres mediocampistas ofensivos (uno por la izquierda, un enganche y uno por la derecha) y un delantero centro. En Vestuario cada uno de esos puestos tiene su lugar propio en la pizarra, así que conviene mirar a quién ubicás en cada uno.', 'Los dos pivotes son la base: si uno de los dos sabe recuperar y el otro sabe pasar, el equipo se ordena solo. Cuando los dos son destructores, el equipo recupera pero le cuesta crear; cuando los dos son creativos, queda expuesto a la contra.'] },
      { heading: 'El enganche, la pieza clave', body: ['El mediocampista ofensivo central es el que conecta el medio con el delantero. Si tenés un jugador de buen pase y buena visión, este dibujo le saca el máximo provecho. Si no lo tenés, el delantero se queda aislado y el equipo genera pocas chances.', 'Un consejo: antes de elegir el 4-2-3-1, revisá si tu mejor jugador de armado juega de enganche. Si tu figura es un extremo o un nueve, quizás te convenga otro dibujo.'] },
      { heading: 'Qué le pide al delantero', body: ['Con un solo punta, el delantero tiene que aguantar la pelota, definir bien y no perderse en el área. Si tu nueve es muy goleador pero poco participativo, los tres de atrás lo van a tener que asistir seguido.', 'Si tu plantel tiene dos delanteros de nivel parecido, mejor un 4-4-2: sentar a uno de los dos por el dibujo es desperdiciar talento.'] },
      { heading: 'Cuándo conviene', body: ['Es un buen dibujo contra rivales que atacan con dos o tres jugadores, porque tus dos pivotes tapan el medio. También funciona cuando tenés mediocampistas de buen nivel y pocos delanteros: llenás el medio y le pedís al nueve que haga la diferencia.', 'Si vas perdiendo, podés subir la presión y pedirle a los dos pivotes que se adelanten; si vas ganando, bajá la línea y dejá que los dos de contención cierren el partido.'] },
      { heading: 'Errores comunes', body: ['El más frecuente es poner a un delantero de enganche porque "juega cerca del área". El puesto pide visión y pase, no solo gol. Otro es descuidar el físico de los extremos: recorren mucho y se cansan antes, así que conviene rotarlos en las semanas con varios partidos.'] }
    ],
    related: ['/guias/formacion-4-4-2', '/guias/formacion-4-3-3', '/guias/formacion-5-3-2', '/demo']
  }),
  guide({
    path: '/guias/formacion-5-3-2',
    label: 'Formación 5-3-2',
    title: 'Formación 5-3-2: cómo defender y salir de contra | Vestuario',
    description: 'Cuándo usar el 5-3-2 en Vestuario, cómo cerrar el partido con cinco defensores y cómo salir rápido con dos delanteros.',
    h1: 'Formación 5-3-2: el candado y la contra',
    intro: 'El 5-3-2 es el dibujo de los equipos que quieren no perder antes de ganar: tres centrales, dos carrileros, tres volantes y dos delanteros. Es ideal para defender un resultado o para jugar de visitante contra un rival más fuerte.',
    sections: [
      { heading: 'Cómo se arma', body: ['Tres defensores centrales en el fondo, un lateral por cada lado que sube y baja por la banda, tres mediocampistas por el centro y dos delanteros. En la pizarra de Vestuario los laterales quedan más adelantados que en una línea de cuatro, para que puedan colaborar en las dos zonas.', 'La clave está en los carrileros: si no tienen resistencia, el equipo queda con cinco en el fondo y poco contacto con los delanteros.'] },
      { heading: 'Cuándo conviene', body: ['Es la mejor opción cuando el rival es claramente superior, cuando jugás de visitante o cuando querés cuidar una ventaja en los últimos partidos de la temporada. Con tres centrales es difícil que te lastimen por el medio.', 'También sirve si tenés defensores buenos y delanteros rápidos: cerrás atrás y salís de contra con los dos de arriba.'] },
      { heading: 'La salida de contra', body: ['Con este dibujo conviene ritmo alto y pases directos cuando recuperás la pelota. Los tres del medio tienen que sacarla rápido hacia los delanteros, que esperan arriba para correr al espacio.', 'Si tus delanteros son lentos o cuesta que lleguen al área, el 5-3-2 se vuelve pasivo: defendés muy bien y no generás nada.'] },
      { heading: 'Sus puntos débiles', body: ['Cede la iniciativa. Contra un rival que se mete atrás, vas a tener la pelota y poca gente para atacar. Y si un carrilero se lesiona, el reemplazo suele jugar peor en el puesto, así que tené siempre un suplente preparado.', 'Otro detalle: pasar de cuatro a cinco defensores no te garantiza no recibir goles. Si los volantes no recuperan, los centrales quedan muy exigidos.'] },
      { heading: 'Cómo cambiar durante el partido', body: ['Un buen truco es arrancar con cinco atrás y, si vas ganando, mantener el dibujo hasta el final. Si estás perdiendo, pasá a un 4-3-3 o a un 3-4-3 para sumar gente al ataque. Los cambios dentro del partido también cuentan: un lateral fresco o un delantero de recambio pueden dar vuelta la historia.'] }
    ],
    related: ['/guias/formacion-4-2-3-1', '/guias/formacion-4-4-2', '/tacticas', '/demo']
  }),
  guide({
    path: '/guias/cantera-y-juveniles',
    label: 'Cantera y juveniles',
    title: 'Cantera y juveniles: formá jugadores propios | Vestuario',
    description: 'Cómo sacarle provecho a la cantera en Vestuario: academia, juveniles, cuándo promoverlos al primer equipo y cuándo venderlos.',
    h1: 'Cantera: cómo formar a tus propios jugadores',
    intro: 'Con la plata justa, formar es más barato que comprar. La cantera te da juveniles que pueden convertirse en titulares, en ídolos o en una buena venta. Esta guía explica cómo aprovecharla.',
    sections: [
      { heading: 'Cómo funciona', body: ['Cada temporada aparece una nueva camada de juveniles en las divisiones inferiores del club. Algunos son promesas y otros no llegan a nada, pero siempre te sirven para completar el plantel sin gastar en el mercado.', 'Los juveniles ocupan menos espacio en el tope salarial que un jugador comprado, y eso te deja margen para otras contrataciones.'] },
      { heading: 'Mejorar la academia', body: ['Las instalaciones de la academia influyen en la calidad de la camada. Si tu proyecto es largo, invertir ahí rinde con el tiempo: los chicos salen mejores y vas a necesitar menos fichajes.', 'Es una inversión a largo plazo. No esperes resultados la semana siguiente: la diferencia se nota en las temporadas siguientes.'] },
      { heading: 'Cuándo promover a un juvenil', body: ['Cuando su nivel alcanza para competir por un puesto, subilo al primer equipo. También podés usarlo de apoyo si te falta gente por lesiones o suspensiones; los minutos ayudan a que crezca.', 'No lo subas demasiado pronto: un chico que juega muy por encima de su nivel puede perder confianza y rendir menos de lo esperado.'] },
      { heading: 'Crecimiento y edad', body: ['Los jugadores jóvenes mejoran con minutos y entrenamiento, y los veteranos con los años empiezan a bajar. Por eso conviene mirar la edad del plantel y planificar el recambio antes de que sea una urgencia.', 'Un equipo lleno de veteranos rinde hoy pero se desarma en dos años; uno con buena mezcla dura mucho más.'] },
      { heading: 'Cantera y finanzas', body: ['Un juvenil que se destaca puede venderse a buen precio y ayudar a equilibrar la caja. Si el club está ajustado, esa venta puede ser la diferencia entre fichar o no. Pero ojo: vender a todos los buenos te deja sin recambio. El equilibrio es parte del trabajo del DT.'] }
    ],
    related: ['/cantera', '/guias/como-fichar-jugadores', '/guias/finanzas-del-club', '/demo']
  }),
  guide({
    path: '/guias/pelota-parada-y-penales',
    label: 'Pelota parada y penales',
    title: 'Pelota parada y penales: cómo sacarles provecho | Vestuario',
    description: 'Consejos de Vestuario para córners, tiros libres y penales: elegir al especialista, preparar la semana y decidir en los momentos clave.',
    h1: 'Pelota parada y penales: los partidos se deciden ahí',
    intro: 'En los partidos parejos, un córner bien ejecutado o un penal convertido valen una temporada. Estas jugadas dependen de quién las ejecuta y de cómo decidas prepararlas.',
    sections: [
      { heading: 'Por qué importan', body: ['Muchos partidos se definen por una jugada aislada. Un equipo que defiende bien y ataca regular puede ganar si convierte sus pelotas paradas, y uno muy ofensivo puede perder si las defiende mal.', 'Por eso conviene prestarles atención aunque no sean la parte más vistosa del juego.'] },
      { heading: 'Elegir al especialista', body: ['En la pizarra podés elegir quién ejecuta las pelotas paradas. No siempre el mejor jugador del equipo es el mejor pateador: mirá quién tiene buena técnica y sangre fría.', 'Revisá también el estado de ese jugador. Si está cansado o no está en su mejor momento, quizás convenga cambiar de ejecutor para ese partido.'] },
      { heading: 'Los penales', body: ['Un penal es un duelo entre el pateador y el arquero. Cuando te toca decidir en un momento clave, la fuerza y la dirección importan: ir muy fuerte aumenta el riesgo de errar, ir muy suave le da chances al arquero.', 'Probá en la demo del juego cómo se siente: es una buena forma de practicar antes de una situación importante.'] },
      { heading: 'Defender la pelota parada', body: ['No se trata solo de patear bien: también hay que defender. Los defensores altos y fuertes ayudan en los córners del rival, y un buen arquero puede evitar goles en jugadas de peligro.', 'Si recibís muchos goles de pelota parada, revisá la altura y el nivel de tus centrales antes de pensar en cambiar todo el dibujo.'] },
      { heading: 'Preparar la semana', body: ['El entrenamiento influye en cómo llega el equipo al partido. Un plantel descansado y concentrado resuelve mejor las jugadas aisladas que uno agotado. Antes de un partido importante, cuidá la carga física y los nervios, y tené claro quién patea qué.'] }
    ],
    related: ['/guias/formacion-4-4-2', '/guias/entrenamiento-y-lesiones', '/tacticas', '/demo']
  }),
  guide({
    path: '/guias/prensa-y-dirigencia',
    label: 'Prensa y dirigencia',
    title: 'Prensa y dirigencia: cómo manejar al club | Vestuario',
    description: 'Cómo tratar con la dirigencia, la hinchada y la prensa en Vestuario para sostener tu proyecto sin que te echen a la primera derrota.',
    h1: 'Prensa y dirigencia: sobrevivir en el cargo',
    intro: 'Ganar partidos es solo una parte del trabajo. Un DT que se lleva mal con la dirigencia o con la hinchada dura poco, aunque el equipo juegue bien. Esta guía te explica cómo cuidar esas relaciones.',
    sections: [
      { heading: 'Los cuatro medidores', body: ['Todo lo que decidís mueve cuatro cosas: la caja del club, la barra, la dirigencia y el vestuario. Una decisión puede mejorar una y empeorar otra, así que conviene mirar el conjunto antes de elegir.', 'Un club con la caja vacía pero la hinchada contenta aguanta más que uno con plata y todos enojados.'] },
      { heading: 'La dirigencia y los objetivos', body: ['La dirigencia te fija objetivos al comenzar la temporada. Si no los cumplís, pierde la paciencia, y en el peor caso te despide. Revisá siempre qué te piden y cuánto margen tenés.', 'Si el objetivo es ambicioso para tu plantel, conviene hablar con claridad desde el principio y sumar refuerzos antes de que sea tarde.'] },
      { heading: 'La conferencia de prensa', body: ['Lo que decís en la sala de prensa tiene consecuencias. Elogiar al plantel levanta al vestuario; criticar a un dirigente puede traerte problemas. Hay respuestas que gustan y respuestas que te cuestan, así que pensá antes de contestar.', 'A veces la mejor opción es la más prudente: no prometer lo que no podés cumplir.'] },
      { heading: 'La hinchada y la barra', body: ['La barra puede ser un aliado o un dolor de cabeza. Cada pedido es una decisión: aceptar mejora el humor de la hinchada pero puede salir caro; rechazar te cuida de otros problemas pero genera tensión.', 'No hay una única respuesta correcta: depende de cómo esté tu club y de qué tanto necesites su apoyo en ese momento.'] },
      { heading: 'Cómo no perder el cargo', body: ['Los buenos resultados lo resuelven casi todo, pero cuando vienen mal conviene tener algo en el banco: un vestuario unido, una dirigencia tranquila o una hinchada que te banque. Cuidá los cuatro medidores y vas a tener margen para atravesar una mala racha.'] }
    ],
    related: ['/guias/finanzas-del-club', '/guias/simulador-de-futbol-argentino', '/juego', '/demo']
  }),
  guide({
    path: '/guias/copas-y-torneos',
    label: 'Copas y torneos',
    title: 'Copas y torneos: cómo planificar la temporada | Vestuario',
    description: 'Cómo se juegan las copas y los torneos en Vestuario: liga, copa continental, premios y cómo repartir el plantel para llegar bien a todo.',
    h1: 'Copas y torneos: cómo planificar la temporada',
    intro: 'La temporada no es solo la liga. Las copas dan prestigio y premios, pero también cansan al plantel. Aprender a repartir las energías es parte del trabajo del DT.',
    sections: [
      { heading: 'La liga, tu base', body: ['La liga es el torneo que define el año: ahí se juegan los ascensos y los descensos. Cada categoría tiene veinte equipos, y los puestos de arriba y de abajo de la tabla tienen consecuencias claras.', 'Mantené la liga como prioridad: un buen año en la copa no compensa un descenso.'] },
      { heading: 'La copa continental', body: ['Es un torneo internacional de clubes que se juega aparte de la liga. Los partidos que te tocan aparecen cuando llega su fecha y se juegan igual que los de liga.', 'Dan prestigio y premios extra, que pueden ser una ayuda importante para la caja del club.'] },
      { heading: 'Cuidar al plantel', body: ['Más partidos significan más cansancio y más riesgo de lesiones. Si jugás varias competencias, rotá a los titulares y usá el entrenamiento para recuperar.', 'Un plantel corto sufre mucho en las semanas con muchos partidos. Tener un banco de nivel parecido te permite descansar a las figuras sin perder tanto.'] },
      { heading: 'El calendario', body: ['Mirá siempre qué partidos vienen y contra quién. Si tenés una semana complicada, quizás convenga mandar suplentes a un partido menos importante y guardar a los mejores para el que más pesa.', 'El calendario del juego te muestra las fechas y si jugás de local o de visitante, algo que también influye en la caja.'] },
      { heading: 'Los premios', body: ['Avanzar en una copa trae dinero y reputación. Con ese dinero podés reforzar el plantel o mejorar las instalaciones. Por eso, aunque no sea tu prioridad, conviene tomarse en serio las rondas importantes cuando el plantel está sano.', 'Una regla simple para empezar: en la liga jugá con tu mejor equipo, en las copas rotá cuando el cansancio apriete y no te obsesiones con un torneo si eso te cuesta puntos donde más importa. Con los años vas a encontrar tu propio equilibrio.'] }
    ],
    related: ['/guias/como-ascender-de-categoria', '/guias/entrenamiento-y-lesiones', '/guias/liga-con-amigos', '/demo']
  })
]
