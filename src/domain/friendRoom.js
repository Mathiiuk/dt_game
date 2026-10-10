/**
 * Liga de amigos: una sala con código donde hasta 10 DT comparan sus carreras y se hacen travesuras de la AFA.
 * Las travesuras solo mueven puntos de la sala y texto del muro (nunca la caja, el plantel ni los resultados de otra cuenta).
 * Funciones puras; el servidor aplica y valida cada travesura (`friend_prank`).
 */
export const MAX_MEMBERS = 10

export const PRANKS = [
  { id: 'SOBRE', name: 'El Sobre', cost: 30, target: 'friend', blurb: 'Le mandás un sobre a un amigo para que pierda puntos. 7 de cada 10 veces sale bien (él pierde 3). Si la AFA te agarra, perdés 5.' },
  { id: 'ARBITRO', name: 'Árbitro amigo', cost: 40, target: 'self', blurb: 'Apostás por un arbitraje a medida: mitad y mitad, ganás 6 puntos o perdés 4. Sin red.' },
  { id: 'MOTE', name: 'El Mote', cost: 10, target: 'friend', needsChoice: true, blurb: 'Le ponés un mote a un amigo en la tabla, para que lo vea toda la sala.' },
  { id: 'DENUNCIA', name: 'La Denuncia', cost: 25, target: 'friend', blurb: 'Denunciás al líder de la sala ante el Tribunal de Disciplina: le sacás 2 puntos. Solo sirve contra el que va primero.' }
]

export const MOTES = [
  'El Cartonero', 'El Comprapibes', 'Don Sobre', 'El Hincha del Tapete', 'El Rey del Penal',
  'El Árbitro de la Casa', 'El Manija', 'Mister Humo', 'El Pecho Frío', 'El Fantasma de la Fecha'
]

export const prankById = (id) => PRANKS.find(p => p.id === id) || null

/** Códigos de invitación: se aceptan con guiones, espacios y minúsculas */
export const normalizeCode = (code) => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '')

export const canAfford = (prank, mangos) => Boolean(prank) && (mangos || 0) >= prank.cost

/** Por qué no se puede hacer la travesura (o null si se puede) */
export function prankBlockReason(prank, { mangos = 0, targetIsMe = false } = {}) {
  if (!prank) return 'Elegí una travesura.'
  if (!canAfford(prank, mangos)) return `Te faltan mangos: cuesta ${prank.cost}.`
  if (prank.target === 'friend' && targetIsMe) return 'Esa travesura es contra un amigo, no a vos mismo.'
  return null
}
