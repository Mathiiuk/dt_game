import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hallOfFameApi } from '../../api/hallOfFame'
import { useGameContext } from '../../context/GameContext'
import BottomNav from '../../components/BottomNav'
import { 
  ArrowLeft, 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  Sparkles, 
  TrendingUp, 
  Shield, 
  Flame, 
  User, 
  CheckCircle2, 
  Globe2,
  Calendar,
  X,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

export default function HallOfFameScreen() {
  const navigate = useNavigate()
  const { manager, loading: contextLoading, confirmAction } = useGameContext()

  const [loading, setLoading] = useState(true)
  const [ranking, setRanking] = useState([])
  const [userProjection, setUserProjection] = useState(null)
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'human' | 'titles'
  const [selectedLegend, setSelectedLegend] = useState(null)
  const [inducting, setInducting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [rankingData, projectionData] = await Promise.all([
        hallOfFameApi.getRanking(),
        manager?.id ? hallOfFameApi.getLiveManagerProjection(manager.id) : null
      ])
      setRanking(rankingData || [])
      setUserProjection(projectionData)
    } catch (err) {
      toast.error('Error al cargar el Salón de la Fama: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [manager])

  const handleInductSelf = async () => {
    if (!manager?.id || !userProjection) return

    const confirmed = await confirmAction({
      title: 'Inmortalizar en el Salón de la Fama',
      description: `¿Deseas inmortalizar tu trayectoria actual en el Salón de la Fama con ${userProjection.estimatedScore.toLocaleString()} puntos de legado (${userProjection.tier.title})?`,
      confirmText: 'Inmortalizar Legado',
      cancelText: 'Cancelar',
      variant: 'default'
    })

    if (!confirmed) return

    try {
      setInducting(true)
      await hallOfFameApi.inductManager(manager.id)
      toast.success('¡Has sido oficialmente inducido al Salón de la Fama del Fútbol!')
      await loadData()
    } catch (err) {
      toast.error('Error al inducir al Salón de la Fama: ' + err.message)
    } finally {
      setInducting(false)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-amber-400 font-medium text-sm animate-pulse">Abriendo el Salón de la Fama...</p>
      </div>
    )
  }

  const filteredRanking = ranking.filter(entry => {
    if (filterTab === 'human') return entry.is_human
    if (filterTab === 'titles') return entry.titles_count >= 10
    return true
  })

  const top3 = filteredRanking.slice(0, 3)
  const restOfRanking = filteredRanking.slice(3)

  return (
    <div className="min-h-screen p-3 sm:p-6 md:p-8 text-white bg-zinc-950 pb-28 md:pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => navigate('/manager')} 
            className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0"
            title="Volver a Carrera"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Crown className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-amber-400 tracking-tight leading-none">
                SALÓN DE LA FAMA
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Récords históricos, leyendas inmortales y legado universal de directores técnicos
            </p>
          </div>
        </div>

        {/* Tab filters */}
        <div className="flex rounded-xl bg-zinc-900/80 p-1 border border-zinc-800 text-xs font-semibold self-start md:self-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterTab === 'all' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            Todas las Leyendas
          </button>
          <button
            onClick={() => setFilterTab('human')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterTab === 'human' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            Tus Carreras
          </button>
          <button
            onClick={() => setFilterTab('titles')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterTab === 'titles' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            +10 Títulos
          </button>
        </div>
      </header>

      {/* Tarjeta de Proyección del DT Actual */}
      {userProjection && (
        <div className="mb-8 p-4 sm:p-6 rounded-2xl md:rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-amber-500/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Trophy className="w-48 h-48 text-amber-400" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Tu Proyección en Vivo
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${userProjection.tier.color}`}>
                  {userProjection.tier.title}
                </span>
                {userProjection.isInducted && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Miembro Inducido
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {userProjection.manager.first_name} {userProjection.manager.last_name}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {userProjection.manager.club?.name || 'Club'} • Nivel {userProjection.manager.level} • Prestigio {userProjection.manager.reputation} pts
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/80 p-3 sm:p-4 rounded-2xl border border-zinc-800/80 text-center w-full sm:w-auto">
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Puntos Legado</p>
                  <p className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
                    {userProjection.estimatedScore.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Títulos Totales</p>
                  <p className="text-lg sm:text-2xl font-black text-white font-mono">
                    {userProjection.stats.totalTitles}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Efectividad</p>
                  <p className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
                    {userProjection.stats.winRatio}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Partidos Ganados</p>
                  <p className="text-lg sm:text-2xl font-black text-blue-400 font-mono">
                    {userProjection.stats.wonMatches}
                  </p>
                </div>
              </div>

              {!userProjection.isInducted && (
                <button
                  onClick={handleInductSelf}
                  disabled={inducting}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
                >
                  <Crown className="w-4 h-4" />
                  <span>{inducting ? 'Inmortalizando...' : 'Inmortalizar en Hall'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Podio Histórico (Top 3) */}
      {top3.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
            <Medal className="w-4 h-4 text-amber-400" /> Olimpo de Entrenadores
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((legend, index) => {
              const isFirst = index === 0
              const isSecond = index === 1
              const isThird = index === 2

              const borderClass = isFirst 
                ? 'border-amber-500/50 bg-gradient-to-b from-amber-500/15 via-zinc-900/60 to-zinc-950' 
                : isSecond
                  ? 'border-zinc-400/40 bg-gradient-to-b from-zinc-300/10 via-zinc-900/60 to-zinc-950'
                  : 'border-amber-700/40 bg-gradient-to-b from-amber-900/15 via-zinc-900/60 to-zinc-950'

              const medalColor = isFirst ? 'text-amber-400' : isSecond ? 'text-zinc-300' : 'text-amber-600'
              const medalLabel = isFirst ? '1º Puesto' : isSecond ? '2º Puesto' : '3º Puesto'

              return (
                <div 
                  key={legend.id || index} 
                  onClick={() => setSelectedLegend(legend)}
                  className={`p-4 sm:p-5 rounded-2xl md:rounded-3xl border ${borderClass} flex flex-col justify-between relative shadow-lg cursor-pointer hover:scale-[1.01] transition-transform`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1.5">
                      <Crown className={`w-4 h-4 ${medalColor}`} />
                      <span className={`text-xs font-bold ${medalColor}`}>{medalLabel}</span>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300">
                      {legend.legacy_score.toLocaleString()} pts
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                      {legend.manager_name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {legend.nationality} • {legend.era}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 my-4 p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-center">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">Títulos</p>
                      <p className="text-sm font-black text-amber-400 font-mono">{legend.titles_count}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">Victorias</p>
                      <p className="text-sm font-black text-blue-400 font-mono">{legend.matches_won}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">Eficacia</p>
                      <p className="text-sm font-black text-emerald-400 font-mono">{legend.win_ratio}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/60">
                    <span className="truncate">
                      {Array.isArray(legend.clubs_managed) ? legend.clubs_managed.join(', ') : 'Club'}
                    </span>
                    <span className="text-zinc-400 shrink-0 font-medium">Ver Ficha</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabla Completa de Ránking */}
      <div className="p-4 sm:p-6 rounded-2xl md:rounded-3xl bg-zinc-900/40 border border-zinc-800">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> Registro General de Directores Técnicos
        </h2>

        {filteredRanking.length === 0 ? (
          <p className="text-center text-zinc-500 text-xs py-8">No hay registros que coincidan con el filtro.</p>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="pb-3 pl-2">#</th>
                  <th className="pb-3">Entrenador</th>
                  <th className="pb-3 text-center">Títulos (Nac / Int)</th>
                  <th className="pb-3 text-center">PG / PJ</th>
                  <th className="pb-3 text-center">Efectividad</th>
                  <th className="pb-3 text-right pr-2">Puntaje Legado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredRanking.map((item, idx) => {
                  return (
                    <tr 
                      key={item.id || idx}
                      onClick={() => setSelectedLegend(item)}
                      className="hover:bg-zinc-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pl-2 font-mono font-bold text-zinc-500">
                        {idx + 1}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5">
                              {item.manager_name}
                              {item.is_human && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  TÚ
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-zinc-500">{item.nationality} • {item.era}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-center font-mono">
                        <span className="font-bold text-amber-400">{item.titles_count}</span>
                        <span className="text-[11px] text-zinc-500 ml-1">({item.national_titles || 0} / {item.international_titles || 0})</span>
                      </td>
                      <td className="py-3.5 text-center font-mono text-zinc-300">
                        {item.matches_won} / {item.matches_played}
                      </td>
                      <td className="py-3.5 text-center font-mono text-emerald-400 font-bold">
                        {item.win_ratio}%
                      </td>
                      <td className="py-3.5 text-right pr-2 font-black text-amber-400 font-mono text-sm sm:text-base">
                        {item.legacy_score.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal / Drawer de Detalle de Leyenda */}
      {selectedLegend && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-amber-400">
                <Crown className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Ficha del Entrenador Histórico</h3>
              </div>
              <button 
                onClick={() => setSelectedLegend(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xl font-black text-white">{selectedLegend.manager_name}</h4>
                <p className="text-xs text-zinc-400">
                  {selectedLegend.nationality} • {selectedLegend.era} {selectedLegend.is_human && '(Entrenador Usuario)'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Puntaje Legado</p>
                  <p className="text-xl font-black text-amber-400 font-mono">
                    {selectedLegend.legacy_score.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Títulos Totales</p>
                  <p className="text-xl font-black text-white font-mono">
                    {selectedLegend.titles_count}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Títulos Locales:</span>
                  <span className="font-bold text-white">{selectedLegend.national_titles || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Títulos Internacionales:</span>
                  <span className="font-bold text-amber-400">{selectedLegend.international_titles || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Partidos Dirigidos:</span>
                  <span className="font-bold text-white">{selectedLegend.matches_played || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Partidos Ganados:</span>
                  <span className="font-bold text-emerald-400">{selectedLegend.matches_won || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Eficacia Histórica:</span>
                  <span className="font-bold text-emerald-400">{selectedLegend.win_ratio || 0}%</span>
                </div>
              </div>

              {selectedLegend.clubs_managed?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 mb-1">Clubes Dirigidos:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLegend.clubs_managed.map((clubName, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
                        {clubName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLegend(null)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Navegación inferior persistente */}
      <BottomNav />
    </div>
  )
}
