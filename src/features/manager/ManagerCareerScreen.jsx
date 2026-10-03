import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameContext } from '../../context/GameContext'
import { careerApi } from '../../api/career'
import { 
  ArrowLeft, Award, Trophy, Star, Briefcase, TrendingUp, 
  Shield, UserX, Loader2, Sparkles, AlertTriangle, CheckCircle, Flag, ChevronRight 
} from 'lucide-react'
import { toast } from 'sonner'
import BottomNav from '../../components/BottomNav'

export default function ManagerCareerScreen() {
  const navigate = useNavigate()
  const { manager, club, refreshContext } = useGameContext()
  const [stats, setStats] = useState(null)
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [transferring, setTransferring] = useState(false)
  const [retiring, setRetiring] = useState(false)
  const [endgameData, setEndgameData] = useState(null)

  useEffect(() => {
    if (!manager) return

    const loadCareer = async () => {
      try {
        const data = await careerApi.getCareerStats(manager.id, club?.id)
        setStats(data)

        const jobOffers = await careerApi.getAvailableJobOffers(manager.id, club?.id, manager.reputation || 10)
        setOffers(jobOffers)
      } catch (err) {
        console.error(err)
        toast.error('Error al cargar datos de carrera')
      } finally {
        setLoading(false)
      }
    }

    loadCareer()
  }, [manager, club])

  const handleAcceptOffer = async (offer) => {
    if (!window.confirm(`¿Deseas firmar contrato con ${offer.clubName}? Dejarás tu club actual.`)) return

    setTransferring(true)
    try {
      await careerApi.acceptJobOffer(manager.id, offer.clubId, club?.id)
      await refreshContext()
      toast.success(`¡Has firmado con ${offer.clubName}! Bienvenido a tu nuevo club.`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTransferring(false)
    }
  }

  const handleRetire = async () => {
    if (!window.confirm('¿Estás seguro de retirarte del fútbol profesional? Tu carrera como DT finalizará aquí y se calculará tu legado histórico.')) return

    setRetiring(true)
    try {
      const result = await careerApi.retireManager(manager.id)
      setEndgameData(result)
      toast.success('Carrera finalizada con éxito.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRetiring(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-emerald-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Modal / Pantalla de Endgame (Retiro voluntario)
  if (endgameData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full border border-yellow-500/30 rounded-3xl bg-zinc-900/90 p-8 text-center space-y-6 shadow-2xl shadow-yellow-500/10">
          <div className="w-20 h-20 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto border border-yellow-500/40">
            <Sparkles className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest text-yellow-500 font-bold">Fin de Carrera</span>
            <h1 className="text-3xl md:text-5xl font-black text-white mt-1">¡LEYENDA DEL FÚTBOL!</h1>
            <p className="text-lg text-emerald-400 font-bold mt-2">{endgameData.legacyRank}</p>
          </div>

          <p className="text-sm text-zinc-300 max-w-lg mx-auto">
            {manager.first_name} {manager.last_name} ha colgado el buzo de DT tras una trayectoria inolvidable. Tu nombre ha quedado grabado para siempre en la memoria de los hinchas.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-zinc-800">
            <div>
              <p className="text-xs text-zinc-500 font-medium">Partidos</p>
              <p className="text-2xl font-black text-white">{endgameData.stats.totalMatches}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Victorias</p>
              <p className="text-2xl font-black text-emerald-400">{endgameData.stats.totalWon}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Títulos</p>
              <p className="text-2xl font-black text-yellow-400">{endgameData.trophyCount}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Puntos de Leyenda</p>
              <p className="text-2xl font-black text-purple-400">{endgameData.legacyScore}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl transition-transform hover:scale-105"
            >
              Comenzar Nueva Partida
            </button>
          </div>
        </div>
      </div>
    )
  }

  const reputationStars = careerApi.calculateReputationStars(manager.reputation || 10)

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-black flex items-center gap-2 text-emerald-500 truncate">
              <Briefcase className="w-6 h-6 md:w-8 md:h-8 shrink-0" /> CARRERA DEL DT
            </h1>
            <p className="text-xs text-zinc-400">Perfil profesional, palmarés y administración</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Grid: Perfil y Reputación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Perfil DT */}
          <div className="md:col-span-2 p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50 flex flex-col justify-between">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500 text-black rounded-2xl flex items-center justify-center font-black text-2xl shrink-0">
                {manager.first_name[0]}{manager.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                    {manager.first_name} {manager.last_name}
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                    Nivel {manager.level}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  {manager.age || 40} años • {manager.nationality || 'Argentina'} • Club actual: <span className="text-white font-semibold">{club?.name || 'Agente Libre'}</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Estilo: <span className="text-zinc-300 font-medium">{manager.philosophy || 'Equilibrado'}</span> • Especialidad: <span className="text-zinc-300 font-medium">{manager.specialization || 'Táctico'}</span>
                </p>
              </div>
            </div>

            {/* Atributos del DT */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 block">Liderazgo</span>
                <span className="text-lg font-black text-emerald-400">{manager.attr_leadership || 70}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 block">Táctica</span>
                <span className="text-lg font-black text-blue-400">{manager.attr_tactics || 70}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 block">Motivación</span>
                <span className="text-lg font-black text-yellow-400">{manager.attr_motivation || 70}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 block">Vestuario</span>
                <span className="text-lg font-black text-purple-400">{manager.attr_locker_room || 70}</span>
              </div>
            </div>
          </div>

          {/* Reputación y Efectividad */}
          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Reputación Mundial</h3>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    className={`w-6 h-6 ${star <= reputationStars ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`} 
                  />
                ))}
              </div>
              <p className="text-xs text-zinc-400">
                {reputationStars >= 4 ? 'DT de Élite Internacional' : reputationStars >= 3 ? 'Consolidado en Primera División' : 'Entrenador Emergente'}
              </p>
            </div>

            <div className="space-y-4 mt-6 pt-6 border-t border-zinc-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Efectividad Histórica</span>
                <span className="font-black text-emerald-400 text-lg">{stats?.winRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Títulos Ganados</span>
                <span className="font-black text-yellow-400 text-lg">{stats?.trophies?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Temporadas Completadas</span>
                <span className="font-black text-white text-lg">{stats?.seasons?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Historial y Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40">
            <span className="text-xs text-zinc-500 font-medium">Partidos Dirigidos</span>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">{stats?.totalMatches || 0}</p>
          </div>
          <div className="p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40">
            <span className="text-xs text-zinc-500 font-medium">Victorias</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{stats?.totalWon || 0}</p>
          </div>
          <div className="p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40">
            <span className="text-xs text-zinc-500 font-medium">Empates</span>
            <p className="text-2xl sm:text-3xl font-black text-yellow-400 mt-1">{stats?.totalDrawn || 0}</p>
          </div>
          <div className="p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40">
            <span className="text-xs text-zinc-500 font-medium">Derrotas</span>
            <p className="text-2xl sm:text-3xl font-black text-red-400 mt-1">{stats?.totalLost || 0}</p>
          </div>
        </div>

        {/* Vitrina de Trofeos (Salón de la Fama) */}
        <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-400 mb-4">
            <Trophy className="w-6 h-6" /> Vitrina de Trofeos y Logros
          </h2>

          {stats?.trophies && stats.trophies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {stats.trophies.map(trophy => (
                <div key={trophy.id} className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 text-yellow-400 rounded-xl flex items-center justify-center shrink-0">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{trophy.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Año {trophy.year} • {trophy.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center border border-dashed border-zinc-800 rounded-2xl">
              <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-400 font-medium">Aún no has levantado trofeos</p>
              <p className="text-xs text-zinc-600 mt-1">Gana la liga o consigue un ascenso para llenar tu vitrina</p>
            </div>
          )}
        </div>

        {/* Acceso a Selección Nacional (Fase 33) */}
        <div 
          onClick={() => navigate('/national-team')}
          className="p-5 border border-sky-500/30 rounded-3xl bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-sky-500/60 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-2xl group-hover:scale-105 transition-transform shrink-0">
              <Flag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Selección Nacional & Doble Carrera</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">Fase FIFA</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dirige a tu país, gestiona convocatorias y disputa torneos internacionales sin descuidar a tu club.
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-sky-500 text-zinc-950 rounded-xl font-bold text-xs flex items-center gap-1.5 group-hover:bg-sky-400 transition-colors shrink-0">
            <span>Gestionar Selección</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Ofertas Laborales */}
        <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white mb-2">
            <Briefcase className="w-6 h-6 text-emerald-500" /> Ofertas de Otros Clubes
          </h2>
          <p className="text-xs text-zinc-400 mb-6">
            Clubes interesados en contratarte según tu reputación y nivel como entrenador
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map(offer => (
              <div key={offer.clubId} className="p-5 border border-zinc-800 bg-zinc-950 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-base truncate">{offer.clubName}</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded font-medium">
                      {offer.tierName}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{offer.city}, {offer.country}</p>

                  <div className="mt-4 pt-4 border-t border-zinc-900 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Presupuesto Club:</span>
                      <span className="text-white font-semibold">${Number(offer.budget || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Salario Ofrecido:</span>
                      <span className="text-emerald-400 font-semibold">${offer.offeredSalary}/semana</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAcceptOffer(offer)}
                  disabled={transferring}
                  className="w-full mt-5 py-2.5 text-xs font-bold text-black bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors disabled:opacity-50"
                >
                  {transferring ? 'Firmando...' : 'Aceptar Oferta y Cambiar de Club'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Zona de Administración y Retiro (Endgame) */}
        <div className="p-6 border border-red-900/40 rounded-3xl bg-red-950/10">
          <h2 className="text-lg font-bold flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle className="w-5 h-5" /> Administración del DT & Retiro Voluntario
          </h2>
          <p className="text-xs text-zinc-400 mb-6">
            Si decides retirarte, tu carrera como director técnico concluirá definitivamente. El sistema calculará tu Legado Histórico en base a tus partidos, victorias y trofeos obtenidos.
          </p>

          <button
            onClick={handleRetire}
            disabled={retiring}
            className="px-6 py-3 border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white font-bold rounded-xl text-sm transition-all"
          >
            {retiring ? 'Procesando retiro...' : 'Retirarse del Fútbol Profesional'}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
