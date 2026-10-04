import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameContext } from '../../context/GameContext'
import { careerApi, CAREER_PROGRESSION_RULES } from '../../api/career'
import { endgameApi } from '../../api/endgame'
import JobOfferBottomSheet from '../career/JobOfferBottomSheet'
import ReputationHistoryModal from '../career/ReputationHistoryModal'
import { 
  ArrowLeft, Award, Trophy, Star, Briefcase, TrendingUp, 
  Shield, UserX, Loader2, Sparkles, AlertTriangle, CheckCircle, 
  Flag, ChevronRight, DollarSign, Wallet, FileText, Send, Building, History
} from 'lucide-react'
import { toast } from 'sonner'
import BottomNav from '../../components/BottomNav'

export default function ManagerCareerScreen() {
  const navigate = useNavigate()
  const { manager, club, refreshContext, confirmAction } = useGameContext()
  
  const [stats, setStats] = useState(null)
  const [offers, setOffers] = useState([])
  const [vacancies, setVacancies] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stints') // 'stints' | 'offers' | 'vacancies' | 'trophies'
  
  // Bottom Sheet state
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [retiring, setRetiring] = useState(false)
  const [reputationModalOpen, setReputationModalOpen] = useState(false)

  const loadCareerData = async () => {
    if (!manager) return
    try {
      setLoading(true)
      const [statsData, jobOffers, vacancyList] = await Promise.all([
        careerApi.getCareerStats(manager.id, club?.id),
        careerApi.getAvailableJobOffers(manager.id, club?.id, manager.reputation || 10),
        careerApi.getAvailableVacancies(club?.id, manager.reputation || 10)
      ])

      setStats(statsData)
      setOffers(jobOffers || [])
      setVacancies(vacancyList || [])
    } catch (err) {
      console.error('Error cargando datos de carrera del DT:', err)
      toast.error('Error al cargar datos de carrera')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCareerData()
  }, [manager?.id, club?.id])

  const handleOpenOfferSheet = (offer) => {
    setSelectedOffer(offer)
  }

  const handleAcceptOffer = async (offer) => {
    const ok = await confirmAction({
      title: 'Firmar Contrato Profesional',
      description: `¿Confirmas tu asunción en ${offer.clubName}? Dejarás tu puesto actual para asumir de forma inmediata con un salario de $${Number(offer.offeredSalary || 0).toLocaleString()}/semana.`,
      confirmText: 'Firmar Contrato',
      variant: 'emerald'
    })
    if (!ok) return

    setActionLoading(true)
    try {
      await careerApi.acceptJobOffer(manager.id, offer.id || offer.clubId, club?.id)
      setSelectedOffer(null)
      toast.success(`¡Has firmado con ${offer.clubName}! Bienvenido a tu nuevo club.`)
      await refreshContext()
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Error al firmar el contrato')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectOffer = async (offer) => {
    setActionLoading(true)
    try {
      if (offer.id) {
        await careerApi.rejectJobOffer(manager.id, offer.id)
      }
      setSelectedOffer(null)
      setOffers(prev => prev.filter(o => o.id !== offer.id && o.clubId !== offer.clubId))
      toast.info(`Has desestimado la propuesta de ${offer.clubName}.`)
    } catch (err) {
      toast.error('Error al rechazar oferta')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApplyForJob = async (targetClub) => {
    const ok = await confirmAction({
      title: `Postularse a ${targetClub.name}`,
      description: `Enviarás tu currículum oficial a la comisión directiva de ${targetClub.name} (${targetClub.tierName}). Tu chance estimada es: ${targetClub.chance}.`,
      confirmText: 'Enviar Postulación',
      variant: 'blue'
    })
    if (!ok) return

    setActionLoading(true)
    try {
      const res = await careerApi.applyForJob(manager.id, targetClub.id, manager.reputation || 10)
      if (res.accepted) {
        toast.success(res.message)
        await loadCareerData()
        setActiveTab('offers')
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err.message || 'Error al procesar la postulación')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResign = async () => {
    const ok = await confirmAction({
      title: 'Presentar Renuncia Voluntaria',
      description: '¿Estás seguro de renunciar a tu cargo? Quedarás en condición de DESEMPLEADO sin cobro de indemnización y tu reputación sufrirá un descuento de 5 puntos por rescisión unilateral.',
      confirmText: 'Confirmar Renuncia',
      variant: 'red'
    })
    if (!ok) return

    setActionLoading(true)
    try {
      await careerApi.resignFromClub(manager.id, club?.id)
      toast.warning('Has presentado tu renuncia. Ahora eres Director Técnico libre.')
      await refreshContext()
      await loadCareerData()
    } catch (err) {
      toast.error(err.message || 'Error al procesar la renuncia')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRetire = async () => {
    const ok = await confirmAction({
      title: 'Retiro del Fútbol Profesional',
      description: '¿Estás seguro de retirarte definitivamente? Tu carrera como entrenador concluirá aquí. Se calculará tu legado histórico, ingresarás al Salón de la Fama y se emitirá la edición histórica del Diario del Retiro.',
      confirmText: 'Colgar el Buzo de DT',
      variant: 'amber'
    })
    if (!ok) return

    setRetiring(true)
    try {
      await endgameApi.processRetirement(manager.id, club?.id)
      toast.success('Carrera finalizada con éxito.')
      if (refreshContext) await refreshContext()
      navigate('/endgame')
    } catch (err) {
      toast.error(err.message || 'Error al procesar el retiro')
    } finally {
      setRetiring(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-emerald-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs text-zinc-400 font-medium">Cargando expediente curricular del DT...</p>
      </div>
    )
  }

  const reputationStars = careerApi.calculateReputationStars(manager.reputation || 10)
  const isEmployed = (stats?.employmentStatus || 'EMPLOYED') === 'EMPLOYED' && !!club

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 pb-28">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(isEmployed ? '/dashboard' : '/manager')}
            className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-300" />
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-black flex items-center gap-2 text-emerald-500 truncate">
              <Briefcase className="w-6 h-6 md:w-8 md:h-8 shrink-0" /> CARRERA DEL DT
            </h1>
            <p className="text-xs text-zinc-400">Trayectoria, finanzas personales, ofertas y banquillos</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/achievements')}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-bold rounded-xl text-xs sm:text-sm transition-all shrink-0"
          >
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Logros</span>
          </button>

          <button
            onClick={() => navigate('/hall-of-fame')}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-bold rounded-xl text-xs sm:text-sm transition-all shrink-0"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Salón de la Fama</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner de Estado Laboral (si está desempleado) */}
        {!isEmployed && !manager.is_retired && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-300">Actualmente Desempleado</h4>
                <p className="text-xs text-zinc-400">
                  No diriges ningún club en este momento. Revisa tus ofertas o postúlate a las vacantes en la Bolsa de Trabajo.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('vacancies')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs shrink-0"
            >
              Ver Vacantes
            </button>
          </div>
        )}

        {/* Top Grid: Perfil DT + Economía Personal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Perfil DT */}
          <div className="md:col-span-2 p-6 border border-zinc-800 rounded-3xl bg-zinc-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500 text-zinc-950 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 shadow-lg shadow-emerald-500/20">
                  {manager.first_name?.[0]}{manager.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                      {manager.first_name} {manager.last_name}
                    </h2>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                      Nivel {manager.level}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                      isEmployed 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {isEmployed ? 'En Funciones' : 'Agente Libre'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    {manager.age || 40} años • {manager.nationality || 'Argentina'} • Club actual: <span className="text-white font-semibold">{club?.name || 'Sin Club (Desempleado)'}</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Filosofía: <span className="text-zinc-300 font-medium">{manager.philosophy || 'Equilibrado'}</span> • Especialidad: <span className="text-zinc-300 font-medium">{manager.specialization || 'Táctico'}</span>
                  </p>
                </div>
              </div>

              {/* Atributos del DT */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
                <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase">Liderazgo</span>
                  <span className="text-lg font-black text-emerald-400">{manager.attr_leadership || 70}</span>
                </div>
                <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase">Táctica</span>
                  <span className="text-lg font-black text-blue-400">{manager.attr_tactics || 70}</span>
                </div>
                <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase">Motivación</span>
                  <span className="text-lg font-black text-yellow-400">{manager.attr_motivation || 70}</span>
                </div>
                <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase">Vestuario</span>
                  <span className="text-lg font-black text-purple-400">{manager.attr_locker_room || 70}</span>
                </div>
              </div>
            </div>

            {/* Renuncia Voluntaria (si está empleado) */}
            {isEmployed && (
              <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-500">¿Deseas desvincularte del club?</span>
                <button
                  onClick={handleResign}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Presentar Renuncia
                </button>
              </div>
            )}
          </div>

          {/* Economía Personal y Reputación */}
          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/60 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Reputación Deportiva</h3>
                <button
                  onClick={() => setReputationModalOpen(true)}
                  className="text-[11px] text-yellow-400 font-bold hover:underline flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Ver Ledger</span>
                </button>
              </div>
              <div 
                className="flex items-center gap-1 mb-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setReputationModalOpen(true)}
                title="Abrir libro mayor de prestigio"
              >
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    className={`w-5 h-5 ${star <= reputationStars ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`} 
                  />
                ))}
                <span className="ml-2 font-mono text-xs font-bold text-yellow-400">
                  {manager.reputation || 10} pts
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {reputationStars >= 4 ? 'DT de Élite Internacional' : reputationStars >= 3 ? 'Consolidado en Primera' : 'Entrenador Emergente'}
              </p>
            </div>

            {/* Finanzas Personales (Regla 31.3) */}
            <div className="space-y-3 mt-6 pt-6 border-t border-zinc-800/80">
              <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Ahorros Personales Acumulados</span>
                </div>
                <p className="text-xl font-black text-emerald-400">
                  ${Number(stats?.personalSavings || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  <span>Salario Semanal Percibido</span>
                </div>
                <p className="text-base font-black text-white">
                  ${Number(stats?.currentContractWage || 0).toLocaleString()}
                  <span className="text-xs font-normal text-zinc-500">/sem</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen Global de Partidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40">
            <span className="text-xs text-zinc-500 font-medium">Partidos Dirigidos</span>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">{stats?.totalMatches || 0}</p>
          </div>
          <div className="p-4 sm:p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40">
            <span className="text-xs text-zinc-500 font-medium">Victorias</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{stats?.totalWon || 0}</p>
          </div>
          <div className="p-4 sm:p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40">
            <span className="text-xs text-zinc-500 font-medium">Empates</span>
            <p className="text-2xl sm:text-3xl font-black text-yellow-400 mt-1">{stats?.totalDrawn || 0}</p>
          </div>
          <div className="p-4 sm:p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-zinc-500 font-medium">Efectividad</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">{stats?.winRate || 0}%</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-zinc-300 mt-1">{stats?.totalLost || 0} <span className="text-xs text-red-400 font-medium">D</span></p>
          </div>
        </div>

        {/* Acceso a Selección Nacional (Fase 33) */}
        <div 
          onClick={() => navigate('/national-team')}
          className="p-4 sm:p-5 border border-sky-500/30 rounded-3xl bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-sky-500/60 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-2xl group-hover:scale-105 transition-transform shrink-0">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Selección Nacional & Doble Carrera</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">Fase FIFA</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dirige a tu país, gestiona convocatorias y disputa torneos internacionales sin descuidar a tu club.
              </p>
            </div>
          </div>
          <button className="px-3.5 py-1.5 bg-sky-500 text-zinc-950 rounded-xl font-bold text-xs flex items-center gap-1.5 group-hover:bg-sky-400 transition-colors shrink-0">
            <span>Gestionar Selección</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stints')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'stints'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Trayectoria & Ciclos ({stats?.stints?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('offers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 relative ${
              activeTab === 'offers'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Ofertas Entrantes ({offers.length})</span>
            {offers.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('vacancies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'vacancies'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Bolsa de Trabajo ({vacancies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trophies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'trophies'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Vitrina de Trofeos ({stats?.trophies?.length || 0})</span>
          </button>
        </div>

        {/* Tab 1: Trayectoria & Ciclos */}
        {activeTab === 'stints' && (
          <div className="p-5 sm:p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white mb-1">
              <FileText className="w-5 h-5 text-emerald-400" /> Historial de Clubes Dirigidos
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              Registro inmutable de ciclos, efectividad y títulos conquistados en cada institución
            </p>

            {stats?.stints && stats.stints.length > 0 ? (
              <div className="space-y-3">
                {stats.stints.map((stint, idx) => {
                  const isCurrent = !stint.ended_at
                  const stintTotal = (stint.matches_won || 0) + (stint.matches_drawn || 0) + (stint.matches_lost || 0)
                  const stintWinRate = stintTotal > 0 ? Math.round(((stint.matches_won || 0) / stintTotal) * 100) : 0

                  return (
                    <div 
                      key={stint.id || idx}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isCurrent 
                          ? 'border-emerald-500/30 bg-emerald-500/5' 
                          : 'border-zinc-800 bg-zinc-950'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${
                            isCurrent 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-base">{stint.club_name}</h3>
                              {isCurrent ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                                  Club Actual
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-400 rounded-full">
                                  {stint.departure_reason === 'RESIGNED' ? 'Renuncia' :
                                   stint.departure_reason === 'MOVED_TO_ANOTHER_CLUB' ? 'Traspaso' :
                                   stint.departure_reason === 'SACKED' ? 'Destituido' : 'Concluido'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              Desde {new Date(stint.started_at).toLocaleDateString('es-AR')} {stint.ended_at ? `hasta ${new Date(stint.ended_at).toLocaleDateString('es-AR')}` : '(En curso)'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-500 block">Efectividad</span>
                            <span className="font-black text-emerald-400 font-mono text-sm">{stintWinRate}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-zinc-800/80 text-center">
                        <div className="p-2 bg-zinc-900/60 rounded-xl">
                          <span className="text-[10px] text-zinc-500 block">PJ</span>
                          <span className="font-bold text-white text-xs">{stint.matches_managed || 0}</span>
                        </div>
                        <div className="p-2 bg-zinc-900/60 rounded-xl">
                          <span className="text-[10px] text-zinc-500 block">PG</span>
                          <span className="font-bold text-emerald-400 text-xs">{stint.matches_won || 0}</span>
                        </div>
                        <div className="p-2 bg-zinc-900/60 rounded-xl">
                          <span className="text-[10px] text-zinc-500 block">PE</span>
                          <span className="font-bold text-yellow-400 text-xs">{stint.matches_drawn || 0}</span>
                        </div>
                        <div className="p-2 bg-zinc-900/60 rounded-xl">
                          <span className="text-[10px] text-zinc-500 block">PP</span>
                          <span className="font-bold text-red-400 text-xs">{stint.matches_lost || 0}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-10 text-center border border-dashed border-zinc-800 rounded-2xl">
                <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">Aún no hay ciclos registrados</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Ofertas Laborales Activas */}
        {activeTab === 'offers' && (
          <div className="p-5 sm:p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white mb-1">
              <Briefcase className="w-5 h-5 text-emerald-400" /> Ofertas de Empleo Entrantes
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              Propuestas formales emitidas por comisiones directivas según tu reputación y mérito deportivo
            </p>

            {offers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map(offer => (
                  <div 
                    key={offer.id || offer.clubId}
                    className="p-5 border border-zinc-800 bg-zinc-950 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-white text-base truncate">{offer.clubName}</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full font-medium">
                          {offer.tierName}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Objetivo: <span className="text-amber-300 font-semibold">{offer.objective || 'Mitad de Tabla'}</span>
                      </p>

                      <div className="mt-4 pt-3 border-t border-zinc-900 space-y-2 text-xs">
                        <div className="flex justify-between text-zinc-400">
                          <span>Sueldo Ofrecido:</span>
                          <span className="text-emerald-400 font-semibold font-mono">${Number(offer.offeredSalary || 0).toLocaleString()}/sem</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Presupuesto Fichajes:</span>
                          <span className="text-white font-semibold font-mono">${Number(offer.budget || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Vigencia:</span>
                          <span className="text-zinc-300 font-medium">Vence en {offer.weeksRemaining || 2} sem.</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-5">
                      <button
                        onClick={() => handleOpenOfferSheet(offer)}
                        className="flex-1 py-2.5 text-xs font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors"
                      >
                        Revisar & Firmar
                      </button>
                      <button
                        onClick={() => handleRejectOffer(offer)}
                        disabled={actionLoading}
                        className="px-3 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:bg-zinc-900 rounded-xl transition-colors"
                        title="Desestimar Oferta"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl">
                <Briefcase className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-400 font-medium">No tienes ofertas pendientes en este momento</p>
                <p className="text-xs text-zinc-600 mt-1">Avanza en el torneo o postúlate activamente en la Bolsa de Trabajo</p>
                <button
                  onClick={() => setActiveTab('vacancies')}
                  className="mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs hover:bg-emerald-500/20 transition-all"
                >
                  Explorar Bolsa de Trabajo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Bolsa de Trabajo / Vacantes */}
        {activeTab === 'vacancies' && (
          <div className="p-5 sm:p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white mb-1">
              <Building className="w-5 h-5 text-emerald-400" /> Bolsa de Trabajo & Puestos Vacantes
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              Clubes de la federación donde puedes presentar tu candidatura formal según los requisitos de reputación
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vacancies.map(targetClub => (
                <div 
                  key={targetClub.id}
                  className="p-4 sm:p-5 border border-zinc-800 bg-zinc-950 rounded-2xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="font-bold text-white text-base truncate">{targetClub.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full font-medium">
                        {targetClub.tierName}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{targetClub.city}</p>

                    <div className="mt-3 pt-3 border-t border-zinc-900 space-y-1.5 text-xs">
                      <div className="flex justify-between text-zinc-400">
                        <span>Reputación requerida:</span>
                        <span className="text-zinc-200 font-semibold font-mono">{targetClub.requiredReputation} pts</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Tu probabilidad:</span>
                        <span className={`font-bold font-mono text-[11px] ${
                          targetClub.chance === 'MUY ALTA' || targetClub.chance === 'CANDIDATO FIRME' 
                            ? 'text-emerald-400' 
                            : targetClub.chance === 'POCAS OPCIONES'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}>
                          {targetClub.chance}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyForJob(targetClub)}
                    disabled={actionLoading}
                    className="w-full mt-4 py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Postularse a este Club</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Vitrina de Trofeos */}
        {activeTab === 'trophies' && (
          <div className="p-5 sm:p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-yellow-400 mb-1">
              <Trophy className="w-5 h-5 text-yellow-400" /> Vitrina de Trofeos & Palmarés
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              Títulos de liga, ascensos y copas conquistadas durante tu carrera
            </p>

            {stats?.trophies && stats.trophies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {stats.trophies.map(trophy => (
                  <div key={trophy.id} className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500/10 text-yellow-400 rounded-xl flex items-center justify-center shrink-0 border border-yellow-500/20">
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
              <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl">
                <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-400 font-medium">Aún no has levantado trofeos</p>
                <p className="text-xs text-zinc-600 mt-1">Gana la liga o consigue un ascenso para llenar tu vitrina</p>
              </div>
            )}
          </div>
        )}

        {/* Zona de Administración y Retiro Voluntario */}
        {manager.is_retired ? (
          <div className="p-6 border border-amber-500/40 rounded-3xl bg-amber-950/10">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-amber-400 mb-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Carrera Finalizada • DT Consagrado
            </h2>
            <p className="text-xs text-zinc-400 mb-6">
              Has colgado el buzo de director técnico. Tu legado se encuentra inmortalizado en el Salón de la Fama y en la edición histórica del Diario del Retiro.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/endgame')}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl text-sm transition-transform active:scale-95 shadow-lg shadow-amber-500/20"
              >
                Ver Diario del Retiro y Epílogo
              </button>
              <button
                onClick={() => navigate('/hall-of-fame')}
                className="px-6 py-3 border border-amber-500/40 bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-bold rounded-xl text-sm transition-all"
              >
                Ver en el Salón de la Fama
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 border border-red-900/40 rounded-3xl bg-red-950/10">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5" /> Retiro Voluntario del Fútbol Profesional
            </h2>
            <p className="text-xs text-zinc-400 mb-6">
              Si decides retirarte, tu carrera como director técnico concluirá definitivamente. El sistema calculará tu Legado Histórico, registrará tu inducción al Salón de la Fama y redactará la crónica periodística de tu trayectoria.
            </p>

            <button
              onClick={handleRetire}
              disabled={retiring}
              className="px-6 py-3 border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white font-bold rounded-xl text-sm transition-all"
            >
              {retiring ? 'Procesando retiro...' : 'Retirarse del Fútbol Profesional'}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet de Oferta Laboral (Regla 31.1) */}
      <JobOfferBottomSheet
        isOpen={!!selectedOffer}
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onAccept={handleAcceptOffer}
        onReject={handleRejectOffer}
        loading={actionLoading}
      />

      {/* Modal / Sheet del Libro Mayor de Prestigio (Fase 32) */}
      <ReputationHistoryModal
        isOpen={reputationModalOpen}
        onClose={() => setReputationModalOpen(false)}
        managerId={manager?.id}
      />

      <BottomNav />
    </div>
  )
}
