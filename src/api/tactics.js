import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const FORMATIONS = {
  '4-4-2': {
    id: '4-4-2',
    name: '4-4-2 Clásico',
    slots: ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LM', 'LCM', 'RCM', 'RM', 'LST', 'RST'],
    description: 'Equilibrio defensivo y juego por bandas.'
  },
  '4-3-3': {
    id: '4-3-3',
    name: '4-3-3 Ofensivo',
    slots: ['GK', 'LB', 'LCB', 'RCB', 'RB', 'CDM', 'LCM', 'RCM', 'LW', 'ST', 'RW'],
    description: 'Amplitud de ataque, presión y transiciones rápidas.'
  },
  '4-2-3-1': {
    id: '4-2-3-1',
    name: '4-2-3-1 Moderno',
    slots: ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LDM', 'RDM', 'CAM', 'LM', 'RM', 'ST'],
    description: 'Control de la medular y llegada escalonada.'
  },
  '3-5-2': {
    id: '3-5-2',
    name: '3-5-2 Con Carrileros',
    slots: ['GK', 'LCB', 'CB', 'RCB', 'LWB', 'LCM', 'RCM', 'RWB', 'CAM', 'LST', 'RST'],
    description: 'Densidad en mediocampo y superioridad en centros.'
  },
  '5-3-2': {
    id: '5-3-2',
    name: '5-3-2 Cerrojo / Contra',
    slots: ['GK', 'LWB', 'LCB', 'CB', 'RCB', 'RWB', 'LCM', 'CM', 'RCM', 'LST', 'RST'],
    description: 'Seguridad máxima atrás y salidas verticales.'
  },
  '4-1-4-1': {
    id: '4-1-4-1',
    name: '4-1-4-1 Posesión',
    slots: ['GK', 'LB', 'LCB', 'RCB', 'RB', 'CDM', 'LM', 'LCM', 'RCM', 'RM', 'ST'],
    description: 'Estructura compacta para dominar la pelota.'
  },
  '3-4-3': {
    id: '3-4-3',
    name: '3-4-3 Ataque Total',
    slots: ['GK', 'LCB', 'CB', 'RCB', 'LM', 'LCM', 'RCM', 'RM', 'LW', 'ST', 'RW'],
    description: 'Presión ultra alta y juego agresivo en campo rival.'
  }
}

export const TACTICAL_MENTALITIES = [
  { id: 'VERY_DEFENSIVE', label: 'Muy Defensiva' },
  { id: 'DEFENSIVE', label: 'Defensiva' },
  { id: 'BALANCED', label: 'Equilibrada' },
  { id: 'ATTACKING', label: 'Ofensiva' },
  { id: 'ALL_OUT_ATTACK', label: 'Ataque Total' }
]

export const PASSING_STYLES = [
  { id: 'SHORT_TIKI', label: 'Corto / Posesión' },
  { id: 'MIXED', label: 'Mixto / Dinámico' },
  { id: 'DIRECT', label: 'Directo / Vertical' },
  { id: 'LONG_BALL', label: 'Balón Largo' }
]

export const PRESSING_LEVELS = [
  { id: 'STAND_OFF', label: 'Repliegue Bajo' },
  { id: 'BALANCED', label: 'Presión Media' },
  { id: 'AGGRESSIVE', label: 'Presión Alta e Intensa' }
]

export const TEMPO_LEVELS = [
  { id: 'SLOW', label: 'Lento y Pausado' },
  { id: 'NORMAL', label: 'Normal' },
  { id: 'FAST', label: 'Rápido / Vértigo' }
]

/**
 * Calcula el coeficiente de afinidad de un futbolista en un puesto específico.
 */
