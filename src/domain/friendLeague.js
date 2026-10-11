/**
 * Liga de la sala: el que arma la sala decide cómo es el torneo (equipos, fechas, bots, nivel de los bots y reglamento).
 * Funciones puras; el servidor vuelve a validar y acotar todo (`friend_configure_room`).
 */
import { RULESETS, rulesFor, rulesetName } from './leagueRules'
import { pickRivalClubs } from './rivalClubs'
import { seededRandom } from './cupMatch'
import { cupSizeFor } from './friendCup'

export const DEFAULT_SETTINGS = Object.freeze({ format: 'LIGA', teams: 10, fillBots: true, legs: 2, difficulty: 'PAREJOS', rulesId: 'CLASICO' })

export const FORMATS = { LIGA: 'Liga', COPA: 'Copa Mundial' }

/** Qué tan fuertes son los bots frente al promedio de los clubes de los amigos: [piso, techo] en puntos de fuerza */
export const DIFFICULTIES = {
  FLOJOS: { label: 'Flojos', range: [-8, -1] },
  PAREJOS: { label: 'Parejos', range: [-3, 3] },
  CRACKS: { label: 'Cracks', range: [3, 10] }
}

/** Reglamentos que se pueden usar en una sala: solo los que cambian puntos (las ruedas y los ascensos no aplican acá) */
export const ROOM_RULESETS = RULESETS.filter(r => {
  const x = rulesFor(r.id)
  return x.legs === 2 && x.promoted === 2 && x.relegated === 3
})

const ROOM_RULE_IDS = new Set(['SORTEO', ...ROOM_RULESETS.map(r => r.id)])

export function sanitizeSettings(raw) {
  const s = raw || {}
  const format = s.format === 'COPA' ? 'COPA' : 'LIGA'
  if (format === 'COPA') {
    return {
      format, teams: cupSizeFor(s.teams), fillBots: true, legs: 1,
      difficulty: s.difficulty in DIFFICULTIES ? s.difficulty : DEFAULT_SETTINGS.difficulty, rulesId: DEFAULT_SETTINGS.rulesId
    }
  }
  const teams = Math.min(20, Math.max(4, Math.round(Number(s.teams)) || DEFAULT_SETTINGS.teams))
  return {
    format,
    teams,
    fillBots: s.fillBots === undefined ? DEFAULT_SETTINGS.fillBots : Boolean(s.fillBots),
    legs: Number(s.legs) === 1 ? 1 : 2,
    difficulty: s.difficulty in DIFFICULTIES ? s.difficulty : DEFAULT_SETTINGS.difficulty,
    rulesId: ROOM_RULE_IDS.has(s.rulesId) ? s.rulesId : DEFAULT_SETTINGS.rulesId
  }
}

/** Cantidad de fechas: con equipos impares cada uno descansa una vez */
export const roundsFor = (teams, legs = 2) => (teams % 2 === 0 ? teams - 1 : teams) * (legs === 1 ? 1 : 2)

/** Equipos que juegan: con bots se completa hasta lo pedido; sin bots, solo los DT */
export const teamsFor = (settings, humans) => (settings.fillBots ? Math.max(settings.teams, humans) : humans)

export const botCount = (settings, humans) => teamsFor(settings, humans) - humans

/** Nombres de los bots: clubes históricos distintos, siempre los mismos para la misma sala */
export function pickBotNames(seed, count, exclude = []) {
  if (count <= 0) return []
  return pickRivalClubs(`bots:${seed}`, count, { exclude }).map(c => c.name)
}

/** Reglamento de puntos de la sala (el sorteo siempre da lo mismo para la misma sala) */
export function resolveRules(settings, seed) {
  if (settings?.rulesId === 'SORTEO') {
    const pick = ROOM_RULESETS[Math.floor(seededRandom(`room-rules:${seed}`)() * ROOM_RULESETS.length)]
    return rulesFor(pick.id)
  }
  return rulesFor(settings?.rulesId)
}

export function settingsSummary(settings, humans = 2) {
  const s = sanitizeSettings(settings)
  if (s.format === 'COPA') return `Copa Mundial: ${s.teams} selecciones en ${s.teams / 4} grupos y llaves hasta la final. Los lugares libres los completan selecciones bot ${DIFFICULTIES[s.difficulty].label.toLowerCase()}.`
  const teams = teamsFor(s, humans)
  const who = s.fillBots ? `completa con bots ${DIFFICULTIES[s.difficulty].label.toLowerCase()}` : 'solo los DT'
  const rules = s.rulesId === 'SORTEO' ? 'reglamento sorpresa' : rulesetName(s.rulesId)
  return `${s.fillBots ? s.teams : teams} equipos, ${roundsFor(s.fillBots ? s.teams : teams, s.legs)} fechas (${s.legs === 1 ? 'solo ida' : 'ida y vuelta'}), ${who}. ${rules}.`
}
