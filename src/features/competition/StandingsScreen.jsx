import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { competitionApi } from '../../api/competition'
import { ArrowLeft, Trophy } from 'lucide-react'
import { toast } from 'sonner'

export default function StandingsScreen() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [standings, setStandings] = useState([])
  const [clubId, setClubId] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const user = await authApi.getSession()
        if (!user) return navigate('/auth')
        const manager = await managerApi.getManager(user.id)
        const club = await clubApi.getClubByManager(manager.id)
        setClubId(club.id)
        
        const data = await competitionApi.getStandings(club.id)
        if (data && data.length > 0) {
          setStandings(data)
        } else {
          // Generar tabla simulada de 10 equipos si no hay datos (MVP)
          const dummy = Array.from({length: 9}).map((_, i) => ({
            id: `dummy-${i}`,
            club_id: `dummy-${i}`,
            clubs: { name: `Club Rival ${i+1}`, short_name: `RIV${i+1}` },
            played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0
          }))
          dummy.push({
            id: 'my-standing',
            club_id: club.id,
            clubs: { name: club.name, short_name: club.short_name },
            played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0
          })
          setStandings(dummy.sort(() => Math.random() - 0.5))
        }
      } catch (e) {
        toast.error(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  const handleEndSeason = async () => {
    if (!window.confirm('¿Finalizar temporada? Se procesarán las edades, retiros, y se reiniciará la tabla.')) return
    
    try {
      setLoading(true)
      const { gameLoopApi } = await import('../../api/gameLoop')
      await gameLoopApi.endSeason(clubId)
      toast.success('Temporada Finalizada')
      window.location.reload()
    } catch(e) {
      toast.error(e.message)
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-emerald-500">Cargando tabla...</div>

  return (
    <div className="min-h-screen p-8 text-white bg-zinc-950">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black flex items-center gap-2 text-emerald-500">
              <Trophy className="w-8 h-8" /> TABLA DE POSICIONES
            </h1>
            <p className="text-zinc-500">Liga Regional (MVP)</p>
          </div>
        </div>
        
        <button 
          onClick={handleEndSeason}
          className="px-4 py-2 text-sm font-bold text-black transition-colors bg-emerald-500 rounded-lg hover:bg-emerald-400"
        >
          Finalizar Temporada
        </button>
      </header>

      <div className="max-w-4xl p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
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
              {standings.map((s, idx) => {
                const isMe = s.club_id === clubId
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
