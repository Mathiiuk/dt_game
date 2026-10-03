import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { tacticsApi } from '../../api/tactics'
import { playerApi } from '../../api/player'
import { simulateMatch } from '../../api/matchEngine'
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
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

const TACTICAL_ORDERS = [
  { id: 'attack', label: '¡Todos al Ataque!', icon: Flame, color: 'text-red-400 border-red-500/40 bg-red-950/30 hover:bg-red-900/40', text: 'Adelanten las líneas y busquen el gol con agresividad.' },
  { id: 'defend', label: '¡Colgarse del Travesaño!', icon: ShieldAlert, color: 'text-blue-400 border-blue-500/40 bg-blue-950/30 hover:bg-blue-900/40', text: 'Replieguen filas, cerrojo defensivo y rechacen todo.' },
  { id: 'press', label: '¡Presión Asfixiante!', icon: Zap, color: 'text-amber-400 border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40', text: 'Presión alta y asfixiante sobre la salida rival.' },
  { id: 'possession', label: '¡Pausa y Posesión!', icon: Activity, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40', text: 'Mover el balón de lado a lado y dormir el partido.' }
]

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

  const matchKey = fixtureId ? `fixture_${fixtureId}` : 'friendly'

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

        // Check if a match was already in progress before a browser refresh
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
              toast.info('Partido completado automáticamente tras recargar la página.')
            }
          } catch (err) {
            console.error('Error restoring match state from session', err)
          }
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

      // Historial local del club
      await supabase.from('match_history').insert({
        club_id: data.club.id,
        opponent_name: oppName,
        home_score: resultsToSave.homeScore,
        away_score: resultsToSave.awayScore,
        is_home: isHome,
        match_date: data.club.game_date
      })

      // Si es de torneo oficial, actualizar fixtures y standings
      if (data.fixture) {
        const homeGoals = isHome ? resultsToSave.homeScore : resultsToSave.awayScore
        const awayGoals = isHome ? resultsToSave.awayScore : resultsToSave.homeScore
        
        await supabase.from('fixtures')
          .update({ status: 'PLAYED', home_score: homeGoals, away_score: awayGoals })
          .eq('id', data.fixture.id)
          
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
      console.error('Error saving match results', err)
    }
  }

  const handleStartMatch = () => {
    const awayTactic = { mentality: 'Equilibrada', build_up: 'Posesión', pressure: 'Media', tempo: 'Normal' }
    
    const opponentRep = data.fixture 
      ? (data.fixture.home_team_id === data.club.id ? (data.fixture.away?.reputation || 10) : (data.fixture.home?.reputation || 10)) 
      : 10
      
    const awayPlayers = Array.from({length: 11}).map(() => ({
      state_fitness: 90, 
      attr_pace: 40 + (opponentRep * 0.5), 
      attr_finishing: 40 + (opponentRep * 0.5), 
      attr_defending: 40 + (opponentRep * 0.5)
    }))
    
    const isHome = data.fixture ? data.fixture.home_team_id === data.club.id : true
    const oppName = data.fixture 
      ? (isHome ? data.fixture.away?.name : data.fixture.home?.name) 
      : 'Equipo Rival'
    
    const results = isHome 
      ? simulateMatch(data.tactic, data.players, awayTactic, awayPlayers)
      : simulateMatch(awayTactic, awayPlayers, data.tactic, data.players)
      
    const matchData = {
      ...results,
      isHome,
      opponentName: oppName
    }

    setSimResults(matchData)
    setMinute(0)
    setScore({ home: 0, away: 0 })
    setEvents([])
    setMatchState('playing')

    // Persist in sessionStorage so refresh does NOT reset match
    const sessionKey = `active_match_${fixtureId || data.club.id}`
    sessionStorage.setItem(sessionKey, JSON.stringify({
      simResults: matchData,
      isHome,
      oppName,
      startedAt: Date.now()
    }))
  }

  // Instant simulate to full time
  const handleSimulateToEnd = () => {
    if (!simResults) return
    setMinute(90)
    setScore({ home: simResults.homeScore, away: simResults.awayScore })
    setEvents(simResults.events || [])
    setMatchState('finished')
    persistMatchResults(simResults)
    toast.success('Partido simulado hasta el pitido final.')
  }

  // Issue in-match tactical order
  const handleApplyOrder = (order) => {
    setActiveOrder(order.id)
    toast.success(`${order.label}`)
    
    // Add custom manager shout to event feed
    const orderEvent = {
      minute: Math.max(1, minute),
      type: 'TACTIC_SHOUT',
      text: `[DT] ${order.label} - ${order.text}`,
      team: 'home'
    }
    setEvents(prev => [orderEvent, ...prev])
  }

  // Simulation speed in ms per minute
  // 1x = 55ms (total ~5 sec match)
  // 2x = 25ms (total ~2.2 sec match)
  // 4x = 10ms (total ~0.9 sec match)
  const getSpeedMs = () => {
    if (speed === 4) return 10
    if (speed === 2) return 25
    return 55
  }

  // Progress minute clock
  useEffect(() => {
    if (matchState !== 'playing') return
    
    if (minute >= 90) {
      setMatchState('finished')
      if (simResults) {
        persistMatchResults(simResults)
      }
      return
    }

    const timer = setTimeout(() => {
      const nextMinute = minute + 1
      setMinute(nextMinute)
      
      // Check for events in this minute
      if (simResults && simResults.events) {
        const currentEvents = simResults.events.filter(e => e.minute === nextMinute)
        if (currentEvents.length > 0) {
          setEvents(prev => [...currentEvents, ...prev])
          
          currentEvents.forEach(e => {
            if (e.type === 'GOAL') {
              if (e.team === 'home') setScore(s => ({ ...s, home: s.home + 1 }))
              else setScore(s => ({ ...s, away: s.away + 1 }))
            }
          })
        }
      }
    }, getSpeedMs())

    return () => clearTimeout(timer)
  }, [matchState, minute, simResults, speed])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-400 font-medium text-sm animate-pulse">Preparando vestuario...</p>
      </div>
    )
  }

  const oppDisplayName = simResults?.opponentName || (data.fixture ? (data.fixture.home_team_id === data.club?.id ? data.fixture.away?.name : data.fixture.home?.name) : 'Rival')

  return (
    <div className="flex flex-col min-h-screen text-white bg-zinc-950 pb-28 md:pb-8">
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-900 bg-zinc-950">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-lg sm:text-2xl font-black text-emerald-500 tracking-wide">DÍA DE PARTIDO</h1>
          <p className="text-xs text-zinc-400">{data.fixture ? `Liga Regional - Fecha ${data.fixture.match_week}` : 'Amistoso'}</p>
        </div>
        <div className="w-9" />
      </header>

      {/* Marcador */}
      <div className="py-6 sm:py-8 bg-zinc-900/40 border-b border-zinc-900">
        <div className="flex items-center justify-center gap-3 sm:gap-8 px-4">
          <div className="flex flex-col items-center w-24 sm:w-32">
            <Shield className={`w-10 h-10 sm:w-14 sm:h-14 mb-2 transition-colors ${score.home > score.away ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span className="font-bold text-center text-xs sm:text-sm truncate w-full">{data.club?.short_name || 'LOCAL'}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 sm:gap-5 px-5 sm:px-8 py-2 border rounded-2xl bg-zinc-950 border-zinc-800 shadow-xl">
              <span className="text-3xl sm:text-5xl font-black text-white">{score.home}</span>
              <span className="text-xl sm:text-2xl text-zinc-600 font-bold">-</span>
              <span className="text-3xl sm:text-5xl font-black text-white">{score.away}</span>
            </div>
            <div className="mt-2.5 font-mono text-base sm:text-lg text-emerald-400 font-bold flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-emerald-500 animate-pulse" />
              {matchState === 'pre-match' ? '00:00' : matchState === 'finished' ? 'FINAL' : `${minute.toString().padStart(2, '0')}:00`}
            </div>
          </div>
          
          <div className="flex flex-col items-center w-24 sm:w-32">
            <Shield className={`w-10 h-10 sm:w-14 sm:h-14 mb-2 transition-colors ${score.away > score.home ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="font-bold text-center text-xs sm:text-sm truncate w-full" title={oppDisplayName}>
              {oppDisplayName}
            </span>
          </div>
        </div>

        {/* Speed Controls (during play) */}
        {matchState === 'playing' && (
          <div className="flex items-center justify-center gap-2 mt-4 px-4">
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 gap-1">
              <button 
                onClick={() => setSpeed(1)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${speed === 1 ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                1x
              </button>
              <button 
                onClick={() => setSpeed(2)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${speed === 2 ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                2x
              </button>
              <button 
                onClick={() => setSpeed(4)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${speed === 4 ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                4x
              </button>
            </div>

            <button 
              onClick={handleSimulateToEnd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 rounded-xl transition-colors"
            >
              <FastForward className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simular Final</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Field & Tactics Layout */}
      <div className="flex flex-col flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 lg:flex-row gap-4 sm:gap-6">
        
        {/* Panel de Eventos */}
        <div className="flex-1 flex flex-col border border-zinc-800 rounded-2xl md:rounded-3xl bg-zinc-900/50 p-4 sm:p-6 h-[380px] sm:h-[420px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Minuto a Minuto
            </h3>
            {activeOrder && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                Orden Activa
              </span>
            )}
          </div>
          
          <div className="flex-1 pr-1 space-y-2.5 overflow-y-auto font-mono text-xs sm:text-sm">
            {events.map((e, idx) => {
              const isGoal = e.type === 'GOAL'
              const isCard = e.type === 'CARD_YELLOW' || e.type === 'CARD_RED'
              const isShout = e.type === 'TACTIC_SHOUT'

              return (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border transition-all ${
                    isGoal 
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold' 
                      : isCard
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                        : isShout
                          ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 font-sans'
                          : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300'
                  }`}
                >
                  <span className="text-zinc-500 font-bold shrink-0">{e.minute}'</span>
                  <div className="flex-1 leading-snug">
                    {isShout ? (
                      <span className="italic">{e.text}</span>
                    ) : (
                      <>
                        <span className="font-semibold text-zinc-400 mr-1.5">
                          {e.team === 'home' ? `[${data.club?.short_name || 'LOCAL'}]` : `[${oppDisplayName}]`}
                        </span>
                        {e.text}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
            {events.length === 0 && matchState !== 'pre-match' && (
              <div className="h-full flex items-center justify-center text-center text-zinc-500 text-xs italic">
                El árbitro da la orden, balón en disputa...
              </div>
            )}
            {events.length === 0 && matchState === 'pre-match' && (
              <div className="h-full flex items-center justify-center text-center text-zinc-500 text-xs italic">
                Equipos realizando calentamiento pre-competitivo en el césped.
              </div>
            )}
          </div>
        </div>

        {/* Panel Táctico / Órdenes del DT */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="p-4 sm:p-6 border border-zinc-800 rounded-2xl md:rounded-3xl bg-zinc-900/50">
            <h3 className="mb-3 font-bold text-white text-sm sm:text-base">Órdenes del DT</h3>
            
            {matchState === 'pre-match' ? (
              <button 
                onClick={handleStartMatch}
                className="flex items-center justify-center w-full gap-2 py-4 font-bold text-black transition-all bg-emerald-500 rounded-xl hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <Play className="w-5 h-5 fill-black" /> Iniciar Partido
              </button>
            ) : matchState === 'playing' ? (
              <div className="space-y-2.5">
                <p className="text-xs text-zinc-400 mb-2">Instrucciones tácticas en tiempo real:</p>
                {TACTICAL_ORDERS.map((order) => {
                  const Icon = order.icon
                  const isSelected = activeOrder === order.id
                  return (
                    <button 
                      key={order.id}
                      onClick={() => handleApplyOrder(order)}
                      className={`flex items-center gap-2.5 w-full p-2.5 sm:p-3 text-left font-semibold text-xs sm:text-sm rounded-xl border transition-all ${order.color} ${
                        isSelected ? 'ring-2 ring-emerald-500 font-bold' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{order.label}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <button 
                onClick={() => {
                  // Clear session checkpoint on exiting to post-match
                  const sessionKey = `active_match_${fixtureId || data.club?.id}`
                  sessionStorage.removeItem(sessionKey)

                  navigate('/post-match', { 
                    state: { 
                      results: simResults, 
                      managerId: data.club?.manager_id, 
                      clubId: data.club?.id, 
                      clubName: data.club?.name 
                    } 
                  })
                }}
                className="flex items-center justify-center w-full gap-2 py-4 font-bold text-black transition-all bg-emerald-500 rounded-xl hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <CheckCircle className="w-5 h-5" /> Ver Resumen
              </button>
            )}
          </div>
        </div>
        
      </div>
    </div>
  )
}
