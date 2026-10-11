// Novedades del juego, de la más nueva a la más vieja. Cada entrada se muestra UNA vez a cada persona después de actualizar.
// Para sumar una: agregarla arriba con un `id` nuevo, la fecha (AAAA-MM-DD) y frases cortas (máximo 140 caracteres).
export const CHANGELOG = [
  {
    id: '2026-10-19-pizarra-linea',
    date: '2026-10-19',
    title: 'Pizarra más quieta',
    items: [
      'Los datos de arriba van en una sola línea.',
      'Al tocar una ficha, “Cambiar jugador” aparece en esa misma línea: la pizarra ya no se mueve ni hace scroll.'
    ]
  },
  {
    id: '2026-10-18-dias-reales',
    date: '2026-10-18',
    title: 'Días reales y ayuda en la pizarra',
    items: [
      'Al avanzar la semana ves los días con su fecha real y, al final, cuándo es tu próximo partido.',
      'En la pizarra del celular, tocá el “?” para ver cómo se usa y qué significa cada color y símbolo.'
    ]
  },
  {
    id: '2026-10-17-rapido',
    date: '2026-10-17',
    title: 'Más rápido y con conexión mala',
    items: [
      'Abre más rápido, sobre todo con señal floja.',
      'Sin internet podés mirar tu club (solo lectura); guardar y jugar vuelven al reconectar.',
      'Si la conexión va lenta, te lo avisamos en vez de dejarte esperando.'
    ]
  },
  {
    id: '2026-10-16-tarjetas',
    date: '2026-10-16',
    title: 'Tarjetas y suspensiones',
    items: [
      'Una roja o la quinta amarilla de la temporada te deja afuera del próximo partido.',
      'En la pizarra: cruz roja si está lesionado, tarjeta roja si lo expulsaron y tarjeta amarilla si está suspendido por amarillas.',
      'Las fichas del celular ya no se pisan entre sí.'
    ]
  },
  {
    id: '2026-10-15-semana',
    date: '2026-10-15',
    title: 'La semana pasa',
    items: [
      'Al avanzar la semana ves cómo pasan los días mientras el club trabaja.',
      'Al terminar, un resumen corto: qué pasó con la caja y las altas médicas.'
    ]
  },
  {
    id: '2026-10-14-avisos',
    date: '2026-10-14',
    title: 'Avisos en tu celular',
    items: [
      'Activalos en "Más" para enterarte cuando se juega una fecha de tu sala o si te falta el planteo.',
      'Elegís qué avisos recibir y los podés apagar cuando quieras.',
      'En iPhone funcionan con el juego instalado en la pantalla de inicio.'
    ]
  },
  {
    id: '2026-10-13-movil-y-lesiones',
    date: '2026-10-13',
    title: 'Pizarra y lesiones, a tu medida',
    items: [
      'La pizarra del celular entra en una sola pantalla y no se mueve nada sin querer.',
      'Hay menos lesiones: ahora dependen del cansancio, el ritmo y la presión.',
      'Las actualizaciones nuevas se instalan al cambiar de sección, nunca en medio de un partido.'
    ]
  },
  {
    id: '2026-10-12-amigos',
    date: '2026-10-12',
    title: 'Sala de amigos con planteos y prode',
    items: [
      'Cada fecha tiene plazo: elegí tu planteo y pronosticá los partidos.',
      'Tocá un resultado para leer el relato del partido.',
      'Nueva Copa Mundial para jugar con amigos.'
    ]
  }
]

export const newestId = () => CHANGELOG[0]?.id || null

/** Las novedades que la persona todavía no vio (si nunca vio ninguna o el último que vio ya no existe, todas) */
export function unseenEntries(list, lastSeenId) {
  const at = list.findIndex(e => e.id === lastSeenId)
  return at === -1 ? list : list.slice(0, at)
}
