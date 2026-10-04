import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { internationalCupApi } from '../../api/internationalCup'
import { useGameContext } from '../../context/GameContext'
import { 
  ArrowLeft, 
  Globe, 
  Trophy, 
  Shield, 
  Calendar, 
  DollarSign, 
  Award, 
  Play, 
  CheckCircle2, 
  Sparkles,
  Flame
} from 'lucide-react'
import { toast } from 'sonner'
import BottomNav from '../../components/BottomNav'

export default function InternationalCupScreen() {
  const navigate = useNavigate()
  const { club, manager, loading: contextLoading } = useGameContext()
  const [loading, setLoading] = useState(true)
  const [cupData, setCupData] = useState(null)
  const [playingMatchId, setPlayingMatchId] = useState(null)

  const loadCupData = async () => {
    try {
      if (!club?.id) return
      const res = await internationalCupApi.getActiveTournament(club.id)
      setCupData(res)
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar la Copa Continental')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contextLoading || !club) return
    loadCupData()
  }, [contextLoading, club])

  const handlePlayUserMatch = async (fixture) => {
    try {
      setPlayingMatchId(fixture.id)
      // Generar resultado con ventaja para el equipo mejor preparado
      const userIsHome = fixture.home_club_id === club.id
      const userGoals = Math.floor(Math.random() * 3) + 1
      let oppGoals = Math.floor(Math.random() * 2)

      // Evitar empates en partidos de eliminación directa
      if (userGoals === oppGoals) {
        oppGoals = Math.max(0, userGoals - 1)
      }

      const homeScore = userIsHome ? userGoals : oppGoals
      const awayScore = userIsHome ? oppGoals : userGoals

      const res = await internationalCupApi.processUserMatchResult(
        fixture.id,
        club.id,
        manager?.id,
        homeScore,
        awayScore
      )

      if (res.userWon) {
        toast.success(`¡Victoria continental! ${homeScore}-${awayScore}. Premio: +$${res.matchBonus.toLocaleString()}`)
      } else {
        toast.error(`Derrota en la copa: ${homeScore}-${awayScore}`)
      }

      await loadCupData()
    } catch (e) {
      toast.error(e.message || 'Error al disputar el partido')
    } finally {
      setPlayingMatchId(null)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-amber-400 bg-zinc-950">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 animate-pulse" />
          <span className="font-semibold text-sm">Cargando certamen continental...</span>
        </div>
      </div>
    )
  }

  const { tournament, fixtures } = cupData || {}
  const quarterFixtures = fixtures?.filter(f => f.stage === 'quarter_finals') || []
  const semiFixtures = fixtures?.filter(f => f.stage === 'semi_finals') || []
  const finalFixtures = fixtures?.filter(f => f.stage === 'final') || []

  return (
    <div className="min-h-screen p-3 md:p-6 text-zinc-100 bg-zinc-950 pb-28 md:pb-12 max-w-7xl mx-auto">
      {/* Header del torneo */}
      <header className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/80 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => navigate('/standings')} 
            className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 shrink-0"
            title="Volver a competiciones"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
          </button>
          <div className="truncate">
            <h1 className="text-lg md:text-2xl font-black flex items-center gap-2 text-amber-400 truncate leading-tight">
              <Globe className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
              <span>{tournament?.name || 'Copa Gloria Continental'}</span>
            </h1>
            <p className="text-xs text-zinc-400 truncate">
              Temporada {tournament?.season_year || 2026} • Torneo de Clubes de América
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[11px] text-zinc-400 font-medium">Bolsa de Premios</p>
          <p className="text-base md:text-xl font-black text-emerald-400">
            ${Number(tournament?.prize_pool || 1500000).toLocaleString()}
          </p>
        </div>
      </header>

      {/* Banner de Campeón si el torneo concluyó */}
      {tournament?.status === 'finished' && (
        <div className="mb-6 p-4 md:p-6 border border-amber-500/40 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-center gap-4">
          <div className="p-3 bg-amber-500 text-zinc-950 rounded-xl font-bold shadow-lg shadow-amber-500/20">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-amber-400">Campeón Continental</span>
            <h2 className="text-xl md:text-2xl font-black text-white">
              {tournament?.champion?.name || 'Campeón de América'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Gloria eterna y clasificación asegurada a la próxima edición internacional.
            </p>
          </div>
        </div>
      )}

      {/* Estructura de Llaves / Fases de la Copa */}
      <div className="space-y-8">
        
        {/* Cuartos de Final */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm md:text-base text-zinc-200">Cuartos de Final</h3>
            <span className="text-[11px] text-zinc-500 ml-auto">Partidos de Ida y Vuelta / Eliminación</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quarterFixtures.map(f => renderFixtureCard(f, club?.id, handlePlayUserMatch, playingMatchId))}
          </div>
        </section>

        {/* Semifinales */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm md:text-base text-zinc-200">Semifinales</h3>
            <span className="text-[11px] text-zinc-500 ml-auto">Los 4 mejores del continente</span>
          </div>

          {semiFixtures.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
              <p className="text-xs text-zinc-500">Se definirán al concluir la fase de Cuartos de Final.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {semiFixtures.map(f => renderFixtureCard(f, club?.id, handlePlayUserMatch, playingMatchId))}
            </div>
          )}
        </section>

        {/* Gran Final */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm md:text-base text-amber-300">Gran Final Continental</h3>
            <span className="text-[11px] text-amber-400/80 ml-auto font-semibold">Premio Mayor: $1,000,000</span>
          </div>

          {finalFixtures.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
              <p className="text-xs text-zinc-500">La Final se disputará tras concluir las Semifinales.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {finalFixtures.map(f => renderFixtureCard(f, club?.id, handlePlayUserMatch, playingMatchId, true))}
            </div>
          )}
        </section>

      </div>
      <BottomNav />
    </div>
  )
}

