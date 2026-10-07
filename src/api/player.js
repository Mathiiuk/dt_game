import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { auditApi } from './audit'
import { contractEndFor, pickInitialContractYears } from '../domain/contracts'
import { generateAttributesForOverall, TIER_5_RATING_RANGES } from '../domain/ratings'
import { POSITION_CODES, normalizePosition } from '../domain/positions'
import { playerValue } from '../domain/valuation'

const FIRST_NAMES = [
  'Santiago', 'Lucas', 'Matias', 'Facundo', 'Tomas', 'Agustin', 'Nicolas',
  'Gonzalo', 'Federico', 'Leandro', 'Franco', 'Julian', 'Enzo', 'Lautaro',
  'Rodrigo', 'Alexis', 'Nahuel', 'Cristian', 'Ignacio', 'Mateo', 'Braian',
  'Mauro', 'Emiliano', 'Esteban', 'Maximiliano', 'Valentin', 'Damian', 'Ramiro'
]

const LAST_NAMES = [
  'Fernandez', 'Rodriguez', 'Gomez', 'Gonzalez', 'Lopez', 'Diaz', 'Martinez',
  'Perez', 'Garcia', 'Romero', 'Sanchez', 'Alvarez', 'Torres', 'Ruiz',
  'Ramirez', 'Flores', 'Acosta', 'Benitez', 'Medina', 'Herrera', 'Aguirre',
  'Peralta', 'Gimenez', 'Molina', 'Castro', 'Rios', 'Navarro', 'Rojas'
]

export const INITIAL_SQUAD_STRUCTURE = [
  // Arqueros (2)
  { position: 'PO', squadRole: 'Titular', shirtNumber: 1, ageCategory: 'prime' },
  { position: 'PO', squadRole: 'Suplente', shirtNumber: 12, ageCategory: 'young' },
  // Defensores (6)
  { position: 'DFC', squadRole: 'Titular', shirtNumber: 2, ageCategory: 'prime' },
  { position: 'DFC', squadRole: 'Titular', shirtNumber: 6, ageCategory: 'veteran' },
  { position: 'LI', squadRole: 'Titular', shirtNumber: 3, ageCategory: 'prime' },
  { position: 'LD', squadRole: 'Titular', shirtNumber: 4, ageCategory: 'prime' },
  { position: 'DFC', squadRole: 'Rotación', shirtNumber: 13, ageCategory: 'prospect' },
  { position: 'DFC', squadRole: 'Rotación', shirtNumber: 14, ageCategory: 'prime' },
  // Mediocampistas (7)
  { position: 'MCD', squadRole: 'Titular', shirtNumber: 5, ageCategory: 'prime' },
  { position: 'MC', squadRole: 'Titular', shirtNumber: 8, ageCategory: 'prime' },
  { position: 'MC', squadRole: 'Titular', shirtNumber: 10, ageCategory: 'star' },
  { position: 'MCD', squadRole: 'Rotación', shirtNumber: 15, ageCategory: 'prime' },
  { position: 'MD', squadRole: 'Rotación', shirtNumber: 16, ageCategory: 'young' },
  { position: 'MCO', squadRole: 'Rotación', shirtNumber: 17, ageCategory: 'prospect' },
  { position: 'MI', squadRole: 'Rotación', shirtNumber: 18, ageCategory: 'prime' },
  // Delanteros (5)
  { position: 'ED', squadRole: 'Titular', shirtNumber: 7, ageCategory: 'prime' },
  { position: 'DC', squadRole: 'Titular', shirtNumber: 9, ageCategory: 'star' },
  { position: 'EI', squadRole: 'Titular', shirtNumber: 11, ageCategory: 'prime' },
  { position: 'DC', squadRole: 'Rotación', shirtNumber: 19, ageCategory: 'prospect' },
  { position: 'DC', squadRole: 'Rotación', shirtNumber: 20, ageCategory: 'veteran' }
]

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const PROSPECT_POSITIONS = POSITION_CODES
const pick = (list) => list[randomInt(0, list.length - 1)]

