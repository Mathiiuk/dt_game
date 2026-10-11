/**
 * Compartir el resultado de un partido: el texto y el enlace. Siempre desde el club propio, sin datos personales:
 * el enlace lleva a la demo (para que quien lo reciba pruebe sin registrarse) marcado como origen "share".
 */
import { SITE } from '../data/site'

export const outcomeOf = (mine, theirs) => (mine > theirs ? 'win' : mine < theirs ? 'loss' : 'draw')

export const shareUrl = () => `${SITE.url}/demo?utm_source=share&utm_medium=match`

const LEAD = { win: '¡Ganamos en Vestuario!', draw: 'Empate peleado en Vestuario.', loss: 'Perdimos en Vestuario, pero el DT no se va.' }

/** Texto para mandar por WhatsApp, redes o portapapeles */
export function shareText({ club, rival, mine, theirs }) {
  const line = `${club || 'Mi club'} ${mine} - ${theirs} ${rival || 'El rival'}`
  return `${LEAD[outcomeOf(mine, theirs)]} ${line}. ¿Te animás a dirigir? Probalo gratis: ${shareUrl()}`
}
