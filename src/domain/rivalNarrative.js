/**
 * Relato según cómo juega el rival: frases que se suman al final de la línea de una jugada (el resultado no cambia).
 * Cada estilo (ver rivalStyle.js) tiene las suyas por tipo de jugada. Funciones puras.
 */

export const STYLE_QUIPS = {
  CROSSERS: {
    GOAL: ['Centro al área, cabezazo y gol: el plan de siempre de estos centradores.', 'Lo vienen buscando por arriba desde el primer minuto y les salió.'],
    SAVE: ['Otro centro peligroso y otra vez tuvo que aparecer el arquero.', 'Pelota cruzada al área y el arquero se la quita de la cabeza al delantero.'],
    MISS: ['Centro, cabezazo, afuera: una más del manual de los centradores.', 'Otro centro más al área que no termina en nada.'],
    CORNER: ['Otro córner: estos no saben jugar sin tirar la pelota al área.', 'Y van otra vez con el centro. Es lo único que saben hacer, pero lo hacen bien.']
  },
  LONG_SHOTS: {
    GOAL: ['¡De media distancia! Por fin les salió uno de esos zapatazos.', 'Le pegó de lejos, con toda, y entró: así juegan estos.'],
    SAVE: ['Le pegó de treinta metros y el arquero lo sacó con las dos manos.', 'Otro zapatazo de afuera y otra vez el arquero respondió.'],
    MISS: ['Otro zapatazo de afuera del área: estos patean desde el colectivo.', 'Le pegó de lejos y la mandó a la tribuna, como siempre.'],
    CORNER: ['Zapatazo de afuera, rebote y córner.']
  },
  COUNTER: {
    GOAL: ['Salida rápida y fulminante: así juegan los contragolpeadores.', 'Esperaron atrás, salieron en dos toques y la clavaron.'],
    SAVE: ['Salieron de contra y casi la clavan: peligrosísimos.', 'Tres toques y un remate: el arquero evitó el golpe.'],
    MISS: ['Salieron de contra, pero llegaron cansados al final.', 'Contragolpe perfecto y definición pésima.'],
    CORNER: ['Un contragolpe que termina en córner: ahora sí hay que volver rápido.']
  },
  POSSESSION: {
    GOAL: ['Tocaron, tocaron y tocaron hasta que la metieron.', 'Pase tras pase y al final, gol: paciencia de relojero.'],
    SAVE: ['Tanto toque para que el arquero lo ataje con tranquilidad.', 'Armaron la jugada con diez pases y el arquero la sacó.'],
    MISS: ['Tanto toque para terminar desviándola.', 'Una posesión larguísima que se apaga con un disparo afuera.'],
    CORNER: ['Lo ahogaron con el toque y termina en córner.']
  },
  ROUGH: {
    GOAL: ['Gol de los que juegan fuerte; encima tienen puntería.', 'Duros atrás, pero acá hubo fútbol: gol.'],
    SAVE: ['Entran fuerte y encima rematan: el arquero lo sacó.'],
    MISS: ['Se les va por arriba, igual que la pierna dura en cada pelota dividida.'],
    CORNER: ['Córner tras otra pelota dividida bien fuerte.'],
    YELLOW: ['Los duros, fieles a su estilo: entrada fuerte y a la libreta.', 'Otra amarilla para un equipo que juega al límite.'],
    RED: ['Era cuestión de tiempo: a fuerza de entrar así, alguien se iba a ir.']
  }
}

