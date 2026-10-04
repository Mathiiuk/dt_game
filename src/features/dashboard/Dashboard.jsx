import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi } from '../../api/dashboard'
import { eventsApi } from '../../api/events'
import { queryCache } from '../../utils/cache'
import { useGameContext } from '../../context/GameContext'
import { 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  Activity, 
  Shield, 
  Trophy, 
  FastForward, 
  Loader2, 
  Building2, 
  DollarSign, 
  Bell, 
  Globe, 
  ChevronRight, 
  Award,
  AlertTriangle,
  AlertCircle,
  Heart,
  TrendingUp,
  Play
} from 'lucide-react'
import { toast } from 'sonner'
import { isFixtureDue } from '../../domain/fixtureStatus'
import SeasonCloseModal from '../season/SeasonCloseModal'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, manager, club, loading: contextLoading, refreshContext } = useGameContext()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSeasonCloseModal, setShowSeasonCloseModal] = useState(false)

  useEffect(() => {
    if (contextLoading || !club || !manager) return

    let isMounted = true

    const loadData = async () => {
      try {
        const overview = await dashboardApi.getOverview(club, manager)
        if (isMounted) {
          setDashboardData(overview)
          setLoading(false)
        }
      } catch (e) {
        console.error('Error cargando proyección del dashboard:', e)
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [contextLoading, club?.id, club?.game_date, club?.budget, manager?.id, manager?.xp])

  const handleAdvanceWeek = async () => {
    // Nota: tener menos de 11 aptos NO impide avanzar la semana (si no, un plantel lesionado jamás se recuperaría:
    // la recuperación ocurre al avanzar). El mínimo de 11 sólo condiciona jugar el partido (ver alerta del dashboard).
    if (dashboardData?.nextFixture && isFixtureDue(dashboardData.nextFixture.match_date, club.game_date)) {
      toast.error('Debes disputar tu partido pendiente antes de avanzar de semana.')
      return
    }

    setAdvancing(true)
    try {
      const { gameLoopApi } = await import('../../api/gameLoop')
      const result = await gameLoopApi.advanceWeek(club.id, manager.id)

      if (result.fired) {
        toast.error('¡LA DIRIGENCIA TE HA DESTITUIDO POR RESULTADOS DEPORTIVOS!')
        navigate('/auth')
        return
      }

      queryCache.clear()
      await refreshContext()
      toast.success('Semana completada con éxito. Plan de trabajo ejecutado.')
    } catch (e) {
      toast.error(e.message || 'Error al avanzar de semana.')
    } finally {
      setAdvancing(false)
    }
  }

  if (loading || contextLoading || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-emerald-400 font-medium text-sm animate-pulse">Cargando centro de mando del club...</p>
      </div>
    )
  }

  const {
    managerSummary,
    clubSummary,
    financesSummary,
    squadHealth,
    standingsSnippet,
    nextFixture,
    urgentAlerts,
    pendingEvents
  } = dashboardData

  const navItems = [
    { icon: Home, label: 'Inicio', active: true, path: '/dashboard' },
    { icon: Calendar, label: 'Calendario', path: '/calendar' },
    { icon: Users, label: 'Plantel', path: '/squad' },
    { icon: Trophy, label: 'Competición', path: '/standings' },
    { icon: Activity, label: 'Entrenamiento', path: '/training' },
    { icon: Settings, label: 'Mercado', path: '/market' },
    { icon: Building2, label: 'Club', path: '/club' },
    { icon: DollarSign, label: 'Finanzas', path: '/finances' }
  ]

  const getSafeDate = (dateStr) => {
    if (!dateStr) return new Date('2026-08-01T00:00:00')
    const cleanStr = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`
    const d = new Date(cleanStr)
    return isNaN(d.getTime()) ? new Date('2026-08-01T00:00:00') : d
  }

  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).format(getSafeDate(clubSummary.gameDate))

  const isMatchReady = !!nextFixture && isFixtureDue(nextFixture.match_date, clubSummary.gameDate)
  const isMatchFuture = !!nextFixture && !isMatchReady

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 p-4 border-r border-zinc-900 bg-zinc-950 transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-emerald-500">DEL POTRERO</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-zinc-400 hover:text-white">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {navItems.map((item, i) => (
            <button 
              key={i} 
              onClick={() => {
                if (item.path) navigate(item.path)
              }}
              className={`flex items-center w-full gap-3 px-3.5 py-2.5 text-xs font-semibold transition-colors rounded-xl ${
                item.active 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* DT Summary Card at Bottom */}
        <div 
          onClick={() => navigate('/manager')}
          className="pt-4 mt-auto border-t border-zinc-900 space-y-2.5 cursor-pointer p-2 rounded-2xl hover:bg-zinc-900 transition-colors"
          title="Ver Carrera y Administración del DT"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 font-bold text-black rounded-full bg-emerald-500 shrink-0 text-sm">
              {managerSummary.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">{managerSummary.name}</p>
              <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-1">
                <span>Nvl {managerSummary.level} • {managerSummary.title}</span>
                <span className="font-mono">{managerSummary.currentXp} XP</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${managerSummary.progressPercent || 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="text-[10px] text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800 flex justify-between">
            <span>Reputación:</span>
            <span className="font-bold text-emerald-400 font-mono">{managerSummary.reputation} pts</span>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 lg:pb-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <header className="flex flex-col items-start justify-between mb-6 md:flex-row md:items-center gap-4">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="p-2 transition-colors rounded-xl bg-zinc-900 text-emerald-500 lg:hidden hover:bg-zinc-800 border border-zinc-800"
              >
                <Home className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white">{clubSummary.name}</h2>
                <p className="text-xs text-zinc-400">{clubSummary.city}, {clubSummary.country} • {clubSummary.stadiumName}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between w-full gap-3 md:gap-4 md:justify-end md:w-auto">
            <div 
              onClick={() => navigate('/calendar')}
              className="text-left md:text-right cursor-pointer group hover:opacity-90 transition-opacity"
              title="Ver calendario anual de la temporada"
            >
              <div className="flex items-center md:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                <p className="text-xs text-zinc-500 group-hover:text-zinc-300 capitalize transition-colors">{formattedDate}</p>
              </div>
              <p className="text-xs md:text-sm font-bold text-emerald-400">Torneo Regional • Tier 5</p>
            </div>

            {(club?.current_week >= 52) ? (
              <button
                onClick={() => setShowSeasonCloseModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-black rounded-xl transition-all shadow-lg active:scale-95 bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:from-amber-300 hover:to-amber-400 shadow-amber-500/20"
              >
                <Trophy className="w-4 h-4 text-black" />
                <span>Gala de Fin de Temporada</span>
              </button>
            ) : (
              <button 
                onClick={handleAdvanceWeek}
                disabled={advancing || isMatchReady}
                className={`flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 ${
                  isMatchReady 
                    ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                }`}
              >
                {advancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FastForward className="w-4 h-4" />}
                <span>{isMatchReady ? 'Partido Programado Hoy' : 'Avanzar Semana'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Banners de Alertas Urgentes */}
        {urgentAlerts && urgentAlerts.length > 0 && (
          <div className="space-y-2 mb-6">
            {urgentAlerts.map(alert => (
              <div 
                key={alert.id}
                onClick={() => alert.actionUrl && navigate(alert.actionUrl)}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] ${
                  alert.priority === 'HIGH'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : alert.priority === 'MEDIUM'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {alert.priority === 'HIGH' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : alert.priority === 'MEDIUM' ? (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Bell className="w-4 h-4 text-blue-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold mr-2">[{alert.title}]</span>
                    <span>{alert.message}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-semibold underline text-[11px] shrink-0">
                  <span>Resolver</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Hub Access: Copas Internacionales y Salón de la Fama */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div 
            onClick={() => navigate('/international-cup')}
            className="p-3.5 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-center justify-between cursor-pointer hover:border-amber-500/60 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Copa Continental</h4>
                <p className="text-[10px] text-zinc-400">Torneo internacional de clubes</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div 
            onClick={() => navigate('/achievements')}
            className="p-3.5 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent flex items-center justify-between cursor-pointer hover:border-emerald-500/60 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Logros de DT</h4>
                <p className="text-[10px] text-zinc-400">Misiones y recompensas</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div 
            onClick={() => navigate('/hall-of-fame')}
            className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Salón de la Fama</h4>
                <p className="text-[10px] text-zinc-400">Leyendas del fútbol</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Dynamic Events (Fase 35) */}
        {pendingEvents && pendingEvents.length > 0 && pendingEvents.map(ev => {
          const isCritical = ev.severity === 'CRITICAL'
          const optionsList = Array.isArray(ev.options) ? ev.options : []
          const categoryColors = {
            COMMUNITY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
            LOCKER_ROOM: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
            BOARD_PRESS: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
            FINANCIAL_CRISIS: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
          }
          const categoryLabels = {
            COMMUNITY: 'Comunidad & Barrio',
            LOCKER_ROOM: 'Vestuario & Disciplina',
            BOARD_PRESS: 'Dirigencia & Prensa',
            FINANCIAL_CRISIS: 'Economía & Crisis'
          }

          return (
            <div 
              key={ev.id} 
              className={`p-5 mb-6 border rounded-2xl transition-all ${
                isCritical 
                  ? 'border-red-500/50 bg-red-950/20 shadow-lg shadow-red-950/20' 
                  : 'border-zinc-800 bg-zinc-900/60'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryColors[ev.category] || 'text-zinc-400 bg-zinc-800'}`}>
                    {categoryLabels[ev.category] || ev.category}
                  </span>
                  {isCritical && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Requiere Decisión Urgente
                    </span>
                  )}
                </div>
              </div>

              <h3 className="mb-1 font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <Bell className={`w-4 h-4 ${isCritical ? 'text-red-400' : 'text-blue-400'}`} />
                <span>{ev.title}</span>
              </h3>
              <p className="mb-4 text-xs text-zinc-300 leading-relaxed">{ev.description}</p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
                {optionsList.map(opt => {
                  const optCost = Number(opt.cost || 0)
                  const canAfford = optCost === 0 || Number(clubSummary?.budget || 0) >= optCost

                  return (
                    <button 
                      key={opt.id}
                      disabled={!canAfford}
                      onClick={async () => {
                        try {
                          await eventsApi.resolveEvent(ev.id, opt, manager?.id)
                          await refreshContext()
                          toast.success('Decisión ejecutada con éxito.')
                        } catch (err) {
                          toast.error(err.message || 'Error al procesar decisión.')
                        }
                      }}
                      className={`px-3.5 py-2 text-xs font-semibold transition-all border rounded-xl flex items-center justify-between gap-2 ${
                        !canAfford 
                          ? 'border-zinc-800 bg-zinc-950 text-zinc-600 cursor-not-allowed'
                          : 'border-zinc-700/80 bg-zinc-900 hover:bg-zinc-800 text-white hover:border-zinc-600'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {optCost > 0 && (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${canAfford ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-400'}`}>
                          -${optCost.toLocaleString()}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Grid Principal */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Tarjeta de Próximo Partido */}
          <div className="p-6 border lg:col-span-2 border-zinc-800/80 rounded-2xl bg-zinc-900/60 backdrop-blur-sm flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Compromiso Oficial</h3>
                </div>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-zinc-800 text-zinc-300">
                  {nextFixture ? `Fecha ${nextFixture.match_week || 1}` : 'Pretemporada'}
                </span>
              </div>
              
              {nextFixture ? (
                <div className="flex items-center justify-center gap-4 py-8 md:gap-8">
                  <div className="w-28 text-center md:w-36 shrink-0">
                    <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-2 rounded-2xl flex items-center justify-center bg-zinc-950 border border-zinc-800">
                      <Shield className={`w-8 h-8 md:w-10 md:h-10 ${nextFixture.home_team_id === club.id ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    </div>
                    <p className="font-bold text-xs md:text-sm text-white truncate" title={nextFixture.home?.name || 'Local'}>
                      {nextFixture.home?.name || 'Local'}
                    </p>
                    <span className="text-[10px] text-zinc-500 uppercase">{nextFixture.home_team_id === club.id ? 'Tu Club' : 'Rival'}</span>
                  </div>

                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-xl font-black md:text-2xl text-zinc-600 font-mono">VS</span>
                    <span className="text-[10px] text-zinc-500 mt-1 font-mono">{nextFixture.match_date}</span>
                  </div>

                  <div className="w-28 text-center md:w-36 shrink-0">
                    <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-2 rounded-2xl flex items-center justify-center bg-zinc-950 border border-zinc-800">
                      <Shield className={`w-8 h-8 md:w-10 md:h-10 ${nextFixture.away_team_id === club.id ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    </div>
                    <p className="font-bold text-xs md:text-sm text-white truncate" title={nextFixture.away?.name || 'Visitante'}>
                      {nextFixture.away?.name || 'Visitante'}
                    </p>
                    <span className="text-[10px] text-zinc-500 uppercase">{nextFixture.away_team_id === club.id ? 'Tu Club' : 'Rival'}</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No hay compromisos oficiales agendados para esta semana
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800/80">
              <button 
                onClick={() => navigate('/tactics')} 
                className="flex-1 py-3 px-4 text-xs font-bold transition-colors border text-zinc-300 border-zinc-700/80 rounded-xl bg-zinc-800/70 hover:bg-zinc-700"
              >
                Ajustar Táctica y XI Titular
              </button>
              <button 
                onClick={() => {
                  if (!nextFixture) return
                  navigate('/match', { state: { fixtureId: nextFixture.id } })
                }}
                disabled={!nextFixture || isMatchFuture}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 ${
                  !nextFixture || isMatchFuture
                    ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/80 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {isMatchFuture
                    ? `Partido el ${nextFixture.match_date}`
                    : 'Disputar Partido'}
                </span>
              </button>
            </div>
          </div>

          {/* Panel de Estado Institucional y Plantel */}
          <div className="p-6 border border-zinc-800/80 rounded-2xl bg-zinc-900/60 backdrop-blur-sm space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="font-bold text-sm text-white">Estado del Plantel</h3>
              <span className="text-[11px] font-mono text-zinc-400">
                {squadHealth.availableCount} / {squadHealth.totalPlayers} Aptos
              </span>
            </div>
            
            <div className="space-y-4">
              {/* Condición Física */}
              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Condición Física Media
                  </span>
                  <span className="font-mono font-bold text-emerald-400">{squadHealth.averageFitness}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800">
                  <div 
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${squadHealth.averageFitness}%` }} 
                  />
                </div>
              </div>

              {/* Moral del Plantel */}
              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-blue-400" />
                    Moral del Vestuario
                  </span>
                  <span className="font-mono font-bold text-blue-400">{squadHealth.averageMorale}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800">
                  <div 
                    className="h-full rounded-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${squadHealth.averageMorale}%` }} 
                  />
                </div>
              </div>

              {/* Salud Financiera */}
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Caja del Club
                  </span>
                  <span className={`font-mono font-bold ${financesSummary.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${financesSummary.balance.toLocaleString()} USD
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Sueldos: ${financesSummary.weeklyWageBill}/sem</span>
                  <span>Tope: ${financesSummary.wageBudget}/sem</span>
                </div>
              </div>

              {/* Mini Standings */}
              {standingsSnippet && (
                <div className="pt-3 border-t border-zinc-800/80">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-zinc-400 font-semibold">Posición en Liga</span>
                    <button onClick={() => navigate('/standings')} className="text-[10px] text-emerald-400 hover:underline">
                      Ver Tabla
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                        {standingsSnippet.rank || 1}º
                      </span>
                      <span className="text-white font-sans">{clubSummary.shortName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <span>{standingsSnippet.played || 0} PJ</span>
                      <span className="font-bold text-white">{standingsSnippet.points || 0} PTS</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal: Gala de Cierre de Temporada (Fase 29) */}
      {showSeasonCloseModal && (
        <SeasonCloseModal
          club={club}
          manager={manager}
          careerId={club?.career_id}
          seasonYear={club?.current_season_year || 2026}
          onClose={() => setShowSeasonCloseModal(false)}
          onSuccess={() => {
            setShowSeasonCloseModal(false)
            if (typeof refreshContext === 'function') refreshContext()
          }}
        />
      )}
    </div>
  )
}
