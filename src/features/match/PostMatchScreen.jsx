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
import { AsyncButton } from '../../components/ui'

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
      <div className="flex flex-col items-center justify-center min-h-dvh bg-bg text-fg gap-3 p-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-accent font-medium text-sm animate-pulse">Consolidando estadísticas oficiales del encuentro...</p>
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
    <div className="min-h-dvh p-3 sm:p-6 text-fg bg-bg pb-28 md:pb-12">
      {/* Top Header & Outcome Banner */}
      <div className="max-w-4xl mx-auto space-y-4 mb-6">
        <div className="p-5 rounded-lg border border-line bg-gradient-to-br from-surface via-surface/90 to-bg text-center shadow-lg">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-fg-subtle">
            Resumen Oficial • Pitazo Final
          </span>
          <h1 className={`text-2xl sm:text-4xl font-semibold mt-1 ${isWin ? 'text-accent' : isDraw ? 'text-gold' : 'text-danger'}`}>
            {isWin ? '¡VICTORIA VICTORIOSA!' : isDraw ? 'EMPATE DISPUTADO' : 'DERROTA DOLOROSA'}
          </h1>

          {/* Marcador */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 my-4">
            <div className="text-right flex-1 min-w-0">
              <span className="text-xs text-fg-muted block font-semibold">Local</span>
              <span className="text-base sm:text-xl font-semibold text-fg truncate block">
                {isHome ? clubName || 'Tu Club' : oppName}
              </span>
            </div>

            <div className="px-4 py-1.5 rounded-xl bg-bg/80 border border-line flex items-center gap-2">
              <span className="text-2xl sm:text-4xl font-semibold text-accent">{results.homeScore}</span>
              <span className="text-fg-subtle font-light text-xl">-</span>
              <span className="text-2xl sm:text-4xl font-semibold text-accent">{results.awayScore}</span>
            </div>

            <div className="text-left flex-1 min-w-0">
              <span className="text-xs text-fg-muted block font-semibold">Visita</span>
              <span className="text-base sm:text-xl font-semibold text-fg truncate block">
                {isHome ? oppName : clubName || 'Tu Club'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-fg-muted">
            <span className="px-2.5 py-0.5 rounded-full bg-surface-3 border border-line font-medium">
              +{processedData?.xpAward || 50} XP DT
            </span>
            {isHome && (
              <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold">
                Taquilla: +${(processedData?.matchIncome || 0).toLocaleString()}
              </span>
            )}
            {mvp && (
              <span className="px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold font-semibold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" />
                MVP: {mvp.name} ({mvp.rating})
              </span>
            )}
          </div>
        </div>

        {/* 4 Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-line text-xs">
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
                    ? 'bg-accent text-accent-fg shadow-md shadow-emerald-950/40'
                    : 'bg-surface/60 text-fg-muted hover:text-fg border border-line'
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
            <div className="p-5 rounded-lg border border-line bg-surface/60 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
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
                          ? 'border-accent/50 bg-accent-soft text-accent font-bold'
                          : isRed
                          ? 'border-danger/50 bg-danger-soft text-danger'
                          : isYellow
                          ? 'border-gold/40 bg-gold-soft text-gold'
                          : 'border-line bg-bg/60 text-fg'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center font-mono font-bold text-fg shrink-0">
                        {ev.minute}'
                      </span>
                      <p className="leading-snug flex-1">{ev.text}</p>
                    </div>
                  )
                })}

                {keyEvents.length === 0 && (
                  <p className="text-fg-subtle text-xs text-center py-6">
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
            <div className="p-5 rounded-lg border border-line bg-surface/60 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent" />
                Comparativa de Rendimiento Colectivo
              </h3>

              <div className="space-y-3 text-xs">
                {/* Posesión */}
                <div>
                  <div className="flex justify-between text-fg-muted mb-1 font-semibold">
                    <span>{isHome ? clubName : oppName} ({stats.possession?.home || 50}%)</span>
                    <span>Posesión</span>
                    <span>{isHome ? oppName : clubName} ({stats.possession?.away || 50}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-3 rounded-full overflow-hidden flex">
                    <div className="bg-accent h-full" style={{ width: `${stats.possession?.home || 50}%` }} />
                    <div className="bg-accent h-full" style={{ width: `${stats.possession?.away || 50}%` }} />
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
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-bg border border-line/80">
                    <span className="font-bold text-fg w-12 text-left">{row.home}</span>
                    <span className="text-fg-muted font-medium">{row.label}</span>
                    <span className="font-bold text-fg w-12 text-right">{row.away}</span>
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
              <div className="p-4 rounded-lg border border-gold/50 bg-gradient-to-r from-gold/30 to-surface/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-semibold">
                    <Star className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gold tracking-wider">Figura de la Cancha (MVP)</span>
                    <h4 className="text-sm font-semibold text-fg">{mvp.name} (#{mvp.shirt_number})</h4>
                    <span className="text-[11px] text-fg-muted">{mvp.position} • {mvp.goals} goles • {mvp.assists} asistencias</span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-gold text-accent-fg font-semibold text-base">
                  {mvp.rating}
                </div>
              </div>
            )}

            {/* Listado de Calificaciones */}
            <div className="p-4 sm:p-5 rounded-lg border border-line bg-surface/60 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                Puntajes del Plantel
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {ratings.map(p => {
                  const ratingColor = p.rating >= 7.0 
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : p.rating >= 6.0 
                    ? 'bg-gold/10 text-gold border-gold/30'
                    : 'bg-danger/10 text-danger border-danger/30'

                  return (
                    <div 
                      key={p.player_id}
                      className="p-2.5 rounded-xl border border-line/80 bg-bg/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded bg-surface-3 text-[10px] font-bold text-fg flex items-center justify-center shrink-0">
                          {p.shirt_number}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-fg block truncate">{p.name}</span>
                          <span className="text-[10px] text-fg-subtle">
                            {p.position} • Fitness post: {p.fitness_after_match}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {p.goals > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent">
                            {p.goals}G
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-lg border font-semibold text-xs ${ratingColor}`}>
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
            <div className="p-5 rounded-lg border border-line bg-surface/60 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-accent" />
                Liquidación de Boletería y Entradas
              </h3>

              {isHome ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-bg border border-line/80 text-fg">
                    <span>Espectadores Presentes:</span>
                    <span className="font-bold text-fg">{(processedData?.attendance || 0).toLocaleString()} personas</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-bg border border-line/80 text-fg">
                    <span>Recaudación Bruta (Boletería):</span>
                    <span className="font-bold text-fg">${(processedData?.grossIncome || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-bg border border-line/80 text-fg">
                    <span>Gastos de Seguridad y Operación (15%):</span>
                    <span className="font-bold text-danger">-${(processedData?.operatingCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-accent-soft border border-accent/30 text-accent font-bold">
                    <span>Ingreso Neto Acreditado en Tesorería:</span>
                    <span>+${(processedData?.matchIncome || 0).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-bg border border-line text-xs text-fg-muted text-center">
                  El partido se disputó en condición de visitante; la recaudación de taquilla pertenece al club anfitrión.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Rueda de Prensa Oficial (Fase 24) */}
        {activeTab === 'PRENSA' && (
          <div className="space-y-4">
            <div className="p-4 sm:p-6 rounded-lg border border-line bg-surface/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-line gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-gold/10 border border-gold/20 text-gold">
                    <Mic className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-fg">Sala de Conferencias Oficial</h3>
                    <p className="text-xs text-fg-muted">Micrófonos abiertos ante los cronistas locales</p>
                  </div>
                </div>

                {!isPressFinished && (
                  <AsyncButton
                    onClick={handleDelegatePress}
                    className="px-3 py-1.5 rounded-xl border border-line bg-bg hover:bg-surface-3 text-xs text-fg font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-fg-muted" />
                    <span>Delegar en 2º Entrenador</span>
                  </AsyncButton>
                )}
              </div>

              {isPressDelegated ? (
                <div className="p-6 rounded-xl bg-bg/80 border border-line text-center space-y-2">
                  <UserCheck className="w-8 h-8 text-accent mx-auto" />
                  <p className="text-sm font-bold text-fg">Conferencia atendida por el Ayudante de Campo</p>
                  <p className="text-xs text-fg-muted">
                    Tu segundo entrenador respondió con diplomacia y cautela ante los medios sin generar polémicas. (+1 moral general)
                  </p>
                </div>
              ) : isPressFinished ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-accent-soft border border-accent/40/50 flex items-center gap-2 text-xs text-accent font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Rueda de prensa finalizada. Las declaraciones han sido publicadas en los medios.</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {pressQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="p-3.5 rounded-xl bg-bg/70 border border-line/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-fg-subtle">
                          <span className="font-semibold text-fg-muted">{q.media_outlet} • {q.journalist_name}</span>
                          <span className="uppercase font-mono font-bold text-accent">{q.chosen_tone || 'RESPONDIDA'}</span>
                        </div>
                        <p className="font-medium text-fg italic">"{q.question_text}"</p>
                        <p className="text-fg-muted pl-3 border-l-2 border-accent/50 text-[11px]">
                          "{q.manager_answer_text}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : pressQuestions.length > 0 && pressQuestions[currentQIndex] ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-fg-muted">
                    <span className="font-semibold text-accent">
                      {pressQuestions[currentQIndex].media_outlet}
                    </span>
                    <span className="font-mono text-fg-subtle">
                      Pregunta {currentQIndex + 1} de {pressQuestions.length}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-bg border border-line">
                    <p className="text-xs text-fg-muted font-semibold mb-1">
                      {pressQuestions[currentQIndex].journalist_name}:
                    </p>
                    <p className="text-sm font-medium text-fg italic">
                      "{pressQuestions[currentQIndex].question_text}"
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-fg-muted">Elige tu postura y respuesta:</p>
                    {(pressQuestions[currentQIndex].options || []).map((opt, optIdx) => {
                      const toneColors = {
                        PRAISING: 'border-accent/40 text-accent bg-accent-soft',
                        COMBATIVE: 'border-danger/40 text-danger bg-danger-soft',
                        SELF_CRITICAL: 'border-line-strong/40 text-fg-muted bg-surface-2',
                        PRAGMATIC: 'border-line text-fg bg-surface/40'
                      }
                      const toneNames = {
                        PRAISING: 'Elogioso / Motivador',
                        COMBATIVE: 'Combativo / Confrontativo',
                        SELF_CRITICAL: 'Autocrítico / Exigente',
                        PRAGMATIC: 'Cauteloso / Pragmático'
                      }

                      return (
                        <AsyncButton
                          key={optIdx}
                          onClick={() => handleSelectPressOption(pressQuestions[currentQIndex].id, opt)}
                          className="w-full p-3 text-left rounded-xl border border-line bg-bg/70 hover:border-accent/60 hover:bg-surface transition-all text-xs group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${toneColors[opt.tone] || 'border-line text-fg-muted'}`}>
                              {toneNames[opt.tone] || opt.tone}
                            </span>
                            <span className="text-[10px] text-fg-subtle">
                              Impacto moral: {opt.moraleDelta >= 0 ? `+${opt.moraleDelta}` : opt.moraleDelta}
                            </span>
                          </div>
                          <p className="text-fg group-hover:text-fg leading-snug">
                            "{opt.text}"
                          </p>
                        </AsyncButton>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-fg-subtle py-6 text-center">
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
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-line bg-surface hover:bg-surface-3 text-xs font-bold text-fg transition-colors"
          >
            Ver Tabla de Posiciones
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-accent hover:bg-accent-strong active:scale-95 text-accent-fg font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </button>
        </div>
      </main>
    </div>
  )
}
