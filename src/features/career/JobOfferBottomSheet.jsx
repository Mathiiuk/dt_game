import React from 'react'
import { Briefcase, DollarSign, Target, Calendar, Shield, X, Check, AlertCircle } from 'lucide-react'

export default function JobOfferBottomSheet({
  isOpen,
  offer,
  onClose,
  onAccept,
  onReject,
  loading = false
}) {
  if (!isOpen || !offer) return null

  const getObjectiveLabel = (obj) => {
    switch (obj) {
      case 'CHAMPION': return 'Salir Campeón del Torneo'
      case 'PROMOTION': return 'Lograr el Ascenso de Categoría'
      case 'TOP_HALF': return 'Clasificar a Playoff / Reducido'
      case 'MID_TABLE': return 'Mitad de Tabla Cómoda'
      case 'AVOID_RELEGATION': return 'Evitar el Descenso'
      default: return 'Objetivo Institucional Equilibrado'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content */}
      <div className="relative w-full max-w-lg p-5 sm:p-6 bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black animate-in slide-in-from-bottom duration-300 z-10 max-h-[90vh] overflow-y-auto">
        {/* Mobile handle indicator */}
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  Propuesta Laboral
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  Vence en {offer.weeksRemaining || 2} sem.
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                {offer.clubName}
              </h2>
              <p className="text-xs text-zinc-400">
                {offer.tierName || `Tier ${offer.tier}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conditions Summary */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Sueldo Semanal DT</span>
            </div>
            <p className="text-lg font-black text-emerald-400">
              ${Number(offer.offeredSalary || 0).toLocaleString()}
              <span className="text-xs font-normal text-zinc-500">/sem</span>
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Presupuesto Fichajes</span>
            </div>
            <p className="text-lg font-black text-white">
              ${Number(offer.budget || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Objetivo Temporada</span>
            </div>
            <p className="text-xs font-bold text-amber-300 line-clamp-2">
              {getObjectiveLabel(offer.objective)}
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Duración Contrato</span>
            </div>
            <p className="text-sm font-bold text-white">
              {offer.contractDurationYears || 1} {offer.contractDurationYears === 1 ? 'año' : 'años'}
            </p>
          </div>
        </div>

        {/* Warning note */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 mb-5 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Al firmar este contrato, concluirás tu ciclo en tu club actual y asumirás de inmediato el mando de {offer.clubName}.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => onAccept(offer)}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Firmando Contrato...' : 'Firmar Contrato Formal'}</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => onReject(offer)}
            className="w-full sm:w-auto py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs sm:text-sm transition-colors disabled:opacity-50"
          >
            Desestimar Oferta
          </button>
        </div>
      </div>
    </div>
  )
}
