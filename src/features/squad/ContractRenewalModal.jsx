import React, { useState, useEffect } from 'react'
import { Check, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { contractApi } from '../../api/contracts'
import { agentsApi } from '../../api/agents'
import { formatMoney } from '../../lib/format'
import { Badge, Button, Card, CardBody, Field, Input, ResponsiveOverlay, Select, Skeleton, Stat } from '../../components/ui'
import AgentProfileCard from './AgentProfileCard'
import { friendlyError } from '../../lib/errors'

const ROLES = [
  ['KEY_PLAYER', 'Jugador clave'],
  ['FIRST_TEAM', 'Titular habitual'],
  ['ROTATION', 'Rotación'],
  ['PROSPECT', 'Joven promesa'],
  ['BACKUP', 'Suplente / reserva']
]

/** Mesa de negociación de contrato: diálogo en escritorio, página completa en móvil */
export default function ContractRenewalModal({ player, club, manager, currentWeek = 1, onClose, onSuccess }) {
  const [demands, setDemands] = useState(null)
  const [agentData, setAgentData] = useState(null)
  const [wageInput, setWageInput] = useState('')
  const [yearsInput, setYearsInput] = useState(2)
  const [roleInput, setRoleInput] = useState('ROTATION')
  const [signingBonusInput, setSigningBonusInput] = useState('0')
  const [releaseClauseInput, setReleaseClauseInput] = useState('')
  const [roundsCompleted, setRoundsCompleted] = useState(0)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [lockoutWeeks, setLockoutWeeks] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [wageError, setWageError] = useState('')

  useEffect(() => {
    if (!player || !club) return
    const init = async () => {
      try {
        const [status, agentInfo] = await Promise.all([
          contractApi.getNegotiationStatus(club.id, player.id, currentWeek),
          agentsApi.getAgentForPlayer(player.id, club?.career_id, manager?.id)
        ])

        setDemands(status.demands)
        setRoundsCompleted(status.roundsCompleted)
        setIsLockedOut(status.isLockedOut)
        setLockoutWeeks(status.lockoutWeeksRemaining)
        setAgentData(agentInfo)

        // Se parte de las pretensiones del jugador
        setWageInput(String(status.demands.expectedWage))
        setYearsInput(status.demands.desiredYears)
        setRoleInput(status.demands.desiredRole)
        setReleaseClauseInput(String(status.demands.suggestedReleaseClause))
      } catch (e) {
        toast.error(friendlyError(e))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [player, club, currentWeek, manager?.id])

  const handleSubmitOffer = async () => {
    const wage = parseInt(wageInput, 10)
    const years = parseInt(yearsInput, 10)
    const bonus = parseInt(signingBonusInput, 10) || 0
    const clause = releaseClauseInput ? parseInt(releaseClauseInput, 10) : null

    if (isNaN(wage) || wage <= 0) {
      setWageError('Ingresa un salario semanal válido.')
      return
    }
    setWageError('')

    try {
      setSubmitting(true)
      const res = await contractApi.submitRenewalOffer({
        clubId: club.id, playerId: player.id, wageOffered: wage, yearsOffered: years,
        squadRole: roleInput, releaseClause: clause, signingBonus: bonus, currentWeek, managerId: manager?.id
      })

      if (res.status === 'ACCEPTED') {
        // Mejora la relación con el representante (su comisión ya la cobró la base)
        if (agentData?.agent?.id && manager?.id) {
          await agentsApi.recordInteraction(manager.id, agentData.agent.id, 'SUCCESS', currentWeek)
        }
        toast.success(res.message)
        onSuccess?.()
        onClose()
      } else if (res.status === 'COLLAPSED') {
        if (agentData?.agent?.id && manager?.id) {
          await agentsApi.recordInteraction(manager.id, agentData.agent.id, 'FAILED', currentWeek)
        }
        toast.error(res.message)
        setIsLockedOut(true)
        setLockoutWeeks(contractApi.BALANCE.lockout_duration_on_collapse_weeks)
        onSuccess?.()
      } else {
        toast.warning(res.message)
        setRoundsCompleted(res.roundsCompleted)
      }
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (!player) return null

  const maxRounds = contractApi.BALANCE.max_negotiation_rounds
  const quickWages = demands ? [
    ['Mínimo', demands.minAcceptableWage],
    ['Pretensión', demands.expectedWage],
    ['+15% generoso', Math.round((demands.expectedWage || 500) * 1.15)]
  ] : []

  const footer = !loading && !isLockedOut ? (
    <>
      <Button variant="ghost" onClick={onClose}>Cancelar</Button>
      <Button onClick={handleSubmitOffer} loading={submitting}>{!submitting && <Check />}Enviar propuesta</Button>
    </>
  ) : (
    <Button variant="outline" onClick={onClose}>Cerrar mesa</Button>
  )

  return (
    <ResponsiveOverlay
      title={`${player.first_name} ${player.last_name}`}
      description={`Mesa de negociación · ${player.position} · ${player.age} años · ${player.personality || 'Personalidad normal'}`}
      onClose={onClose}
      size="md"
      footer={footer}
    >
      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Consultando pretensiones con el agente">
          <Skeleton className="h-20" /><Skeleton className="h-40" />
        </div>
      ) : isLockedOut ? (
        <div role="alert" className="space-y-2 rounded-lg border border-danger/40 bg-danger-soft p-5 text-center">
          <ShieldAlert className="mx-auto size-8 text-danger" aria-hidden="true" />
          <h3 className="font-display text-xl font-semibold text-fg">Negociación rota</h3>
          <p className="text-sm text-fg-muted">El jugador y su representante abandonaron la mesa tras ofertas insatisfactorias.</p>
          <p className="text-sm font-semibold text-danger">Podrás reabrir el diálogo en {lockoutWeeks} semana(s).</p>
        </div>
      ) : (
        <div className="space-y-5">
          {agentData && <AgentProfileCard agentData={agentData} />}

          <Card as="div">
            <CardBody className="grid grid-cols-2 gap-4">
              <Stat label="Pretensión salarial" value={`${formatMoney(demands?.expectedWage)}`} hint={`Mínimo ${formatMoney(demands?.minAcceptableWage)} por semana`} />
              <Stat label="Ronda" value={`${roundsCompleted + 1} / ${maxRounds}`} hint="Al agotarse, se rompe la negociación" />
            </CardBody>
          </Card>

          <div className="space-y-4">
            <Field label="Salario semanal ofrecido" error={wageError}>
              {(p) => <Input {...p} type="number" inputMode="numeric" min="1" value={wageInput} onChange={(e) => setWageInput(e.target.value)} placeholder="Monto semanal" className="num" />}
            </Field>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Montos rápidos">
              {quickWages.map(([label, amount]) => (
                <Button key={label} type="button" variant="outline" size="sm" onClick={() => setWageInput(String(amount))}>
                  {label} <Badge className="num">{formatMoney(amount)}</Badge>
                </Button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Duración">
                {(p) => (
                  <Select {...p} value={yearsInput} onChange={(e) => setYearsInput(Number(e.target.value))}>
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y} {y === 1 ? 'temporada' : 'temporadas'}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Rol en el plantel">
                {(p) => (
                  <Select {...p} value={roleInput} onChange={(e) => setRoleInput(e.target.value)}>
                    {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Prima de firma">
                {(p) => <Input {...p} type="number" inputMode="numeric" min="0" value={signingBonusInput} onChange={(e) => setSigningBonusInput(e.target.value)} className="num" />}
              </Field>
              <Field label="Cláusula de rescisión" hint="Opcional">
                {(p) => <Input {...p} type="number" inputMode="numeric" min="0" value={releaseClauseInput} onChange={(e) => setReleaseClauseInput(e.target.value)} placeholder="Monto" className="num" />}
              </Field>
            </div>
          </div>
        </div>
      )}
    </ResponsiveOverlay>
  )
}
