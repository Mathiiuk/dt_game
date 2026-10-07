// Nombre de cada categoría y qué le espera al club al cerrar la temporada según su puesto.
// La escala de premios y el ascenso los liquida la base (`settle_season_prize`); esto es solo para mostrarlos antes del cierre.
import { movementOf, wageFactorFor } from './pyramid'

const NAMES = {
  1: 'Primera División',
  2: 'Primera B Nacional',
  3: 'Primera B Metropolitana',
  4: 'Primera C',
  5: 'Torneo Regional Amateur'
}

export const divisionName = (tier) => {
  if (tier === undefined || tier === null) return NAMES[5]
  return NAMES[tier] || `División ${tier}`
}

const prizeFor = (pos) => (pos === 1 ? 12000 : pos === 2 ? 8000 : pos <= 6 ? 5000 : pos <= 17 ? 2500 : 1000)

export const seasonOutlook = (position, tier = 5) => {
  if (!position) return null
  const movement = movementOf(position, tier)
  return {
    position,
    prize: prizeFor(position),
    movement,
    promoted: movement === 'PROMOTED',
    relegated: movement === 'RELEGATED',
    wageChangePct: Math.round((wageFactorFor(movement) - 1) * 100)
  }
}
