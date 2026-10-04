import React, { useState } from 'react'
import { 
  Trophy, 
  Award, 
  Sparkles, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  Users, 
  TrendingUp, 
  X, 
  Building2,
  Landmark,
  UserMinus,
  Crown
} from 'lucide-react'
import { seasonCloseApi } from '../../api/seasonClose'
import { useGameContext } from '../../context/GameContext'
import { toast } from 'sonner'

export default function SeasonCloseModal({ 
  club, 
  manager, 
  careerId, 
  seasonYear = 2026, 
  onClose, 
  onSuccess 
}) {
  const { refreshContext } = useGameContext()
  const [closing, setClosing] = useState(false)
  const [closedSummary, setClosedSummary] = useState(null)

  const handleExecuteClose = async () => {
    try {
      setClosing(true)
      const res = await seasonCloseApi.executeSeasonClose({
        careerId: careerId || club?.career_id,
        clubId: club.id,
        seasonYear
      })

      setClosedSummary(res)
      toast.success('¡Temporada cerrada con éxito! La nueva temporada ha comenzado.')
      if (typeof refreshContext === 'function') await refreshContext()
      if (onSuccess) onSuccess(res)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Error al procesar el cierre de temporada')
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        {/* Header con Copa o Galardón */}
        <div className="text-center space-y-2 border-b border-zinc-800 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-zinc-950 mx-auto shadow-xl shadow-amber-500/20">
            <Trophy className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block">
            Gala de Fin de Temporada {seasonYear}
          </span>
          <h2 className="text-2xl font-black text-white">
            Balance Deportivo e Histórico
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            El torneo oficial ha concluido. La federación y la comisión directiva hacen balance de las metas alcanzadas y preparan el nuevo ciclo.
          </p>
        </div>

        {/* Contenido / Resumen */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Recompensa y Finanzas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Landmark className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Premios Federativos</span>
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                +$60,000 <span className="text-xs text-zinc-400 font-normal">USD</span>
              </p>
              <p className="text-[11px] text-zinc-500">
                Abono inmediato a la tesorería por mérito deportivo en el campeonato.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="font-semibold">Presupuesto Próximo Año</span>
              </div>
              <p className="text-2xl font-black text-blue-400 font-mono">
                +80% <span className="text-xs text-zinc-400 font-normal">Masa Salarial</span>
              </p>
              <p className="text-[11px] text-zinc-500">
                Aprobado por presidencia para competir en el nuevo escenario deportivo.
              </p>
            </div>
          </div>

          {/* Medidas Automáticas de la Federación (Reglas Maestras) */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2.5">
            <h3 className="font-bold text-white text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Consecuencias Automáticas del Cierre
            </h3>
            <ul className="space-y-2 text-zinc-300 text-[11px]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Snapshot Inmutable:</strong> La tabla de posiciones se congela de por vida en los archivos históricos del fútbol.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Evolución y Maduración:</strong> Todo el plantel cumple 1 año biológico más. Los juveniles progresan según minutos y los veteranos acusan el paso del tiempo.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Desvinculación de Contratos Vencidos:</strong> Los jugadores sin acuerdo de renovación quedan en libertad de acción sin coste de indemnización.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Apertura del Mercado:</strong> El reloj pasa a la Semana 1 del año {seasonYear + 1} con el libro de transferencias de pretemporada activo.</span>
              </li>
            </ul>
          </div>

          {/* Resultado tras cerrar si ya se ejecutó */}
          {closedSummary && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-2 text-emerald-300">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>¡Transición de Temporada Completada!</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Se archivó el snapshot oficial. Tu nuevo balance en caja es de ${Number(closedSummary.newBudget || 0).toLocaleString()} USD. ¡Bienvenido a la temporada {closedSummary.newSeasonYear}!
              </p>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
          >
            {closedSummary ? 'Volver al Menú' : 'Revisar Plantel'}
          </button>

          {!closedSummary ? (
            <button
              disabled={closing}
              onClick={handleExecuteClose}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              {closing ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Procesando Cierre Anual...</span>
                </>
              ) : (
                <>
                  <span>Cerrar Temporada & Abrir Nuevo Año</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs hover:bg-emerald-400 transition-all"
            >
              Comenzar Pretemporada
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
