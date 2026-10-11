// Novedades del juego, de la más nueva a la más vieja. Cada entrada se muestra UNA vez a cada persona después de actualizar.
// Para sumar una: agregarla arriba con un `id` nuevo, la fecha (AAAA-MM-DD) y frases cortas (máximo 140 caracteres).
export const CHANGELOG = [
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
