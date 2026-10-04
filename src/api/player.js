import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

const FIRST_NAMES = ['Juan', 'Pedro', 'Carlos', 'Diego', 'Martin', 'Lucas', 'Matias', 'Facundo', 'Tomas', 'Agustin', 'Nicolas', 'Gonzalo', 'Federico', 'Leandro']
const LAST_NAMES = ['Garcia', 'Rodriguez', 'Gomez', 'Fernandez', 'Lopez', 'Diaz', 'Martinez', 'Perez', 'Romero', 'Sanchez', 'Alvarez', 'Ruiz', 'Alonso']
const POSITIONS = [
  'GK', 'GK', 
  'CB', 'CB', 'CB', 'CB', 
  'LB', 'RB', 
  'DM', 'DM', 
  'CM', 'CM', 
  'AM', 'AM', 
  'LW', 'RW', 
  'ST', 'ST'
]

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]

const generateAttributes = (baseLevel) => {
  const genAttr = () => Math.max(1, Math.min(99, randomInt(baseLevel - 10, baseLevel + 10)))
  
  return {
    attr_pace: genAttr(),
    attr_acceleration: genAttr(),
    attr_strength: genAttr(),
    attr_stamina: genAttr(),
    attr_technique: genAttr(),
    attr_passing: genAttr(),
    attr_control: genAttr(),
    attr_dribbling: genAttr(),
    attr_finishing: genAttr(),
    attr_shooting: genAttr(),
    attr_heading: genAttr(),
    attr_marking: genAttr(),
    attr_tackling: genAttr(),
    attr_positioning: genAttr(),
    attr_vision: genAttr(),
    attr_decisions: genAttr(),
    attr_mentality: genAttr(),
    attr_concentration: genAttr(),
    attr_leadership: genAttr(),
    attr_aggression: genAttr(),
    attr_professionalism: genAttr()
  }
}

export const playerApi = {
  generatePlayersArray(clubId, reputation) {
    const baseLevel = 25 + Math.floor(reputation * 0.8)
    return POSITIONS.map((pos, idx) => {
      const age = randomInt(17, 35)
      return {
        club_id: clubId,
        first_name: randomItem(FIRST_NAMES),
        last_name: randomItem(LAST_NAMES),
        age,
        nationality: 'Argentina',
        shirt_number: idx + 1,
        position: pos,
        ...generateAttributes(baseLevel),
        state_fitness: randomInt(80, 100),
        state_morale: randomInt(70, 100),
        state_form: randomInt(4, 7),
        is_injured: false,
        is_suspended: false,
        contract_wage: baseLevel * 100,
        contract_salary: baseLevel * 100,
        contract_years: randomInt(1, 4),
        contract_role: idx < 11 ? 'Titular' : 'Rotación',
        attr_potential: Math.min(99, baseLevel + randomInt(0, 15)),
        market_value: baseLevel * 5000,
        release_clause: baseLevel * 10000,
        squad_role: idx < 11 ? 'Titular' : 'Rotación'
      }
    })
  },

  async generateInitialSquad(clubId, reputation) {
    const playersToInsert = this.generatePlayersArray(clubId, reputation)
    const { data, error } = await supabase
      .from('players')
      .insert(playersToInsert)
      .select()

    if (error) throw new Error(error.message)
    return data
  },

  async getSquad(clubId) {
    if (!clubId) return []

    return queryCache.fetch(`squad:${clubId}`, async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('club_id', clubId)
        .order('shirt_number')

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
