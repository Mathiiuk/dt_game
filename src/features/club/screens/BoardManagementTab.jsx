import React, { useState, useEffect } from 'react'
import { 
  Briefcase, 
  ShieldAlert, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Award, 
  AlertTriangle, 
  Users, 
  Target,
  Sparkles,
  MessageSquare,
  Building
} from 'lucide-react'
import { boardApi } from '../../../api/board'
import { toast } from 'sonner'

export default function BoardManagementTab({ club, manager, confirmAction, onUpdateClub }) {
  const [board, setBoard] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const loadBoardData = async () => {
    if (!club?.id) return
    try {
      setLoading(true)
      const [boardRes, meetingsRes] = await Promise.all([
        boardApi.getBoardConfidence(club.id, manager?.id),
        boardApi.getBoardMeetings(club.id)
      ])
      setBoard(boardRes)
      setMeetings(meetingsRes)
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar datos de la directiva')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBoardData()
  }, [club?.id, manager?.id])

  const handleRequestFunding = async () => {
    const confirmed = await confirmAction({
      title: 'Solicitar Aporte Extraordinario de Fondos',
      description: '¿Deseas solicitar a la Comisión Directiva una partida de emergencia de $15,000? Requerirá gastar capital político y aumentará la exigencia sobre tu gestión.',
      confirmText: 'Solicitar $15,000',
      cancelText: 'Cancelar'
    })

    if (!confirmed) return

    try {
      setActionLoading(true)
      const res = await boardApi.requestEmergencyFunding(club.id, manager?.id)
      toast.success(res.message || 'Fondos aprobados')
      if (onUpdateClub) onUpdateClub()
      await loadBoardData()
    } catch (e) {
      toast.error(e.message || 'Petición rechazada por la directiva')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-fg-muted">
        <Briefcase className="w-8 h-8 animate-pulse text-accent mb-2" />
        <p className="text-sm font-medium">Reuniéndose con la Comisión Directiva...</p>
      </div>
    )
  }

  const statusMeta = boardApi.getBoardStatusMetadata(board?.confidence_score || 70, board?.is_under_ultimatum)
  const score = board?.confidence_score || 70

  const objectiveNames = {
    AVOID_RELEGATION: 'Mantener la categoría / Luchar por la permanencia',
    MID_TABLE: 'Consolidación en mitad de tabla sin sobresaltos',
    TOP_HALF: 'Clasificar en la mitad superior de la tabla',
    PLAYOFFS: 'Alcanzar el Reducido / Playoffs de Ascenso',
    AUTOMATIC_PROMOTION: 'Pelear el Ascenso Directo',
    CHAMPION: 'Salir Campeón de la División'
  }

  return (
    <div className="space-y-6">
      {/* BANNER DE ULTIMÁTUM CRÍTICO (SI ESTÁ ACTIVO) */}
      {board?.is_under_ultimatum && (
        <div className="p-4 sm:p-5 rounded-lg bg-rose-950/40 border border-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-danger/20 text-danger shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-danger bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                Ultimátum Dirigencial Activo
              </span>
              <h3 className="text-base font-semibold text-fg mt-1">
                La directiva exige sumar {board.ultimatum_points_required} puntos
              </h3>
              <p className="text-xs text-rose-200">
                Puntos conseguidos: {board.ultimatum_points_gathered} / {board.ultimatum_points_required}. Si no cumples la meta, serás destituido al concluir el plazo.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-rose-800/40">
            <span className="text-xs text-danger">Partidos restantes</span>
            <span className="text-xl font-mono font-semibold text-danger flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {board.ultimatum_matches_remaining} {board.ultimatum_matches_remaining === 1 ? 'partido' : 'partidos'}
            </span>
          </div>
        </div>
      )}

      {/* TARJETA RESUMEN DE CONFIANZA */}
      <div className="p-4 sm:p-6 rounded-lg bg-surface/60 border border-line">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                <Briefcase className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-fg">Comisión Directiva & Presidencia</h2>
                <p className="text-xs text-fg-muted">Evaluación permanente del proyecto deportivo e institucional</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-fg-muted font-medium">Índice de Confianza</span>
              <p className="text-2xl font-semibold text-fg font-mono flex items-center justify-end gap-1.5">
                <Award className={`w-5 h-5 ${score >= 70 ? 'text-accent' : score >= 40 ? 'text-gold' : 'text-danger'}`} />
                {score}<span className="text-xs font-normal text-fg-muted">/100</span>
              </p>
            </div>
            <div className="border-l border-line pl-4 text-left">
              <span className="text-[11px] text-fg-muted font-medium">Vínculo Político</span>
              <div className="mt-0.5">
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border ${statusMeta.badgeColor}`}>
                  {statusMeta.title}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SATISFACCIÓN POR ÁREAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          {/* Rendimiento Deportivo */}
          <div className="p-4 rounded-xl bg-bg/80 border border-line/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-fg flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-accent" />
                Área Deportiva (50%)
              </span>
              <span className="text-xs font-mono font-bold text-fg">
                {board?.sports_satisfaction || 70}/100
              </span>
            </div>
            <div className="w-full bg-surface-3 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="h-2 rounded-full bg-accent transition-all duration-500"
                style={{ width: `${board?.sports_satisfaction || 70}%` }}
              />
            </div>
            <p className="text-[11px] text-fg-muted">
              Evaluada fecha a fecha según victorias, empates y derrotas.
            </p>
          </div>

          {/* Salud Financiera */}
          <div className="p-4 rounded-xl bg-bg/80 border border-line/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-fg flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-400" />
                Área Financiera (30%)
              </span>
              <span className="text-xs font-mono font-bold text-fg">
                {board?.financial_satisfaction || 70}/100
              </span>
            </div>
            <div className="w-full bg-surface-3 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${board?.financial_satisfaction || 70}%` }}
              />
            </div>
            <p className="text-[11px] text-fg-muted">
              Control del presupuesto salarial y balance de tesorería positivo.
            </p>
          </div>

          {/* Plantel y Juveniles */}
          <div className="p-4 rounded-xl bg-bg/80 border border-line/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-fg flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                Gestión de Plantel (20%)
              </span>
              <span className="text-xs font-mono font-bold text-fg">
                {board?.squad_satisfaction || 70}/100
              </span>
            </div>
            <div className="w-full bg-surface-3 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="h-2 rounded-full bg-purple-500 transition-all duration-500"
                style={{ width: `${board?.squad_satisfaction || 70}%` }}
              />
            </div>
            <p className="text-[11px] text-fg-muted">
              Oportunidades a jugadores de inferiores y armonía de vestuario.
            </p>
          </div>
        </div>
      </div>

      {/* OBJETIVO DE LA TEMPORADA Y PETICIONES AL PRESIDENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Objetivo de Temporada */}
        <div className="p-4 sm:p-5 rounded-lg bg-surface/60 border border-line flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-2 rounded-lg bg-surface-3 text-accent">
                <Target className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-fg">Objetivo Oficial de la Temporada</h3>
            </div>
            <div className="p-3.5 rounded-xl bg-bg/80 border border-line/80 mb-3">
              <span className="text-xs font-mono font-bold text-accent uppercase tracking-wide">
                Meta Institucional
              </span>
              <p className="text-sm font-semibold text-fg mt-1">
                {objectiveNames[board?.season_objective || 'MID_TABLE']}
              </p>
            </div>
            <p className="text-xs text-fg-muted">
              Cumplir o superar este objetivo a fin de año garantiza renovación automática de contrato y prima de rendimiento.
            </p>
          </div>

          <div className="pt-4 border-t border-line/60 mt-4 flex items-center justify-between text-xs text-fg-muted">
            <span>Temporada en curso</span>
            <span className="font-mono text-fg font-bold">Año {board?.season_year || 1}</span>
          </div>
        </div>

        {/* Petición al Presidente: Inyección Extraordinaria de Fondos */}
        <div className="p-4 sm:p-5 rounded-lg bg-surface/60 border border-line flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-2 rounded-lg bg-surface-3 text-accent">
                <DollarSign className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-fg">Solicitar Apoyo de Tesorería</h3>
            </div>
            <p className="text-xs text-fg-muted mb-3">
              Si el club enfrenta dificultades de liquidez para sueldos u obras, puedes solicitar formalmente una inyección extraordinaria de capital al presidente.
            </p>
            <div className="p-3 rounded-xl bg-bg/80 border border-line/80 text-xs space-y-1 mb-4">
              <p className="text-fg font-semibold">• Aporte solicitado: <span className="text-accent font-mono font-bold">$15,000</span></p>
              <p className="text-fg font-semibold">• Requisito mínimo: <span className="text-fg font-mono">Confianza {'>='} 55%</span></p>
              <p className="text-fg-muted">• Consecuencia: Mayor presión sobre el resultado del próximo fin de semana.</p>
            </div>
          </div>

          <button
            onClick={handleRequestFunding}
            disabled={actionLoading || score < 55}
            className="w-full py-2.5 px-4 bg-accent hover:bg-accent-strong disabled:opacity-50 text-accent-fg font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Petición Extraordinaria de $15,000</span>
          </button>
        </div>
      </div>

      {/* LIBRO DE REUNIONES DIRIGENCIALES Y DIÁLOGOS */}
      <div className="p-4 sm:p-5 rounded-lg bg-surface/40 border border-line">
        <h3 className="text-sm font-bold text-fg flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-accent" />
          Libro de Actas y Reuniones de Comisión Directiva
        </h3>
        {meetings.length === 0 ? (
          <p className="text-xs text-fg-subtle py-6 text-center border border-dashed border-line rounded-xl">
            Sin reuniones extraordinarias registradas hasta el momento.
          </p>
        ) : (
          <div className="space-y-3">
            {meetings.map((m) => (
              <div 
                key={m.id} 
                className="p-3.5 rounded-xl bg-bg/70 border border-line/80 text-xs"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-accent">
                    {m.meeting_reason === 'SEASON_OBJECTIVES_SET' && 'Fijación de Objetivos Anuales'}
                    {m.meeting_reason === 'CRISIS_WARNING' && 'Reunión de Alerta Financiera'}
                    {m.meeting_reason === 'ULTIMATUM_ISSUED' && 'Reunión de Crisis: Ultimátum Emitido'}
                    {m.meeting_reason === 'ULTIMATUM_SURVIVED' && 'Ratificación de Confianza: Ultimátum Superado'}
                    {m.meeting_reason === 'DISMISSAL_EXECUTED' && 'Cese de Funciones y Rescisión'}
                  </span>
                  <span className="text-[11px] text-fg-subtle">
                    {new Date(m.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="space-y-1 border-l-2 border-line pl-3 my-2">
                  <p className="text-fg">
                    <span className="text-fg-subtle font-semibold">Presidente:</span> "{m.board_statement}"
                  </p>
                  {m.manager_response && (
                    <p className="text-fg-muted italic">
                      <span className="text-fg-subtle font-semibold">DT:</span> "{m.manager_response}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