/** Primer dorsal libre a partir del 21 (los 1-20 son del plantel inicial) */
export const nextFreeShirtNumber = (taken = []) => {
  const used = new Set(taken)
  for (let n = 21; n <= 99; n++) if (!used.has(n)) return n
  return 99
}

/**
 * Arma la fila COMPLETA de un jugador joven para insertar en `players`: todos los campos obligatorios
 * (nacionalidad, dorsal, atributos, contrato, valor, rol) y nada de columnas inexistentes.
 * Escala FIFA: los atributos se generan para que la media en su posición sea `overall`.
 */
export const buildProspectRow = ({
  clubId, firstName, lastName, age, position, overall, potential, shirtNumber, nationality = 'Argentina', gameDate = '2026-07-01',
  role = 'Juvenil', isYouth = true
}) => {
  const pos = normalizePosition(position)
  const wage = Math.round(80 * Math.pow((overall - 7) / 50, 1.85))
  const years = 3

  return {
    club_id: clubId,
    first_name: firstName,
    last_name: lastName,
    age,
    nationality,
    shirt_number: shirtNumber,
    position: pos,
    ...generateAttributesForOverall(overall, pos),
    attr_overall: overall,
    attr_potential: Math.min(99, Math.max(potential, overall)),
    state_fitness: 100,
    state_morale: 80,
    state_form: 6,
    contract_wage: wage,
    contract_salary: wage,
    contract_years: years,
    contract_end: contractEndFor(gameDate, years),
    contract_role: role,
    squad_role: role,
    market_value: playerValue({ ovr: overall, potential: Math.min(99, Math.max(potential, overall)), age }),
    is_youth: isYouth
  }
}

/** Juvenil de cantera al azar (botón "Otear" de la Academia): entre 50 y 58 de media, potencial según el nivel de la academia */
export const buildYouthProspect = ({ clubId, academyLevel = 1, shirtNumber, nationality = 'Argentina', gameDate = '2026-07-01' }) => {
  const overall = randomInt(50, 54) + Math.min(4, academyLevel)
  return buildProspectRow({
    clubId,
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    age: randomInt(16, 17),
    position: pick(PROSPECT_POSITIONS),
    overall,
    potential: Math.max(overall + 6, 66 + academyLevel * 5 + randomInt(0, 14)),
    shirtNumber,
    nationality,
    gameDate
  })
}

/** Filas de agentes libres (sin club) a partir de sus perfiles: nombre al azar, dorsal libre y contrato de 3 años que se rehace al fichar */
export const buildFreeAgentRows = (specs, gameDate = '2026-07-01') => specs.map(spec => buildProspectRow({
  clubId: null,
  firstName: pick(FIRST_NAMES),
  lastName: pick(LAST_NAMES),
  age: spec.age,
  position: spec.position,
  overall: spec.overall,
  potential: spec.potential,
  shirtNumber: randomInt(21, 99),
  gameDate,
  role: 'Libre',
  isYouth: false
}))

