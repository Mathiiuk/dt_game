import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hallOfFameApi } from '../../api/hallOfFame'
import { useGameContext } from '../../context/GameContext'
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
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

export default function HallOfFameScreen() {
  const navigate = useNavigate()
  const { manager, loading: contextLoading } = useGameContext()

  const [loading, setLoading] = useState(true)
  const [ranking, setRanking] = useState([])
  const [userProjection, setUserProjection] = useState(null)
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'human' | 'titles'

  useEffect(() => {
    const load = async () => {
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
    load()
  }, [manager])

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
    <div className="min-h-screen p-3 sm:p-6 md:p-8 text-white bg-zinc-950 pb-28 md:pb-8">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => navigate('/manager')} 
            className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
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
              Récords históricos, leyendas inmortales y legado de directores técnicos
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
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {userProjection.manager.first_name} {userProjection.manager.last_name}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {userProjection.manager.club?.name || 'Club'} • Nivel {userProjection.manager.level} • Reputación {userProjection.manager.reputation}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/80 p-3 sm:p-4 rounded-2xl border border-zinc-800/80 text-center">
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
                  key={legend.id} 
                  className={`p-4 sm:p-5 rounded-2xl md:rounded-3xl border ${borderClass} flex flex-col justify-between relative shadow-lg`}
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
                      <p className="text-[10px] text-zinc-500 uppercase font-semibold">Títulos</p>
                      <p className="font-black text-amber-400 text-sm font-mono">{legend.titles_count}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-semibold">Efectividad</p>
                      <p className="font-black text-emerald-400 text-sm font-mono">{legend.win_ratio}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-semibold">Partidos</p>
                      <p className="font-black text-zinc-300 text-sm font-mono">{legend.matches_played}</p>
                    </div>
                  </div>

                  {legend.clubs_managed && legend.clubs_managed.length > 0 && (
                    <div className="text-[11px] text-zinc-400 truncate">
                      <span className="text-zinc-500 font-medium">Clubes: </span>
                      {legend.clubs_managed.join(', ')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabla General / Lista Histórica */}
      <div className="border border-zinc-800 rounded-2xl md:rounded-3xl bg-zinc-900/50 p-4 sm:p-6 shadow-xl">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" /> Clasificación Histórica Completa
        </h2>

        {restOfRanking.length === 0 && top3.length === 0 ? (
          <p className="text-center text-zinc-500 text-sm py-8">
            No se encontraron directores técnicos registrados bajo este filtro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                  <th className="pb-3 font-semibold text-center w-12">Pos</th>
                  <th className="pb-3 font-semibold">Director Técnico</th>
                  <th className="pb-3 font-semibold text-center">Títulos (Nac / Int)</th>
                  <th className="pb-3 font-semibold text-center">Partidos (G / T)</th>
                  <th className="pb-3 font-semibold text-center">Efectividad</th>
                  <th className="pb-3 font-semibold text-right">Puntaje Legado</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm divide-y divide-zinc-900/60">
                {filteredRanking.map((item, idx) => {
                  const isCurrentManager = userProjection?.manager?.id === item.manager_id
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-zinc-800/40 transition-colors ${isCurrentManager ? 'bg-amber-500/10' : ''}`}
                    >
                      <td className="py-3.5 text-center font-bold text-zinc-400">
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
                        <span className="text-[11px] text-zinc-500 ml-1">({item.national_titles} / {item.international_titles})</span>
                      </td>
                      <td className="py-3.5 text-center font-mono text-zinc-300">
                        {item.matches_won} / {item.matches_played}
                      </td>
                      <td className="py-3.5 text-center font-mono text-emerald-400 font-bold">
                        {item.win_ratio}%
                      </td>
                      <td className="py-3.5 text-right font-black text-amber-400 font-mono text-sm sm:text-base">
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

    </div>
  )
}
