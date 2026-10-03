import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { tacticsApi } from '../../api/tactics'
import { playerApi } from '../../api/player'
import { simulateMatch } from '../../api/matchEngine'
import { supabase } from '../../api/supabase'
import { Shield, Play, Square, FastForward, CheckCircle, ArrowLeft } from 'lucide-react'

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
  
  const simSpeed = 100 // ms per minute
  
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
          const { data: fix } = await supabase.from('fixtures').select('*, home:clubs!home_team_id(*), away:clubs!away_team_id(*)').eq('id', fixtureId).single()
          fixture = fix
        }
        
        setData({ club, tactic, players, fixture })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate, fixtureId])

  const handleStartMatch = () => {
    // Generate opponent dummy data
    const awayTactic = { mentality: 'Equilibrada', build_up: 'Posesión', pressure: 'Media', tempo: 'Normal' }
    
    // Si tenemos fixture, usamos reputación real del rival
    const opponentRep = data.fixture 
      ? (data.fixture.home_team_id === data.club.id ? data.fixture.away.reputation : data.fixture.home.reputation) 
      : 10
      
    const awayPlayers = Array.from({length: 11}).map(() => ({
      state_fitness: 90, attr_pace: 40 + (opponentRep*0.5), attr_finishing: 40 + (opponentRep*0.5), attr_defending: 40 + (opponentRep*0.5)
    }))
    
    const isHome = data.fixture ? data.fixture.home_team_id === data.club.id : true
    const oppName = data.fixture 
      ? (isHome ? data.fixture.away.name : data.fixture.home.name) 
      : 'Equipo Rival'
    
    const results = isHome 
      ? simulateMatch(data.tactic, data.players, awayTactic, awayPlayers)
      : simulateMatch(awayTactic, awayPlayers, data.tactic, data.players)
      
    setSimResults({
      ...results,
      isHome,
      opponentName: oppName
    })
    setMatchState('playing')
  }

  // Effect to progress the minute clock
  useEffect(() => {
    if (matchState !== 'playing') return
    
    if (minute >= 90) {
      if (matchState !== 'finished') {
        setMatchState('finished')
        // Save to DB using simResults for final exact score to avoid closure staleness
        const saveMatch = async () => {
          const { supabase } = await import('../../api/supabase')
          
          const isHome = data.fixture ? data.fixture.home_team_id === data.club.id : true
          const oppName = data.fixture 
            ? (isHome ? data.fixture.away.name : data.fixture.home.name) 
            : 'Equipo Rival'

          // Historial local del club
          await supabase.from('match_history').insert({
            club_id: data.club.id,
            opponent_name: oppName,
            home_score: simResults.homeScore,
            away_score: simResults.awayScore,
            is_home: isHome,
            match_date: data.club.game_date
          })

          // Si es de torneo, actualizar tabla general de tournament
          if (data.fixture) {
             const homeGoals = isHome ? simResults.homeScore : simResults.awayScore
             const awayGoals = isHome ? simResults.awayScore : simResults.homeScore
             
             await supabase.from('fixtures')
              .update({ status: 'PLAYED', home_score: homeGoals, away_score: awayGoals })
              .eq('id', data.fixture.id)
              
             const { competitionApi } = await import('../../api/competition')
             await competitionApi._updateStandings(
               data.fixture.competition_id, 
               data.fixture.home_team_id, 
               data.fixture.away_team_id, 
               homeGoals, awayGoals
             )
          }
        }
        saveMatch()
      }
      return
    }

    const timer = setTimeout(() => {
      setMinute(m => m + 1)
      
      // Chequear si hay eventos en este minuto
      if (simResults) {
        const currentEvents = simResults.events.filter(e => e.minute === minute + 1)
        if (currentEvents.length > 0) {
           setEvents(prev => [...currentEvents, ...prev])
           
           // Check if goal to update score
           currentEvents.forEach(e => {
             if (e.type === 'GOAL') {
               if (e.team === 'home') setScore(s => ({...s, home: s.home + 1}))
               else setScore(s => ({...s, away: s.away + 1}))
             }
           })
        }
      }
    }, simSpeed)

    return () => clearTimeout(timer)
  }, [matchState, minute, simResults])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-emerald-500">Preparando vestuario...</div>

  return (
    <div className="flex flex-col min-h-screen text-white bg-zinc-950">
      
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-zinc-900 bg-zinc-950">
        <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-emerald-500">DÍA DE PARTIDO</h1>
          <p className="text-xs text-zinc-500">{data.fixture ? `Liga Regional - Fecha ${data.fixture.match_week}` : 'Amistoso'}</p>
        </div>
        <div className="w-10"></div>
      </header>

      {/* Marcador */}
      <div className="py-8 bg-zinc-900/30">
        <div className="flex items-center justify-center gap-4 md:gap-8">
          <div className="flex flex-col items-center w-24 md:w-32">
            <Shield className={`w-12 h-12 md:w-16 md:h-16 mb-2 ${score.home > score.away ? 'text-emerald-500' : 'text-zinc-400'}`} />
            <span className="font-bold text-center truncate w-full">{data.club?.short_name}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 px-6 py-2 border rounded-2xl bg-zinc-950 border-zinc-800">
              <span className="text-5xl font-black">{score.home}</span>
              <span className="text-2xl text-zinc-600">-</span>
              <span className="text-5xl font-black">{score.away}</span>
            </div>
            <div className="mt-4 font-mono text-xl text-emerald-400">
              {matchState === 'pre-match' ? '00:00' : matchState === 'finished' ? 'FINAL' : `${minute.toString().padStart(2, '0')}:00`}
            </div>
          </div>
          
          <div className="flex flex-col items-center w-24 md:w-32">
            <Shield className={`w-12 h-12 md:w-16 md:h-16 mb-2 ${score.away > score.home ? 'text-blue-500' : 'text-zinc-400'}`} />
            <span className="font-bold text-center truncate w-full" title={simResults?.opponentName || 'Rival'}>
              {simResults?.opponentName || 'RIVAL'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 max-w-4xl w-full mx-auto p-4 lg:flex-row gap-6">
        
        {/* Panel de Eventos */}
        <div className="flex-1 flex flex-col border border-zinc-800 rounded-3xl bg-zinc-900/50 p-6 h-[400px]">
          <h3 className="mb-4 font-bold text-white">Minuto a Minuto</h3>
          
          <div className="flex-1 pr-2 space-y-3 overflow-y-auto font-mono text-sm">
            {events.map((e, idx) => (
              <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${e.type === 'GOAL' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-950'}`}>
                <span className="text-zinc-500">{e.minute}'</span>
                <span className={e.type === 'GOAL' ? 'text-emerald-400 font-bold' : e.type === 'CARD_YELLOW' ? 'text-yellow-500' : 'text-zinc-300'}>
                  {e.team === 'home' ? `[${data.club?.short_name}]` : '[RIVAL]'} {e.text}
                </span>
              </div>
            ))}
            {events.length === 0 && matchState !== 'pre-match' && (
              <p className="text-center text-zinc-600">Pelota en juego, mucha fricción en el medio campo...</p>
            )}
          </div>
        </div>

        {/* Panel Táctico Directo */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
            <h3 className="mb-4 font-bold text-white">Órdenes del DT</h3>
            
            {matchState === 'pre-match' ? (
              <button 
                onClick={handleStartMatch}
                className="flex items-center justify-center w-full gap-2 py-4 font-bold text-black transition-transform bg-emerald-500 rounded-xl hover:bg-emerald-400 hover:scale-105"
              >
                <Play className="w-5 h-5" /> Iniciar Partido
              </button>
            ) : matchState === 'playing' ? (
              <div className="space-y-3">
                <button className="flex justify-center items-center w-full py-3 font-bold text-sm text-zinc-300 transition-colors border border-zinc-700 rounded-xl bg-zinc-800 hover:bg-zinc-700">
                   Cambiar Mentalidad
                </button>
                <button className="flex justify-center items-center w-full py-3 font-bold text-sm text-zinc-300 transition-colors border border-zinc-700 rounded-xl bg-zinc-800 hover:bg-zinc-700">
                   Gritar "¡Presionen!"
                </button>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/post-match', { state: { results: simResults, managerId: data.club.manager_id, clubId: data.club.id, clubName: data.club.name } })}
                className="flex items-center justify-center w-full gap-2 py-4 font-bold text-black transition-transform bg-emerald-500 rounded-xl hover:bg-emerald-400 hover:scale-105"
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
