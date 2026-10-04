import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { auditApi } from './audit'
import { contractEndFor, pickInitialContractYears } from '../domain/contracts'

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
  { position: 'GK', squadRole: 'Titular', shirtNumber: 1, ageCategory: 'prime' },
  { position: 'GK', squadRole: 'Suplente', shirtNumber: 12, ageCategory: 'young' },
  // Defensores (6)
  { position: 'CB', squadRole: 'Titular', shirtNumber: 2, ageCategory: 'prime' },
  { position: 'CB', squadRole: 'Titular', shirtNumber: 6, ageCategory: 'veteran' },
  { position: 'LB', squadRole: 'Titular', shirtNumber: 3, ageCategory: 'prime' },
  { position: 'RB', squadRole: 'Titular', shirtNumber: 4, ageCategory: 'prime' },
  { position: 'CB', squadRole: 'Rotación', shirtNumber: 13, ageCategory: 'prospect' },
  { position: 'CB', squadRole: 'Rotación', shirtNumber: 14, ageCategory: 'prime' },
  // Mediocampistas (7)
  { position: 'DM', squadRole: 'Titular', shirtNumber: 5, ageCategory: 'prime' },
  { position: 'CM', squadRole: 'Titular', shirtNumber: 8, ageCategory: 'prime' },
  { position: 'CM', squadRole: 'Titular', shirtNumber: 10, ageCategory: 'star' },
  { position: 'DM', squadRole: 'Rotación', shirtNumber: 15, ageCategory: 'prime' },
  { position: 'CM', squadRole: 'Rotación', shirtNumber: 16, ageCategory: 'young' },
  { position: 'AM', squadRole: 'Rotación', shirtNumber: 17, ageCategory: 'prospect' },
  { position: 'LM', squadRole: 'Rotación', shirtNumber: 18, ageCategory: 'prime' },
  // Delanteros (5)
  { position: 'RW', squadRole: 'Titular', shirtNumber: 7, ageCategory: 'prime' },
  { position: 'ST', squadRole: 'Titular', shirtNumber: 9, ageCategory: 'star' },
  { position: 'LW', squadRole: 'Titular', shirtNumber: 11, ageCategory: 'prime' },
  { position: 'ST', squadRole: 'Rotación', shirtNumber: 19, ageCategory: 'prospect' },
  { position: 'ST', squadRole: 'Rotación', shirtNumber: 20, ageCategory: 'veteran' }
]

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

/**
 * Genera atributos técnicos, físicos y mentales adaptados al OVR objetivo del jugador
 */
const generateAttributes = (targetOvr, position) => {
  const isGK = position === 'GK'
  const isDef = ['CB', 'LB', 'RB'].includes(position)
  const isMid = ['DM', 'CM', 'AM', 'LM', 'RM'].includes(position)
  const isFwd = ['ST', 'RW', 'LW'].includes(position)

  const genVal = (bias = 0) => Math.max(25, Math.min(85, Math.round(targetOvr + bias + randomInt(-4, 4))))

  return {
    attr_pace: genVal(isFwd || position === 'LB' || position === 'RB' ? 5 : -2),
    attr_acceleration: genVal(isFwd ? 4 : 0),
    attr_strength: genVal(isDef || position === 'DM' ? 6 : -3),
    attr_stamina: genVal(2),
    attr_technique: genVal(isMid || isFwd ? 4 : -5),
    attr_passing: genVal(isMid ? 6 : -3),
    attr_control: genVal(isMid ? 4 : -2),
    attr_dribbling: genVal(isFwd || position === 'AM' ? 5 : -4),
    attr_finishing: genVal(isFwd ? 8 : -8),
    attr_shooting: genVal(isFwd ? 6 : -6),
    attr_heading: genVal(isDef || position === 'ST' ? 5 : -4),
    attr_marking: genVal(isDef || position === 'DM' ? 8 : -10),
    attr_tackling: genVal(isDef || position === 'DM' ? 7 : -9),
    attr_positioning: genVal(isGK || isDef ? 5 : 0),
    attr_vision: genVal(isMid ? 6 : -4),
    attr_decisions: genVal(0),
    attr_mentality: genVal(1),
    attr_concentration: genVal(isGK || isDef ? 4 : 0),
    attr_leadership: genVal(randomInt(-5, 8)),
    attr_aggression: genVal(randomInt(-3, 6)),
    attr_professionalism: genVal(randomInt(0, 8))
  }
}

export const playerApi = {
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

      switch (slot.ageCategory) {
        case 'prospect':
          age = randomInt(17, 19)
          targetOvr = randomInt(44, 48)
          potential = randomInt(70, 78) // Gran margen de crecimiento (> 68)
          break
        case 'young':
          age = randomInt(20, 22)
          targetOvr = randomInt(46, 50)
          potential = randomInt(64, 72)
          break
        case 'star':
          age = randomInt(26, 29)
          targetOvr = randomInt(56, 62) // Jugador estrella de la liga
          potential = targetOvr + randomInt(1, 3)
          break
        case 'veteran':
          age = randomInt(31, 34)
          targetOvr = randomInt(49, 53)
          potential = targetOvr
          break
        case 'prime':
        default:
          age = randomInt(23, 28)
          targetOvr = randomInt(48, 53)
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
      const weeklyWage = Math.round(120 * Math.pow(targetOvr / 50, 1.85))

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
        ...generateAttributes(targetOvr, slot.position),
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
        market_value: targetOvr * 3500,
        release_clause: targetOvr * 7000,
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
