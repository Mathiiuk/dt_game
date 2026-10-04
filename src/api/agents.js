import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const agentsApi = {
  BALANCE: {
    commission_min_rate: 0.04,              // 4% mínimo legal
    commission_max_rate: 0.15,              // 15% máximo legal (Regla 16.1)
    agent_leak_chance_on_stalemate: 0.45,   // Probabilidad semanal de filtración
    affinity_gain_on_successful_signing: 6, // +6 pts de afinidad al firmar
    affinity_loss_on_broken_talks: 14,      // -14 pts de afinidad al romper diálogo
    default_affinity: 50                    // Afinidad neutral inicial
  },

  ARCHETYPES: {
    GREEDY: {
      name: 'Codicioso',
      description: 'Prioriza comisiones altas y bonificaciones económicas.',
      defaultCommission: 0.12,
      patience: 35,
      greed: 85
    },
    FAIR: {
      name: 'Negociador Razonable',
      description: 'Busca acuerdos equilibrados y valora relaciones a largo plazo.',
      defaultCommission: 0.08,
      patience: 65,
      greed: 50
    },
    PROTECTIVE: {
      name: 'Protector / Familiar',
      description: 'A menudo el padre o familiar. Prioriza minutos de juego y bienestar.',
      defaultCommission: 0.05,
      patience: 50,
      greed: 25
    },
    AGGRESSIVE: {
      name: 'Hostil / Agresivo',
      description: 'Exige cláusulas bajas, amenaza con filtrar noticias a la prensa.',
      defaultCommission: 0.10,
      patience: 25,
      greed: 75
    }
  },

  /**
   * Obtener el agente asignado a un jugador y su relación con el DT
   */
  async getAgentForPlayer(playerId, careerId, managerId) {
    if (!playerId) return null

    // 1. Verificar si el jugador ya tiene un agente vinculado
    const { data: player } = await supabase
      .from('players')
      .select('id, agent_id, first_name, last_name, age')
      .eq('id', playerId)
      .single()

    let agent = null
    if (player?.agent_id) {
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', player.agent_id)
        .maybeSingle()
      agent = existingAgent
    }

    // 2. Si no tiene agente, asignar o generar uno de forma procedural
    if (!agent) {
      agent = await this.generateOrAssignAgent(player, careerId)
    }

    // 3. Consultar afinidad con el DT humano
    let relationshipScore = this.BALANCE.default_affinity
    if (managerId && agent?.id) {
      const { data: rel } = await supabase
        .from('manager_agent_relations')
        .select('relationship_score')
        .eq('manager_id', managerId)
        .eq('agent_id', agent.id)
        .maybeSingle()

      if (rel) {
        relationshipScore = rel.relationship_score
      } else {
        // Inicializar relación en 50
        try {
          await supabase.from('manager_agent_relations').insert({
            manager_id: managerId,
            agent_id: agent.id,
            relationship_score: this.BALANCE.default_affinity
          })
        } catch {
          // Ignorar si colisiona
        }
      }
    }

    // 4. Calcular tasa efectiva de comisión basada en la afinidad
    const baseRate = agent.base_commission_rate || 0.08
    // Mayor afinidad (ej: 90) abarata la comisión; menor afinidad (ej: 20) la encarece
    const affinityFactor = 1.2 - 0.4 * (relationshipScore / 100)
    const effectiveCommissionRate = Math.max(
      this.BALANCE.commission_min_rate,
      Math.min(this.BALANCE.commission_max_rate, Number((baseRate * affinityFactor).toFixed(3)))
    )

    return {
      agent,
      relationshipScore,
      effectiveCommissionRate,
      archetypeDetails: this.ARCHETYPES[agent.personality] || this.ARCHETYPES.FAIR
    }
  },

  /**
   * Generar o asignar un agente para el futbolista
   */
  async generateOrAssignAgent(player, careerId) {
    const isYoung = (player?.age || 22) <= 20
    const personalityPool = isYoung 
      ? ['PROTECTIVE', 'FAIR', 'GREEDY'] 
      : ['FAIR', 'GREEDY', 'AGGRESSIVE', 'PROTECTIVE']
    
    const chosenPersonality = personalityPool[Math.floor(Math.random() * personalityPool.length)]
    const archetype = this.ARCHETYPES[chosenPersonality]

    let agentName
    if (chosenPersonality === 'PROTECTIVE' && isYoung) {
      agentName = `Familia ${player?.last_name || 'del Jugador'}`
    } else {
      const firstNames = ['Carlos', 'Jorge', 'Guillermo', 'Mariano', 'Federico', 'Hernán', 'Sebastián']
      const lastNames = ['Méndez', 'Coppola', 'Mascardi', 'Hidalgo', 'Bragarnik', 'Settimio', 'Simon']
      agentName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
    }

    // Insertar nuevo agente en la base de datos
    const { data: newAgent, error } = await supabase
      .from('agents')
      .insert({
        career_id: careerId || null,
        name: agentName,
        personality: chosenPersonality,
        influence: Math.floor(30 + Math.random() * 50),
        patience_rating: archetype.patience,
        base_commission_rate: archetype.defaultCommission
      })
      .select()
      .single()

    if (!error && newAgent) {
      // Vincular al jugador
      await supabase
        .from('players')
        .update({ agent_id: newAgent.id })
        .eq('id', player.id)

      return newAgent
    }

    return {
      id: null,
      name: agentName,
      personality: chosenPersonality,
      base_commission_rate: archetype.defaultCommission,
      influence: 50,
      patience_rating: archetype.patience
    }
  },

  /**
   * Registrar resultado de una negociación en la relación DT-Agente
   */
  async recordInteraction(managerId, agentId, result, currentWeek = 1) {
    if (!managerId || !agentId) return

    const delta = result === 'SUCCESS' 
      ? this.BALANCE.affinity_gain_on_successful_signing 
      : -this.BALANCE.affinity_loss_on_broken_talks

    const { data: existing } = await supabase
      .from('manager_agent_relations')
      .select('relationship_score')
      .eq('manager_id', managerId)
      .eq('agent_id', agentId)
      .maybeSingle()

    const currentScore = existing ? existing.relationship_score : this.BALANCE.default_affinity
    const newScore = Math.max(0, Math.min(100, currentScore + delta))

    await supabase
      .from('manager_agent_relations')
      .upsert({
        manager_id: managerId,
        agent_id: agentId,
        relationship_score: newScore,
        last_interaction_week: currentWeek
      }, { onConflict: 'manager_id,agent_id' })

    try {
      await supabase.from('agent_action_log').insert({
        agent_id: agentId,
        action_type: result === 'SUCCESS' ? 'COMMISSION_PAID' : 'NEGOTIATION_INTERRUPTED',
        financial_impact: 0
      })
    } catch {
      // Ignorar si tabla no disponible
    }

    return newScore
  },

  /**
   * Calcular y debitar comisión de agencia en un traspaso o renovación
   */
  async disburseCommission(clubId, agentId, playerId, operationAmount, commissionRate = 0.08) {
    if (!clubId || !operationAmount || operationAmount <= 0) return 0

    // Aplicar tope reglamentario del 15% (Regla 16.1)
    const rate = Math.min(this.BALANCE.commission_max_rate, Math.max(this.BALANCE.commission_min_rate, commissionRate))
    const commission = Math.round(operationAmount * rate)

    // Debitar de tesorería del club
    const { data: club } = await supabase
      .from('clubs')
      .select('budget')
      .eq('id', clubId)
      .single()

    if (club) {
      await supabase
        .from('clubs')
        .update({ budget: Math.max(0, (club.budget || 0) - commission) })
        .eq('id', clubId)
    }

    // Registrar en auditoría
    try {
      await supabase.from('agent_action_log').insert({
        agent_id: agentId || null,
        player_id: playerId || null,
        action_type: 'COMMISSION_PAID',
        financial_impact: commission
      })
    } catch {
      // Ignorar si no disponible
    }

    queryCache.invalidate('finances:')
    queryCache.invalidate('club:')

    return commission
  }
}
