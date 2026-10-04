import React, { useState, useEffect } from 'react'
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Shield, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Medal, 
  Swords, 
  Building2, 
  X,
  CheckCircle2,
  DollarSign,
  Tv
} from 'lucide-react'
import { competitionTiersApi, LEAGUE_TIERS } from '../../api/competitionTiers'
import { toast } from 'sonner'

export default function LeaguePyramidModal({ club, currentTier = 5, careerId, seasonYear = 2026, onClose }) {
  const [activeTab, setActiveTab] = useState('pyramid') // 'pyramid' | 'playoffs'
  const [pyramidList, setPyramidList] = useState([])
  const [playoffs, setPlayoffs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [pyr, ply] = await Promise.all([
          competitionTiersApi.getLeaguePyramid(),
          careerId ? competitionTiersApi.getPlayoffFixtures(careerId, seasonYear) : []
        ])
        setPyramidList(pyr)
        setPlayoffs(ply)
      } catch (e) {
        console.error(e)
        toast.error('Error al cargar la pirámide de ligas')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [careerId, seasonYear])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Estructura Piramidal del Fútbol Nacional
              </h2>
              <p className="text-xs text-zinc-400">
                5 divisiones oficiales, 3 boletos de ascenso (2 directos + 1 reducido) y descensos
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

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pyramid')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'pyramid'
                ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mapa Piramidal (5 Tiers)</span>
          </button>
          <button
            onClick={() => setActiveTab('playoffs')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'playoffs'
                ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Torneo Reducido / Playoffs</span>
          </button>
        </div>

        {/* Contenido Pirámide */}
        {activeTab === 'pyramid' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {pyramidList.map((tier) => {
              const isCurrent = (club?.league_tier || currentTier) === tier.tier_level
              const meta = LEAGUE_TIERS[tier.tier_level] || {}

              return (
                <div 
                  key={tier.tier_level}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    isCurrent 
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                      : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border ${
                        tier.tier_level === 1 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                        tier.tier_level === 2 ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                        tier.tier_level === 3 ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                        tier.tier_level === 4 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      }`}>
                        T{tier.tier_level}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{tier.tier_name}</h4>
                          {isCurrent && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-black">
                              Tu División Actual
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{meta.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs self-start sm:self-center">
                      <span className="text-zinc-500">20 Equipos</span>
                    </div>
                  </div>

                  {/* Badges de Ascensos y Descensos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-900 text-[11px]">
                    <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-center gap-1.5 text-emerald-400">
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      <span>{tier.automatic_promotions} Ascensos Directos</span>
                    </div>

                    <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-center gap-1.5 text-blue-400">
                      <Swords className="w-3.5 h-3.5 shrink-0" />
                      <span>{tier.playoff_promotions ? '1 Boleto por Reducido' : 'Sin Reducido'}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-center gap-1.5 text-rose-400">
                      <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                      <span>{tier.relegations_count ? `${tier.relegations_count} Descensos` : 'Sin Descensos (Base)'}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-center gap-1.5 text-zinc-300 font-mono">
                      <Tv className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>${Number(tier.base_tv_revenue_weekly || 400).toLocaleString()}/sem TV</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Contenido Playoffs / Reducido */}
        {activeTab === 'playoffs' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Swords className="w-4 h-4 text-emerald-400" />
                Reglamento del Torneo Reducido
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Los clubes que finalizan en los <strong>puestos 3°, 4°, 5° y 6°</strong> de la tabla de posiciones disputan la liguilla por el tercer ascenso de categoría a partido único.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-900 text-[11px] text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Semifinal 1: 3° de la tabla vs 6°</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Semifinal 2: 4° de la tabla vs 5°</span>
                </div>
              </div>
            </div>

            {playoffs.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950/60 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
                Las llaves del Torneo Reducido se activan automáticamente al concluir las 38 fechas del campeonato de liga.
              </div>
            ) : (
              <div className="space-y-2">
                {playoffs.map(f => (
                  <div key={f.id} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {f.round_name === 'FINAL' ? 'Gran Final del Reducido' : 'Semifinal'}
                      </span>
                      <p className="font-bold text-white text-sm mt-1">
                        {f.home_club?.name || 'Local'} vs {f.away_club?.name || 'Visitante'}
                      </p>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-base font-black text-white">
                        {f.home_score} - {f.away_score}
                      </span>
                      {f.penalty_home_score != null && (
                        <p className="text-[10px] text-emerald-400">
                          (Pen: {f.penalty_home_score} - {f.penalty_away_score})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
