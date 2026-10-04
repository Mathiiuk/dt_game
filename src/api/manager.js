import { supabase } from './supabase'
import { auditApi } from './audit'

export const FREE_POINTS_POOL = 15
export const ATTRIBUTE_MAX_INITIAL_CAP = 14
export const ATTRIBUTE_MIN_FLOOR = 4

export const MANAGER_BACKGROUND_PRESETS = {
  STREET_COACH: {
    id: 'STREET_COACH',
    title: 'DT de Potrero',
    description: 'Forjado en canchas de tierra y ligas barriales. Gran llegada al jugador y olfato para el talento puro.',
    reputation: 20,
    baseAttributes: {
      tactics: 6,
      motivation: 9,
      youth: 8,
      management: 6,
      negotiation: 5
    }
  },
  EX_PRO_PLAYER: {
    id: 'EX_PRO_PLAYER',
    title: 'Exfutbolista Profesional',
    description: 'Años en primera división. Respeta los códigos del vestuario y conoce las negociaciones de alto nivel.',
    reputation: 35,
    baseAttributes: {
      tactics: 7,
      motivation: 8,
      youth: 6,
      management: 8,
      negotiation: 7
    }
  },
  TACTICAL_ANALYST: {
    id: 'TACTICAL_ANALYST',
    title: 'Analista Táctico',
    description: 'Obsesivo de los datos y el pizarrón. Lee los partidos al milímetro y explota las debilidades del rival.',
    reputation: 25,
    baseAttributes: {
      tactics: 10,
      motivation: 5,
      youth: 7,
      management: 5,
      negotiation: 6
    }
  },
  ACADEMY_MENTOR: {
    id: 'ACADEMY_MENTOR',
    title: 'Formador de Cantera',
    description: 'Dedicado a moldear promesas. Maximiza el desarrollo técnico, físico y de madurez de los juveniles.',
    reputation: 25,
    baseAttributes: {
      tactics: 6,
      motivation: 7,
      youth: 10,
      management: 7,
      negotiation: 5
    }
  }
}

/**
 * Valida de forma estricta la distribución de puntos de suma cero en backend
 */
export function validateManagerPoints(backgroundId, distributedDeltas) {
  const preset = MANAGER_BACKGROUND_PRESETS[backgroundId] || MANAGER_BACKGROUND_PRESETS.STREET_COACH
  let totalDistributed = 0
  const calculated = {}

  const keys = ['tactics', 'motivation', 'youth', 'management', 'negotiation']

  for (const key of keys) {
    const delta = Number(distributedDeltas[key]) || 0
    if (delta < 0) {
      return { valid: false, error: `No se pueden asignar puntos negativos al atributo ${key}.` }
    }
    const base = preset.baseAttributes[key] || 5
    const finalVal = base + delta

    if (finalVal > ATTRIBUTE_MAX_INITIAL_CAP) {
      return { 
        valid: false, 
        error: `El atributo ${key} supera el tope inicial permitido de ${ATTRIBUTE_MAX_INITIAL_CAP} puntos.` 
      }
    }

    totalDistributed += delta
    calculated[key] = finalVal
  }

  if (totalDistributed !== FREE_POINTS_POOL) {
    return {
      valid: false,
      error: `Debes distribuir exactamente los ${FREE_POINTS_POOL} puntos (distribuidos: ${totalDistributed}).`
    }
  }

  return {
    valid: true,
    calculated,
    reputation: preset.reputation
  }
}

export const managerApi = {
  /**
   * Crea un nuevo Director Técnico con validación autoritativa en servidor
   */
  async createManager(userId, managerData) {
    // 1. Verificar si ya existe un DT no retirado
    const { data: existingManager } = await supabase
      .from('managers')
      .select('id, is_retired')
      .eq('user_id', userId)
      .eq('is_retired', false)
      .maybeSingle()

    if (existingManager) {
      throw new Error('Ya tienes un perfil de Director Técnico activo en tu carrera.')
    }

    const { identity, background = 'STREET_COACH', distributedPoints = {}, philosophy, specialization } = managerData

    // 2. Validación de suma cero autoritativa en backend
    const validation = validateManagerPoints(background, distributedPoints)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // 3. Sanitización de nombres
    const cleanFirstName = (identity.firstName || '').trim().replace(/[^\p{L}\s]/gu, '')
    const cleanLastName = (identity.lastName || '').trim().replace(/[^\p{L}\s]/gu, '')

    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
      throw new Error('El nombre y apellido deben tener al menos 2 letras cada uno.')
    }

    const calculated = validation.calculated
    const initialReputation = validation.reputation

    // 4. Inserción en base de datos con nivel 1 y xp 0 forzados
    const insertPayload = {
      user_id: userId,
      level: 1,
      xp: 0,
      reputation: initialReputation,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      age: Math.max(25, Math.min(75, Number(identity.age) || 35)),
      nationality: identity.nationality || 'Argentina',
      city: identity.city || 'Buenos Aires',
      dominant_foot: identity.dominantFoot || 'Derecho',
      philosophy: philosophy || 'Equilibrado',
      specialization: specialization || 'TACTICO',
      attr_leadership: calculated.management,
      attr_tactics: calculated.tactics,
      attr_motivation: calculated.motivation,
      attr_management: calculated.management,
      attr_youth: calculated.youth,
      attr_negotiation: calculated.negotiation,
      attr_locker_room: calculated.motivation,
      is_retired: false
    }

    const { data, error } = await supabase
      .from('managers')
      .insert([insertPayload])
      .select()
      .single()

    if (error) {
      console.error('Error insertando manager en base de datos:', error)
      throw new Error(error.message)
    }

    // 5. Auditoría
    try {
      await auditApi.logAction({
        whoId: data.id,
        action: 'MANAGER_CREATED',
        entityType: 'manager',
        entityId: data.id,
        stateAfter: {
          background,
          calculatedAttributes: calculated,
          reputation: initialReputation,
          philosophy,
          specialization
        }
      })
    } catch (e) {
      console.warn('No se pudo registrar auditoría de creación de DT:', e)
    }

    return data
  },

  async getManager(userId) {
    const { data, error } = await supabase
      .from('managers')
      .select('*')
      .eq('user_id', userId)
      .eq('is_retired', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    return data || null
  },

  async addXp(managerId, xpAmount, sourceType = 'MATCH_WON', sourceEntityId = null) {
    const { levelsApi } = await import('./levels')
    return await levelsApi.awardXp(managerId, sourceType, sourceEntityId, xpAmount)
  }
}