// Pelotas paradas y penales: se suman a las frases de arriba
const EXTRA_QUIPS = {
  "CROSSERS": {
    "SETPIECE_CORNER": [
      "Ya se acomodan todos en el área: lo único que saben hacer es esto."
    ],
    "SETPIECE_FK": [
      "Lo van a colgar al área, seguro: no tienen otro plan."
    ],
    "PENALTY": [
      "Los centradores consiguen el penal por tanto insistir con el centro."
    ],
    "PENALTY_GOAL": [
      "Penal convertido: para variar, vino de un centro al área."
    ],
    "PENALTY_MISS": [
      "Se les escapó el penal: no es una pelota que puedan cruzar al área."
    ],
    "FK_GOAL": [
      "Tiro libre colgado, desvío y gol: de manual de centradores."
    ],
    "FK_SAVE": [
      "Otro envío al área que el arquero logra controlar."
    ],
    "FK_MISS": [
      "El centro del tiro libre se va por encima de todos."
    ]
  },
  "LONG_SHOTS": {
    "SETPIECE_CORNER": [
      "Ojo que si despejan, ya hay un par esperando para sacarle el cuero a la pelota."
    ],
    "SETPIECE_FK": [
      "Para estos, un tiro libre es una excusa para pegarle con todo."
    ],
    "PENALTY": [
      "Penal a favor de los pegadores: hasta acá llegaron remates de todos los colores."
    ],
    "PENALTY_GOAL": [
      "Entró de pura potencia, como todo lo que hacen estos."
    ],
    "PENALTY_MISS": [
      "Le pegó con tanta fuerza que se la llevó el viento."
    ],
    "FK_GOAL": [
      "¡Zapatazo de tiro libre! Estos entrenan pegarle de lejos."
    ],
    "FK_SAVE": [
      "El tiro libre llegó con una violencia bárbara y el arquero lo sacó."
    ],
    "FK_MISS": [
      "Le pegó con toda y la mandó a la tercera bandeja."
    ]
  },
  "COUNTER": {
    "SETPIECE_CORNER": [
      "Ojo con el despeje: dos de ellos se quedaron esperando afuera del área."
    ],
    "SETPIECE_FK": [
      "Mucho cuidado: si pierden la pelota, los contragolpeadores ya saben dónde está el espacio."
    ],
    "PENALTY": [
      "Del contragolpe, penal: a los contragolpeadores les alcanza con una sola jugada."
    ],
    "PENALTY_GOAL": [
      "Una sola llegada, un solo penal y un solo gol: así de eficaces."
    ],
    "PENALTY_MISS": [
      "Esperaron todo el partido y se les escapó el penal."
    ],
    "FK_GOAL": [
      "Un tiro libre y a festejar: los contragolpeadores no necesitan más."
    ],
    "FK_SAVE": [
      "Salvó el arquero: era la única que habían tenido en un rato largo."
    ],
    "FK_MISS": [
      "Se queda sin recompensa la espera de los contragolpeadores."
    ]
  },
  "POSSESSION": {
    "SETPIECE_CORNER": [
      "Lo cobran cortito, con calma: no tienen apuro, tienen la pelota."
    ],
    "SETPIECE_FK": [
      "Se juntan a charlar la jugada: estos planean hasta los tiros libres."
    ],
    "PENALTY": [
      "Tanto toque terminó en penal: la paciencia tiene premio."
    ],
    "PENALTY_GOAL": [
      "Penal convertido sin apuro y con mucho estilo."
    ],
    "PENALTY_MISS": [
      "Tanto trabajo para fallar el penal: se les nubla la cara."
    ],
    "FK_GOAL": [
      "Tiro libre ensayado: tocaron dos veces y la metieron."
    ],
    "FK_SAVE": [
      "Lo sacó el arquero: nada que se parezca a lo que habían ensayado."
    ],
    "FK_MISS": [
      "La jugada ensayada se les desarmó al final."
    ]
  },
  "ROUGH": {
    "SETPIECE_CORNER": [
      "Van todos al área con los codos afuera."
    ],
    "SETPIECE_FK": [
      "Nada de sutilezas: el tiro libre lo cobra uno al que no se le tiembla el pulso."
    ],
    "PENALTY": [
      "Los duros consiguen un penal de los que se protestan."
    ],
    "PENALTY_GOAL": [
      "Penal convertido con la misma fuerza con la que juegan toda la tarde."
    ],
    "PENALTY_MISS": [
      "Le pegó tan fuerte que la sacó del estadio."
    ],
    "FK_GOAL": [
      "Tiro libre y gol: el que patea es tan duro como el resto."
    ],
    "FK_SAVE": [
      "Paró el arquero: ni así lo pudieron abollar."
    ],
    "FK_MISS": [
      "Se va por arriba: igual que las patadas que reparten."
    ]
  }
}
for (const [id, kinds] of Object.entries(EXTRA_QUIPS)) STYLE_QUIPS[id] = { ...STYLE_QUIPS[id], ...kinds }

/** Frase para una jugada ('' si el estilo no tiene para ese tipo de jugada) */
export const styleQuipFor = (styleId, kind, rng = Math.random) => {
  const list = STYLE_QUIPS[styleId]?.[kind]
  return list?.length ? list[Math.floor(rng() * list.length)] : ''
}