export const calculatePositionalAffinity = (playerPos, slotPos) => {
  if (!playerPos || !slotPos) return { rating: 1.0, label: 'Natural', color: 'emerald', code: 'NATURAL' }

  const p = playerPos.toUpperCase()
  const s = slotPos.toUpperCase()

  // Posición idéntica o exacta
  if (p === s || (p === 'GK' && s === 'GK')) {
    return { rating: 1.0, label: 'Natural', color: 'emerald', code: 'NATURAL' }
  }

  // Compatibles directos (laterales, extremos, dobles pivotes)
  const compatiblePairs = [
    ['LB', 'LWB'], ['RB', 'RWB'], ['LWB', 'LB'], ['RWB', 'RB'],
    ['LCB', 'RCB'], ['RCB', 'LCB'], ['CB', 'LCB'], ['CB', 'RCB'], ['LCB', 'CB'], ['RCB', 'CB'],
    ['CDM', 'CM'], ['CM', 'CDM'], ['LDM', 'RDM'], ['RDM', 'LDM'], ['LCM', 'RCM'], ['RCM', 'LCM'],
    ['CAM', 'CM'], ['CM', 'CAM'],
    ['LM', 'LW'], ['LW', 'LM'], ['RM', 'RW'], ['RW', 'RM'],
    ['LST', 'RST'], ['RST', 'LST'], ['ST', 'LST'], ['ST', 'RST'], ['LST', 'ST'], ['RST', 'ST'], ['CF', 'ST'], ['ST', 'CF']
  ]

  if (compatiblePairs.some(([a, b]) => (p === a && s === b) || (p === b && s === a))) {
    return { rating: 0.85, label: 'Compatible', color: 'amber', code: 'COMPATIBLE' }
  }

  // Misma línea posicional (defensas entre sí, volantes entre sí, delanteros entre sí)
  const isDefP = ['LB', 'RB', 'CB', 'LCB', 'RCB', 'LWB', 'RWB', 'DEF'].includes(p)
  const isDefS = ['LB', 'RB', 'CB', 'LCB', 'RCB', 'LWB', 'RWB', 'DEF'].includes(s)
  if (isDefP && isDefS) {
    return { rating: 0.65, label: 'Adaptada', color: 'orange', code: 'ADAPTED' }
  }

  const isMidP = ['CM', 'LCM', 'RCM', 'CDM', 'LDM', 'RDM', 'CAM', 'LM', 'RM', 'MED'].includes(p)
  const isMidS = ['CM', 'LCM', 'RCM', 'CDM', 'LDM', 'RDM', 'CAM', 'LM', 'RM', 'MED'].includes(s)
  if (isMidP && isMidS) {
    return { rating: 0.65, label: 'Adaptada', color: 'orange', code: 'ADAPTED' }
  }

  const isAttP = ['ST', 'LST', 'RST', 'CF', 'LW', 'RW', 'DEL'].includes(p)
  const isAttS = ['ST', 'LST', 'RST', 'CF', 'LW', 'RW', 'DEL'].includes(s)
  if (isAttP && isAttS) {
    return { rating: 0.65, label: 'Adaptada', color: 'orange', code: 'ADAPTED' }
  }

  // Arquero de campo o jugador de campo al arco = Fuera de puesto grave
  return { rating: 0.40, label: 'Fuera de Puesto', color: 'red', code: 'OUT_OF_POSITION' }
}

