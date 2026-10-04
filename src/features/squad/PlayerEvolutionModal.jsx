import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  UserCheck, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  Calendar, 
  Award, 
  Zap, 
  X, 
  Users, 
  CheckCircle2,
  ChevronRight,
  Flame,
  ShieldAlert
} from 'lucide-react'
import { playerEvolutionApi, CAREER_PHASES } from '../../api/playerEvolution'
import { toast } from 'sonner'

export default function PlayerEvolutionModal({ club, players = [], onClose, currentSeasonYear = 2026 }) {
  const [activeFilter, setActiveFilter] = useState('ALL') // 'ALL' | 'YOUTH' | 'PEAK' | 'VETERANS'
  const [retiringPlayers, setRetiringPlayers] = useState([])
  const [evolutionHistory, setEvolutionHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!club?.id) return
      try {
        setLoading(true)
        const [retirements, history] = await Promise.all([
          playerEvolutionApi.getRetiringPlayers(club.id),
          playerEvolutionApi.getClubEvolutionHistory(club.id, currentSeasonYear).catch(() => [])
        ])
        setRetiringPlayers(retirements)
        setEvolutionHistory(history)
      } catch (e) {
        console.error(e)
        toast.error('Error al cargar datos de evolución')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [club?.id, currentSeasonYear])

  const filteredPlayers = players.filter(p => {
    const age = p.age || 20
    if (activeFilter === 'YOUTH') return age <= 21
    if (activeFilter === 'PEAK') return age >= 22 && age <= 29
    if (activeFilter === 'VETERANS') return age >= 30
    return true
  })

  const historyMap = new Map((evolutionHistory || []).map(h => [h.player_id, h]))
  const retirementMap = new Map((retiringPlayers || []).map(r => [r.player_id, r]))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Desarrollo Biológico y Curva de Vida
              </h2>
              <p className="text-xs text-zinc-400">
                Picos de rendimiento, minutos oficiales en cancha y declive natural de futbolistas
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

        {/* Anuncio de Retiros Próximos si existen */}
        {retiringPlayers.length > 0 && (
          <div className="p-3.5 bg-amber-950/30 border border-amber-800/50 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {retiringPlayers.length === 1 
                  ? '1 futbolista histórico ha confirmado su retiro al finalizar el torneo.' 
                  : `${retiringPlayers.length} futbolistas históricos han confirmado su retiro.`}
              </span>
            </div>
            <span className="text-[10px] text-amber-400/80 font-bold px-2 py-0.5 rounded bg-amber-900/40">
              Último Baile
            </span>
          </div>
        )}

        {/* Selector de Filtros de Etapa Etaria */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl border transition-colors shrink-0 ${
              activeFilter === 'ALL'
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Todo el Plantel ({players.length})
          </button>
          <button
            onClick={() => setActiveFilter('YOUTH')}
            className={`px-3 py-1.5 rounded-xl border transition-colors shrink-0 ${
              activeFilter === 'YOUTH'
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Promesas & Juveniles (≤21)
          </button>
          <button
            onClick={() => setActiveFilter('PEAK')}
            className={`px-3 py-1.5 rounded-xl border transition-colors shrink-0 ${
              activeFilter === 'PEAK'
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Plenitud / Prime (22-29)
          </button>
          <button
            onClick={() => setActiveFilter('VETERANS')}
            className={`px-3 py-1.5 rounded-xl border transition-colors shrink-0 ${
              activeFilter === 'VETERANS'
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Veteranos (≥30)
          </button>
        </div>

        {/* Lista de Futbolistas y Curva de Vida */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredPlayers.length === 0 ? (
            <div className="p-8 text-center bg-zinc-950/60 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
              No hay futbolistas que coincidan con el filtro seleccionado.
            </div>
          ) : (
            filteredPlayers.map(p => {
              const isRetiring = retirementMap.has(p.id)
              const retirementInfo = retirementMap.get(p.id)
              const phaseKey = playerEvolutionApi.determineCareerPhase(p.age || 20, isRetiring)
              const phase = CAREER_PHASES[phaseKey] || CAREER_PHASES.PRIME_DEVELOPMENT
              const minutes = p.minutes_played_season || 0
              const progressMinPct = Math.min(100, Math.round((minutes / 1800) * 100))
              const hist = historyMap.get(p.id)

              let minutesBadge = 'bg-zinc-800 text-zinc-400'
              let minutesLabel = 'Sin minutos (<300)'
              if (minutes >= 1800) {
                minutesBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                minutesLabel = 'Titular indiscutido (+4 a +5 OVR)'
              } else if (minutes >= 900) {
                minutesBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                minutesLabel = 'Rodaje regular (+2 a +3 OVR)'
              } else if (minutes >= 300) {
                minutesBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                minutesLabel = 'Rotación esporádica (+1 OVR)'
              }

              return (
                <div 
                  key={p.id}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-sm shrink-0">
                        {p.shirt_number ? `#${p.shirt_number}` : '•'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{p.first_name} {p.last_name}</h4>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {p.position}
                          </span>
                          <span className="text-xs text-zinc-400">{p.age} años</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${phase.badgeColor}`}>
                            {phase.name}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            OVR: <strong className="text-white">{p.overall || p.attr_overall || 50}</strong>
                            {p.potential_rating && (
                              <span className="ml-1 text-zinc-400">/ Potencial: <strong className="text-emerald-400">{p.potential_rating}</strong></span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isRetiring && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] font-semibold self-start sm:self-center">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Retiro programado (Interés: {retirementInfo.future_role_interest === 'COACH' ? 'DT' : retirementInfo.future_role_interest === 'SCOUT' ? 'Ojeador' : 'Fisio'})</span>
                      </div>
                    )}
                  </div>

                  {/* Barra de Minutos Jugados en la Temporada (Regla 28.1) */}
                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        Minutos Oficiales: <strong className="text-white font-mono">{minutes} min</strong>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${minutesBadge}`}>
                        {minutesLabel}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          minutes >= 1800 ? 'bg-emerald-500' : minutes >= 900 ? 'bg-blue-500' : minutes >= 300 ? 'bg-amber-500' : 'bg-zinc-700'
                        }`}
                        style={{ width: `${Math.max(3, progressMinPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Historial de la última evolución anual si existe */}
                  {hist && (
                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-900">
                      <span>Último balance anual:</span>
                      <span className="flex items-center gap-1 font-bold">
                        OVR {hist.ovr_before}
                        <ChevronRight className="w-3 h-3 text-zinc-600" />
                        <span className={hist.ovr_after >= hist.ovr_before ? 'text-emerald-400' : 'text-rose-400'}>
                          OVR {hist.ovr_after} ({hist.ovr_after >= hist.ovr_before ? `+${hist.ovr_after - hist.ovr_before}` : hist.ovr_after - hist.ovr_before})
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
