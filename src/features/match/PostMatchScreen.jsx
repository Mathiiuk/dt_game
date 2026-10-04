import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { postMatchApi } from '../../api/postMatch'
import { pressApi } from '../../api/press'
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
  Home,
  MessageSquare,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'

export default function PostMatchScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { results, managerId, clubId, clubName, fixtureId: stateFixtureId } = location.state || {}
  // El id del fixture viaja explícito en el state (simResults no lo incluye)
  const officialFixtureId = stateFixtureId || results?.fixtureId || null

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('CRONICA') // 'CRONICA' | 'STATS' | 'RATINGS' | 'FINANCES' | 'PRENSA'
  const [processedData, setProcessedData] = useState(null)
  
  // Conferencia de Prensa (Fase 24)
  const [pressConference, setPressConference] = useState(null)
  const [pressQuestions, setPressQuestions] = useState([])
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [isPressFinished, setIsPressFinished] = useState(false)
  const [isPressDelegated, setIsPressDelegated] = useState(false)

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
        }, officialFixtureId)

        setProcessedData(processed)

        // Inicializar Rueda de Prensa procedimental (Fase 24)
        try {
          const pressRes = await pressApi.generatePostMatchConference({
            fixtureId: officialFixtureId,
            clubId,
            managerId,
            results,
            mvpPlayer: processed?.mvp || null,
            isDerby: Boolean(results.isDerby)
          })
          if (pressRes) {
            setPressConference(pressRes.conference)
            setPressQuestions(pressRes.questions || [])
            const pendingIdx = pressRes.questions.findIndex(q => !q.chosen_tone)
            if (pendingIdx !== -1) {
              setCurrentQIndex(pendingIdx)
            } else if (pressRes.questions.length > 0) {
              setIsPressFinished(true)
            }
          }
        } catch (prErr) {
          console.warn('Error iniciando conferencia de prensa:', prErr)
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

  const handleSelectPressOption = async (questionId, option) => {
    if (!pressConference) return
    try {
      const res = await pressApi.submitAnswer({
        conferenceId: pressConference.id,
        questionId,
        chosenTone: option.tone,
        answerText: option.text,
        moraleImpact: option.moraleDelta,
        clubId,
        managerId
      })
      toast.success(`Declaración emitida (${option.tone}) • Moral (${option.moraleDelta >= 0 ? '+' : ''}${option.moraleDelta})`)
      
      setPressQuestions(prev => prev.map(q => q.id === questionId ? { ...q, chosen_tone: option.tone, manager_answer_text: option.text } : q))

      if (res.isFinished || currentQIndex + 1 >= pressQuestions.length) {
        setIsPressFinished(true)
      } else {
        setCurrentQIndex(prev => prev + 1)
      }
    } catch (err) {
      toast.error(err.message || 'Error al emitir respuesta')
    }
  }

  const handleDelegatePress = async () => {
    if (!pressConference) return
    try {
      await pressApi.delegateToAssistant(pressConference.id, clubId)
      setIsPressDelegated(true)
      setIsPressFinished(true)
      toast.info('Conferencia delegada en el ayudante de campo.')
    } catch (err) {
      toast.error('Error al delegar rueda de prensa')
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
            { id: 'FINANCES', label: 'Boletería', icon: DollarSign },
            { id: 'PRENSA', label: 'Rueda de Prensa', icon: Mic }
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

        {/* Tab 4: Boletería */}
        {activeTab === 'FINANCES' && (
          <div className="space-y-4">
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
          </div>
        )}

        {/* Tab 5: Rueda de Prensa Oficial (Fase 24) */}
        {activeTab === 'PRENSA' && (
          <div className="space-y-4">
            <div className="p-4 sm:p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Mic className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Sala de Conferencias Oficial</h3>
                    <p className="text-xs text-zinc-400">Micrófonos abiertos ante los cronistas locales</p>
                  </div>
                </div>

                {!isPressFinished && (
                  <button
                    onClick={handleDelegatePress}
                    className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-xs text-zinc-300 font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Delegar en 2º Entrenador</span>
                  </button>
                )}
              </div>

              {isPressDelegated ? (
                <div className="p-6 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center space-y-2">
                  <UserCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-white">Conferencia atendida por el Ayudante de Campo</p>
                  <p className="text-xs text-zinc-400">
                    Tu segundo entrenador respondió con diplomacia y cautela ante los medios sin generar polémicas. (+1 moral general)
                  </p>
                </div>
              ) : isPressFinished ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Rueda de prensa finalizada. Las declaraciones han sido publicadas en los medios.</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {pressQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <span className="font-semibold text-zinc-400">{q.media_outlet} • {q.journalist_name}</span>
                          <span className="uppercase font-mono font-bold text-emerald-400">{q.chosen_tone || 'RESPONDIDA'}</span>
                        </div>
                        <p className="font-medium text-zinc-200 italic">"{q.question_text}"</p>
                        <p className="text-zinc-400 pl-3 border-l-2 border-emerald-500/50 text-[11px]">
                          "{q.manager_answer_text}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : pressQuestions.length > 0 && pressQuestions[currentQIndex] ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold text-emerald-400">
                      {pressQuestions[currentQIndex].media_outlet}
                    </span>
                    <span className="font-mono text-zinc-500">
                      Pregunta {currentQIndex + 1} de {pressQuestions.length}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <p className="text-xs text-zinc-400 font-semibold mb-1">
                      {pressQuestions[currentQIndex].journalist_name}:
                    </p>
                    <p className="text-sm font-medium text-white italic">
                      "{pressQuestions[currentQIndex].question_text}"
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-zinc-400">Elige tu postura y respuesta:</p>
                    {(pressQuestions[currentQIndex].options || []).map((opt, optIdx) => {
                      const toneColors = {
                        PRAISING: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20',
                        COMBATIVE: 'border-rose-500/40 text-rose-400 bg-rose-950/20',
                        SELF_CRITICAL: 'border-blue-500/40 text-blue-400 bg-blue-950/20',
                        PRAGMATIC: 'border-zinc-700 text-zinc-300 bg-zinc-900/40'
                      }
                      const toneNames = {
                        PRAISING: 'Elogioso / Motivador',
                        COMBATIVE: 'Combativo / Confrontativo',
                        SELF_CRITICAL: 'Autocrítico / Exigente',
                        PRAGMATIC: 'Cauteloso / Pragmático'
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectPressOption(pressQuestions[currentQIndex].id, opt)}
                          className="w-full p-3 text-left rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-emerald-500/60 hover:bg-zinc-900 transition-all text-xs group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${toneColors[opt.tone] || 'border-zinc-800 text-zinc-400'}`}>
                              {toneNames[opt.tone] || opt.tone}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              Impacto moral: {opt.moraleDelta >= 0 ? `+${opt.moraleDelta}` : opt.moraleDelta}
                            </span>
                          </div>
                          <p className="text-zinc-200 group-hover:text-white leading-snug">
                            "{opt.text}"
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 py-6 text-center">
                  Sin preguntas de prensa para este encuentro.
                </p>
              )}
            </div>
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
