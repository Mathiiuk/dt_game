// Lectura del ojeador: lo que un informe te diría además de los números. Funciones puras.
import { valueOfPlayer } from './valuation'

const level = (p) => Number(p?.attr_overall ?? p?.overall ?? 0)

/**
 * @param {{ player: object, squad?: object[], price?: number }} p  `price` es lo que pide el club por el jugador
 * @returns {Array<{ tone: 'good' | 'warn' | 'neutral', text: string }>}
 */
export function scoutInsights({ player, squad = [], price = 0 } = {}) {
  if (!player) return []
  const lines = []
  const mine = level(player)

  // 1. Qué le aporta a tu plantel en su puesto
  const sameSpot = squad.filter(s => s.position === player.position)
  if (sameSpot.length === 0) {
    lines.push({ tone: 'good', text: `Cubre un puesto sin titular en tu plantel (${player.position}).` })
  } else {
    const best = Math.max(...sameSpot.map(level))
    const diff = mine - best
    if (diff > 0) lines.push({ tone: 'good', text: `Mejoraría a tu mejor ${player.position} (+${diff}).` })
    else if (diff === 0) lines.push({ tone: 'neutral', text: `Compite de igual a igual con tu mejor ${player.position}.` })
    else lines.push({ tone: 'warn', text: `No mejora a tu mejor ${player.position} (${diff}): sería suplente.` })
  }

  // 2. Si el precio es justo frente a lo que vale
  if (price > 0) {
    const value = valueOfPlayer(player)
    const ratio = price / Math.max(1, value)
    if (ratio <= 0.85) lines.push({ tone: 'good', text: `Está barato: pide ${Math.round((1 - ratio) * 100)}% menos que su valor de mercado.` })
    else if (ratio >= 1.15) lines.push({ tone: 'warn', text: `Está caro: pide ${Math.round((ratio - 1) * 100)}% más que su valor de mercado.` })
    else lines.push({ tone: 'neutral', text: 'El precio es acorde a su valor de mercado.' })
  }

  // 3. Perfil de edad y potencial
  const age = Number(player.age || 25)
  const potential = Number(player.attr_potential ?? 0)
  if (age <= 21 && potential - mine >= 8) lines.push({ tone: 'good', text: `Joven con margen: puede crecer hasta ${potential}.` })
  else if (age >= 31) lines.push({ tone: 'neutral', text: 'Veterano: rinde hoy, pero con poca reventa.' })

  return lines
}
