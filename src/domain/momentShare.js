/**
 * Momentos para compartir (campeonato, ascenso, fichaje, balance de la temporada): el texto y los datos de la tarjeta.
 * Siempre del club propio y sin datos personales; el enlace lleva a la demo, marcado con el tipo de momento.
 */
import { SITE } from '../data/site'
import { formatMoney } from '../lib/format'

export const momentUrl = (kind) => `${SITE.url}/demo?utm_source=share&utm_medium=${kind}`

const withPosition = (n) => (n ? `${n}º` : '—')

const BUILDERS = {
  champion: ({ season }) => ({ headline: '¡CAMPEONES!', big: String(season ?? ''), sub: 'Temporada ganada', tone: 'gold', lead: '¡Somos campeones en Vestuario!' }),
  promotion: ({ tierName }) => ({ headline: '¡ASCENSO!', big: tierName || 'Categoría nueva', sub: 'Subimos de categoría', tone: 'win', lead: '¡Ascendimos en Vestuario!' }),
  signing: ({ player, fee }) => ({ headline: 'NUEVO FICHAJE', big: player || 'Nuevo refuerzo', sub: `Llegó por ${formatMoney(fee || 0)}`, tone: 'win', lead: 'Cerré un fichaje en Vestuario.' }),
  daily: ({ score, rank, players }) => ({ headline: 'RETO DEL DÍA', big: `${score ?? 0} pts`, sub: rank ? `Puesto ${rank} de ${players ?? rank}` : 'Jugué el reto de hoy', tone: 'gold', lead: 'Jugué el reto del día en Vestuario.' }),
  season: ({ season, position, storyHeadline }) => ({ headline: `TEMPORADA ${season ?? ''}`.trim(), big: withPosition(position), sub: storyHeadline || 'Balance del año', tone: 'draw', lead: 'Mi temporada en Vestuario.' })
}

export function momentCard({ kind, club, ...data }) {
  const k = BUILDERS[kind] ? kind : 'season'
  const card = BUILDERS[k](data)
  return {
    kind: k,
    ...card,
    club: club || 'Mi club',
    text: `${card.lead} ${club || 'Mi club'}: ${card.big} (${card.sub}). ¿Te animás a dirigir? Probalo gratis: ${momentUrl(k)}`
  }
}
