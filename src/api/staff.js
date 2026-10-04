import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { auditApi } from './audit'

export const staffApi = {
  BALANCE: {
    severance_weeks_penalty: 8,       // 8 semanas de indemnización obligatoria
    base_staff_wage_tier_5: 120,      // Salario semanal base
    max_staff_members: 5              // 1 por cada rol especializado
  },

  ROLES: {
    ASSISTANT_MANAGER: {
      id: 'ASSISTANT_MANAGER',
      name: 'Segundo Entrenador (Ayudante de Campo)',
      description: 'Aporta consejos tácticos, mejora la cohesión de vestuario y asume interinatos.',
      statName: 'Táctica y Liderazgo'
    },
    FITNESS_COACH: {
      id: 'FITNESS_COACH',
      name: 'Preparador Físico',
      description: 'Acelera la recuperación de energía (fitness) semanal y previene fatiga muscular.',
      statName: 'Preparación Física'
    },
    PHYSIO: {
      id: 'PHYSIO',
      name: 'Fisioterapeuta / Médico',
      description: 'Reduce significativamente el tiempo de baja de futbolistas lesionados.',
      statName: 'Fisioterapia y Medicina'
    },
    HEAD_SCOUT: {
      id: 'HEAD_SCOUT',
      name: 'Jefe de Ojeadores',
      description: 'Disminuye el margen de error en informes de scouting y acelera el análisis.',
      statName: 'Ojo Clínico y Análisis'
    },
    GOALKEEPER_COACH: {
      id: 'GOALKEEPER_COACH',
      name: 'Entrenador de Porteros',
      description: 'Aumenta el rendimiento y progresión de los arqueros del plantel.',
      statName: 'Entrenamiento Específico de Arqueros'
    }
  },

  /**
   * Obtener el cuerpo técnico actual del club con bonificaciones pasivas calculadas
   */
  async getStaff(clubId) {
    if (!clubId) return []

    return queryCache.fetch(`staff:${clubId}`, async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('club_id', clubId)

      if (error) throw new Error(error.message)
      return data || []
    }, 30000)
  },

  /**
   * Calcular las bonificaciones pasivas aportadas por el cuerpo técnico (Regla 19.2)
   */
  calculateStaffBonuses(staffList = []) {
    const staffMap = new Map(staffList.map(s => [s.role, s]))

    const physio = staffMap.get('PHYSIO')
    const fitnessCoach = staffMap.get('FITNESS_COACH')
    const headScout = staffMap.get('HEAD_SCOUT')
    const assistant = staffMap.get('ASSISTANT_MANAGER')
    const gkCoach = staffMap.get('GOALKEEPER_COACH')

    const physioSkill = physio ? (physio.skill_rating ?? physio.level ?? 8) : 0
    const fitnessSkill = fitnessCoach ? (fitnessCoach.skill_rating ?? fitnessCoach.level ?? 8) : 0
    const scoutSkill = headScout ? (headScout.skill_rating ?? headScout.level ?? 8) : 0
    const assistantSkill = assistant ? (assistant.skill_rating ?? assistant.level ?? 8) : 0
    const gkSkill = gkCoach ? (gkCoach.skill_rating ?? gkCoach.level ?? 8) : 0

    return {
      // Fisioterapeuta: hasta 40% de reducción en semanas de lesión
      injuryReductionPct: Math.min(40, physioSkill * 2),
      // Preparador Físico: hasta +10 puntos de fitness semanal
      weeklyFitnessRecoveryBonus: Math.round(fitnessSkill * 0.5),
      // Jefe de Ojeadores: reduce error en scouting
      scoutErrorReduction: Math.min(8, Math.round(scoutSkill * 0.4)),
      // Ayudante de Campo: +10 cohesión de vestuario
      cohesionBonus: assistantSkill >= 10 ? 10 : 5,
      // Entrenador de Porteros: +25% progreso de arqueros
      gkTrainingBonusPct: gkSkill >= 10 ? 25 : 10
    }
  },

  /**
   * Obtener o generar candidatos a empleados disponibles para contratar
   */
  async getAvailableCandidates(careerId) {
    let { data: candidates } = await supabase
      .from('staff_candidates')
      .select('*')
      .eq('status', 'AVAILABLE')

    if (!candidates || candidates.length === 0) {
      // Generar pool de candidatos procedurales
      const pool = [
        { f: 'Roberto', l: 'Sensini', role: 'ASSISTANT_MANAGER', skill: 12, wage: 180 },
        { f: 'Julio', l: 'Santamaría', role: 'ASSISTANT_MANAGER', skill: 8, wage: 110 },
        { f: 'Profesor', l: 'Kohan', role: 'FITNESS_COACH', skill: 15, wage: 220 },
        { f: 'Esteban', l: 'Pérez', role: 'FITNESS_COACH', skill: 9, wage: 120 },
        { f: 'Dr. Donato', l: 'Villani', role: 'PHYSIO', skill: 14, wage: 210 },
        { f: 'Lic. Mariano', l: 'Díaz', role: 'PHYSIO', skill: 8, wage: 100 },
        { f: 'Jorge', l: 'Griffa Jr.', role: 'HEAD_SCOUT', skill: 15, wage: 230 },
        { f: 'Claudio', l: 'Vivas', role: 'HEAD_SCOUT', skill: 10, wage: 140 },
        { f: 'Ubaldo', l: 'Fillol Jr.', role: 'GOALKEEPER_COACH', skill: 13, wage: 190 },
        { f: 'Gustavo', l: 'Campagnuolo', role: 'GOALKEEPER_COACH', skill: 9, wage: 115 }
      ]

      const inserts = pool.map(c => ({
        career_id: careerId || null,
        first_name: c.f,
        last_name: c.l,
        role: c.role,
        skill_rating: c.skill,
        wage_demanded: c.wage,
        status: 'AVAILABLE'
      }))

      const { data: inserted } = await supabase
        .from('staff_candidates')
        .insert(inserts)
        .select()

      candidates = inserted || []
    }

    return candidates
  },

  /**
   * Contratar a un especialista en un rol específico
   */
  async hireStaff(clubId, candidate, managerId = null) {
    if (!clubId || !candidate) throw new Error('Parámetros de contratación incompletos.')

    const wage = candidate.wage_demanded || candidate.salary || this.BALANCE.base_staff_wage_tier_5
    const role = candidate.role
    const skill = candidate.skill_rating || candidate.level || 10
    const fullName = candidate.first_name ? `${candidate.first_name} ${candidate.last_name}` : candidate.name

    // 1. Verificar si ya existe un empleado en este rol (Regla 19.1)
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('*')
      .eq('club_id', clubId)
      .eq('role', role)
      .maybeSingle()

    // 2. Si ya existía, calcular indemnización de despido (8 semanas)
    let severancePaid = 0
    if (existingStaff) {
      const oldWage = existingStaff.wage_weekly || existingStaff.salary || 100
      severancePaid = Math.round(oldWage * this.BALANCE.severance_weeks_penalty)
      
      const { data: club } = await supabase.from('clubs').select('budget').eq('id', clubId).single()
      if ((club?.budget || 0) < severancePaid) {
        throw new Error(`Fondos insuficientes: rescindir al empleado actual requiere abonar $${severancePaid.toLocaleString()} de indemnización.`)
      }

      await supabase.from('clubs').update({ budget: club.budget - severancePaid }).eq('id', clubId)
      await supabase.from('staff').delete().eq('id', existingStaff.id)

      try {
        await supabase.from('staff_audit_log').insert({
          club_id: clubId,
          staff_id: existingStaff.id,
          role,
          action: 'STAFF_DISMISSED',
          severance_cost: severancePaid
        })
      } catch {
        // Ignorar
      }
    }

    // 3. Insertar nuevo empleado
    const now = new Date()
    const expiry = new Date()
    expiry.setFullYear(now.getFullYear() + 2)

    const { data: hired, error: hireErr } = await supabase
      .from('staff')
      .insert({
        club_id: clubId,
        name: fullName,
        first_name: candidate.first_name || fullName.split(' ')[0],
        last_name: candidate.last_name || fullName.split(' ')[1] || '',
        role,
        level: skill,
        skill_rating: skill,
        salary: wage,
        wage_weekly: wage,
        contract_expires_at: expiry.toISOString().split('T')[0]
      })
      .select()
      .single()

    if (hireErr) throw new Error(hireErr.message)

    // 4. Marcar candidato como HIRED si proviene de staff_candidates
    if (candidate.id && !candidate.is_custom) {
      await supabase
        .from('staff_candidates')
        .update({ status: 'HIRED' })
        .eq('id', candidate.id)
    }

    // 5. Registrar en auditoría
    try {
      await supabase.from('staff_audit_log').insert({
        club_id: clubId,
        staff_id: hired.id,
        role,
        action: 'STAFF_HIRED',
        severance_cost: 0
      })
    } catch {
      // Ignorar
    }

    queryCache.invalidate(`staff:${clubId}`)
    queryCache.invalidate(`club:${clubId}`)
    queryCache.invalidate(`club:screen:${clubId}`)

    return {
      success: true,
      staff: hired,
      severancePaid
    }
  },

  /**
   * Despedir a un empleado del cuerpo técnico con indemnización de 8 semanas
   */
  async dismissStaff(clubId, staffId, managerId = null) {
    if (!clubId || !staffId) throw new Error('Parámetros de despido incompletos.')

    const { data: member, error: fetchErr } = await supabase
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .eq('club_id', clubId)
      .single()

    if (fetchErr || !member) throw new Error('Empleado no encontrado.')

    // Calcular finiquito de 8 semanas (Regla 19.3)
    const wage = member.wage_weekly || member.salary || 100
    const severance = Math.round(wage * this.BALANCE.severance_weeks_penalty)

    const { data: club } = await supabase.from('clubs').select('budget').eq('id', clubId).single()
    if ((club?.budget || 0) < severance) {
      throw new Error(`Fondos insuficientes: el finiquito de 8 semanas requiere $${severance.toLocaleString()} pero la caja tiene $${Number(club?.budget || 0).toLocaleString()}.`)
    }

    // Descontar indemnización
    const newBudget = (club.budget || 0) - severance
    await supabase.from('clubs').update({ budget: newBudget }).eq('id', clubId)

    // Eliminar de club_staff
    await supabase.from('staff').delete().eq('id', staffId)

    try {
      await supabase.from('staff_audit_log').insert({
        club_id: clubId,
        staff_id: staffId,
        role: member.role,
        action: 'STAFF_DISMISSED',
        severance_cost: severance
      })
    } catch {
      // Ignorar
    }

    queryCache.invalidate(`staff:${clubId}`)
    queryCache.invalidate(`club:${clubId}`)
    queryCache.invalidate(`club:screen:${clubId}`)

    return {
      success: true,
      severancePaid: severance,
      newBudget
    }
  }
}
