import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { competitionApi } from '../../api/competition'
import { ArrowLeft, Trophy, Globe } from 'lucide-react'
import { toast } from 'sonner'

import { useGameContext } from '../../context/GameContext'
import { queryCache } from '../../utils/cache'

export default function StandingsScreen() {
  const navigate = useNavigate()
  const { club, loading: contextLoading, confirmAction } = useGameContext()

  const cachedStandings = club?.id ? queryCache.get(`standings:${club.id}`) : null
  const [loading, setLoading] = useState(!cachedStandings)
  const [standings, setStandings] = useState(cachedStandings || [])

  const loadData = async (force = false) => {
    try {
      if (force && club?.id) {
        queryCache.invalidate(`standings:${club.id}`)
      }
      let data = await competitionApi.getStandings(club.id)
      if (!data || data.length === 0) {
        await competitionApi.initializeLeague(club.id, club.country)
        data = await competitionApi.getStandings(club.id)
      }
      setStandings(data || [])
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
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
      description: '¿Finalizar temporada? Se procesarán las edades de los jugadores, retiros, contratos y se reiniciará la tabla de posiciones para el próximo año.',
      confirmText: 'Finalizar Temporada',
      cancelText: 'Cancelar',
      variant: 'warning'
    })
    if (!confirmed) return
    
    try {
      setLoading(true)
      const { gameLoopApi } = await import('../../api/gameLoop')
      await gameLoopApi.endSeason(club.id)
      toast.success('Temporada Finalizada')
      window.location.reload()
    } catch(e) {
      toast.error(e.message)
      setLoading(false)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-400 font-medium text-sm animate-pulse">Cargando tabla de posiciones...</p>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-4 p-6 text-center">
        <p className="text-zinc-400 text-base">No se encontró club activo para este mánager.</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-xl text-sm">
          Volver al Inicio
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 sm:p-6 md:p-8 text-white bg-zinc-950 pb-28 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-black flex items-center gap-2 text-emerald-500 leading-none mb-1">
              <Trophy className="w-5 h-5 md:w-8 md:h-8" /> TABLA DE POSICIONES
            </h1>
            <p className="text-xs md:text-sm text-zinc-500">Liga Regional (MVP)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => navigate('/international-cup')}
            className="flex-1 md:flex-initial px-4 py-2.5 md:py-2 text-xs md:text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
          >
            <Globe className="w-4 h-4 text-amber-400" />
            <span>Copa Continental</span>
          </button>
          <button 
            onClick={handleEndSeason}
            className="flex-1 md:flex-initial px-4 py-2.5 md:py-2 text-xs md:text-sm font-bold text-black transition-colors bg-emerald-500 rounded-lg hover:bg-emerald-400"
          >
            Finalizar Temporada
          </button>
        </div>
      </header>

      <div className="max-w-4xl p-3 md:p-6 border border-zinc-800 rounded-2xl md:rounded-3xl bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-zinc-500 border-zinc-800 text-sm">
                <th className="pb-3 font-medium w-12 text-center">Pos</th>
                <th className="pb-3 font-medium">Club</th>
                <th className="pb-3 font-medium text-center w-12">PJ</th>
                <th className="pb-3 font-medium text-center w-12">PG</th>
                <th className="pb-3 font-medium text-center w-12">PE</th>
                <th className="pb-3 font-medium text-center w-12">PP</th>
                <th className="pb-3 font-medium text-center w-16">GF:GC</th>
                <th className="pb-3 font-medium text-center w-12">DIF</th>
                <th className="pb-3 font-black text-emerald-500 text-center w-16">PTS</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    <Trophy className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-zinc-400">No hay datos en la tabla de posiciones</p>
                    <p className="text-xs text-zinc-600 mt-1">Pulsa reintentar para recargar la información de la liga.</p>
                    <button 
                      onClick={() => loadData(true)}
                      className="mt-3 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-xs font-bold transition-colors"
                    >
                      Reintentar Carga
                    </button>
                  </td>
                </tr>
              ) : (
                standings.map((s, idx) => {
                  const isMe = s.club_id === club.id
                  const diff = s.goals_for - s.goals_against
                  
                  return (
                    <tr key={s.id} className={`border-b border-zinc-900/50 hover:bg-zinc-800/50 ${isMe ? 'bg-emerald-950/20' : ''}`}>
                      <td className="py-3 font-bold text-zinc-400 text-center">{idx + 1}</td>
                      <td className="py-3 font-medium">
                        <span className={isMe ? 'text-emerald-400 font-bold' : 'text-white'}>
                          {s.clubs?.name}
                        </span>
                      </td>
                      <td className="py-3 text-center text-zinc-400">{s.played}</td>
                      <td className="py-3 text-center text-zinc-400">{s.won}</td>
                      <td className="py-3 text-center text-zinc-400">{s.drawn}</td>
                      <td className="py-3 text-center text-zinc-400">{s.lost}</td>
                      <td className="py-3 text-center text-zinc-500">{s.goals_for}:{s.goals_against}</td>
                      <td className={`py-3 text-center font-medium ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td className="py-3 font-black text-center text-emerald-400 text-base">{s.points}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