export const playerApi = {
  /**
   * Actualiza varios jugadores en UNA sola llamada (RPC batch_update_players).
   * Cada fila lleva { id, ...columnas }; sólo se tocan las claves presentes.
   */
  async batchUpdate(rows) {
    if (!rows || rows.length === 0) return 0
    const { data, error } = await supabase.rpc('batch_update_players', { rows })
    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Genera el arreglo oficial de 20 jugadores respetando cuotas posicionales y Tier 5
   */
  generatePlayersArray(clubId, reputation = 15, gameDate = '2026-07-01') {
    const usedNames = new Set()

    return INITIAL_SQUAD_STRUCTURE.map((slot) => {
      // 1. Determinar edad y OVR objetivo según categoría
      let age = 24
      let targetOvr = 50
      let potential = 55

      const [minOvr, maxOvr] = TIER_5_RATING_RANGES[slot.ageCategory] || TIER_5_RATING_RANGES.prime
      targetOvr = randomInt(minOvr, maxOvr)
      switch (slot.ageCategory) {
        case 'prospect':
          age = randomInt(17, 19)
          potential = randomInt(70, 80) // gran margen de crecimiento
          break
        case 'young':
          age = randomInt(20, 22)
          potential = randomInt(66, 74)
          break
        case 'star':
          age = randomInt(26, 29)
          potential = targetOvr + randomInt(1, 3)
          break
        case 'veteran':
          age = randomInt(31, 34)
          potential = targetOvr
          break
        case 'prime':
        default:
          age = randomInt(23, 28)
          potential = targetOvr + randomInt(2, 6)
          break
      }

      // 2. Nombre no repetido
      let firstName = FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)]
      let lastName = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)]
      let fullName = `${firstName} ${lastName}`
      let attempts = 0
      while (usedNames.has(fullName) && attempts < 10) {
        firstName = FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)]
        lastName = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)]
        fullName = `${firstName} ${lastName}`
        attempts++
      }
      usedNames.add(fullName)

      // 3. Salario semanal ajustado a Tier 5 (~$100 a $220 semanal)
      const weeklyWage = Math.round(120 * Math.pow((targetOvr - 7) / 50, 1.85))

      // 4. Contrato escalonado (1 a 5 años) con vencimiento real anclado al 30 de junio
      const contractYears = pickInitialContractYears()

      return {
        club_id: clubId,
        first_name: firstName,
        last_name: lastName,
        age,
        nationality: 'Argentina',
        shirt_number: slot.shirtNumber,
        position: slot.position,
        ...generateAttributesForOverall(targetOvr, slot.position),
        attr_overall: targetOvr,
        state_fitness: 100,
        state_morale: 75,
        state_form: 6,
        is_injured: false,
        is_suspended: false,
        contract_wage: weeklyWage,
        contract_salary: weeklyWage,
        contract_years: contractYears,
        contract_end: contractEndFor(gameDate, contractYears),
        contract_role: slot.squadRole,
        attr_potential: Math.min(99, potential),
        market_value: playerValue({ ovr: targetOvr, potential: Math.min(99, potential), age }),
        release_clause: playerValue({ ovr: targetOvr, potential: Math.min(99, potential), age }) * 2,
        squad_role: slot.squadRole
      }
    })
  },

  /**
   * Generación atómica e idempotente del primer plantel
   */
  async generateInitialSquad(clubId, reputation = 15) {
    if (!clubId) return []

    // 1. Idempotencia: Verificar si ya existen jugadores para el club
    const { data: existing, error: countError } = await supabase
      .from('players')
      .select('id')
      .eq('club_id', clubId)
      .limit(1)

    // Si la lectura falla no se sabe si hay plantel: generar otro encima lo duplicaría
    if (countError) throw new Error(countError.message)
    if (existing && existing.length > 0) {
      return await this.getSquad(clubId)
    }

    // 2. Generar nómina de 20 jugadores
    const { data: clubRow } = await supabase.from('clubs').select('game_date').eq('id', clubId).maybeSingle()
    const playersToInsert = this.generatePlayersArray(clubId, reputation, clubRow?.game_date || '2026-07-01')

    const { data, error } = await supabase
      .from('players')
      .insert(playersToInsert)
      .select()

    if (error) {
      console.error('Error insertando primer plantel:', error)
      throw new Error(error.message)
    }

    // 3. Auditoría de generación
    try {
      const totalWage = playersToInsert.reduce((sum, p) => sum + p.contract_wage, 0)
      await auditApi.logAction({
        whoId: clubId,
        action: 'INITIAL_SQUAD_GENERATED',
        entityType: 'club',
        entityId: clubId,
        stateAfter: {
          playersCount: data.length,
          totalWeeklyWage: totalWage
        }
      })
    } catch (e) {
      console.warn('No se pudo registrar auditoría de plantel inicial:', e)
    }

    // Invalidar caché
    queryCache.invalidate(`squad:${clubId}`)

    return data
  },

  async getSquad(clubId) {
    if (!clubId) return []

    return queryCache.fetch(`squad:${clubId}`, async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('club_id', clubId)
        .order('shirt_number', { ascending: true })

      if (error) throw new Error(error.message)
      return data || []
    }, 60000)
  },

  async updatePlayer(playerId, updates) {
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    queryCache.invalidate('squad:')
    return data
  }
}