function renderFixtureCard(fixture, userClubId, onPlay, isPlaying, isFinal = false) {
  const isUserMatch = fixture.home_club_id === userClubId || fixture.away_club_id === userClubId
  const homeName = fixture.home_club?.name || 'Equipo 1'
  const awayName = fixture.away_club?.name || 'Equipo 2'
  const isPlayed = fixture.played

  return (
    <div 
      key={fixture.id} 
      className={`p-4 rounded-xl border transition-all ${
        isUserMatch 
          ? 'border-amber-500/50 bg-amber-500/5 shadow-sm' 
          : 'border-zinc-800/80 bg-zinc-900/40'
      } ${isFinal ? 'ring-1 ring-amber-500/30' : ''}`}
    >
      <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-2">
        <span className="font-semibold uppercase tracking-wider text-zinc-400">
          {fixture.stage === 'quarter_finals' ? 'Cuartos' : fixture.stage === 'semi_finals' ? 'Semifinal' : 'Gran Final'}
        </span>
        {isPlayed ? (
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Finalizado
          </span>
        ) : (
          <span className="text-zinc-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {fixture.match_date || 'Entre semana'}
          </span>
        )}
      </div>

      <div className="space-y-2 mb-3">
        {/* Local */}
        <div className="flex items-center justify-between">
          <span className={`text-xs md:text-sm font-bold truncate ${
            fixture.home_club_id === userClubId ? 'text-amber-400' : 'text-zinc-200'
          }`}>
            {homeName} {fixture.home_club_id === userClubId && '(Tú)'}
          </span>
          <span className="text-sm font-black text-white px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-800">
            {isPlayed ? fixture.home_score : '-'}
          </span>
        </div>

        {/* Visitante */}
        <div className="flex items-center justify-between">
          <span className={`text-xs md:text-sm font-bold truncate ${
            fixture.away_club_id === userClubId ? 'text-amber-400' : 'text-zinc-200'
          }`}>
            {awayName} {fixture.away_club_id === userClubId && '(Tú)'}
          </span>
          <span className="text-sm font-black text-white px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-800">
            {isPlayed ? fixture.away_score : '-'}
          </span>
        </div>
      </div>

      {/* Botón de jugar si es partido pendiente del usuario */}
      {isUserMatch && !isPlayed && (
        <button
          disabled={isPlaying === fixture.id}
          onClick={() => onPlay(fixture)}
          className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isPlaying === fixture.id ? 'Disputando...' : 'Jugar Partido Continental'}</span>
        </button>
      )}
    </div>
  )
}
