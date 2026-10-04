import { supabase } from './supabase'
import { ensureRow } from '../utils/ensureRow'
import { queryCache } from '../utils/cache'
import { financesApi } from './finances'

export const STADIUM_CATALOG = {
  EXPAND_CAPACITY_1K: {
    key: 'EXPAND_CAPACITY_1K',
    type: 'EXPAND_CAPACITY',
    name: 'Ampliación Popular (+1,000)',
    description: 'Construcción de gradas populares adicionales de tablones reforzados.',
    cost: 20000,
    durationWeeks: 6,
    capacityDelta: 1000,
    targetTier: 1,
    weeklyMaintIncrease: 40
  },
  EXPAND_CAPACITY_3K: {
    key: 'EXPAND_CAPACITY_3K',
    type: 'EXPAND_CAPACITY',
    name: 'Tribuna Lateral de Cemento (+3,000)',
    description: 'Estructura de hormigón armado para mayor capacidad y seguridad.',
    cost: 55000,
    durationWeeks: 12,
    capacityDelta: 3000,
    targetTier: 2,
    weeklyMaintIncrease: 120
  },
  EXPAND_CAPACITY_10K: {
    key: 'EXPAND_CAPACITY_10K',
    type: 'EXPAND_CAPACITY',
    name: 'Platea Principal con Butacas (+10,000)',
    description: 'Aforo de nivel provincial con butacas individuales numeradas.',
    cost: 180000,
    durationWeeks: 24,
    capacityDelta: 10000,
    targetTier: 3,
    weeklyMaintIncrease: 400
  },
  RESURFACE_PITCH: {
    key: 'RESURFACE_PITCH',
    type: 'RESURFACING_PITCH',
    name: 'Resiembra y Nivelado de Césped',
    description: 'Nivelación del suelo y resembrado profesional para evitar pozos y rebotes irregulares.',
    cost: 3500,
    durationWeeks: 2,
    pitchQualityTarget: 85,
    weeklyMaintIncrease: 0
  },
  HYBRID_PITCH: {
    key: 'HYBRID_PITCH',
    type: 'RESURFACING_PITCH',
    name: 'Césped Híbrido Profesional de Alta Resistencia',
    description: 'Césped con fibras sintéticas entrelazadas y drenaje rápido bajo lluvia torrencial.',
    cost: 40000,
    durationWeeks: 8,
    pitchQualityTarget: 98,
    weeklyMaintIncrease: 30
  },
  INSTALL_FLOODLIGHTS: {
    key: 'INSTALL_FLOODLIGHTS',
    type: 'INSTALL_FLOODLIGHTS',
    name: 'Torres de Iluminación Halógenas',
    description: 'Habilita transmisiones de televisión en horario nocturno (+ $300/semana de TV).',
    cost: 15000,
    durationWeeks: 4,
    floodlights: true,
    weeklyMaintIncrease: 50
  },
  BUILD_VIP_BOXES: {
    key: 'BUILD_VIP_BOXES',
    type: 'BUILD_VIP_BOXES',
    name: 'Sector de Palcos VIP (+10 palcos)',
    description: 'Palcos corporativos con hospitality para empresas y abonados premium.',
    cost: 30000,
    durationWeeks: 6,
    vipBoxesDelta: 10,
    targetTier: 4,
    weeklyMaintIncrease: 80
  }
}

