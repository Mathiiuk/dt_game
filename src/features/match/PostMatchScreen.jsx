import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { postMatchApi } from '../../api/postMatch'
import { ArrowRight, Trophy, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

export default function PostMatchScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [xp, setXp] = useState(0)
  
  const { results, managerId, clubId, clubName } = location.state || {}

  useEffect(() => {
    if (!results) {
      navigate('/dashboard')
      return
    }
    
    const process = async () => {
      try {
        const isHome = true // Por MVP asumimos siempre local
        const { xpAward } = await postMatchApi.processResult(managerId, clubId, {
          homeScore: results.homeScore,
          awayScore: results.awayScore,
          isHome
        })
        setXp(xpAward)
      } catch (e) {
        toast.error(e.message)
      } finally {
        setLoading(false)
      }
    }
    
    process()
  }, [results, managerId, clubId, navigate])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-emerald-500">Procesando resultado...</div>

  const isWin = results.homeScore > results.awayScore
  const isDraw = results.homeScore === results.awayScore

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-zinc-950">
      <div className="w-full max-w-2xl p-8 border border-zinc-800 rounded-3xl bg-zinc-900/50">
        
        <div className="mb-8 text-center">
          <h1 className={`text-4xl font-black mb-2 ${isWin ? 'text-emerald-500' : isDraw ? 'text-yellow-500' : 'text-red-500'}`}>
            {isWin ? '¡VICTORIA!' : isDraw ? 'EMPATE' : 'DERROTA'}
          </h1>
          <p className="text-zinc-400">Resumen del Partido</p>
        </div>

        <div className="flex items-center justify-center gap-8 mb-12">
          <div className="text-center w-28">
            <h2 className="mb-2 text-xl font-bold">{clubName}</h2>
          </div>
          <div className="flex items-center gap-4 px-8 py-4 border rounded-2xl bg-zinc-950 border-zinc-800">
            <span className="text-6xl font-black">{results.homeScore}</span>
            <span className="text-3xl text-zinc-600">-</span>
            <span className="text-6xl font-black">{results.awayScore}</span>
          </div>
          <div className="text-center w-28">
            <h2 className="mb-2 text-xl font-bold">RIVAL</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="p-4 border rounded-xl bg-zinc-950 border-zinc-800">
            <h3 className="flex items-center gap-2 mb-2 font-bold text-zinc-300">
              <Trophy className="w-4 h-4 text-yellow-500" /> Experiencia DT
            </h3>
            <p className="text-2xl font-black text-emerald-400">+{xp} XP</p>
          </div>
          <div className="p-4 border rounded-xl bg-zinc-950 border-zinc-800">
            <h3 className="flex items-center gap-2 mb-2 font-bold text-zinc-300">
              <Star className="w-4 h-4 text-blue-500" /> Rendimiento
            </h3>
            <div className="flex items-center gap-2">
              {isWin ? <TrendingUp className="w-6 h-6 text-emerald-500" /> : <TrendingDown className="w-6 h-6 text-red-500" />}
              <span className="font-medium text-zinc-400">{isWin ? 'Excelente' : 'A mejorar'}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center w-full gap-2 py-4 font-bold text-black transition-transform bg-emerald-500 rounded-xl hover:bg-emerald-400 hover:scale-[1.02]"
        >
          Volver a la Oficina <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
