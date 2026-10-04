import React, { useEffect, useState } from 'react'
import { reputationApi } from '../../api/reputation'
import { 
  Star, Award, Shield, Trophy, TrendingUp, TrendingDown, 
  X, Loader2, Sparkles, CheckCircle2, AlertCircle, HelpCircle, History 
} from 'lucide-react'

export default function ReputationHistoryModal({ isOpen, onClose, managerId }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !managerId) return

    const loadData = async () => {
      setLoading(true)
      try {
        const res = await reputationApi.getReputationProfile(managerId)
        setProfile(res)
      } catch (err) {
        console.error('Error cargando historial de reputación:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isOpen, managerId])

  if (!isOpen) return null

  const rank = profile?.rank

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl p-5 sm:p-6 bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black animate-in slide-in-from-bottom duration-300 z-10 max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-2xl shrink-0">
              <Star className="w-6 h-6 fill-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-500/30">
                  Prestigio de Carrera
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {profile?.score || 20} / 100 pts
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {rank?.title || 'Director Técnico'}
              </h2>
              <p className="text-xs text-zinc-400">
                {rank?.subtitle || 'Nivel de Reputación Oficial'}
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

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-yellow-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs text-zinc-400">Consultando libro mayor de prestigio...</span>
          </div>
        ) : (
          <div className="space-y-6 my-5">
            {/* Barra de Progreso al Próximo Rango */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-zinc-400 font-medium">
                  {rank?.nextRank ? `Próximo escalón: ${rank.nextRank.title}` : 'Máximo prestigio alcanzado'}
                </span>
                <span className="text-yellow-400 font-bold font-mono">
                  {rank?.nextRank ? `Faltan ${rank.pointsToNext} pts` : '100%'}
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-amber-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, profile?.score || 20)}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                Pico histórico de carrera: <strong className="text-zinc-300 font-mono">{profile?.peak || 20} pts</strong>
              </p>
            </div>

            {/* Beneficios Desbloqueados (Perks) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" /> Beneficios de tu Prestigio
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-3.5 rounded-2xl border ${
                  profile?.hasRefereeRespect 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-zinc-950 border-zinc-800 opacity-60'
                }`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${profile?.hasRefereeRespect ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <h4 className="text-xs font-bold text-white">Respeto Arbitral</h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Reduce un 10% las tarjetas amarillas por protestas de banco (Requiere 76+ pts).
                  </p>
                </div>

                <div className={`p-3.5 rounded-2xl border ${
                  profile?.hasSponsorBonus 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-zinc-950 border-zinc-800 opacity-60'
                }`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${profile?.hasSponsorBonus ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <h4 className="text-xs font-bold text-white">Imán de Patrocinios</h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Atrae ofertas de sponsors premium con primas económicas mayores (Requiere 60+ pts).
                  </p>
                </div>
              </div>
            </div>

            {/* Libro Mayor / Historial de Variaciones (Ledger) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-400" /> Libro Mayor de Variaciones (Ledger)
              </h3>

              {profile?.recentLedger && profile.recentLedger.length > 0 ? (
                <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950">
                  {profile.recentLedger.map((item, idx) => {
                    const delta = Number(item.delta_amount || 0)
                    const isPositive = delta > 0

                    return (
                      <div key={item.id || idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">
                              {item.description || item.event_type}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              {new Date(item.created_at).toLocaleDateString('es-AR', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-zinc-500 block font-mono">
                            Total: {item.reputation_after} pts
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-zinc-800 rounded-2xl">
                  <History className="w-6 h-6 text-zinc-700 mx-auto mb-1.5" />
                  <p className="text-xs text-zinc-500">Aún no hay movimientos registrados en el ledger</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs sm:text-sm transition-colors"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  )
}
