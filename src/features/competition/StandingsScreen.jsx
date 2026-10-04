import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { competitionApi } from '../../api/competition'
import { 
  ArrowLeft, 
  Trophy, 
  Globe, 
  RefreshCw, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import { queryCache } from '../../utils/cache'

export default function StandingsScreen() {
  const navigate = useNavigate()
  const { club, loading: contextLoading, confirmAction } = useGameContext()

  const [loading, setLoading] = useState(true)
  const [standings, setStandings] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (force = false) => {
    if (!club?.id) return
    try {
      if (force) {
        setRefreshing(true)
        queryCache.invalidate(`standings:${club.id}`)
      }
      const data = await competitionApi.getStandings(club.id)
      setStandings(data || [])
    } catch (e) {
      console.error('Error cargando tabla de posiciones:', e)
      toast.error('No se pudo sincronizar la tabla de posiciones.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (contextLoading) return
    if (!club) {
      setLoading(false)
      return
    }
    loadData()
  }, [contextLoading, club?.id])

  const handleEndSeason = async () => {
    const confirmed = await confirmAction({
      title: 'Finalizar Temporada',
      description: '¿Finalizar temporada? Se procesarán las edades de los jugadores, retiros, ascensos y descensos para el próximo año.',
      confirmText: 'Finalizar Temporada',
      cancelText: 'Cancelar',
      variant: 'warning'
    })
    if (!confirmed) return
    
    try {
      setLoading(true)
      const { gameLoopApi } = await import('../../api/gameLoop')
      await gameLoopApi.endSeason(club.id)
      toast.success('Temporada regular finalizada con éxito.')
      navigate('/dashboard')
    } catch(e) {
      toast.error(e.message || 'Error al finalizar temporada.')
      setLoading(false)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-zinc-400 font-medium text-sm">Cargando clasificación oficial...</p>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-4 p-6 text-center">
        <Shield className="w-12 h-12 text-zinc-600 mb-2" />
        <p className="text-zinc-400 text-sm">No se encontró club activo en esta sesión.</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-xl text-xs">
          Volver al Inicio
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 sm:p-6 text-zinc-100 bg-zinc-950 pb-28 md:pb-12">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-emerald-400" />
              Tabla de Posiciones
            </h1>
            <p className="text-xs text-zinc-400">Torneo Regional • División Tier 5 • 20 Clubes</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            title="Recargar tabla"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button 
            onClick={() => navigate('/calendar')}
            className="px-3.5 py-2 text-xs font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Calendario</span>
          </button>

          <button 
            onClick={handleEndSeason}
            className="px-3.5 py-2 text-xs font-black text-zinc-950 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-all active:scale-95 shadow-md shadow-emerald-950/40"
          >
            Cierre Anual
          </button>
        </div>
      </header>

      {/* Main Table Container */}
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Leyenda de Zonas */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-zinc-300 font-medium">Ascenso Directo (1º - 2º)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-zinc-300 font-medium">Reducido / Playoff (3º - 6º)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-zinc-300 font-medium">Zona Descenso (18º - 20º)</span>
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 text-center w-12">Pos</th>
                  <th className="py-3 px-3 min-w-[160px]">Club</th>
                  <th className="py-3 px-2 text-center w-10">PJ</th>
                  <th className="py-3 px-2 text-center w-10">PG</th>
                  <th className="py-3 px-2 text-center w-10">PE</th>
                  <th className="py-3 px-2 text-center w-10">PP</th>
                  <th className="py-3 px-2 text-center w-14">GF:GC</th>
                  <th className="py-3 px-2 text-center w-12">DIF</th>
                  <th className="py-3 px-2 text-center w-14">Racha</th>
                  <th className="py-3 px-3 text-center w-14 text-emerald-400 font-black">PTS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800/60">
                {standings.map((s, idx) => {
                  const isUserClub = s.club_id === club.id
                  const pos = idx + 1
                  const diff = (s.goals_for || 0) - (s.goals_against || 0)

                  // Borde y fondo según zona
                  const zoneBorder = pos <= 2 
                    ? 'border-l-4 border-l-emerald-500' 
                    : pos <= 6 
                    ? 'border-l-4 border-l-cyan-500' 
                    : pos >= 18 
                    ? 'border-l-4 border-l-red-500' 
                    : 'border-l-4 border-l-transparent'

                  const forms = (s.form || 'E').split(',').filter(Boolean).slice(0, 5)

                  return (
                    <tr 
                      key={s.id || idx} 
                      className={`transition-colors hover:bg-zinc-800/40 ${zoneBorder} ${
                        isUserClub ? 'bg-emerald-950/30 font-semibold' : ''
                      }`}
                    >
                      {/* Posición */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-zinc-400">
                        {pos}
                      </td>

                      {/* Nombre Club */}
                      <td className="py-3 px-3 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <span className={`truncate font-medium ${isUserClub ? 'text-emerald-400 font-black' : 'text-zinc-200'}`}>
                            {s.clubs?.name || s.club_name || 'Club de Liga'}
                          </span>
                          {isUserClub && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500 text-zinc-950">
                              TÚ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estadísticas */}
                      <td className="py-3 px-2 text-center text-zinc-400">{s.played || 0}</td>
                      <td className="py-3 px-2 text-center text-zinc-300 font-medium">{s.won || 0}</td>
                      <td className="py-3 px-2 text-center text-zinc-400">{s.drawn || 0}</td>
                      <td className="py-3 px-2 text-center text-zinc-400">{s.lost || 0}</td>
                      <td className="py-3 px-2 text-center text-zinc-400 font-mono">
                        {s.goals_for || 0}:{s.goals_against || 0}
                      </td>
                      <td className={`py-3 px-2 text-center font-mono font-semibold ${
                        diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-zinc-400'
                      }`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>

                      {/* Racha */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {forms.map((f, fIdx) => (
                            <span 
                              key={fIdx}
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                                f === 'V' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                                f === 'E' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                                'bg-red-500/20 text-red-400 border border-red-500/40'
                              }`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Puntos */}
                      <td className="py-3 px-3 text-center font-mono font-black text-emerald-400 text-sm">
                        {s.points || 0}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
