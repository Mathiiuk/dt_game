import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { tacticsApi, FORMATIONS } from '../../api/tactics'
import { playerApi } from '../../api/player'
import { matchEngineApi, SHOUT_TYPES } from '../../api/matchEngine'
import { supabase } from '../../api/supabase'
import { useGameContext } from '../../context/GameContext'
import MatchHeader from './MatchHeader'
import MatchTimeline from './MatchTimeline'
import MatchActions from './MatchActions'
import MatchStats from './MatchStats'
import SubstitutionsSheet from './SubstitutionsSheet'
import ShoutsSheet from './ShoutsSheet'
import DecisionSheet from './DecisionSheet'
import SubstitutionsPanel from './SubstitutionsPanel'
import DecisionCard from './DecisionCard'
import { detectMoment, shoutBuff, shoutWaitMinutes, SHOUT_DURATION, MOMENT_ACTION_OPEN_SUBS, decisionText } from '../../domain/quickDecisions'
import { benchOf, makeSubstitution, substitutionsLeft, substitutionText } from '../../domain/substitutions'
import { useMediaQuery } from '../../hooks/useMediaQuery'
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
import { cleanTakers } from '../../domain/specialists'

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
  // Mismo corte que el grid de la pantalla (lg): por debajo, los controles van anclados abajo
  const isLg = useMediaQuery('(min-width: 1024px)')
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
  // Cambios del DT: once actual en la cancha y los cambios hechos (cada uno rejuega el resto del partido)
  const [onField, setOnField] = useState([])
  const [subsMade, setSubsMade] = useState([])
  const changesRef = useRef([])
  // Decisiones rápidas: momento pendiente, los ya resueltos, el último grito y el jugador que se marca para salir
  const [moment, setMoment] = useState(null)
  const firedRef = useRef(new Set())
  const [lastShout, setLastShout] = useState(null)
  const [preselectOut, setPreselectOut] = useState(null)
  const [subsSheetOpen, setSubsSheetOpen] = useState(false)
  const [shoutsSheetOpen, setShoutsSheetOpen] = useState(false)

  // Vista previa del once: avisa antes del pitazo si el plantel está incompleto
  const previewSquad = data?.club && data.players?.length > 0 ? buildMatchSquad(data.players, lineupIdsOf(data.tactic, data.players), 11, slotsOf(data.tactic)) : null
  const squadNotes = previewSquad?.notes || []
  const youthNotes = squadNotes.filter(n => n.type === 'YOUTH_CALLUP')
  const injuredNotes = squadNotes.filter(n => n.type === 'INJURED_PLAYING')
  // Estado de cada jugador en el partido (amarillas, roja, molestias) para marcarlo en la pizarra de cambios
  const statusById = useMemo(() => {
    const map = {}
    for (const e of simResults?.events || []) {
      if (e.minute > minute || !e.playerId) continue
      const st = (map[e.playerId] ||= { yellow: 0, red: false, hurt: false })
      if (e.type === 'CARD_YELLOW') st.yellow++
      else if (e.type === 'CARD_RED') st.red = true
      else if (e.type === 'INJURY') st.hurt = true
    }
    return map
  }, [simResults, minute])

  // Estadísticas en vivo que evolucionan minuto a minuto según los eventos reales simulados
  const liveStats = useMemo(() => {
    if (!simResults?.events) return simResults?.stats || null
    const currentEvents = simResults.events.filter(e => e.minute <= minute)
    
    let homeShots = 0, awayShots = 0
    let homeShotsOnTarget = 0, awayShotsOnTarget = 0
    let homeFouls = 0, awayFouls = 0
    let homeYellows = 0, awayYellows = 0
    let homeReds = 0, awayReds = 0
    let homeCorners = 0, awayCorners = 0

    for (const ev of currentEvents) {
      if (ev.type === 'GOAL') {
        if (ev.team === 'home') { homeShots++; homeShotsOnTarget++ }
        else if (ev.team === 'away') { awayShots++; awayShotsOnTarget++ }
      } else if (ev.type === 'SAVE') {
        if (ev.team === 'home') { homeShots++; homeShotsOnTarget++ }
        else if (ev.team === 'away') { awayShots++; awayShotsOnTarget++ }
      } else if (ev.type === 'MISS') {
        if (ev.team === 'home') homeShots++
        else if (ev.team === 'away') awayShots++
      } else if (ev.type === 'CORNER') {
        if (ev.team === 'home') homeCorners++
        else if (ev.team === 'away') awayCorners++
      } else if (ev.type === 'FOUL') {
        if (ev.team === 'home') homeFouls++
        else if (ev.team === 'away') awayFouls++
      } else if (ev.type === 'CARD_YELLOW') {
        if (ev.team === 'home') { homeYellows++; homeFouls++ }
        else if (ev.team === 'away') { awayYellows++; awayFouls++ }
      } else if (ev.type === 'CARD_RED') {
        if (ev.team === 'home') { homeReds++; homeFouls++ }
        else if (ev.team === 'away') { awayReds++; awayFouls++ }
      }
    }

    const finalHomePoss = simResults.stats?.possession?.home ?? 50
    const factor = Math.min(1, Math.max(0.05, minute / 90))
    const homePoss = Math.round(50 * (1 - factor) + finalHomePoss * factor)
    const awayPoss = 100 - homePoss

    return {
      possession: { home: homePoss, away: awayPoss },
      shots: { home: homeShots, away: awayShots },
      shotsOnTarget: { home: homeShotsOnTarget, away: awayShotsOnTarget },
      fouls: { home: homeFouls, away: awayFouls },
      yellowCards: { home: homeYellows, away: awayYellows },
      redCards: { home: homeReds, away: awayReds },
      corners: { home: homeCorners, away: awayCorners }
    }
  }, [simResults, minute])


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

    } catch (err) {
      console.error('Error persistiendo resultado de partido:', err)
    }
  }

  const handleStartMatch = async () => {
    const awayTactic = { mentality: 'Equilibrada', build_up: 'Posesión', pressure: 'Media', tempo: 'Normal' }
    
    const rival = data.fixture ? (data.fixture.home_team_id === data.club.id ? data.fixture.away : data.fixture.home) : null
    // El rival juega con su fuerza real (si no la tiene, con la de su reputación)
    const awayPlayers = buildRivalLineup(rival?.reputation || 10, rival?.strength ?? null, rival?.id || rival?.name || 'rival')
    
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
    const options = { userPowerFactor, userIsHome: isHome, userTakers: cleanTakers(data.tactic?.set_piece_takers) }

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

  // Posiciones de la pizarra del DT (formación fija o alineación libre)
  const pitchLayout = (() => {
    const custom = data.tactic?.formation === FREE_FORMATION ? normalizeLayout(data.tactic?.custom_layout) : null
    return custom || getLayout(data.tactic?.formation)
  })()

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

  // Abrir la pizarra de cambios o las órdenes pausa el partido solo; al salir se retoma solo (si ya estaba en pausa, queda como estaba)
  const autoPausedRef = useRef(false)
  const openSheet = (setOpen) => {
    if (!paused) { autoPausedRef.current = true; setPaused(true) }
    setOpen(true)
  }
  const closeSheet = (setOpen) => {
    setOpen(false)
    if (autoPausedRef.current && !moment) { autoPausedRef.current = false; setPaused(false) }
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
    if (isLg && autoPausedRef.current) { autoPausedRef.current = false; setPaused(false) }
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
    // Penal: quién lo patea (a favor) o hacia dónde se tira el arquero (en contra); se resuelve al minuto siguiente
    if (option.action === 'PENALTY_TAKER' && option.playerId) {
      commitChange({ kind: 'PENALTY_TAKER', playerId: option.playerId })
      // Con puntería (minijuego): hacia dónde y qué tan bien le pegó
      if (option.aim) commitChange({ kind: 'PENALTY_AIM', aim: option.aim, quality: option.quality })
      logDirective(decisionText(option))
    } else if (option.action === 'FK_TAKER' && option.playerId) {
      commitChange({ kind: 'SETPIECE_FK', playerId: option.playerId, aim: option.aim, quality: option.quality })
      logDirective(decisionText(option))
    } else if (option.action === 'DEF_CORNER') {
      commitChange({ kind: 'SETPIECE_DEF_CORNER', zone: option.zone })
      logDirective(decisionText(option))
    } else if (option.action === 'DEF_FK') {
      commitChange({ kind: 'SETPIECE_DEF_FK', mode: option.mode })
      logDirective(decisionText(option))
    } else if (option.action === 'CORNER_ZONE') {
      commitChange({ kind: 'SETPIECE_CORNER', zone: option.zone })
      logDirective(decisionText(option))
    } else if (option.action === 'SAVE_REACT') {
      commitChange({ kind: 'SAVE_REACT', quality: option.quality })
      logDirective(decisionText(option))
    } else if (option.action === 'KEYPLAY') {
      commitChange({ kind: 'KEYPLAY_CHOICE', choice: option.choice })
      logDirective(decisionText(option))
    } else if (option.action === 'PENALTY_DIVE') {
      commitChange({ kind: 'PENALTY_DIVE', dive: option.dive })
      logDirective(decisionText(option))
    }
    if (option.action === MOMENT_ACTION_OPEN_SUBS) {
      setPreselectOut(wasMoment.playerId || null)
      // El partido ya está en pausa por el momento: se retoma solo al cerrar el banco
      autoPausedRef.current = true
      // En pantallas chicas el banco vive en una hoja: se abre sola para elegir quién entra
      if (!isLg) setSubsSheetOpen(true)
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

  // Del pitazo final al resumen (el botón también está arriba, junto al marcador)
  const goToSummary = () => {
    sessionStorage.removeItem(`active_match_${fixtureId || data.club?.id}`)
    navigate('/post-match', {
      state: {
        results: simResults,
        fixtureId: fixtureId || null,
        managerId: data.club?.manager_id,
        clubId: data.club?.id,
        clubName: data.club?.name
      }
    })
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
      const found = detectMoment({ minute: nextMin, events: simResults.events, userSide, fired: firedRef.current, morale: data.club?.squad_morale ?? 60, onField, takers: cleanTakers(data.tactic?.set_piece_takers) })
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
    <div className="flex h-[calc(100dvh_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] flex-col overflow-hidden text-fg bg-bg">
      <div className="max-w-[1400px] mx-auto w-full flex-1 min-h-0 flex flex-col relative">
        <MatchHeader 
          isHome={isHome}
          clubName={data.club?.name || 'Local'}
          opponentName={oppDisplayName}
          score={score}
          minute={minute}
          matchState={matchState}
          onBack={() => navigate('/dashboard')}
        />
        
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 pt-0 lg:grid lg:grid-cols-12 lg:gap-6 lg:p-4 lg:pt-0">
          
          {/* Izquierda: Desktop (Tu Equipo) / Oculto en móvil (van a las Sheets) */}
          {isLg && (
          <div className="hidden min-h-0 flex-col gap-4 overflow-y-auto pr-2 lg:col-span-4 lg:flex xl:col-span-3">
            <div className="p-4 rounded-xl bg-surface border border-line space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted">Dirección técnica</h3>
              
              {matchState === 'pre-match' ? (
                <button 
                  onClick={handleStartMatch}
                  className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-accent hover:bg-accent-strong text-accent-fg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-zinc-950" />
                  Comenzar partido
                </button>
              ) : matchState === 'playing' ? (
                <div className="space-y-4">
                  <div className="bg-surface-2 p-3 rounded-xl border border-line">
                    <p className="text-xs text-fg-subtle mb-2">Táctica y Gritos (Enfriamiento: {shoutWait}m)</p>
                    {SHOUT_TYPES.map(order => (
                      <button 
                        key={order.id}
                        disabled={shoutWait > 0}
                        onClick={() => handleApplyOrder(order)}
                        className={`w-full p-2.5 mt-2 text-left rounded-lg border text-xs transition-all ${
                          activeOrder === order.id 
                            ? 'border-accent bg-accent-soft text-accent font-bold'
                            : 'border-line bg-bg/60 text-fg hover:border-line'
                        }`}
                      >
                        {order.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={goToSummary}
                  className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-accent hover:bg-accent-strong text-accent-fg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Resumen
                </button>
              )}
            </div>

            {matchState === 'playing' && (
              <div className="flex-1 bg-surface border border-line rounded-xl overflow-hidden flex flex-col">
                 <div className="p-3 bg-surface-2 border-b border-line">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted">Tu Equipo (Alineación)</h3>
                 </div>
                 <div className="flex-1 overflow-y-auto p-2">
                   <SubstitutionsPanel
                      preselectOutId={preselectOut}
                      onField={onField.filter(p => !sentOffIds.has(p.id))}
                      statusById={statusById}
                      bench={benchOf(data.players, onField, subsMade)}
                      subsLeft={substitutionsLeft(subsMade)}
                      onSubstitute={handleSubstitute}
                   />
                 </div>
              </div>
            )}
          </div>
          )}

          {/* Centro: relato en vivo, estadísticas (la posesión se despliega hacia arriba) y controles */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 lg:col-span-8 lg:h-full xl:col-span-9">
            {matchState === 'pre-match' && squadNotes.length > 0 && (
              <div className="shrink-0 space-y-1 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-gold lg:hidden" role="status">
                <p className="font-bold uppercase tracking-wider text-gold">Plantel incompleto</p>
                {youthNotes.length > 0 && <p>Se convocan {youthNotes.length} juvenil(es).</p>}
                {injuredNotes.length > 0 && <p>Jugarán lesionados: {injuredNotes.map(n => n.name).join(', ')}.</p>}
              </div>
            )}

            <MatchTimeline events={events} matchState={matchState} />

            {matchState !== 'pre-match' && simResults?.stats && (
              <MatchStats stats={liveStats || simResults.stats} homeName={data.club?.name || 'Local'} awayName={oppDisplayName} />
            )}

            {matchState === 'playing' && isLg && (
              <MatchActions
                speed={speed}
                onSpeed={setSpeed}
                paused={paused}
                onTogglePause={() => setPaused(!paused)}
                onSkip={handleSkipMatch}
                onOpenSubs={() => openSheet(setSubsSheetOpen)}
                onOpenShouts={() => openSheet(setShoutsSheetOpen)}
              />
            )}
          </div>
        </div>

        {/* Móvil, antes del pitazo: botón fijo abajo para comenzar */}
        {matchState === 'pre-match' && !isLg && (
          <div className="shrink-0 border-t border-line bg-surface p-3">
            <button
              type="button"
              onClick={handleStartMatch}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-strong"
            >
              <Play className="size-5" aria-hidden="true" />
              Comenzar partido
            </button>
          </div>
        )}

        {/* Móvil, pitazo final: botón fijo abajo para seguir con el resumen y la prensa */}
        {matchState === 'finished' && !isLg && (
          <div className="shrink-0 border-t border-line bg-surface p-3">
            <button
              type="button"
              onClick={goToSummary}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-strong"
            >
              <CheckCircle className="size-5" aria-hidden="true" />
              Siguiente: resumen y prensa
            </button>
          </div>
        )}

        {/* Móvil: controles anclados abajo, fuera del área que scrollea */}
        {matchState === 'playing' && !isLg && (
          <MatchActions
            docked
            speed={speed}
            onSpeed={setSpeed}
            paused={paused}
            onTogglePause={() => setPaused(!paused)}
            onSkip={handleSkipMatch}
            onOpenSubs={() => openSheet(setSubsSheetOpen)}
            onOpenShouts={() => openSheet(setShoutsSheetOpen)}
          />
        )}
      </div>

      {/* Mobile Sheets */}
      <SubstitutionsSheet 
        open={subsSheetOpen}
        onClose={() => closeSheet(setSubsSheetOpen)}
        preselectOutId={preselectOut}
        onField={onField.filter(p => !sentOffIds.has(p.id))}
        players={data.players}
        subsMade={subsMade}
        onSubstitute={handleSubstitute}
        sentOffIds={sentOffIds}
        tactic={data.tactic}
        layout={pitchLayout}
        statusById={statusById}
      />

      <ShoutsSheet
        open={shoutsSheetOpen}
        onClose={() => closeSheet(setShoutsSheetOpen)}
        shoutWait={shoutWait}
        activeOrder={activeOrder}
        onApplyOrder={handleApplyOrder}
      />

      <DecisionSheet 
        open={!!moment}
        moment={moment}
        onChoose={(...args) => {
          handleDecision(...args)
          // La decisiA3n sola cierra el sheet al limpiar el moment (hace trigger de null)
        }}
      />
    </div>
  )
}






