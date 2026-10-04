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
  CheckCircle2,
  BarChart3,
  Award,
  Users,
  Activity,
  HeartPulse,
  Home
} from 'lucide-react'
import { toast } from 'sonner'

export default function PostMatchScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { results, managerId, clubId, clubName } = location.state || {}

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('CRONICA') // 'CRONICA' | 'STATS' | 'RATINGS' | 'FINANCES'
  const [processedData, setProcessedData] = useState(null)
  const [pressActive, setPressActive] = useState(false)
  const [pressAnswered, setPressAnswered] = useState(false)
  const [pressQuestion, setPressQuestion] = useState(null)

  useEffect(() => {
    if (!results) {
      navigate('/dashboard')
      return
    }
    
    // Limpiar claves activas de sesión
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
        setLoading(true)
        const isHome = results.isHome ?? true
        const processed = await postMatchApi.processResult(managerId, clubId, {
          homeScore: results.homeScore,
          awayScore: results.awayScore,
          isHome,
          opponentName: results.opponentName || 'Equipo Rival',
          events: results.events || []
        }, results.fixtureId || null)

        setProcessedData(processed)

        // Conferencia de Prensa
        const isWin = (isHome && results.homeScore > results.awayScore) || (!isHome && results.awayScore > results.homeScore)
        const context = isWin ? 'post_win' : 'post_loss'
        const q = moraleApi.getPressConference(context)
        if (q) {
          setPressQuestion(q)
          setPressActive(true)
        }
      } catch (e) {
        console.error('Error procesando post-partido:', e)
        toast.error(e.message || 'Error procesando resultado.')
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
        <p className="text-emerald-400 font-medium text-sm animate-pulse">Consolidando estadísticas oficiales del encuentro...</p>
      </div>
    )
  }

  const isHome = results.isHome ?? true
  const isWin = (isHome && results.homeScore > results.awayScore) || (!isHome && results.awayScore > results.homeScore)
  const isDraw = results.homeScore === results.awayScore
  const oppName = results.opponentName || 'Equipo Rival'
  const stats = results.stats || {}
  const ratings = processedData?.playerRatings || []
  const mvp = processedData?.mvp

  const keyEvents = (results.events || []).filter(e => ['GOAL', 'CARD_RED', 'CARD_YELLOW', 'INJURY'].includes(e.type))

  return (
    <div className="min-h-screen p-3 sm:p-6 text-zinc-100 bg-zinc-950 pb-28 md:pb-12">
      {/* Top Header & Outcome Banner */}
      <div className="max-w-4xl mx-auto space-y-4 mb-6">
        <div className="p-5 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 text-center shadow-lg">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500">
            Resumen Oficial • Pitazo Final
          </span>
          <h1 className={`text-2xl sm:text-4xl font-black mt-1 ${isWin ? 'text-emerald-400' : isDraw ? 'text-amber-400' : 'text-red-400'}`}>
            {isWin ? '¡VICTORIA VICTORIOSA!' : isDraw ? 'EMPATE DISPUTADO' : 'DERROTA DOLOROSA'}
          </h1>

          {/* Marcador */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 my-4">
            <div className="text-right flex-1 min-w-0">
              <span className="text-xs text-zinc-400 block font-semibold">Local</span>
              <span className="text-base sm:text-xl font-black text-white truncate block">
                {isHome ? clubName || 'Tu Club' : oppName}
              </span>
            </div>

            <div className="px-4 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-2">
              <span className="text-2xl sm:text-4xl font-black text-emerald-400">{results.homeScore}</span>
              <span className="text-zinc-600 font-light text-xl">-</span>
              <span className="text-2xl sm:text-4xl font-black text-emerald-400">{results.awayScore}</span>
            </div>

            <div className="text-left flex-1 min-w-0">
              <span className="text-xs text-zinc-400 block font-semibold">Visita</span>
              <span className="text-base sm:text-xl font-black text-white truncate block">
                {isHome ? oppName : clubName || 'Tu Club'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 font-medium">
              +{processedData?.xpAward || 50} XP DT
            </span>
            {isHome && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                Taquilla: +${(processedData?.matchIncome || 0).toLocaleString()}
              </span>
            )}
            {mvp && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" />
                MVP: {mvp.name} ({mvp.rating})
              </span>
            )}
          </div>
        </div>

        {/* 4 Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-800 text-xs">
          {[
            { id: 'CRONICA', label: 'Crónica & Incidencias', icon: Trophy },
            { id: 'STATS', label: 'Estadísticas de Equipo', icon: BarChart3 },
            { id: 'RATINGS', label: 'Calificaciones Individuales', icon: Users },
            { id: 'FINANCES', label: 'Finanzas & Prensa', icon: DollarSign }
          ].map(tab => {
            const Icon = tab.icon
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-950/40'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <main className="max-w-4xl mx-auto">
        {/* Tab 1: Crónica & Goles */}
        {activeTab === 'CRONICA' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                Hitos y Minuto a Minuto Clave
              </h3>

              <div className="space-y-2">
                {keyEvents.map((ev, idx) => {
                  const isGoal = ev.type === 'GOAL'
                  const isRed = ev.type === 'CARD_RED'
                  const isYellow = ev.type === 'CARD_YELLOW'

                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
                        isGoal 
                          ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300 font-bold'
                          : isRed
                          ? 'border-red-500/50 bg-red-950/20 text-red-300'
                          : isYellow
                          ? 'border-amber-500/40 bg-amber-950/20 text-amber-300'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-300'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-mono font-bold text-zinc-300 shrink-0">
                        {ev.minute}'
                      </span>
                      <p className="leading-snug flex-1">{ev.text}</p>
                    </div>
                  )
                })}

                {keyEvents.length === 0 && (
                  <p className="text-zinc-500 text-xs text-center py-6">
                    Partido muy disputado y táctico sin incidencias disciplinarias graves.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Estadísticas de Equipo */}
        {activeTab === 'STATS' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Comparativa de Rendimiento Colectivo
              </h3>

              <div className="space-y-3 text-xs">
                {/* Posesión */}
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1 font-semibold">
                    <span>{isHome ? clubName : oppName} ({stats.possession?.home || 50}%)</span>
                    <span>Posesión</span>
                    <span>{isHome ? oppName : clubName} ({stats.possession?.away || 50}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${stats.possession?.home || 50}%` }} />
                    <div className="bg-cyan-500 h-full" style={{ width: `${stats.possession?.away || 50}%` }} />
                  </div>
                </div>

                {/* Métricas */}
                {[
                  { label: 'Disparos Totales', home: stats.shots?.home || 0, away: stats.shots?.away || 0 },
                  { label: 'Tiros al Arco', home: stats.shotsOnTarget?.home || 0, away: stats.shotsOnTarget?.away || 0 },
                  { label: 'Faltas Cometidas', home: stats.fouls?.home || 0, away: stats.fouls?.away || 0 },
                  { label: 'Tiros de Esquina', home: stats.corners?.home || 0, away: stats.corners?.away || 0 },
                  { label: 'Tarjetas Amarillas', home: stats.yellowCards?.home || 0, away: stats.yellowCards?.away || 0 }
                ].map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                    <span className="font-bold text-white w-12 text-left">{row.home}</span>
                    <span className="text-zinc-400 font-medium">{row.label}</span>
                    <span className="font-bold text-white w-12 text-right">{row.away}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Calificaciones Individuales */}
        {activeTab === 'RATINGS' && (
          <div className="space-y-4">
            {/* MVP Card */}
            {mvp && (
              <div className="p-4 rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/30 to-zinc-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                    <Star className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Figura de la Cancha (MVP)</span>
                    <h4 className="text-sm font-black text-white">{mvp.name} (#{mvp.shirt_number})</h4>
                    <span className="text-[11px] text-zinc-400">{mvp.position} • {mvp.goals} goles • {mvp.assists} asistencias</span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-black text-base">
                  {mvp.rating}
                </div>
              </div>
            )}

            {/* Listado de Calificaciones */}
            <div className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Puntajes del Plantel
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {ratings.map(p => {
                  const ratingColor = p.rating >= 7.0 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : p.rating >= 6.0 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'

                  return (
                    <div 
                      key={p.player_id}
                      className="p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300 flex items-center justify-center shrink-0">
                          {p.shirt_number}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-white block truncate">{p.name}</span>
                          <span className="text-[10px] text-zinc-500">
                            {p.position} • Fitness post: {p.fitness_after_match}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {p.goals > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            {p.goals}G
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-lg border font-black text-xs ${ratingColor}`}>
                          {p.rating}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Finanzas & Conferencia de Prensa */}
        {activeTab === 'FINANCES' && (
          <div className="space-y-4">
            {/* Taquilla Card */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Liquidación de Boletería y Entradas
              </h3>

              {isHome ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-zinc-300">
                    <span>Espectadores Presentes:</span>
                    <span className="font-bold text-white">{(processedData?.attendance || 0).toLocaleString()} personas</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-zinc-300">
                    <span>Recaudación Bruta (Boletería):</span>
                    <span className="font-bold text-white">${(processedData?.grossIncome || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-zinc-300">
                    <span>Gastos de Seguridad y Operación (15%):</span>
                    <span className="font-bold text-red-400">-${(processedData?.operatingCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 font-bold">
                    <span>Ingreso Neto Acreditado en Tesorería:</span>
                    <span>+${(processedData?.matchIncome || 0).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 text-center">
                  El partido se disputó en condición de visitante; la recaudación de taquilla pertenece al club anfitrión.
                </div>
              )}
            </div>

            {/* Conferencia de Prensa */}
            {pressActive && pressQuestion && (
              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-amber-400" />
                  Conferencia de Prensa Oficial
                </h3>

                <p className="text-xs text-zinc-300 font-medium italic">
                  "{pressQuestion.question}"
                </p>

                <div className="space-y-2 pt-2">
                  {pressQuestion.answers.map(ans => (
                    <button
                      key={ans.id}
                      disabled={pressAnswered}
                      onClick={() => handlePressAnswer(ans.id)}
                      className={`w-full p-2.5 text-left rounded-xl border text-xs transition-all ${
                        pressAnswered 
                          ? 'opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-500'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-200 hover:border-emerald-500 hover:bg-emerald-950/20'
                      }`}
                    >
                      <span className="font-bold text-emerald-400 block mb-0.5">{ans.label}</span>
                      <span className="text-[11px] text-zinc-400 leading-snug">{ans.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={() => navigate('/standings')}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 transition-colors"
          >
            Ver Tabla de Posiciones
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </button>
        </div>
      </main>
    </div>
  )
}
