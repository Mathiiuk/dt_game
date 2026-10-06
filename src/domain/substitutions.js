/**
 * Cambios de jugadores durante el partido. Funciones puras: validan el cambio y arman el nuevo once.
 * El que entra ocupa el puesto del que sale y rinde según su media en ESE puesto (fuera de posición rinde menos).
 */
import { ratingAtSlot } from './ratings'
import { slotBase } from './positions'
import { isAvailable } from './matchSquad'

export const MAX_SUBSTITUTIONS = 5

const rating = (p) => p.attr_overall || p.overall || 50

/** Suplentes que pueden entrar: aptos, que no están en la cancha ni salieron antes (no se vuelve a entrar). Los mejores primero. */
export function benchOf(players = [], onField = [], subsMade = []) {
  const playing = new Set(onField.map(p => p.id))
  const left = new Set(subsMade.map(s => s.outId))
  const entered = new Set(subsMade.map(s => s.inId))
  return players
    .filter(p => isAvailable(p) && !p.isYouthCallup && !playing.has(p.id) && !left.has(p.id) && !entered.has(p.id))
    .sort((a, b) => rating(b) - rating(a))
}

export const substitutionsLeft = (subsMade = []) => Math.max(0, MAX_SUBSTITUTIONS - subsMade.length)

/**
 * @param {{ onField: Array, players: Array, subsMade: Array<{outId,inId,minute}>, outId: string, inId: string, minute: number }} p
 * @returns {{ ok: true, onField: Array, sub: object } | { ok: false, error: string }}
 */
export function makeSubstitution({ onField = [], players = [], subsMade = [], outId, inId, minute }) {
  if (substitutionsLeft(subsMade) === 0) return { ok: false, error: `Ya hiciste los ${MAX_SUBSTITUTIONS} cambios permitidos.` }
  const out = onField.find(p => p.id === outId)
  if (!out) return { ok: false, error: 'Ese jugador no está en la cancha.' }
  const incoming = benchOf(players, onField, subsMade).find(p => p.id === inId)
  if (!incoming) return { ok: false, error: 'Ese suplente no puede entrar.' }

  const slot = out.slot
  const entered = slot
    ? { ...incoming, slot, slot_base: slotBase(slot), slot_rating: Math.max(1, ratingAtSlot(incoming, slot)) }
    : incoming
  return {
    ok: true,
    onField: onField.map(p => (p.id === outId ? entered : p)),
    sub: { outId, inId, minute, outName: `${out.first_name} ${out.last_name}`.trim(), inName: `${incoming.first_name} ${incoming.last_name}`.trim() }
  }
}

/** Texto para el relato */
export const substitutionText = (sub) => `Cambio en tu equipo: sale ${sub.outName}, entra ${sub.inName}.`
