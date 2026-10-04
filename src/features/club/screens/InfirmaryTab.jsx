import React, { useState, useEffect } from 'react'
import { 
  Stethoscope, 
  Activity, 
  HeartPulse, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  Zap, 
  Sparkles,
  User,
  History,
  FileText
} from 'lucide-react'
import { injuriesApi, INJURY_SEVERITY } from '../../../api/injuries'
import { useGameContext } from '../../../context/GameContext'
import { toast } from 'sonner'

export default function InfirmaryTab({ club }) {
  const { confirmAction } = useGameContext()
  const [injuries, setInjuries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlayerHistory, setSelectedPlayerHistory] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [processingInfiltration, setProcessingInfiltration] = useState(null)

  const loadInfirmary = async () => {
    if (!club?.id) return
    try {
      setLoading(true)
      const data = await injuriesApi.getClubInfirmary(club.id)
      setInjuries(data)
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar la enfermería del club')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInfirmary()
  }, [club?.id])

  const handleOpenHistory = async (player) => {
    setSelectedPlayerHistory(player)
    try {
      setLoadingHistory(true)
      const list = await injuriesApi.getPlayerMedicalHistory(player.id)
      setHistoryList(list)
    } catch (e) {
      toast.error('No se pudo cargar el historial médico del jugador')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleInfiltrate = async (injury) => {
    const player = injury.players
    const confirmed = await confirmAction({
      title: `Infiltración Médica: ${player?.first_name} ${player?.last_name}`,
      description: `El cuerpo médico aplicará analgesia infiltrativa para disimular el dolor. Existe un 50% de probabilidad de éxito (habilitación con 60% fitness) y un 50% de catástrofe (+10 semanas de baja y -2 permanente en velocidad y resistencia). ¿Asumes la responsabilidad como DT?`,
      confirmText: 'Autorizar Infiltración (50% Riesgo)',
      cancelText: 'Cancelar',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      setProcessingInfiltration(injury.id)
      const res = await injuriesApi.authorizeInfiltration(club.id, injury.player_id)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
      await loadInfirmary()
    } catch (err) {
      toast.error(err.message || 'Error en procedimiento médico')
    } finally {
      setProcessingInfiltration(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Fisioterapeuta y Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Bajas Médicas Activas</p>
              <h3 className="text-2xl font-black text-white">{injuries.length}</h3>
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${injuries.length === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {injuries.length === 0 ? 'Plantel Pleno' : `${injuries.length} en camilla`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Tiempo Medio Restante</p>
              <h3 className="text-2xl font-black text-white">
                {injuries.length > 0 
                  ? (injuries.reduce((acc, curr) => acc + curr.weeks_remaining, 0) / injuries.length).toFixed(1)
                  : '0.0'} <span className="text-xs text-zinc-400 font-normal">sem</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Cuerpo Médico</p>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Kinesiología Activa
              </h3>
            </div>
          </div>
          <button 
            onClick={loadInfirmary}
            disabled={loading}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="Actualizar parte médico"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Lista de Convalecientes */}
      <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-500" />
            <h2 className="font-bold text-white text-base">Parte Médico Oficial</h2>
          </div>
          <span className="text-xs text-zinc-500">Actualizado semanalmente por el cuerpo médico</span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Cargando fichas médicas...</span>
          </div>
        ) : injuries.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">¡Enfermería Vacía!</p>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Todo el plantel profesional se encuentra en condiciones médicas óptimas para disputar partidos y entrenar.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {injuries.map(injury => {
              const p = injury.players
              const tierInfo = INJURY_SEVERITY[injury.severity_tier] || INJURY_SEVERITY.MINOR
              const canInfiltrate = (injury.severity_tier === 'MINOR' || injury.severity_tier === 'MODERATE') && injury.weeks_remaining <= 2
              const progressPct = Math.round(((injury.weeks_total - injury.weeks_remaining) / (injury.weeks_total || 1)) * 100)

              return (
                <div key={injury.id} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-sm">
                        {p?.number ? `#${p.number}` : <User className="w-5 h-5 text-zinc-500" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{p?.first_name} {p?.last_name}</h4>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {p?.position}
                          </span>
                        </div>
                        <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {injury.injury_type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierInfo.badgeColor}`}>
                        {tierInfo.name}
                      </span>
                      <button
                        onClick={() => handleOpenHistory(p)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <History className="w-3 h-3" /> Ficha
                      </button>
                    </div>
                  </div>

                  {/* Barra de progreso de recuperación */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Recuperación estimada</span>
                      <span className="font-bold text-white font-mono">
                        {injury.weeks_remaining} {injury.weeks_remaining === 1 ? 'semana restante' : 'semanas restantes'} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                      <div 
                        className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(5, progressPct)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Secuelas o detalles */}
                  {injury.permanent_attribute_loss && (
                    <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-900/40 text-[11px] text-red-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                      <span>
                        Secuela permanente documentada: {Object.entries(injury.permanent_attribute_loss).map(([attr, val]) => `${attr.toUpperCase()}: ${val}`).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Acción de Infiltración Médica */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-900">
                    <div className="text-[11px] text-zinc-500">
                      {canInfiltrate 
                        ? 'Apto para infiltración con 50% de probabilidad de éxito.'
                        : injury.weeks_remaining > 2 
                          ? 'Infiltración desaconsejada: fase inflamatoria aguda (> 2 semanas).'
                          : 'Infiltración prohibida: daño estructural de grado alto.'}
                    </div>

                    <button
                      disabled={!canInfiltrate || processingInfiltration === injury.id}
                      onClick={() => handleInfiltrate(injury)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        canInfiltrate 
                          ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30 shadow-md' 
                          : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                      }`}
                      title={canInfiltrate ? 'Infiltrar con anestesia para habilitar en el partido' : 'No apto para infiltración médica'}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {processingInfiltration === injury.id ? 'Infiltrando...' : 'Infiltrar (50% Riesgo)'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Historial Clínico */}
      {selectedPlayerHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                  Ficha Médica Histórica
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {selectedPlayerHistory.first_name} {selectedPlayerHistory.last_name}
                </h3>
                <p className="text-xs text-zinc-400">
                  {selectedPlayerHistory.position} • {selectedPlayerHistory.age} años
                </p>
              </div>
              <button 
                onClick={() => setSelectedPlayerHistory(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-zinc-400">Cargando expediente...</div>
              ) : historyList.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center text-xs text-zinc-500">
                  Sin antecedentes de lesiones registradas en la institución.
                </div>
              ) : (
                historyList.map(h => {
                  const hTier = INJURY_SEVERITY[h.severity_tier] || INJURY_SEVERITY.MINOR
                  return (
                    <div key={h.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-white">{h.injury_type}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${hTier.badgeColor}`}>
                          {hTier.name}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-400 text-[11px]">
                        <span>Contexto: {h.occurred_in_context === 'MATCH' ? 'Partido' : h.occurred_in_context === 'TRAINING' ? 'Entrenamiento' : 'Infiltración'}</span>
                        <span>{h.weeks_total} semanas ({h.is_cleared ? 'Alta recibida' : `${h.weeks_remaining} sem pendientes`})</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedPlayerHistory(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
