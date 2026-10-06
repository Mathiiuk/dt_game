import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { tacticsApi, FORMATIONS } from '../../api/tactics'
import { playerApi } from '../../api/player'
import { matchEngineApi, SHOUT_TYPES } from '../../api/matchEngine'
import { supabase } from '../../api/supabase'
import { useGameContext } from '../../context/GameContext'
import MatchControls from './MatchControls'
import SubstitutionsPanel from './SubstitutionsPanel'
import DecisionCard from './DecisionCard'
import { detectMoment, shoutBuff, shoutWaitMinutes, SHOUT_DURATION, MOMENT_ACTION_OPEN_SUBS, decisionText } from '../../domain/quickDecisions'
import { benchOf, makeSubstitution, substitutionsLeft, substitutionText } from '../../domain/substitutions'
import { useMatchClock } from './useMatchClock'
import { DEFAULT_SPEED, MATCH_MINUTES } from '../../domain/matchClock'
import { 
  Shield, 
  Play, 
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
import { buildMatchSquad, buildRivalLineup } from '../../domain/matchSquad'
import { resolveLineup, getLayout } from '../../domain/formations'
import { chemistryApi } from '../../api/chemistry'
import { teamChemistry } from '../../domain/chemistry'
import { FREE_FORMATION, normalizeLayout, slotsOfLayout } from '../../domain/freeLayout'

// Puestos de la formación activa (en el orden en que se guarda la alineación)
const slotsOf = (tactic) => {
  const custom = tactic?.formation === FREE_FORMATION ? normalizeLayout(tactic?.custom_layout) : null
  return custom ? slotsOfLayout(custom) : (FORMATIONS[tactic?.formation] || FORMATIONS['4-4-2']).slots
}

// Ids de la alineación en el orden de los puestos, con la misma corrección que usa la pizarra (alineaciones desordenadas)
const lineupIdsOf = (tactic, players) => {
  const slots = slotsOf(tactic)
  const map = resolveLineup(slots, players || [], tactic?.lineup || [])
  return slots.map(sl => map[sl])
}

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
  const [speed, setSpeed] = useState(DEFAULT_SPEED) // x1 lento, x2, x4
  const [paused, setPaused] = useState(false)
  const { confirmAction } = useGameContext()
  const [activeOrder, setActiveOrder] = useState(null)
  const [savedToDb, setSavedToDb] = useState(false)
  const [showStats, setShowStats] = useState(false)
  // Cambios del DT: once actual en la cancha y los cambios hechos (cada uno rejuega el resto del partido)
  const [onField, setOnField] = useState([])
  const [subsMade, setSubsMade] = useState([])
  const changesRef = useRef([])
  // Decisiones rápidas: momento pendiente, los ya resueltos, el último grito y el jugador que se marca para salir
  const [moment, setMoment] = useState(null)
  const firedRef = useRef(new Set())
  const [lastShout, setLastShout] = useState(null)
  const [preselectOut, setPreselectOut] = useState(null)

  // Vista previa del once: avisa antes del pitazo si el plantel está incompleto
  const previewSquad = data?.club && data.players?.length > 0 ? buildMatchSquad(data.players, lineupIdsOf(data.tactic, data.players), 11, slotsOf(data.tactic)) : null
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
      
    const awayPlayers = buildRivalLineup(opponentRep)
    
    const isHome = data.fixture ? data.fixture.home_team_id === data.club.id : true
    const oppName = data.fixture 
      ? (isHome ? data.fixture.away?.name : data.fixture.home?.name) 
      : 'Equipo Rival'
    
    // Once real que sale a la cancha: alineación del DT + reemplazos (juveniles y lesionados con penalización si faltan aptos)
    const matchSquad = buildMatchSquad(data.players, lineupIdsOf(data.tactic, data.players), 11, slotsOf(data.tactic))
    
    // Química del once: compañeros de siempre, mentorías y jugar en el puesto natural rinden más que un equipo armado a las apuradas
    let userPowerFactor = 1
    try {
      const custom = data.tactic?.formation === FREE_FORMATION ? normalizeLayout(data.tactic?.custom_layout) : null
      const layout = custom || getLayout(data.tactic?.formation)
      const lineupBySlot = Object.fromEntries(matchSquad.starters.map(p => [p.slot, p.id]))
      const context = await chemistryApi.getContext(data.club.id, data.players)
      userPowerFactor = teamChemistry(layout, lineupBySlot, chemistryApi.withArchetypes(matchSquad.starters, context), context).factor
    } catch (chemErr) {
      console.warn('Aviso: no se pudo calcular la química del equipo:', chemErr)
    }
    const options = { userPowerFactor, userIsHome: isHome }

    const results = isHome
      ? await matchEngineApi.startMatch(fixtureId, data.club.id, data.tactic, matchSquad.starters, awayTactic, awayPlayers, null, options)
      : await matchEngineApi.startMatch(fixtureId, data.club.id, awayTactic, awayPlayers, data.tactic, matchSquad.starters, null, options)
      
    const matchData = {
      ...results,
      isHome,
      opponentName: oppName,
      // Lesionados que jugaron: el post-partido evalúa si agravan la lesión
      injuredPlayingIds: matchSquad.injuredPlayingIds,
      // Ids de quienes salieron a la cancha (los juveniles de reemplazo no están en la base y no figuran)
      starterIds: matchSquad.starters.map(p => p.id)
    }

    setOnField(matchSquad.starters)
    setSubsMade([])
    changesRef.current = []
    firedRef.current = new Set()
    setMoment(null)
    setLastShout(null)
    setSimResults(matchData)
    setMinute(0)
    setScore({ home: 0, away: 0 })
    setEvents([])
    setPaused(false)
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

  const userSide = (data.fixture ? data.fixture.home_team_id === data.club?.id : true) ? 'home' : 'away'

  // Todo cambio del DT (jugadores, gritos, decisiones) rejuega el resto del partido con la misma semilla:
  // hasta el minuto actual queda igual y desde el siguiente rinde lo nuevo
  const commitChange = (change, extraStarterId = null) => {
    changesRef.current = [...changesRef.current, { minute, team: userSide, ...change }]
    const replayed = matchEngineApi.replayWithChanges(simResults, changesRef.current)
    const next = { ...replayed, starterIds: extraStarterId ? [...(simResults.starterIds || []), extraStarterId] : simResults.starterIds }
    setSimResults(next)
    // Si se recarga la página, el partido se retoma con el resultado que dejaron los cambios
    try {
      sessionStorage.setItem(`active_match_${fixtureId || data.club.id}`, JSON.stringify({ simResults: next, isHome: userSide === 'home', oppName: simResults.opponentName, startedAt: Date.now() }))
    } catch { /* sin almacenamiento el partido sigue igual */ }
    return next
  }

  const logDirective = (text) => setEvents(prev => [{ minute: Math.max(1, minute), type: 'TACTIC_SHOUT', text, team: userSide }, ...prev])

  // Cambio en la pausa: entra un suplente en el puesto del que sale
  const handleSubstitute = (outId, inId) => {
    const made = makeSubstitution({ onField, players: data.players, subsMade, outId, inId, minute })
    if (!made.ok) return toast.error(made.error)
    commitChange({ players: made.onField }, inId)
    setOnField(made.onField)
    setSubsMade(prev => [...prev, made.sub])
    setPreselectOut(null)
    setEvents(prev => [{ minute: Math.max(1, minute), type: 'SUBSTITUTION', text: substitutionText(made.sub), team: userSide }, ...prev])
    toast.success(`Cambio: entra ${made.sub.inName}`)
  }

  // Decisión de un momento (entretiempo, ir perdiendo, roja, lesión)
  const handleDecision = (option) => {
    firedRef.current.add(moment.key)
    const wasMoment = moment
    setMoment(null)
    if (option.buff && Object.keys(option.buff).length > 0) {
      commitChange({ buff: option.buff, duration: option.duration })
      logDirective(decisionText(option))
      toast.success(option.label)
    }
    if (option.action === MOMENT_ACTION_OPEN_SUBS) {
      setPreselectOut(wasMoment.playerId || null)
      return // sigue en pausa para hacer el cambio
    }
    setPaused(false)
  }

  // Saltear el partido: se juega de inmediato hasta el final (acción aparte de la velocidad)
  const handleSkipMatch = async () => {
    if (!simResults) return
    const confirmed = await confirmAction({
      title: 'Saltear el partido',
      description: 'Vas a ir directo al resultado final, sin ver el relato. No podés dar órdenes durante el resto del partido.',
      confirmText: 'Saltear',
      cancelText: 'Seguir mirando',
      variant: 'primary'
    })
    if (confirmed) handleSimulateToEnd()
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
    if (shoutWaitMinutes(lastShout, minute) > 0) return
    setActiveOrder(order.id)
    setLastShout(minute)
    commitChange({ buff: shoutBuff(order.effect), duration: SHOUT_DURATION })
    toast.success(`Orden aplicada: ${order.label}`)
    logDirective(`[DT] ${order.label} - ${order.desc}`)
  }

  // Fin del partido: al llegar al minuto final se consolida el resultado
  useEffect(() => {
    if (matchState !== 'playing' || minute < MATCH_MINUTES) return
    setMatchState('finished')
    if (simResults) {
      setScore({ home: simResults.homeScore, away: simResults.awayScore })
      persistMatchResults(simResults)
    }
  }, [matchState, minute, simResults])

  // Cada minuto simulado: eventos y marcador (el reloj respeta la pausa y la velocidad)
  useMatchClock({
    active: matchState === 'playing',
    paused,
    minute,
    speed,
    onTick: (nextMin) => {
      setMinute(nextMin)
      if (!simResults?.events) return
      const eventsAtThisMinute = simResults.events.filter(e => e.minute === nextMin)
      if (eventsAtThisMinute.length > 0) {
        setEvents(prev => [...eventsAtThisMinute, ...prev])
        eventsAtThisMinute.forEach(e => {
          if (e.type === 'GOAL') {
            if (e.team === 'home') setScore(sc => ({ ...sc, home: sc.home + 1 }))
            else if (e.team === 'away') setScore(sc => ({ ...sc, away: sc.away + 1 }))
          }
        })
      }
      // ¿Hay algo para decidir? El partido se pausa solo
      const found = detectMoment({ minute: nextMin, events: simResults.events, userSide, fired: firedRef.current, morale: data.club?.squad_morale ?? 60 })
      if (found) {
        setPaused(true)
        setMoment(found)
      }
    }
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-bg text-fg gap-3 p-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-fg-muted font-medium text-sm">Preparando partido oficial...</p>
      </div>
    )
  }

  const shoutWait = shoutWaitMinutes(lastShout, minute)
  const sentOffIds = new Set((simResults?.events || []).filter(e => e.type === 'CARD_RED' && e.team === userSide && e.minute <= minute && e.playerId).map(e => e.playerId))
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

        {/* Pausa, velocidad y saltear */}
        {matchState === 'playing' && (
          <MatchControls speed={speed} onSpeed={setSpeed} paused={paused} onTogglePause={() => setPaused(p => !p)} onSkip={handleSkipMatch} />
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

        {matchState === 'playing' && paused && (
          <p role="status" className="mt-3 border-t border-line/80 pt-3 text-center text-xs font-semibold text-warning">
            Partido en pausa en el minuto {minute}. Aprovechá para dar una orden táctica o hacer cambios, y reanudá cuando quieras.
          </p>
        )}

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
                {moment && <DecisionCard moment={moment} onChoose={handleDecision} />}
                {paused && !moment && minute < MATCH_MINUTES && (
                  <SubstitutionsPanel
                    preselectOutId={preselectOut}
                    onField={onField.filter(p => !sentOffIds.has(p.id))}
                    bench={benchOf(data.players, onField, subsMade)}
                    subsLeft={substitutionsLeft(subsMade)}
                    onSubstitute={handleSubstitute}
                  />
                )}
                <span className="text-[11px] text-fg-muted block mb-1">Gritos y arengas desde el banco:</span>
                {shoutWait > 0 && <p className="text-[10px] text-fg-subtle">Podés volver a gritar en {shoutWait} min.</p>}
                {SHOUT_TYPES.map(order => {
                  const isSelected = activeOrder === order.id
                  return (
                    <button 
                      key={order.id}
                      disabled={shoutWait > 0}
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
