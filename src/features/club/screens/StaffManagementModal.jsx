import React, { useState, useEffect } from 'react'
import { Activity, Briefcase, Check, Eye, ShieldCheck, Stethoscope, Trash2, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { staffApi } from '../../../api/staff'
import { useGameContext } from '../../../context/GameContext'
import { formatMoney } from '../../../lib/format'
import { Badge, Button, Card, CardBody, ResponsiveOverlay, SectionTitle, Skeleton, Stat } from '../../../components/ui'

const ROLE_ICON = {
  ASSISTANT_MANAGER: Users,
  FITNESS_COACH: Activity,
  PHYSIO: Stethoscope,
  HEAD_SCOUT: Eye,
  GOALKEEPER_COACH: ShieldCheck
}

/** Cuerpo técnico: contratar y despedir especialistas. Diálogo en escritorio, página completa en móvil. */
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

  useEffect(() => { loadData() }, [club]) // eslint-disable-line react-hooks/exhaustive-deps

  const bonuses = staffApi.calculateStaffBonuses(staffList)
  const staffMap = new Map(staffList.map(s => [s.role, s]))

  const roleBonusText = (roleId, skill) => {
    if (!skill) return 'Sin bonificación (vacante)'
    switch (roleId) {
      case 'ASSISTANT_MANAGER': return `+${bonuses.cohesionBonus}% de cohesión del vestuario y consejos tácticos`
      case 'FITNESS_COACH': return `+${bonuses.weeklyFitnessRecoveryBonus} pts de recuperación de energía por semana`
      case 'PHYSIO': return `-${bonuses.injuryReductionPct}% de tiempo de convalecencia`
      case 'HEAD_SCOUT': return `-${bonuses.scoutErrorReduction} pts de margen de error en informes`
      case 'GOALKEEPER_COACH': return `+${bonuses.gkTrainingBonusPct}% de progreso técnico de arqueros`
      default: return 'Bonificación operativa activa'
    }
  }

  const afterChange = async () => {
    onStaffUpdated?.()
    if (typeof refreshContext === 'function') await refreshContext()
    loadData()
  }

  const handleHire = async (candidate) => {
    const roleInfo = staffApi.ROLES[candidate.role]
    const existing = staffMap.get(candidate.role)
    const severanceNotice = existing
      ? ` Rescindir al empleado actual costará ${formatMoney(Math.round((existing.wage_weekly || 100) * 8))} de indemnización.`
      : ''

    const confirmed = await confirmAction({
      title: `Contratar ${roleInfo?.name || candidate.role}`,
      description: `¿Contratar a ${candidate.first_name} ${candidate.last_name} con un sueldo de ${formatMoney(candidate.wage_demanded)} por semana?${severanceNotice}`,
      confirmText: 'Confirmar contratación',
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return

    try {
      setProcessingId(candidate.id)
      await staffApi.hireStaff(club.id, candidate, manager?.id)
      toast.success(`${candidate.first_name} ${candidate.last_name} se incorporó al cuerpo técnico`)
      setSelectedRoleForHire(null)
      await afterChange()
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
      description: `La rescisión unilateral exige abonar 8 semanas de sueldo (${formatMoney(severance)}) como indemnización legal. ¿Confirmas el despido?`,
      confirmText: `Abonar finiquito (${formatMoney(severance)})`,
      cancelText: 'Cancelar',
      variant: 'danger'
    })
    if (!confirmed) return

    try {
      setProcessingId(member.id)
      await staffApi.dismissStaff(club.id, member.id, manager?.id)
      toast.info(`${member.name} fue desvinculado del cuerpo técnico`)
      await afterChange()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setProcessingId(null)
    }
  }

  const roleCandidates = selectedRoleForHire
    ? candidates.filter(c => c.role === selectedRoleForHire && c.status === 'AVAILABLE')
    : []

  return (
    <ResponsiveOverlay
      title="Cuerpo técnico"
      description="Estructura de apoyo: preparación física, medicina, ojeo y táctica"
      onClose={onClose}
      size="md"
    >
      {loading ? (
        <div className="space-y-3" aria-busy="true"><Skeleton className="h-20" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      ) : (
        <div className="space-y-6">
          <Card as="div">
            <CardBody className="grid grid-cols-3 gap-4">
              <Stat label="Recuperación médica" value={`-${bonuses.injuryReductionPct}%`} hint="de tiempo" />
              <Stat label="Fitness semanal" value={`+${bonuses.weeklyFitnessRecoveryBonus}`} hint="puntos" />
              <Stat label="Precisión scouting" value={`+${bonuses.scoutErrorReduction * 10}%`} />
            </CardBody>
          </Card>

          <section aria-labelledby="staff-roles">
            <SectionTitle>Puestos</SectionTitle>
            <ul className="space-y-2.5">
              {Object.values(staffApi.ROLES).map(role => {
                const member = staffMap.get(role.id)
                const skill = member ? (member.skill_rating ?? member.level ?? 8) : 0
                const wage = member ? (member.wage_weekly ?? member.salary ?? 100) : 0
                const Icon = ROLE_ICON[role.id] || Briefcase

                return (
                  <li key={role.id}>
                    <Card as="div">
                      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-md bg-surface-3 text-accent" aria-hidden="true">
                            <Icon className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="eyebrow">{role.name}</p>
                            <p className="mt-0.5 text-sm font-semibold text-fg">
                              {member ? member.name : <span className="font-normal italic text-fg-subtle">Puesto vacante</span>}
                            </p>
                            <p className="mt-0.5 text-xs text-accent">{roleBonusText(role.id, skill)}</p>
                            {member && (
                              <p className="mt-0.5 text-xs text-fg-subtle">
                                Habilidad <span className="num">{skill}/20</span> · Sueldo <span className="num">{formatMoney(wage)}</span>/sem
                              </p>
                            )}
                          </div>
                        </div>
                        {member ? (
                          <Button variant="outline" size="sm" disabled={processingId === member.id} onClick={() => handleDismiss(member)} className="self-start text-danger sm:self-center">
                            <Trash2 />Despedir
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => setSelectedRoleForHire(role.id)} className="self-start sm:self-center">
                            <UserPlus />Contratar
                          </Button>
                        )}
                      </CardBody>
                    </Card>
                  </li>
                )
              })}
            </ul>
          </section>

          {selectedRoleForHire && (
            <section aria-labelledby="staff-candidates" className="border-t border-line pt-5">
              <SectionTitle action={<Button variant="ghost" size="sm" onClick={() => setSelectedRoleForHire(null)}>Cerrar</Button>}>
                Candidatos: {staffApi.ROLES[selectedRoleForHire]?.name}
              </SectionTitle>
              {roleCandidates.length === 0 ? (
                <p className="text-sm text-fg-muted">No hay candidatos disponibles para este puesto por ahora.</p>
              ) : (
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {roleCandidates.map(cand => (
                    <li key={cand.id}>
                      <Card as="div">
                        <CardBody className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-fg">{cand.first_name} {cand.last_name}</p>
                            <p className="mt-0.5 text-xs text-fg-muted">
                              Habilidad <Badge tone="accent" className="num">{cand.skill_rating}/20</Badge>
                            </p>
                            <p className="num mt-1 text-xs text-fg-subtle">{formatMoney(cand.wage_demanded)}/sem</p>
                          </div>
                          <Button size="sm" variant="secondary" disabled={processingId === cand.id} onClick={() => handleHire(cand)}>
                            <Check />Fichar
                          </Button>
                        </CardBody>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </ResponsiveOverlay>
  )
}