export const tacticsApi = {
  /**
   * Obtiene la táctica activa del club. Si no existe, inicializa una por defecto.
   */
  async getTactic(clubId, slotNumber = 1) {
    if (!clubId) return null

    return queryCache.fetch(`tactics:${clubId}:${slotNumber}`, async () => {
      let { data, error } = await supabase
        .from('tactics')
        .select('*')
        .eq('club_id', clubId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn('Error fetching tactic:', error)
      }

      if (!data) {
        const defaultTactic = {
          club_id: clubId,
          slot_number: slotNumber,
          formation: '4-4-2',
          mentality: 'BALANCED',
          passing_style: 'MIXED',
          tempo: 'NORMAL',
          defensive_line: 'STANDARD',
          width: 'BALANCED',
          pressing_intensity: 'BALANCED',
          lineup: []
        }

        // Inserción segura para crear el registro inicial
        try {
          const { data: created, error: insertError } = await supabase
            .from('tactics')
            .insert(defaultTactic)
            .select()
            .single()

          if (!insertError) return created
        } catch (e) {
          console.warn('Fallback al crear táctica default:', e)
        }

        return { id: 'temp-tactic', ...defaultTactic }
      }

      return data
    }, 60000)
  },

  /**
   * Valida autoritativamente que la alineación de 11 titulares sea legal.
   */
  validateLineup(starters = [], squad = []) {
    if (!starters || starters.length !== 11) {
      throw new Error(`ERR_INVALID_STARTERS_COUNT: La alineación titular debe contener exactamente 11 futbolistas (actuales: ${starters?.length || 0}).`)
    }

    const uniqueIds = new Set(starters.map(s => s.player_id || s))
    if (uniqueIds.size !== 11) {
      throw new Error('ERR_DUPLICATE_PLAYER_IN_LINEUP: No puedes alinear al mismo futbolista en más de un puesto.')
    }

    if (squad && squad.length > 0) {
      const squadMap = new Map(squad.map(p => [p.id, p]))

      // Verificar que todos los jugadores pertenecen al club
      for (const starter of starters) {
        const pId = starter.player_id || starter
        if (!squadMap.has(pId)) {
          throw new Error('ERR_UNAUTHORIZED_PLAYER_LINEUP: Un jugador seleccionado no pertenece a la plantilla del club.')
        }
      }

      // Verificar que hay al menos 1 arquero
      const gkSlots = starters.filter(s => s.pitch_position === 'GK')
      if (gkSlots.length !== 1) {
        throw new Error('ERR_NO_GOALKEEPER: La alineación debe contener exactamente un arquero (GK).')
      }
    }

    return true
  },

  /**
   * Guarda de forma estrictamente IDEMPOTENTE la táctica del club.
   * Evita 100% el error 'duplicate key value violates unique constraint tactics_pkey'.
   */
  async updateTactic(clubId, tacticData) {
    if (!clubId) throw new Error('Club ID requerido')

    const cleanData = {
      formation: tacticData.formation || '4-4-2',
      mentality: tacticData.mentality || 'BALANCED',
      pressure: tacticData.pressure || 'Media',
      tempo: tacticData.tempo || 'Normal',
      defensive_line: tacticData.defensive_line || 'Media',
      build_up: tacticData.build_up || 'Mixta',
      passing_style: tacticData.passing_style || 'MIXED',
      width: tacticData.width || 'BALANCED',
      pressing_intensity: tacticData.pressing_intensity || 'BALANCED',
      lineup: Array.isArray(tacticData.lineup) ? tacticData.lineup : [],
      updated_at: new Date().toISOString()
    }

    let savedTactic = null

    // 1. Si tacticData contiene un ID válido, actualizamos ese registro directamente
    if (tacticData.id && tacticData.id !== 'temp-tactic') {
      const { data, error } = await supabase
        .from('tactics')
        .update(cleanData)
        .eq('id', tacticData.id)
        .select()
        .single()

      if (!error && data) {
        savedTactic = data
      }
    }

    // 2. Si no se actualizó por ID, buscamos por club_id para actualizar el registro existente
    if (!savedTactic) {
      const { data: existing } = await supabase
        .from('tactics')
        .select('id')
        .eq('club_id', clubId)
        .limit(1)
        .maybeSingle()

      if (existing?.id) {
        const { data, error } = await supabase
          .from('tactics')
          .update(cleanData)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw new Error(`Error actualizando táctica: ${error.message}`)
        savedTactic = data
      } else {
        // 3. Solo si no existe ningún registro previo para el club, insertamos uno nuevo
        const { data, error } = await supabase
          .from('tactics')
          .insert({
            ...cleanData,
            club_id: clubId
          })
          .select()
          .single()

        if (error) throw new Error(`Error creando táctica: ${error.message}`)
        savedTactic = data
      }
    }

    // 4. Invalidar cachés
    queryCache.invalidate(`tactics:${clubId}`)
    queryCache.invalidate(`tactics:${clubId}:1`)

    // 5. Persistir slots individuales en tactic_lineup_slots si hay alineación detallada
    if (savedTactic?.id && Array.isArray(tacticData.lineupDetails) && tacticData.lineupDetails.length > 0) {
      try {
        await supabase
          .from('tactic_lineup_slots')
          .delete()
          .eq('tactic_id', savedTactic.id)

        const slotsToInsert = tacticData.lineupDetails.map((slot, idx) => ({
          tactic_id: savedTactic.id,
          player_id: slot.player_id,
          pitch_position: slot.pitch_position,
          player_role: slot.player_role || 'DEFAULT',
          is_starter: slot.is_starter !== false,
          order_index: idx
        }))

        await supabase.from('tactic_lineup_slots').insert(slotsToInsert)
      } catch (slotErr) {
        console.warn('Aviso: no se pudieron persistir los slots detallados:', slotErr)
      }
    }

    return savedTactic
  }
}
