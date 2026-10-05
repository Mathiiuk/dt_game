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
import { Button, Field, Input, ResponsiveOverlay, Select, Textarea } from '../../../components/ui'
import { AsyncButton } from '../../../components/ui'

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
        <div className="p-4 rounded-lg bg-surface border border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-danger/10 text-danger border border-danger/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-fg-muted font-medium">Bajas Médicas Activas</p>
              <h3 className="text-2xl font-semibold text-fg">{injuries.length}</h3>
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${injuries.length === 0 ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
            {injuries.length === 0 ? 'Plantel Pleno' : `${injuries.length} en camilla`}
          </span>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-fg-muted font-medium">Tiempo Medio Restante</p>
              <h3 className="text-2xl font-semibold text-fg">
                {injuries.length > 0 
                  ? (injuries.reduce((acc, curr) => acc + curr.weeks_remaining, 0) / injuries.length).toFixed(1)
                  : '0.0'} <span className="text-xs text-fg-muted font-normal">sem</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10 text-accent border border-accent/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-fg-muted font-medium">Cuerpo Médico</p>
              <h3 className="text-sm font-semibold text-fg flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4 text-accent" /> Kinesiología Activa
              </h3>
            </div>
          </div>
          <AsyncButton 
            onClick={loadInfirmary}
            disabled={loading}
            className="p-2 rounded-xl bg-surface-3 hover:bg-surface-3 text-fg transition-colors"
            title="Actualizar parte médico"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </AsyncButton>
        </div>
      </div>

      {/* Lista de Convalecientes */}
      <div className="p-5 rounded-xl bg-surface/60 border border-line space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-danger" />
            <h2 className="font-bold text-fg text-base">Parte Médico Oficial</h2>
          </div>
          <span className="text-xs text-fg-subtle">Actualizado semanalmente por el cuerpo médico</span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-fg-muted">
            <div className="w-6 h-6 border-2 border-danger border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Cargando fichas médicas...</span>
          </div>
        ) : injuries.length === 0 ? (
          <div className="p-8 rounded-lg bg-bg/60 border border-line/80 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-fg">¡Enfermería Vacía!</p>
            <p className="text-xs text-fg-muted max-w-md mx-auto">
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
                <div key={injury.id} className="p-4 rounded-lg bg-bg border border-line hover:border-line transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center font-bold text-fg text-sm">
                        {p?.shirt_number ? `#${p.shirt_number}` : <User className="w-5 h-5 text-fg-subtle" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-fg text-sm">{p?.first_name} {p?.last_name}</h4>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-3 text-fg-muted">
                            {p?.position}
                          </span>
                        </div>
                        <p className="text-xs text-danger font-medium flex items-center gap-1.5 mt-0.5">
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
                        className="px-2.5 py-1 text-[11px] font-semibold text-fg-muted hover:text-fg bg-surface hover:bg-surface-3 border border-line rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <History className="w-3 h-3" /> Ficha
                      </button>
                    </div>
                  </div>

                  {/* Barra de progreso de recuperación */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-fg-subtle">Recuperación estimada</span>
                      <span className="font-bold text-fg font-mono">
                        {injury.weeks_remaining} {injury.weeks_remaining === 1 ? 'semana restante' : 'semanas restantes'} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface overflow-hidden border border-line">
                      <div 
                        className="h-full bg-danger rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(5, progressPct)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Secuelas o detalles */}
                  {injury.permanent_attribute_loss && (
                    <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-900/40 text-[11px] text-danger flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-danger shrink-0" />
                      <span>
                        Secuela permanente documentada: {Object.entries(injury.permanent_attribute_loss).map(([attr, val]) => `${attr.toUpperCase()}: ${val}`).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Acción de Infiltración Médica */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-line">
                    <div className="text-[11px] text-fg-subtle">
                      {canInfiltrate 
                        ? 'Apto para infiltración con 50% de probabilidad de éxito.'
                        : injury.weeks_remaining > 2 
                          ? 'Infiltración desaconsejada: fase inflamatoria aguda (> 2 semanas).'
                          : 'Infiltración prohibida: daño estructural de grado alto.'}
                    </div>

                    <AsyncButton
                      disabled={!canInfiltrate || processingInfiltration === injury.id}
                      onClick={() => handleInfiltrate(injury)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        canInfiltrate 
                          ? 'bg-danger/20 text-danger border border-danger/40 hover:bg-danger/30 shadow-md' 
                          : 'bg-surface text-fg-subtle border border-line cursor-not-allowed'
                      }`}
                      title={canInfiltrate ? 'Infiltrar con anestesia para habilitar en el partido' : 'No apto para infiltración médica'}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {processingInfiltration === injury.id ? 'Infiltrando...' : 'Infiltrar (50% Riesgo)'}
                    </AsyncButton>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Ficha médica histórica */}
      {selectedPlayerHistory && (
        <ResponsiveOverlay
          title={`${selectedPlayerHistory.first_name} ${selectedPlayerHistory.last_name}`}
          description={`Ficha médica histórica · ${selectedPlayerHistory.position} · ${selectedPlayerHistory.age} años`}
          onClose={() => setSelectedPlayerHistory(null)}
          size="md"
          footer={<Button variant="outline" onClick={() => setSelectedPlayerHistory(null)}>Cerrar expediente</Button>}
        >
          <div className="space-y-2">
            {loadingHistory ? (
              <p className="py-8 text-center text-sm text-fg-muted" role="status">Cargando expediente...</p>
            ) : historyList.length === 0 ? (
              <p className="rounded-lg border border-line bg-surface-2 p-6 text-center text-sm text-fg-muted">
                Sin antecedentes de lesiones registradas en la institución.
              </p>
            ) : (
              historyList.map(h => {
                const hTier = INJURY_SEVERITY[h.severity_tier] || INJURY_SEVERITY.MINOR
                return (
                  <div key={h.id} className="space-y-1 rounded-lg border border-line bg-surface-2 p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-fg">{h.injury_type}</span>
                      <span className={`rounded border px-1.5 py-0.5 text-xs font-semibold ${hTier.badgeColor}`}>{hTier.name}</span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-x-3 text-xs text-fg-muted">
                      <span>Contexto: {h.occurred_in_context === 'MATCH' ? 'Partido' : h.occurred_in_context === 'TRAINING' ? 'Entrenamiento' : 'Infiltración'}</span>
                      <span>{h.weeks_total} semanas ({h.is_cleared ? 'Alta recibida' : `${h.weeks_remaining} sem pendientes`})</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ResponsiveOverlay>
      )}
    </div>
  )
}
