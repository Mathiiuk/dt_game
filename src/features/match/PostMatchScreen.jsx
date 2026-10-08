import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { postMatchApi } from '../../api/postMatch'
import { pressApi } from '../../api/press'
import { useGameContext } from '../../context/GameContext'
import { outcomeOf, pressFine } from '../../domain/press'
import { formatMoney } from '../../lib/format'
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
import { AsyncButton, ClubBadge } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import PressRoom from './PressRoom'

export default function PostMatchScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { results, managerId, clubId, clubName, fixtureId: stateFixtureId } = location.state || {}
  // El id del fixture viaja explícito en el state (simResults no lo incluye)
  const officialFixtureId = stateFixtureId || results?.fixtureId || null

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('CRONICA') // 'CRONICA' | 'STATS' | 'RATINGS' | 'FINANCES'
  // Dos pasos: el resumen (estadísticas si se quieren) y después la rueda de prensa
  const [step, setStep] = useState('SUMMARY') // 'SUMMARY' | 'PRESS'
  const [processedData, setProcessedData] = useState(null)
  
  // Conferencia de Prensa (Fase 24)
  const [pressConference, setPressConference] = useState(null)
  const [pressQuestions, setPressQuestions] = useState([])
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [isPressFinished, setIsPressFinished] = useState(false)
  const [isPressDelegated, setIsPressDelegated] = useState(false)
  const [skipResult, setSkipResult] = useState(null)
  const [bingo, setBingo] = useState(null)
  const { confirmAction, refreshContext } = useGameContext()

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
        // La taquilla, la moral y el partido jugado ya están en la base: el inicio no tiene que mostrar los valores de antes
        Promise.resolve(refreshContext?.()).catch(() => {})

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
            // Una conferencia ya cerrada (terminada antes de la última pregunta) no se retoma al volver a la pantalla
            if (pressRes.conference?.status && pressRes.conference.status !== 'IN_PROGRESS') {
              setIsPressFinished(true)
            } else if (pendingIdx !== -1) {
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
        toast.error(friendlyError(e, 'Error procesando resultado.'))
      } finally {
        setLoading(false)
      }
    }
    
    process()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, managerId, clubId, navigate])

  // Responde una pregunta: la sala reacciona y el DT sigue con "Siguiente" (ver PressRoom)
  const handleSelectPressOption = async (question, option) => {
    if (!pressConference) return
    try {
      await pressApi.submitAnswer({
        conferenceId: pressConference.id,
        questionId: question.id,
        chosenTone: option.tone,
        answerText: option.text,
        moraleImpact: option.moraleDelta,
        clubId,
        managerId,
        outcome: outcomeOf(results)
      })
      setPressQuestions(prev => prev.map(q => q.id === question.id ? { ...q, chosen_tone: option.tone, manager_answer_text: option.text } : q))
    } catch (err) {
      toast.error(friendlyError(err, 'Error al emitir respuesta'))
      throw err
    }
  }

  const handleNextPress = () => {
    if (currentQIndex + 1 >= pressQuestions.length) setIsPressFinished(true)
    else setCurrentQIndex(prev => prev + 1)
  }

  const handlePhrase = async (result) => {
    try {
      await pressApi.applyPhrase({ clubId, fans: result.fans, gameDate: processedData?.gameDate || null })
      // La frase de manual tacha su cliché en el Bingo del DT
      if (result.cliche) return await pressApi.markBingo({ clubId, cliche: result.cliche })
    } catch (err) {
      console.warn('Aviso: no se pudo aplicar la frase del DT:', err)
    }
    return null
  }

  const handleHeadline = async (result) => {
    try {
      await pressApi.applyHeadline({ clubId, fans: result.fans, board: result.board })
    } catch (err) {
      console.warn('Aviso: no se pudo aplicar el titular:', err)
    }
  }

  // La cartilla del Bingo se carga al pasar a la prensa
  const openPress = async () => {
    setStep('PRESS')
    try { setBingo(await pressApi.getBingo(clubId)) } catch { /* sin cartilla se juega igual */ }
  }

  // La conferencia es obligatoria: se puede omitir, pero cuesta una multa y la prensa puede hablar de más
  const handleSkipPress = async () => {
    if (!pressConference) return
    const mine = results.isHome ? results.homeScore : results.awayScore
    const theirs = results.isHome ? results.awayScore : results.homeScore
    const { fine } = pressFine({ outcome: outcomeOf(results), goalDiff: mine - theirs })
    const confirmed = await confirmAction({
      title: 'No presentarte a la conferencia',
      description: `La federación te va a multar ${formatMoney(fine)} y la prensa puede hablar de más. ¿Seguís igual?`,
      confirmText: 'No presentarme',
      cancelText: 'Volver',
      variant: 'danger'
    })
    if (!confirmed) return false
    try {
      const res = await pressApi.skipConference({ conferenceId: pressConference.id, clubId, managerId, results, gameDate: processedData?.gameDate || null })
      setSkipResult(res)
      setIsPressFinished(true)
      return true
    } catch (err) {
      toast.error(friendlyError(err, 'No pudimos cerrar la conferencia. Probá de nuevo.'))
      return false
    }
  }

  // Después de contestar al menos una pregunta se puede cortar ahí: lo respondido queda y no hay multa
  const handleFinishPressEarly = async () => {
    if (!pressConference) return false
    try {
      await pressApi.finishEarly(pressConference.id)
      setIsPressFinished(true)
      return true
    } catch (err) {
      toast.error(friendlyError(err, 'No pudimos cerrar la conferencia. Probá de nuevo.'))
      return false
    }
  }

  // Salir de la pantalla con la conferencia sin resolver cuenta como no presentarse; si ya contestaste algo, se termina ahí
  const leaveTo = async (path) => {
    if (pressConference && !isPressFinished && !isPressDelegated) {
      const done = pressQuestions.some(q => q.chosen_tone) ? await handleFinishPressEarly() : await handleSkipPress()
      if (!done) return
    }
    navigate(path)
  }

  const handleDelegatePress = async () => {
    if (!pressConference) return
    try {
      const res = await pressApi.delegateToAssistant(pressConference.id, clubId)
      // Si ya habías contestado no se delega nada: la conferencia sigue con tus respuestas
      if (res?.alreadyAnswered) return
      setIsPressDelegated(!res?.alreadyClosed)
      setIsPressFinished(true)
      if (!res?.alreadyClosed) toast.info('Conferencia delegada en el ayudante de campo.')
    } catch (err) {
      toast.error('Error al delegar rueda de prensa')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] bg-bg text-fg gap-3 p-4">
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

  // Datos para "Titular o fake": el resultado y la figura del partido son verdaderos
  const headlineContext = { clubName: clubName || 'Tu Club', rivalName: oppName, isHome, homeScore: results.homeScore, awayScore: results.awayScore, mvpName: mvp?.name || null }

  const keyEvents = (results.events || []).filter(e => ['GOAL', 'CARD_RED', 'CARD_YELLOW', 'INJURY'].includes(e.type))

  return (
    <div className="min-h-full text-fg bg-bg p-3 sm:p-6 pb-6 lg:h-dvh lg:overflow-hidden lg:flex lg:flex-col lg:p-4">
      {/* Top Header & Outcome Banner */}
      <div className="max-w-4xl mx-auto w-full space-y-3 mb-3 shrink-0">
        <div className="p-5 rounded-lg border border-line bg-gradient-to-br from-surface via-surface/90 to-bg text-center shadow-lg">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-fg-subtle">
            Resumen oficial • Pitazo final
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

        {/* Pestañas del resumen */}
        {step === 'SUMMARY' && <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-line text-xs">
          {[
            { id: 'CRONICA', label: 'Crónica y incidencias', icon: Trophy },
            { id: 'STATS', label: 'Estadísticas de equipo', icon: BarChart3 },
            { id: 'RATINGS', label: 'Calificaciones individuales', icon: Users },
            { id: 'FINANCES', label: 'Boletería', icon: DollarSign }
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
        </div>}
      </div>

      <div className="max-w-4xl mx-auto w-full flex-1 min-h-0 flex flex-col lg:overflow-y-auto lg:overscroll-contain">
        {step === 'PRESS' && (
          <PressRoom
            questions={pressQuestions}
            currentIndex={currentQIndex}
            outcome={outcomeOf(results)}
            finished={isPressFinished}
            delegated={isPressDelegated}
            skipResult={skipResult}
            conferenceId={pressConference?.id}
            onAnswer={handleSelectPressOption}
            onNext={handleNextPress}
            onSkip={handleSkipPress}
            onDelegate={handleDelegatePress}
            onFinishEarly={handleFinishPressEarly}
            onPhrase={handlePhrase}
            onHeadline={handleHeadline}
            bingo={bingo}
            headlineContext={headlineContext}
          />
        )}

        {/* Tab 1: Crónica & Goles */}
        {step === 'SUMMARY' && activeTab === 'CRONICA' && (
          <div className="space-y-4">
            <div className="p-5 rounded-lg border border-line bg-surface/60 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
                Hitos y minuto a minuto clave
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
        {step === 'SUMMARY' && activeTab === 'STATS' && (
          <div className="space-y-4">
            <div className="p-5 rounded-lg border border-line bg-surface/60 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent" />
                Comparativa de rendimiento colectivo
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
                  { label: 'Disparos totales', home: stats.shots?.home || 0, away: stats.shots?.away || 0 },
                  { label: 'Tiros al arco', home: stats.shotsOnTarget?.home || 0, away: stats.shotsOnTarget?.away || 0 },
                  { label: 'Faltas cometidas', home: stats.fouls?.home || 0, away: stats.fouls?.away || 0 },
                  { label: 'Tiros de esquina', home: stats.corners?.home || 0, away: stats.corners?.away || 0 },
                  { label: 'Tarjetas amarillas', home: stats.yellowCards?.home || 0, away: stats.yellowCards?.away || 0 }
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
        {step === 'SUMMARY' && activeTab === 'RATINGS' && (
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
                Puntajes del plantel
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
        {step === 'SUMMARY' && activeTab === 'FINANCES' && (
          <div className="space-y-4">
            <div className="p-5 rounded-lg border border-line bg-surface/60 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-accent" />
                Liquidación de boletería y entradas
              </h3>

              {isHome ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-bg border border-line/80 text-fg">
                    <span>Espectadores presentes:</span>
                    <span className="font-bold text-fg">{(processedData?.attendance || 0).toLocaleString()} personas</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-bg border border-line/80 text-fg">
                    <span>Recaudación Bruta (Boletería):</span>
                    <span className="font-bold text-fg">${(processedData?.grossIncome || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-bg border border-line/80 text-fg">
                    <span>Gastos de seguridad y operación (15%):</span>
                    <span className="font-bold text-danger">-${(processedData?.operatingCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-accent-soft border border-accent/30 text-accent font-bold">
                    <span>Ingreso neto acreditado en tesorería:</span>
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

      </div>
      <div className="sticky bottom-0 z-10 -mx-3 mt-4 shrink-0 border-t border-line bg-bg px-3 py-3 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:mt-3 lg:px-0">
        {/* Acciones: del resumen se sigue a la prensa; al final se vuelve al inicio */}
        <div className="mx-auto flex w-full max-w-4xl flex-col sm:flex-row items-center justify-end gap-3">
          {step === 'SUMMARY' && (
            <button
              onClick={() => leaveTo('/standings')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-line bg-surface hover:bg-surface-3 text-xs font-bold text-fg transition-colors"
            >
              Ver tabla de posiciones
            </button>
          )}

          {step === 'SUMMARY' && pressConference && !isPressFinished && !isPressDelegated ? (
            <button
              onClick={openPress}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-accent hover:bg-accent-strong active:scale-95 text-accent-fg font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" />
              <span>Continuar a la rueda de prensa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => leaveTo('/dashboard')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-accent hover:bg-accent-strong active:scale-95 text-accent-fg font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Volver al inicio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
