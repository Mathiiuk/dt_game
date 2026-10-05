import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { tacticsApi } from '../../api/tactics'
import { playerApi } from '../../api/player'
import { matchEngineApi, SHOUT_TYPES } from '../../api/matchEngine'
import { supabase } from '../../api/supabase'
import { 
  Shield, 
  Play, 
  FastForward, 
  CheckCircle, 
  ArrowLeft, 
  Flame, 
  ShieldAlert, 
  Activity, 
  Timer,
  Zap,
  BarChart3,
  Volume2
} from 'lucide-react'
import { toast } from 'sonner'
import { isFixturePlayed } from '../../domain/fixtureStatus'
import { buildMatchSquad } from '../../domain/matchSquad'

export default function MatchScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const fixtureId = location.state?.fixtureId

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ club: null, tactic: null, players: [], fixture: null })
  
  // Simulation State
  const [matchState, setMatchState] = useState('pre-match') // pre-match, playing, finished
  const [minute, setMinute] = useState(0)
  const [score, setScore] = useState({ home: 0, away: 0 })
  const [events, setEvents] = useState([])
  const [simResults, setSimResults] = useState(null)
  const [speed, setSpeed] = useState(1) // 1x, 2x, 4x
  const [activeOrder, setActiveOrder] = useState(null)
  const [savedToDb, setSavedToDb] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Vista previa del once: avisa antes del pitazo si el plantel está incompleto
  const previewSquad = data?.club && data.players?.length > 0 ? buildMatchSquad(data.players, data.tactic?.lineup) : null
  const squadNotes = previewSquad?.notes || []
  const youthNotes = squadNotes.filter(n => n.type === 'YOUTH_CALLUP')
  const injuredNotes = squadNotes.filter(n => n.type === 'INJURED_PLAYING')

  // Load initial club & fixture data
  useEffect(() => {
    const load = async () => {
      try {
        const user = await authApi.getSession()
        if (!user) return navigate('/auth')
        const manager = await managerApi.getManager(user.id)
        const club = await clubApi.getClubByManager(manager.id)
        const tactic = await tacticsApi.getTactic(club.id)
        const players = await playerApi.getSquad(club.id)
        
        let fixture = null
        if (fixtureId) {
          const { data: fix } = await supabase
            .from('fixtures')
            .select('*, home:clubs!home_team_id(*), away:clubs!away_team_id(*)')
            .eq('id', fixtureId)
            .single()
          fixture = fix
        }
        
        setData({ club, tactic, players, fixture })

        // Check if match was already in progress or completed
        const sessionKey = `active_match_${fixtureId || club.id}`
        const persisted = sessionStorage.getItem(sessionKey)

        if (persisted) {
          try {
            const parsed = JSON.parse(persisted)
            if (parsed && parsed.simResults) {
              setSimResults(parsed.simResults)
              setScore({ home: parsed.simResults.homeScore, away: parsed.simResults.awayScore })
              setEvents(parsed.simResults.events || [])
              setMinute(90)
              setMatchState('finished')
              toast.info('Partido reanudado y completado automáticamente.')
            }
          } catch (err) {
            console.error('Error restaurando estado del partido:', err)
          }
        } else if (fixture && (fixture.status === 'IN_PROGRESS' || isFixturePlayed(fixture.status))) {
          setScore({ home: fixture.home_score || 0, away: fixture.away_score || 0 })
          setMinute(90)
          setMatchState('finished')
          toast.info('Este partido ya fue disputado.')
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate, fixtureId])

  // Save match results to DB once finished
  const persistMatchResults = async (resultsToSave) => {
    if (savedToDb || !resultsToSave || !data.club) return
    setSavedToDb(true)

    try {
      const isHome = data.fixture ? data.fixture.home_team_id === data.club.id : true
      const oppName = data.fixture 
        ? (isHome ? data.fixture.away?.name : data.fixture.home?.name) 
        : 'Equipo Rival'

      await matchEngineApi.finalizeMatch(
        data.fixture?.id,
        data.club.id,
        isHome,
        oppName,
        resultsToSave.homeScore,
        resultsToSave.awayScore,
        resultsToSave.events,
        resultsToSave.stats
      )

      if (data.fixture) {
        const homeGoals = isHome ? resultsToSave.homeScore : resultsToSave.awayScore
        const awayGoals = isHome ? resultsToSave.awayScore : resultsToSave.homeScore

        const { competitionApi } = await import('../../api/competition')
        await competitionApi._updateStandings(
          data.fixture.competition_id, 
          data.fixture.home_team_id, 
          data.fixture.away_team_id, 
          homeGoals, 
          awayGoals
        )
      }
    } catch (err) {
      console.error('Error persistiendo resultado de partido:', err)
    }
  }

  const handleStartMatch = async () => {
    const awayTactic = { mentality: 'Equilibrada', build_up: 'Posesión', pressure: 'Media', tempo: 'Normal' }
    
    const opponentRep = data.fixture 
      ? (data.fixture.home_team_id === data.club.id ? (data.fixture.away?.reputation || 10) : (data.fixture.home?.reputation || 10)) 
      : 10
      
    const awayPlayers = Array.from({length: 11}).map((_, idx) => ({
      id: `rival_${idx}`,
      first_name: 'Jugador',
      last_name: `Rival #${idx + 1}`,
      position: idx === 0 ? 'GK' : (idx < 5 ? 'DEF' : (idx < 9 ? 'MED' : 'DEL')),
      state_fitness: 90, 
      attr_pace: 40 + (opponentRep * 0.5), 
      attr_shooting: 40 + (opponentRep * 0.5),
      attr_finishing: 40 + (opponentRep * 0.5), 
      attr_defending: 40 + (opponentRep * 0.5),
      attr_passing: 40 + (opponentRep * 0.5)
    }))
    
    const isHome = data.fixture ? data.fixture.home_team_id === data.club.id : true
    const oppName = data.fixture 
      ? (isHome ? data.fixture.away?.name : data.fixture.home?.name) 
      : 'Equipo Rival'
    
    // Once real que sale a la cancha: alineación del DT + reemplazos (juveniles y lesionados con penalización si faltan aptos)
    const matchSquad = buildMatchSquad(data.players, data.tactic?.lineup)
    
    const results = isHome 
      ? await matchEngineApi.startMatch(fixtureId, data.club.id, data.tactic, matchSquad.starters, awayTactic, awayPlayers)
      : await matchEngineApi.startMatch(fixtureId, data.club.id, awayTactic, awayPlayers, data.tactic, matchSquad.starters)
      
    const matchData = {
      ...results,
      isHome,
      opponentName: oppName,
      // Lesionados que jugaron: el post-partido evalúa si agravan la lesión
      injuredPlayingIds: matchSquad.injuredPlayingIds,
      // Ids de quienes salieron a la cancha (los juveniles de reemplazo no están en la base y no figuran)
      starterIds: matchSquad.starters.map(p => p.id)
    }

    setSimResults(matchData)
    setMinute(0)
    setScore({ home: 0, away: 0 })
    setEvents([])
    setMatchState('playing')

    // Persistir en sessionStorage para que F5 no reinicie el partido
    const sessionKey = `active_match_${fixtureId || data.club.id}`
    sessionStorage.setItem(sessionKey, JSON.stringify({
      simResults: matchData,
      isHome,
      oppName,
      startedAt: Date.now()
    }))
  }

  // Simular de inmediato hasta el final
  const handleSimulateToEnd = () => {
    if (!simResults) return
    setMinute(90)
    setScore({ home: simResults.homeScore, away: simResults.awayScore })
    setEvents(simResults.events || [])
    setMatchState('finished')
    persistMatchResults(simResults)
    toast.success('Partido simulado hasta el pitido final.')
  }

  // Órdenes tácticas del DT en vivo
  const handleApplyOrder = (order) => {
    setActiveOrder(order.id)
    toast.success(`Orden aplicada: ${order.label}`)
    
    const orderEvent = {
      minute: Math.max(1, minute),
      type: 'TACTIC_SHOUT',
      text: `[DT] ${order.label} - ${order.desc}`,
      team: 'home'
    }
    setEvents(prev => [orderEvent, ...prev])
  }

  // Velocidades: 1x (50ms), 2x (20ms), 4x (8ms) por minuto simulado
  const getSpeedMs = () => {
    if (speed === 4) return 8
    if (speed === 2) return 20
    return 50
  }

  // Avance del cronómetro
  useEffect(() => {
    if (matchState !== 'playing') return
    
    if (minute >= 90) {
      setMatchState('finished')
      if (simResults) {
        setScore({ home: simResults.homeScore, away: simResults.awayScore })
        persistMatchResults(simResults)
      }
      return
    }

    const interval = setTimeout(() => {
      const nextMin = minute + 1
      setMinute(nextMin)

      if (simResults?.events) {
        const eventsAtThisMinute = simResults.events.filter(e => e.minute === nextMin)
        if (eventsAtThisMinute.length > 0) {
          setEvents(prev => [...eventsAtThisMinute, ...prev])

          eventsAtThisMinute.forEach(e => {
            if (e.type === 'GOAL') {
              if (e.team === 'home') setScore(s => ({ ...s, home: s.home + 1 }))
              else if (e.team === 'away') setScore(s => ({ ...s, away: s.away + 1 }))
            }
          })
        }
      }
    }, getSpeedMs())

    return () => clearTimeout(interval)
  }, [matchState, minute, speed, simResults])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-bg text-fg gap-3 p-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-fg-muted font-medium text-sm">Preparando partido oficial...</p>
      </div>
    )
  }

  const isHome = data.fixture ? data.fixture.home_team_id === data.club?.id : true
  const oppDisplayName = data.fixture 
    ? (isHome ? data.fixture.away?.name : data.fixture.home?.name) 
    : 'Equipo Rival'

  return (
    <div className="min-h-dvh p-3 sm:p-6 text-fg bg-bg pb-20">
      {/* Header */}
      <header className="max-w-5xl mx-auto flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 transition-colors border rounded-xl border-line bg-surface hover:bg-surface-3 text-fg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-fg flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              {data.fixture ? 'Fecha Oficial de Torneo' : 'Partido Amistoso'}
            </h1>
            <p className="text-xs text-fg-muted">Dirección técnica en vivo minuto a minuto</p>
          </div>
        </div>

        {/* Speed Controls & Skip */}
        {matchState === 'playing' && (
          <div className="flex items-center gap-1 sm:gap-2">
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  speed === s 
                    ? 'bg-accent text-accent-fg shadow-md shadow-emerald-950/40' 
                    : 'bg-surface text-fg-muted border border-line hover:text-fg'
                }`}
              >
                x{s}
              </button>
            ))}

            <button
              onClick={handleSimulateToEnd}
              className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-surface-3 hover:bg-surface-3 text-fg border border-line transition-colors ml-1"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Final</span>
            </button>
          </div>
        )}
      </header>

      {/* Scoreboard Hero */}
      <div className="max-w-5xl mx-auto mb-4 p-4 sm:p-6 rounded-lg border border-line bg-gradient-to-b from-surface via-surface/90 to-bg shadow-md">
        <div className="flex items-center justify-between text-center">
          {/* Local */}
          <div className="flex-1 text-left sm:text-center">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-fg-muted tracking-wider">Local</span>
            <h2 className="text-sm sm:text-xl font-semibold text-fg truncate">
              {isHome ? data.club?.name : oppDisplayName}
            </h2>
          </div>

          {/* Marcador Central y Minuto */}
          <div className="flex flex-col items-center px-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-5xl font-semibold text-accent tracking-tighter">
                {score.home}
              </span>
              <span className="text-fg-subtle font-light text-2xl">-</span>
              <span className="text-3xl sm:text-5xl font-semibold text-accent tracking-tighter">
                {score.away}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-surface-3/80 border border-line text-xs font-mono font-bold text-fg">
              <Timer className="w-3 h-3 text-accent" />
              <span>{matchState === 'pre-match' ? "00:00" : `${minute}'`}</span>
            </div>
          </div>

          {/* Visita */}
          <div className="flex-1 text-right sm:text-center">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-fg-muted tracking-wider">Visita</span>
            <h2 className="text-sm sm:text-xl font-semibold text-fg truncate">
              {isHome ? oppDisplayName : data.club?.name}
            </h2>
          </div>
        </div>

        {/* Active DT Shout Banner */}
        {activeOrder && (
          <div className="mt-3 pt-3 border-t border-line/80 flex items-center justify-center gap-2 text-xs text-accent">
            <Volume2 className="w-3.5 h-3.5" />
            <span className="font-semibold">Orden táctica activa:</span>
            <span>{SHOUT_TYPES.find(o => o.id === activeOrder)?.label || activeOrder}</span>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Relato Minuto a Minuto */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-lg border border-line bg-surface/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-accent" />
              Relato radial en directo
            </h3>

            {simResults?.stats && (
              <button
                onClick={() => setShowStats(!showStats)}
                className="text-xs text-fg-muted hover:text-accent flex items-center gap-1"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{showStats ? 'Ver relato' : 'Ver estadísticas'}</span>
              </button>
            )}
          </div>

          {showStats && simResults?.stats ? (
            <div className="p-3 rounded-xl bg-bg/80 border border-line space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-fg-muted mb-1">
                  <span>Posesión de balón</span>
                  <span>{simResults.stats.possession.home}% - {simResults.stats.possession.away}%</span>
                </div>
                <div className="w-full h-2 bg-surface-3 rounded-full overflow-hidden flex">
                  <div className="bg-accent h-full" style={{ width: `${simResults.stats.possession.home}%` }} />
                  <div className="bg-accent h-full" style={{ width: `${simResults.stats.possession.away}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-fg">
                <div className="p-2 rounded bg-surface border border-line">
                  <span className="block text-fg-subtle text-[10px]">Tiros totales</span>
                  <span className="font-bold">{simResults.stats.shots.home} vs {simResults.stats.shots.away}</span>
                </div>
                <div className="p-2 rounded bg-surface border border-line">
                  <span className="block text-fg-subtle text-[10px]">Tiros al arco</span>
                  <span className="font-bold">{simResults.stats.shotsOnTarget.home} vs {simResults.stats.shotsOnTarget.away}</span>
                </div>
                <div className="p-2 rounded bg-surface border border-line">
                  <span className="block text-fg-subtle text-[10px]">Faltas</span>
                  <span className="font-bold">{simResults.stats.fouls.home} vs {simResults.stats.fouls.away}</span>
                </div>
                <div className="p-2 rounded bg-surface border border-line">
                  <span className="block text-fg-subtle text-[10px]">Córners</span>
                  <span className="font-bold">{simResults.stats.corners.home} vs {simResults.stats.corners.away}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 sm:h-80 overflow-y-auto space-y-2 pr-1 text-xs">
              {events.map((e, idx) => {
                const isGoal = e.type === 'GOAL'
                const isCard = e.type === 'CARD_YELLOW' || e.type === 'CARD_RED'
                const isShout = e.type === 'TACTIC_SHOUT'

                return (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                      isGoal 
                        ? 'bg-accent-soft border-accent/50 text-accent font-bold'
                        : isCard
                        ? 'bg-gold-soft border-gold/40 text-gold'
                        : isShout
                        ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300 italic'
                        : 'bg-bg/60 border-line text-fg'
                    }`}
                  >
                    <span className="text-fg-subtle font-mono font-bold shrink-0">{e.minute}'</span>
                    <span className="leading-relaxed">{e.text}</span>
                  </div>
                )
              })}

              {events.length === 0 && matchState !== 'pre-match' && (
                <div className="h-full flex items-center justify-center text-center text-fg-subtle text-xs italic">
                  Balón en disputa, equipos midiendo fuerzas en el campo...
                </div>
              )}

              {events.length === 0 && matchState === 'pre-match' && (
                <div className="h-full flex items-center justify-center text-center text-fg-subtle text-xs italic">
                  Equipos en vestuarios finalizando la charla táctica.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Lateral: Órdenes del DT */}
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-lg border border-line bg-surface/60 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted">
              Dirección técnica
            </h3>

            {matchState === 'pre-match' && squadNotes.length > 0 && (
              <div className="p-3 rounded-xl border border-gold/40 bg-gold/10 text-[11px] text-gold space-y-1.5" role="status">
                <p className="font-bold uppercase tracking-wider text-gold">Plantel incompleto</p>
                {youthNotes.length > 0 && (
                  <p>Se convocan {youthNotes.length} juvenil(es) de la cantera para completar el once (rendimiento bajo).</p>
                )}
                {injuredNotes.length > 0 && (
                  <p>
                    Jugarán lesionados: {injuredNotes.map(n => n.name).join(', ')}. Rinden un 20% menos y tienen un 35% de
                    riesgo de empeorar la lesión.
                  </p>
                )}
              </div>
            )}

            {matchState === 'pre-match' ? (
              <button 
                onClick={handleStartMatch}
                className="w-full py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-accent hover:bg-accent-strong text-accent-fg transition-all active:scale-95 shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Comenzar partido</span>
              </button>
            ) : matchState === 'playing' ? (
              <div className="space-y-2">
                <span className="text-[11px] text-fg-muted block mb-1">Gritos y arengas desde el banco:</span>
                {SHOUT_TYPES.map(order => {
                  const isSelected = activeOrder === order.id
                  return (
                    <button 
                      key={order.id}
                      onClick={() => handleApplyOrder(order)}
                      className={`w-full p-2.5 text-left rounded-xl border text-xs transition-all ${
                        isSelected 
                          ? 'border-accent bg-accent-soft text-accent font-bold'
                          : 'border-line bg-bg/60 text-fg hover:border-line'
                      }`}
                    >
                      <span className="block font-bold">{order.label}</span>
                      <span className="text-[10px] text-fg-subtle">{order.desc}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <button 
                onClick={() => {
                  const sessionKey = `active_match_${fixtureId || data.club?.id}`
                  sessionStorage.removeItem(sessionKey)

                  navigate('/post-match', { 
                    state: { 
                      results: simResults, 
                      fixtureId: fixtureId || null, 
                      managerId: data.club?.manager_id, 
                      clubId: data.club?.id, 
                      clubName: data.club?.name 
                    } 
                  })
                }}
                className="w-full py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-accent hover:bg-accent-strong text-accent-fg transition-all active:scale-95 shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Continuar al resumen</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
