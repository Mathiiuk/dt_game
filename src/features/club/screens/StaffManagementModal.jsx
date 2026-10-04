import React, { useState, useEffect } from 'react'
import { 
  X, 
  Briefcase, 
  Users, 
  Activity, 
  Stethoscope, 
  Eye, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Check, 
  Sparkles,
  Award
} from 'lucide-react'
import { staffApi } from '../../../api/staff'
import { toast } from 'sonner'
import { useGameContext } from '../../../context/GameContext'

export default function StaffManagementModal({ club, manager, onClose, onStaffUpdated }) {
  const { confirmAction, refreshContext } = useGameContext()
  const [staffList, setStaffList] = useState([])
  const [candidates, setCandidates] = useState([])
  const [selectedRoleForHire, setSelectedRoleForHire] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  const loadData = async () => {
    try {
      if (!club?.id) return
      const [currentStaff, candidatePool] = await Promise.all([
        staffApi.getStaff(club.id),
        staffApi.getAvailableCandidates(club.career_id)
      ])
      setStaffList(currentStaff)
      setCandidates(candidatePool)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [club])

  const bonuses = staffApi.calculateStaffBonuses(staffList)
  const staffMap = new Map(staffList.map(s => [s.role, s]))

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'ASSISTANT_MANAGER': return <Users className="w-5 h-5 text-emerald-400" />
      case 'FITNESS_COACH': return <Activity className="w-5 h-5 text-amber-400" />
      case 'PHYSIO': return <Stethoscope className="w-5 h-5 text-red-400" />
      case 'HEAD_SCOUT': return <Eye className="w-5 h-5 text-blue-400" />
      case 'GOALKEEPER_COACH': return <ShieldCheck className="w-5 h-5 text-purple-400" />
      default: return <Briefcase className="w-5 h-5 text-zinc-400" />
    }
  }

  const getRoleBonusText = (roleId, skill) => {
    if (!skill) return 'Sin bonificación (vacante)'
    switch (roleId) {
      case 'ASSISTANT_MANAGER': return `+${bonuses.cohesionBonus}% Cohesión de vestuario y consejos tácticos`
      case 'FITNESS_COACH': return `+${bonuses.weeklyFitnessRecoveryBonus} pts de recuperación de energía semanal`
      case 'PHYSIO': return `-${bonuses.injuryReductionPct}% Tiempo de convalecencia en lesiones`
      case 'HEAD_SCOUT': return `-${bonuses.scoutErrorReduction} pts margen de error en informes`
      case 'GOALKEEPER_COACH': return `+${bonuses.gkTrainingBonusPct}% Progreso técnico de arqueros`
      default: return 'Bonificación operativa activa'
    }
  }

  const handleHire = async (candidate) => {
    const roleInfo = staffApi.ROLES[candidate.role]
    const existing = staffMap.get(candidate.role)
    const severanceNotice = existing 
      ? ` Rescindir al empleado actual costará $${Math.round((existing.wage_weekly || 100) * 8).toLocaleString()} de indemnización.` 
      : ''

    const confirmed = await confirmAction({
      title: `Contratar ${roleInfo?.name || candidate.role}`,
      description: `¿Contratar a ${candidate.first_name} ${candidate.last_name} con un sueldo de $${candidate.wage_demanded}/sem?${severanceNotice}`,
      confirmText: 'Confirmar Contratación',
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return

    try {
      setProcessingId(candidate.id)
      await staffApi.hireStaff(club.id, candidate, manager?.id)
      toast.success(`¡${candidate.first_name} ${candidate.last_name} incorporado al cuerpo técnico!`)
      setSelectedRoleForHire(null)
      if (typeof onStaffUpdated === 'function') onStaffUpdated()
      if (typeof refreshContext === 'function') await refreshContext()
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDismiss = async (member) => {
    const wage = member.wage_weekly || member.salary || 100
    const severance = Math.round(wage * staffApi.BALANCE.severance_weeks_penalty)

    const confirmed = await confirmAction({
      title: `Despedir a ${member.name}`,
      description: `La rescisión laboral unilateral requiere abonar 8 semanas de sueldo ($${severance.toLocaleString()}) como indemnización legal. ¿Confirmar despido?`,
      confirmText: `Abonar Finiquito ($${severance.toLocaleString()})`,
      cancelText: 'Cancelar',
      variant: 'danger'
    })
    if (!confirmed) return

    try {
      setProcessingId(member.id)
      await staffApi.dismissStaff(club.id, member.id, manager?.id)
      toast.info(`${member.name} ha sido desvinculado del cuerpo técnico.`)
      if (typeof onStaffUpdated === 'function') onStaffUpdated()
      if (typeof refreshContext === 'function') await refreshContext()
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-2xl bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto pb-28 sm:pb-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Staff & Especialistas
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                Cuerpo Técnico del Club
              </h3>
              <p className="text-xs text-zinc-400">
                Estructura de apoyo: preparación física, medicina, ojeo y táctica
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumen de Bonificaciones */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
            <span className="text-zinc-500 text-[10px] uppercase font-bold block">Recuperación Médica</span>
            <span className="text-red-400 font-mono font-bold">-{bonuses.injuryReductionPct}% tiempo</span>
          </div>
          <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
            <span className="text-zinc-500 text-[10px] uppercase font-bold block">Fitness Semanal</span>
            <span className="text-amber-400 font-mono font-bold">+{bonuses.weeklyFitnessRecoveryBonus} pts</span>
          </div>
          <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-zinc-500 text-[10px] uppercase font-bold block">Precisión Scouting</span>
            <span className="text-blue-400 font-mono font-bold">+{bonuses.scoutErrorReduction * 10}% precisión</span>
          </div>
        </div>

        {/* 5 Roles Principales */}
        <div className="space-y-3">
          {Object.values(staffApi.ROLES).map(role => {
            const member = staffMap.get(role.id)
            const skill = member ? (member.skill_rating ?? member.level ?? 8) : 0
            const wage = member ? (member.wage_weekly ?? member.salary ?? 100) : 0

            return (
              <div 
                key={role.id}
                className="p-3.5 bg-zinc-950 border border-zinc-800/90 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5">
                    {getRoleIcon(role.id)}
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      {role.name}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      {member ? member.name : <span className="text-zinc-500 italic">Puesto Vacante</span>}
                    </h4>
                    <p className="text-[11px] text-emerald-400 mt-0.5 font-medium">
                      {getRoleBonusText(role.id, skill)}
                    </p>
                    {member && (
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Habilidad: {skill}/20 • Sueldo: ${Number(wage).toLocaleString()}/sem
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0 self-end sm:self-center">
                  {member ? (
                    <button
                      disabled={processingId === member.id}
                      onClick={() => handleDismiss(member)}
                      className="py-1.5 px-3 text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Despedir</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedRoleForHire(role.id)}
                      className="py-1.5 px-3 text-xs font-bold text-black bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Contratar</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal/Drawer de Candidatos para un Rol */}
        {selectedRoleForHire && (
          <div className="pt-3 border-t border-zinc-800 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Candidatos para {staffApi.ROLES[selectedRoleForHire]?.name}</span>
              </h4>
              <button 
                onClick={() => setSelectedRoleForHire(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {candidates
                .filter(c => c.role === selectedRoleForHire && c.status === 'AVAILABLE')
                .map(cand => (
                  <div key={cand.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-white">{cand.first_name} {cand.last_name}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Habilidad: <span className="text-emerald-400 font-bold">{cand.skill_rating}/20</span>
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        ${Number(cand.wage_demanded).toLocaleString()}/sem
                      </p>
                    </div>
                    <button
                      disabled={processingId === cand.id}
                      onClick={() => handleHire(cand)}
                      className="py-1 px-2.5 text-xs font-bold text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Fichar
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