export const stadiumApi = {
  /**
   * Obtiene o inicializa los datos autoritativos del estadio del club
   */
  async getStadiumDetails(clubId) {
    if (!clubId) return null

    // 1. Consultar club_stadiums
    const { data: stadium, error } = await supabase
      .from('club_stadiums')
      .select('*')
      .eq('club_id', clubId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('Error al consultar club_stadiums:', error)
    }

    if (stadium) {
      return stadium
    }

    // 2. Si no existe, crearlo a partir del club
    const { data: club } = await supabase
      .from('clubs')
      .select('stadium_name, stadium_capacity, stadium_level')
      .eq('id', clubId)
      .single()

    const initialCapacity = club?.stadium_capacity || 1500
    const initialTier = club?.stadium_level || 1
    const initialName = club?.stadium_name || 'Estadio Principal'

    const newStadium = {
      club_id: clubId,
      stadium_name: initialName,
      capacity: initialCapacity,
      pitch_quality: 60,
      stands_tier: Math.min(4, Math.max(1, initialTier)),
      floodlights_installed: false,
      vip_boxes_count: 0,
      weekly_maintenance_cost: 200.00 + (Math.floor(initialCapacity / 1000) * 40)
    }

    const { data: created, error: insertErr } = await ensureRow(supabase, 'club_stadiums', newStadium, 'club_id')

    if (insertErr) {
      console.warn('Error al inicializar club_stadiums:', insertErr)
      return { id: 'temp', ...newStadium }
    }

    return created
  },

  /**
   * Obtiene el proyecto en construcción actualmente activo (si existe)
   */
  async getActiveProject(clubId) {
    if (!clubId) return null
    const { data, error } = await supabase
      .from('stadium_projects')
      .select('*')
      .eq('club_id', clubId)
      .eq('status', 'UNDER_CONSTRUCTION')
      .order('created_at', { ascending: false })
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('Error consultando stadium_projects:', error)
    }
    return data || null
  },

  /**
   * Historial de obras y eventos de mantenimiento
   */
  async getAuditHistory(clubId) {
    if (!clubId) return []
    const { data, error } = await supabase
      .from('stadium_audit_log')
      .select('*')
      .eq('club_id', clubId)
      .order('timestamp', { ascending: false })
      .limit(15)

    if (error) {
      console.warn('Error consultando stadium_audit_log:', error)
      return []
    }
    return data || []
  },

  /**
   * Inicia un proyecto de infraestructura o mejora edilicia
   */
  async startProject(clubId, projectKey) {
    if (!clubId || !projectKey) throw new Error('Parámetros requeridos inválidos')

    const projectDef = STADIUM_CATALOG[projectKey]
    if (!projectDef) throw new Error(`Proyecto desconocido: ${projectKey}`)

    // 1. Validar que no haya otra obra en curso (Regla 21.3 - Una sola obra simultánea)
    const active = await this.getActiveProject(clubId)
    if (active) {
      throw new Error('ERR_CONSTRUCTION_ALREADY_IN_PROGRESS: Ya hay una obra mayor en ejecución.')
    }

    // 2. Validar estadio actual y presupuesto
    const stadium = await this.getStadiumDetails(clubId)
    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .select('budget, name')
      .eq('id', clubId)
      .single()

    if (clubErr || !club) throw new Error('Club no encontrado')

    if ((club.budget || 0) < projectDef.cost) {
      throw new Error(`ERR_INSUFFICIENT_FUNDS_FOR_UPGRADE: Saldo insuficiente. Se requieren $${projectDef.cost.toLocaleString()}`)
    }

    // 3. Debitar fondos y registrar libro mayor contable (Fase 20)
    const newBudget = (club.budget || 0) - projectDef.cost
    await supabase
      .from('clubs')
      .update({ budget: newBudget })
      .eq('id', clubId)

    try {
      await financesApi.recordLedgerTransaction({
        clubId,
        category: 'INFRASTRUCTURE',
        amount: -projectDef.cost,
        description: `Inicio de obra: ${projectDef.name} (${projectDef.durationWeeks} sem)`
      })
    } catch (e) {
      console.warn('Aviso ledger contable estadio:', e)
    }

    // 4. Crear registro en stadium_projects
    const { data: newProject, error: projErr } = await supabase
      .from('stadium_projects')
      .insert({
        club_id: clubId,
        project_type: projectDef.type,
        cost_paid: projectDef.cost,
        capacity_delta: projectDef.capacityDelta || 0,
        weeks_remaining: projectDef.durationWeeks,
        status: 'UNDER_CONSTRUCTION'
      })
      .select()
      .single()

    if (projErr) throw projErr

    // 5. Registrar en stadium_audit_log
    await supabase.from('stadium_audit_log').insert({
      club_id: clubId,
      action: 'CONSTRUCTION_STARTED',
      cost: projectDef.cost,
      capacity_before: stadium.capacity,
      capacity_after: stadium.capacity + (projectDef.capacityDelta || 0)
    })

    queryCache.invalidate(`club:screen:${clubId}`)
    queryCache.invalidate(`stadium:${clubId}`)

    return {
      success: true,
      project: newProject,
      message: `¡Obra iniciada! Plazo de finalización: ${projectDef.durationWeeks} semanas.`
    }
  },

  /**
   * Procesa el paso semanal de obras en construcción
   */
  async advanceConstructionWeek(clubId, currentWeek, currentSeason) {
    if (!clubId) return null

    const active = await this.getActiveProject(clubId)
    if (!active) return null

    const remaining = active.weeks_remaining - 1

    if (remaining > 0) {
      // Sigue en construcción
      await supabase
        .from('stadium_projects')
        .update({ weeks_remaining: remaining })
        .eq('id', active.id)
      return { status: 'IN_PROGRESS', weeksRemaining: remaining }
    }

    // ¡Obra finalizada!
    await supabase
      .from('stadium_projects')
      .update({ weeks_remaining: 0, status: 'COMPLETED' })
      .eq('id', active.id)

    const stadium = await this.getStadiumDetails(clubId)
    const updates = { updated_at: new Date().toISOString() }
    const clubUpdates = {}

    if (active.project_type === 'EXPAND_CAPACITY') {
      const newCapacity = Math.min(120000, (stadium.capacity || 1500) + active.capacity_delta)
      updates.capacity = newCapacity
      updates.weekly_maintenance_cost = 200.00 + (Math.floor(newCapacity / 1000) * 40)
      clubUpdates.stadium_capacity = newCapacity
    } else if (active.project_type === 'RESURFACING_PITCH') {
      // Subir césped a 85 o 98 según costo pagado
      const targetPitch = active.cost_paid > 20000 ? 98 : 85
      updates.pitch_quality = targetPitch
    } else if (active.project_type === 'INSTALL_FLOODLIGHTS') {
      updates.floodlights_installed = true
    } else if (active.project_type === 'BUILD_VIP_BOXES') {
      updates.vip_boxes_count = (stadium.vip_boxes_count || 0) + 10
      updates.stands_tier = 4
    }

    await supabase
      .from('club_stadiums')
      .update(updates)
      .eq('club_id', clubId)

    if (Object.keys(clubUpdates).length > 0) {
      await supabase
        .from('clubs')
        .update(clubUpdates)
        .eq('id', clubId)
    }

    // Registrar inauguración en auditoría
    await supabase.from('stadium_audit_log').insert({
      club_id: clubId,
      action: 'CONSTRUCTION_COMPLETED',
      cost: 0,
      capacity_before: stadium.capacity,
      capacity_after: updates.capacity || stadium.capacity
    })

    queryCache.invalidate(`club:screen:${clubId}`)
    queryCache.invalidate(`stadium:${clubId}`)

    return { status: 'COMPLETED', projectType: active.project_type }
  },

  /**
   * Degrada el césped tras un partido disputado de local (-3 puntos)
   */
  async degradePitchHomeMatch(clubId) {
    if (!clubId) return
    const stadium = await this.getStadiumDetails(clubId)
    const currentQuality = stadium.pitch_quality || 60
    const newQuality = Math.max(15, currentQuality - 3)

    await supabase
      .from('club_stadiums')
      .update({ pitch_quality: newQuality, updated_at: new Date().toISOString() })
      .eq('club_id', clubId)

    if (newQuality < 45 && currentQuality >= 45) {
      await supabase.from('stadium_audit_log').insert({
        club_id: clubId,
        action: 'PITCH_DEGRADED',
        cost: 0,
        capacity_before: stadium.capacity,
        capacity_after: stadium.capacity
      })
    }

    queryCache.invalidate(`club:screen:${clubId}`)
  },

  /**
   * Obtiene la descripción cualitativa y efecto del estado del césped
   */
  getPitchConditionFeedback(quality = 60) {
    if (quality >= 90) {
      return {
        level: 'Excelente (Billar Europeo)',
        badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
        tacticalBonus: '+10% efectividad pases cortos',
        injuryRisk: 'Riesgo de lesión mínimo (-20%)'
      }
    }
    if (quality >= 75) {
      return {
        level: 'Muy Bueno (Césped Nivelado)',
        badgeColor: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
        tacticalBonus: '+5% efectividad pases cortos',
        injuryRisk: 'Riesgo de lesión estándar'
      }
    }
    if (quality >= 50) {
      return {
        level: 'Aceptable (Potrero Municipal)',
        badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
        tacticalBonus: 'Sin bonificaciones tácticas',
        injuryRisk: 'Riesgo moderado de sobrecargas'
      }
    }
    return {
      level: 'Crítico (Tierra, pozos y piedras)',
      badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
      tacticalBonus: '-25% efectividad de pase / rebotes falsos',
      injuryRisk: 'Doble de riesgo de esguinces de tobillo'
    }
  }
}
