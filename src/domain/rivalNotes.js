/**
 * Notas tácticas del rival que cambian con el marcador. A los 20, 65 y 80 minutos el relato comenta cómo está jugando el rival
 * según su estilo (ver rivalStyle.js) y si va ganando, perdiendo o empatando. Funciones puras.
 */

export const NOTE_MINUTES = [20, 65, 80]

/** Situación del equipo del estilo: va ganando (LEADING), perdiendo (TRAILING) o empatando (LEVEL) */
export const situationOf = (own, other) => (own > other ? 'LEADING' : own < other ? 'TRAILING' : 'LEVEL')

// Cada situación trae tres líneas: minuto 20, minuto 65 y minuto 80 (el final del partido)
export const NOTES_BY_SITUATION = {
  CROSSERS: {
    LEVEL: ['El rival insiste con los centros: todo el equipo juega pensando en el área.', 'Siguen buscando por arriba: el primer palo está ocupadísimo.', 'Todo al centro al área en los últimos minutos: no tienen otra idea.'],
    LEADING: ['El rival ya mete la pelota en el área y se acomoda con ventaja.', 'Van ganando y siguen colgando centros para no sufrir.', 'Ganan, y cada pelota termina en un centro al área para ganar tiempo.'],
    TRAILING: ['El rival va perdiendo y tira centros desde donde pueda.', 'Pierden y se tiran con todos al área: centro tras centro.', 'Se juegan todo a un centro: hasta el arquero rival subió al área.']
  },
  LONG_SHOTS: {
    LEVEL: ['El rival patea apenas puede, aunque esté lejos del arco.', 'Siguen probando desde afuera del área: hay que achicar al que va a pegar.', 'A estas alturas todo se define de un zapatazo: cuidado con los remates de lejos.'],
    LEADING: ['Van ganando y encima se animan a patear de lejos sin presión.', 'Con ventaja, pegan de afuera sin apuro: cualquier rebote es un riesgo.', 'Ganan y siguen probando de afuera: es su forma de cerrar el partido.'],
    TRAILING: ['Pierden y empiezan a probar de lejos para empatar rápido.', 'Van perdiendo y le pegan de donde sea: cada pelota es un zapatazo.', 'Pierden y le pegan de cualquier distancia: se juegan todo a un remate lejano.']
  },
  COUNTER: {
    LEVEL: ['El rival se mete atrás y espera el error para salir de contra.', 'Cada pelota perdida es una salida rápida del rival: ojo con la espalda de los laterales.', 'Con el partido abierto, los contragolpeadores huelen sangre: cuidado con cada pérdida.'],
    LEADING: ['Van ganando y se meten todavía más atrás: te dejan la pelota y esperan.', 'Con ventaja, solo salen de contra: no te dejan un solo espacio.', 'Ganan y se encierran: esperan el error para liquidarlo de contra.'],
    TRAILING: ['Pierden y ahora tienen que salir: el rival se anima a adelantar las líneas.', 'Pierden y ya no se cierran tanto: hay más espacios para los dos.', 'Se juegan el todo por el todo: ahora salen con todos y dejan espacios atrás.']
  },
  POSSESSION: {
    LEVEL: ['El rival se queda con la pelota y te hace correr.', 'El toque del rival no se corta: hay que tener paciencia para recuperarla.', 'Siguen tocando y tocando: el reloj pasa y todavía no pasó nada.'],
    LEADING: ['Van ganando y se guardan la pelota: te hacen correr en vano.', 'Con ventaja, el rival se queda con la pelota y el reloj corre.', 'Ganan y la pelota no sale de sus pies: el tiempo está de su lado.'],
    TRAILING: ['Pierden y siguen tocando, pero ahora con más vértigo para llegar al área.', 'Pierden y aceleran el toque: la paciencia se les va acabando.', 'Pierden y juntan a todo el equipo en tu campo: toque y más toque, buscando el hueco.']
  },
  ROUGH: {
    LEVEL: ['El rival juega fuerte: cada pelota dividida es una pelea.', 'El árbitro ya tiene la libreta a mano: el rival no afloja en los cruces.', 'Se les nota el cansancio y las patadas se hacen más pesadas.'],
    LEADING: ['Van ganando y juegan con la pierna fuerte para cortar el ritmo.', 'Con ventaja, cortan el juego a patadas y el árbitro ya no los controla.', 'Ganan y cortan cada jugada con una falta: quieren que se termine ya.'],
    TRAILING: ['Pierden y entran con más bronca de la cuenta en cada cruce.', 'Pierden y se les va la mano: están al borde de la tarjeta en cada pelota.', 'Pierden y juegan al límite del reglamento: cada falta puede ser roja.']
  }
}

/**
 * Nota táctica del rival para un minuto y un marcador.
 * @param {string} styleId id del estilo (CROSSERS, LONG_SHOTS...)
 * @param {number} minute 20, 65 u 80
 * @param {number} own goles del equipo con ese estilo
 * @param {number} other goles de su rival
 * @returns {string} la nota, o '' si no corresponde
 */
export function tacticalNote(styleId, minute, own, other) {
  const idx = NOTE_MINUTES.indexOf(minute)
  if (idx === -1) return ''
  const pool = NOTES_BY_SITUATION[styleId]?.[situationOf(own, other)]
  return pool?.[idx] || ''
}
