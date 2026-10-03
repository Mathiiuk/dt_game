import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { postMatchApi } from '../../api/postMatch'
import { moraleApi } from '../../api/morale'
import { 
  ArrowRight, 
  Trophy, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Mic, 
  DollarSign, 
  Shield, 
  Sparkles,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

export default function PostMatchScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [xp, setXp] = useState(0)
  const [pressActive, setPressActive] = useState(false)
  const [pressAnswered, setPressAnswered] = useState(false)
  const [pressQuestion, setPressQuestion] = useState(null)
  
  const { results, managerId, clubId, clubName } = location.state || {}

  const [income, setIncome] = useState(0)

  useEffect(() => {
    if (!results) {
      navigate('/dashboard')
      return
    }
    
    // Clear any active session storage match checkpoint
    try {
      const keys = Object.keys(sessionStorage)
      keys.forEach(k => {
        if (k.startsWith('active_match_')) sessionStorage.removeItem(k)
      })
    } catch (e) {
      console.error(e)
    }

    const process = async () => {
      try {
        const isHome = results.isHome ?? true
        const { xpAward, matchIncome } = await postMatchApi.processResult(managerId, clubId, {
          homeScore: results.homeScore,
          awayScore: results.awayScore,
          isHome,
          opponentName: results.opponentName || 'Equipo Rival'
        })
        setXp(xpAward)
        setIncome(matchIncome || 0)
        
        const isWin = results.homeScore > results.awayScore
        const context = isWin ? 'post_win' : 'post_loss'
        const q = moraleApi.getPressConference(context)
        if (q) {
          setPressQuestion(q)
          setPressActive(true)
        }
      } catch (e) {
        toast.error(e.message)
      } finally {
        setLoading(false)
      }
    }
    
    process()
  }, [results, managerId, clubId, navigate])

  const handlePressAnswer = async (answerId) => {
    if (!pressQuestion) return
    try {
      const { effects } = await moraleApi.answerPressConference(managerId, clubId, pressQuestion.id, answerId)
      setPressAnswered(true)
      const moraleSign = effects.morale >= 0 ? `+${effects.morale}` : effects.morale
      const fansSign = effects.fans >= 0 ? `+${effects.fans}` : effects.fans
      toast.success(`Declaraciones emitidas: Moral (${moraleSign}), Hinchada (${fansSign})`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-400 font-medium text-sm animate-pulse">Procesando resultado del partido...</p>
      </div>
    )
  }

  const isWin = results.homeScore > results.awayScore
  const isDraw = results.homeScore === results.awayScore
  const opponentName = results.opponentName || 'Rival'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-3 sm:p-6 text-white bg-zinc-950 pb-28 md:pb-8">
      <div className="w-full max-w-xl p-4 sm:p-8 border border-zinc-800 rounded-3xl bg-zinc-900/60 shadow-2xl">
        
        {/* Outcome Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500">
            Resultado Final
          </span>
          <h1 className={`text-3xl sm:text-4xl font-black mt-1 ${isWin ? 'text-emerald-400' : isDraw ? 'text-yellow-400' : 'text-red-400'}`}>
            {isWin ? '¡VICTORIA!' : isDraw ? 'EMPATE' : 'DERROTA'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Resumen del Partido</p>
        </div>

        {/* Score Board */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-8 sm:mb-10 bg-zinc-950/70 border border-zinc-800/80 p-4 sm:p-6 rounded-2xl">
          <div className="text-center flex-1 min-w-0">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 text-emerald-400" />
            <h2 className="text-xs sm:text-sm font-bold text-white truncate">{clubName || 'Mi Club'}</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl shrink-0">
            <span className="text-3xl sm:text-5xl font-black text-white">{results.homeScore}</span>
            <span className="text-lg sm:text-2xl text-zinc-600 font-bold">-</span>
            <span className="text-3xl sm:text-5xl font-black text-white">{results.awayScore}</span>
          </div>

          <div className="text-center flex-1 min-w-0">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 text-blue-400" />
            <h2 className="text-xs sm:text-sm font-bold text-zinc-300 truncate">{opponentName}</h2>
          </div>
        </div>

        {/* Post-match Rewards / KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 sm:mb-8">
          <div className="p-3.5 border rounded-2xl bg-zinc-950/80 border-zinc-800 flex sm:flex-col justify-between items-center sm:items-start">
            <h3 className="flex items-center gap-1.5 font-bold text-xs text-zinc-400">
              <Trophy className="w-4 h-4 text-yellow-500" /> Experiencia DT
            </h3>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">+{xp} XP</p>
          </div>

          <div className="p-3.5 border rounded-2xl bg-zinc-950/80 border-zinc-800 flex sm:flex-col justify-between items-center sm:items-start">
            <h3 className="flex items-center gap-1.5 font-bold text-xs text-zinc-400">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Recaudación
            </h3>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">+${income.toLocaleString()}</p>
          </div>

          <div className="p-3.5 border rounded-2xl bg-zinc-950/80 border-zinc-800 flex sm:flex-col justify-between items-center sm:items-start">
            <h3 className="flex items-center gap-1.5 font-bold text-xs text-zinc-400">
              <Sparkles className="w-4 h-4 text-blue-400" /> Rendimiento
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              {isWin ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
              <span className="font-bold text-sm text-zinc-200">{isWin ? 'Excelente' : isDraw ? 'Aceptable' : 'A mejorar'}</span>
            </div>
          </div>
        </div>

        {/* Press Conference Section */}
        {pressActive && !pressAnswered && pressQuestion ? (
          <div className="p-4 sm:p-5 mb-6 border border-zinc-700/80 rounded-2xl bg-zinc-950/90 shadow-inner">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Mic className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">Rueda de Prensa</h3>
            </div>
            <p className="mb-4 text-xs sm:text-sm text-zinc-300 italic bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
              "{pressQuestion.question}"
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {pressQuestion.answers.map(ans => (
                <button
                  key={ans.id}
                  onClick={() => handlePressAnswer(ans.id)}
                  className="p-3 text-xs sm:text-sm font-medium text-left transition-all border rounded-xl text-zinc-300 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-emerald-500/50 hover:text-white"
                >
                  <span className="font-semibold text-white block leading-tight">{ans.label}</span>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    Tono: <span className="text-emerald-400 font-semibold">{ans.tone}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : pressAnswered ? (
          <div className="flex items-center gap-2 p-3 mb-6 border border-emerald-900/30 rounded-xl bg-emerald-950/20 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Declaraciones registradas. La prensa y afición han reaccionado.</span>
          </div>
        ) : null}

        {/* Back button */}
        <button 
          onClick={() => navigate('/dashboard')}
          disabled={pressActive && !pressAnswered}
          className="flex items-center justify-center w-full gap-2 py-3.5 sm:py-4 font-bold text-black transition-all bg-emerald-500 rounded-xl hover:bg-emerald-400 text-sm shadow-lg shadow-emerald-500/10 disabled:opacity-50"
        >
          Volver a la Oficina <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  )
}
