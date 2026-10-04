import React, { useState, useEffect } from 'react'
import { 
  X, 
  FileSignature, 
  DollarSign, 
  ShieldAlert, 
  Check, 
  AlertCircle, 
  Award, 
  Clock,
  Sparkles
} from 'lucide-react'
import { contractApi } from '../../api/contracts'
import { agentsApi } from '../../api/agents'
import AgentProfileCard from './AgentProfileCard'
import { toast } from 'sonner'

export default function ContractRenewalModal({ 
  player, 
  club, 
  manager, 
  currentWeek = 1,
  onClose, 
  onSuccess 
}) {
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

        // Inicializar con valores sugeridos de las demandas
        setWageInput(String(status.demands.expectedWage))
        setYearsInput(status.demands.desiredYears)
        setRoleInput(status.demands.desiredRole)
        setReleaseClauseInput(String(status.demands.suggestedReleaseClause))
      } catch (e) {
        toast.error(e.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [player, club, currentWeek])

  const handleSubmitOffer = async () => {
    const wage = parseInt(wageInput, 10)
    const years = parseInt(yearsInput, 10)
    const bonus = parseInt(signingBonusInput, 10) || 0
    const clause = releaseClauseInput ? parseInt(releaseClauseInput, 10) : null

    if (isNaN(wage) || wage <= 0) {
      return toast.error('Ingresa un salario semanal válido.')
    }

    try {
      setSubmitting(true)
      const res = await contractApi.submitRenewalOffer({
        clubId: club.id,
        playerId: player.id,
        wageOffered: wage,
        yearsOffered: years,
        squadRole: roleInput,
        releaseClause: clause,
        signingBonus: bonus,
        currentWeek,
        managerId: manager?.id
      })

      if (res.status === 'ACCEPTED') {
        // Impacto positivo en la relación con el representante
        if (agentData?.agent?.id && manager?.id) {
          await agentsApi.recordInteraction(manager.id, agentData.agent.id, 'SUCCESS', currentWeek)
          // Liquidar comisión pactada
          await agentsApi.disburseCommission(
            club.id, 
            agentData.agent.id, 
            player.id, 
            wage * 4, 
            agentData.effectiveCommissionRate
          )
        }

        toast.success(res.message)
        if (typeof onSuccess === 'function') onSuccess()
        onClose()
      } else if (res.status === 'COLLAPSED') {
        if (agentData?.agent?.id && manager?.id) {
          await agentsApi.recordInteraction(manager.id, agentData.agent.id, 'FAILED', currentWeek)
        }
        toast.error(res.message)
        setIsLockedOut(true)
        setLockoutWeeks(contractApi.BALANCE.lockout_duration_on_collapse_weeks)
        if (typeof onSuccess === 'function') onSuccess()
      } else {
        toast.warning(res.message)
        setRoundsCompleted(res.roundsCompleted)
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!player) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileSignature className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Mesa de Negociación Contractual
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                {player.first_name} {player.last_name}
              </h3>
              <p className="text-xs text-zinc-400">
                {player.position} • {player.age} años • Personalidad: {player.personality || 'Normal'}
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

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-400">Consultando pretensiones con el agente...</p>
          </div>
        ) : isLockedOut ? (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-red-400 mx-auto" />
            <h4 className="font-bold text-red-300 text-sm">Negociaciones Roto / Bloqueadas</h4>
            <p className="text-xs text-zinc-400">
              El jugador y su representante abandonaron la mesa tras ofertas previas insatisfactorias.
            </p>
            <p className="text-xs font-bold text-red-400">
              Disponible para reabrir diálogo en {lockoutWeeks} semana(s).
            </p>
            <button
              onClick={onClose}
              className="mt-3 w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
            >
              Cerrar Mesa
            </button>
          </div>
        ) : (
          <>
            {/* Card del Agente / Representante */}
            {agentData && <AgentProfileCard agentData={agentData} />}

            {/* Rondas & Demandas */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-zinc-500 text-[10px] uppercase font-bold block">Pretensión Salarial</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">
                  ${demands?.expectedWage?.toLocaleString()}/sem
                </span>
                <span className="text-zinc-500 text-[10px] block mt-0.5">
                  Mínimo: ${demands?.minAcceptableWage?.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-zinc-500 text-[10px] uppercase font-bold block">Ronda de Negociación</span>
                <span className="text-amber-400 font-bold text-sm">
                  Ronda {roundsCompleted + 1} de {contractApi.BALANCE.max_negotiation_rounds}
                </span>
                <span className="text-zinc-500 text-[10px] block mt-0.5">
                  Máximo 3 ofertas antes de ruptura
                </span>
              </div>
            </div>

            {/* Formulario de Propuesta */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Salario Semanal Ofrecido ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500 font-bold">$</span>
                  <input 
                    type="number"
                    value={wageInput}
                    onChange={(e) => setWageInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono font-bold focus:border-emerald-500 outline-none text-sm"
                    placeholder="Monto semanal"
                  />
                </div>
                
                {/* Accesos rápidos de salario */}
                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setWageInput(String(demands?.minAcceptableWage))}
                    className="py-1 px-2 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                  >
                    Mínimo (${demands?.minAcceptableWage})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWageInput(String(demands?.expectedWage))}
                    className="py-1 px-2 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-lg"
                  >
                    Pretensión (${demands?.expectedWage})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWageInput(String(Math.round((demands?.expectedWage || 500) * 1.15)))}
                    className="py-1 px-2 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                  >
                    +15% Generoso
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Duración (Años)
                  </label>
                  <select 
                    value={yearsInput}
                    onChange={(e) => setYearsInput(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                  >
                    <option value={1}>1 Temporada</option>
                    <option value={2}>2 Temporadas</option>
                    <option value={3}>3 Temporadas</option>
                    <option value={4}>4 Temporadas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Rol en Plantel
                  </label>
                  <select 
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                  >
                    <option value="KEY_PLAYER">Jugador Clave</option>
                    <option value="FIRST_TEAM">Titular Habitual</option>
                    <option value="ROTATION">Rotación</option>
                    <option value="PROSPECT">Joven Promesa</option>
                    <option value="BACKUP">Suplente / Reserva</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Prima de Firma ($ USD)
                  </label>
                  <input 
                    type="number"
                    value={signingBonusInput}
                    onChange={(e) => setSigningBonusInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Cláusula de Rescisión
                  </label>
                  <input 
                    type="number"
                    value={releaseClauseInput}
                    onChange={(e) => setReleaseClauseInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    placeholder="Monto cláusula"
                  />
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-3">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button"
                disabled={submitting}
                onClick={handleSubmitOffer}
                className="flex-1 py-2.5 text-xs font-bold bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Firmar Propuesta</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
