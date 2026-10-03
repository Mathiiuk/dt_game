import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nationalTeamApi } from '../../api/nationalTeam'
import { useGameContext } from '../../context/GameContext'
import { 
  ArrowLeft, 
  Flag, 
  Users, 
  Calendar, 
  Shield, 
  Star, 
  Award, 
  Play, 
  CheckCircle2, 
  LogOut, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'

export default function NationalTeamScreen() {
  const navigate = useNavigate()
  const { manager, loading: contextLoading } = useGameContext()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState(null)
  const [offers, setOffers] = useState([])
  const [callups, setCallups] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [activeTab, setActiveTab] = useState('convocatoria') // 'convocatoria' | 'partidos'
  const [playingMatchId, setPlayingMatchId] = useState(null)

  const loadData = async () => {
    try {
      if (!manager?.id) return
      const currentTeam = await nationalTeamApi.getCurrentNationalTeam(manager.id)
      setTeam(currentTeam)

      if (currentTeam) {
        const [cList, fList] = await Promise.all([
          nationalTeamApi.getCallups(currentTeam.id),
          nationalTeamApi.getFixtures(currentTeam.id)
        ])
        setCallups(cList)
        setFixtures(fList)
      } else {
        const availableOffers = await nationalTeamApi.getAvailableOffers(manager.id)
        setOffers(availableOffers)
      }
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar datos de selección nacional')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contextLoading || !manager) return
    loadData()
  }, [contextLoading, manager])

  const handleAcceptOffer = async (offer) => {
    try {
      if (!offer.is_eligible) {
        return toast.error(`Necesitas al menos ${offer.required_reputation} de reputación para esta selección.`)
      }
      setLoading(true)
      await nationalTeamApi.acceptOffer(manager.id, offer.id)
      toast.success(`¡Felicitaciones! Has asumido como DT de ${offer.name}`)
      await loadData()
    } catch (e) {
      toast.error(e.message)
      setLoading(false)
    }
  }

  const handleResign = async () => {
    if (!window.confirm('¿Seguro que deseas renunciar a la Selección Nacional? Continuarás al mando de tu club normalmente.')) return
    try {
      setLoading(true)
      await nationalTeamApi.resign(manager.id, team.id)
      toast.success('Has presentado tu renuncia a la selección.')
      await loadData()
    } catch (e) {
      toast.error(e.message)
      setLoading(false)
    }
  }

  const handlePlayMatch = async (fixture) => {
    try {
      setPlayingMatchId(fixture.id)
      const res = await nationalTeamApi.playMatch(fixture.id, team.id, manager.id)
      if (res.won) {
        toast.success(`¡Victoria con la Selección! ${res.teamGoals}-${res.oppGoals}. (+${res.xpBonus} XP, +Reputación)`)
      } else if (res.drawn) {
        toast.info(`Empate internacional: ${res.teamGoals}-${res.oppGoals}`)
      } else {
        toast.error(`Derrota con la Selección: ${res.teamGoals}-${res.oppGoals}`)
      }
      await loadData()
    } catch (e) {
      toast.error(e.message || 'Error al disputar el partido')
    } finally {
      setPlayingMatchId(null)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sky-400 bg-zinc-950">
        <div className="flex items-center gap-3">
          <Flag className="w-6 h-6 animate-pulse" />
          <span className="font-semibold text-sm">Cargando gestión de Selección Nacional...</span>
        </div>
      </div>
    )
  }

  // VISTA 1: OFERTAS DE SELECCIÓN (Si el DT no tiene una selección activa)
  if (!team) {
    return (
      <div className="min-h-screen p-3 md:p-6 text-zinc-100 bg-zinc-950 pb-28 md:pb-12 max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/80 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => navigate('/manager')} 
              className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 shrink-0"
              title="Volver a carrera"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
            </button>
            <div>
              <h1 className="text-lg md:text-2xl font-black flex items-center gap-2 text-sky-400 leading-tight">
                <Flag className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                <span>Bolsa de Selecciones Nacionales</span>
              </h1>
              <p className="text-xs text-zinc-400">
                Tu reputación actual: {manager?.reputation || 50} pts • Modo Doble Carrera (Club + Selección)
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 border border-sky-500/20 rounded-2xl bg-sky-500/5 mb-6">
          <h3 className="font-bold text-sm md:text-base text-sky-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>El Honor de Dirigir a tu País</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Asumir una selección nacional no afecta tu contrato ni el día a día con tu club. Dirigirás en las ventanas de Fechas FIFA, convocarás a los mejores talentos del país y disputarás la gloria internacional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map(offer => (
            <div 
              key={offer.id} 
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                offer.is_eligible 
                  ? 'border-sky-500/40 bg-zinc-900/50 hover:border-sky-400' 
                  : 'border-zinc-800/80 bg-zinc-900/20 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-sky-300 border border-zinc-700">
                    {offer.category_label}
                  </span>
                  <span className="text-xs text-zinc-500 font-semibold">
                    Rep. Req: {offer.required_reputation} pts
                  </span>
                </div>

                <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                  <span>{offer.name}</span>
                </h3>
                <p className="text-xs text-zinc-400 mb-4">{offer.objective}</p>
              </div>

              <button
                onClick={() => handleAcceptOffer(offer)}
                disabled={!offer.is_eligible}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  offer.is_eligible
                    ? 'bg-sky-500 text-zinc-950 hover:bg-sky-400 shadow-md shadow-sky-500/10'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <span>{offer.is_eligible ? 'Aceptar Cargo de Seleccionador' : 'Reputación Insuficiente'}</span>
                {offer.is_eligible && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // VISTA 2: SELECCIÓN NACIONAL ACTIVA
  const totalMatches = team.matches_played || 0
  const winRate = totalMatches > 0 ? Math.round(((team.matches_won || 0) / totalMatches) * 100) : 0

  return (
    <div className="min-h-screen p-3 md:p-6 text-zinc-100 bg-zinc-950 pb-28 md:pb-12 max-w-7xl mx-auto">
      {/* Header del seleccionador */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-zinc-800/80 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => navigate('/manager')} 
            className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 shrink-0"
            title="Volver a carrera"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
          </button>
          <div>
            <h1 className="text-lg md:text-2xl font-black flex items-center gap-2 text-sky-400 leading-tight">
              <Flag className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
              <span>{team.name}</span>
            </h1>
            <p className="text-xs text-zinc-400">
              Categoría: {team.category?.toUpperCase()} • Récord: {team.matches_won || 0}V - {team.matches_drawn || 0}E - {team.matches_lost || 0}D ({winRate}% efectividad)
            </p>
          </div>
        </div>

        <button
          onClick={handleResign}
          className="px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Renunciar a la Selección</span>
        </button>
      </header>

      {/* Tabs */}
      <nav className="flex rounded-xl bg-zinc-900/80 p-1 mb-6 border border-zinc-800 text-xs md:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('convocatoria')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
            activeTab === 'convocatoria'
              ? 'bg-sky-500 text-zinc-950 shadow-sm font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Nómina Convocada ({callups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('partidos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
            activeTab === 'partidos'
              ? 'bg-sky-500 text-zinc-950 shadow-sm font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Partidos Fecha FIFA</span>
        </button>
      </nav>

      {/* TAB 1: CONVOCATORIA */}
      {activeTab === 'convocatoria' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Futbolistas Convocados para el Ciclo Internacional</span>
            <span className="font-semibold text-sky-400">{callups.length} / 23 Plazas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {callups.map(c => (
              <div key={c.id} className="p-3.5 border border-zinc-800/80 rounded-xl bg-zinc-900/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-white">{c.player?.first_name} {c.player?.last_name}</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-zinc-800 text-sky-400 border border-zinc-700">
                      {c.player?.position}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {c.player?.clubs?.short_name || 'Club'} • {c.player?.age || 22} años
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-200">{c.caps || 0} Caps</p>
                  <p className="text-[10px] text-zinc-500">{c.international_goals || 0} Goles</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 2: PARTIDOS FIFA */}
      {activeTab === 'partidos' && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fixtures.map(f => (
              <div 
                key={f.id} 
                className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
                    <span className="font-semibold text-sky-400 uppercase tracking-wider">{f.tournament_name}</span>
                    {f.played ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Disputado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Calendar className="w-3 h-3" /> {f.match_date}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between py-2 text-sm font-bold text-white">
                    <span>{f.is_home ? team.name : f.opponent_name}</span>
                    <span className="text-base font-black px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                      {f.played ? `${f.home_score} - ${f.away_score}` : 'vs'}
                    </span>
                    <span>{f.is_home ? f.opponent_name : team.name}</span>
                  </div>
                </div>

                {!f.played && (
                  <button
                    disabled={playingMatchId === f.id}
                    onClick={() => handlePlayMatch(f)}
                    className="mt-3 w-full py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/10"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{playingMatchId === f.id ? 'Jugando Fecha FIFA...' : 'Disputar Partido de Selección'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
