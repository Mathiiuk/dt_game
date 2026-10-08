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

/** Una nota táctica sobre cómo juega el rival: una para el primer tiempo y otra para el segundo */
export const STYLE_NOTES = {
  CROSSERS: ['El rival insiste con los centros: todo el equipo juega pensando en el área.', 'Siguen buscando por arriba: el que defiende el primer palo está ocupadísimo.'],
  LONG_SHOTS: ['El rival patea apenas puede, aunque esté lejos del arco.', 'Siguen probando desde afuera del área: hay que achicar al que va a pegar.'],
  COUNTER: ['El rival se mete atrás y espera el error para salir de contra.', 'Cada pelota perdida es una salida rápida del rival: ojo con la espalda de los laterales.'],
  POSSESSION: ['El rival se queda con la pelota y te hace correr.', 'El toque del rival no se corta: hay que tener paciencia para recuperarla.'],
  ROUGH: ['El rival juega fuerte: cada pelota dividida es una pelea.', 'El árbitro ya tiene la libreta a mano: el rival no afloja en los cruces.']
}

/** Frase para una jugada ('' si el estilo no tiene para ese tipo de jugada) */
export const styleQuipFor = (styleId, kind, rng = Math.random) => {
  const list = STYLE_QUIPS[styleId]?.[kind]
  return list?.length ? list[Math.floor(rng() * list.length)] : ''
}

/** Nota táctica del estilo: `half` 0 = primer tiempo, 1 = segundo */
export const styleNoteFor = (styleId, half = 0) => {
  const list = STYLE_NOTES[styleId] || []
  return list[Math.min(half, list.length - 1)] || ''
}
