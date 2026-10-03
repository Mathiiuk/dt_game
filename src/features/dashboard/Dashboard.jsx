import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { gameLoopApi } from '../../api/gameLoop'
import { Home, Users, Calendar, Settings, Activity, Shield, Trophy, FastForward, Loader2, Building2, DollarSign, Bell } from 'lucide-react'
import { toast } from 'sonner'

import { useGameContext } from '../../context/GameContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, manager, club, loading: contextLoading, refreshContext } = useGameContext()
  const [data, setData] = useState({ levelInfo: null, nextFixture: null })
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    if (contextLoading || !club) return

    const loadDashboard = async () => {
      try {
        const { levelsApi } = await import('../../api/levels')
        const levelInfo = await levelsApi.getLevelInfo(manager.xp)

        const { supabase } = await import('../../api/supabase')
        const { data: fixture } = await supabase
          .from('fixtures')
          .select('*, home:clubs!home_team_id(*), away:clubs!away_team_id(*)')
          .or(`home_team_id.eq.${club.id},away_team_id.eq.${club.id}`)
          .eq('status', 'PENDING')
          .order('match_week', { ascending: true })
          .limit(1)
          .single()

        setData({ levelInfo, nextFixture: fixture || null })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [contextLoading, club, manager])

  const handleAdvanceWeek = async () => {
    if (data.nextFixture && data.nextFixture.match_date <= club.game_date) {
      toast.error('Debes jugar tu partido pendiente antes de avanzar de semana.')
      return
    }

    setAdvancing(true)
    try {
      const { gameLoopApi } = await import('../../api/gameLoop')
      const newDate = await gameLoopApi.advanceWeek(club.id, manager.id)
      await refreshContext()
      toast.success('Semana completada. Plantel entrenado.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setAdvancing(false)
    }
  }

  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading || contextLoading) {
    return <div className="flex items-center justify-center min-h-screen text-emerald-500">Cargando la oficina...</div>
  }

  const navItems = [
    { icon: Home, label: 'Inicio', active: true },
    { icon: Users, label: 'Plantel' },
    { icon: Calendar, label: 'Partidos' },
    { icon: Activity, label: 'Entrenamiento' },
    { icon: Trophy, label: 'Competición' },
    { icon: Settings, label: 'Mercado' },
    { icon: Building2, label: 'Club' },
    { icon: DollarSign, label: 'Finanzas' }
  ]
  
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(club.game_date + 'T00:00:00'))

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 p-4 border-r border-zinc-900 bg-zinc-950 transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-emerald-500">EL PIZARRÓN</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-zinc-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto">
          {navItems.map((item, i) => (
            <button 
              key={i} 
              onClick={() => {
                if (item.label === 'Plantel') navigate('/squad')
                if (item.label === 'Competición') navigate('/standings')
                if (item.label === 'Mercado') navigate('/market')
                if (item.label === 'Club') navigate('/club')
                if (item.label === 'Finanzas') navigate('/finances')
              }}
              className={`flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-xl ${item.active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="pt-4 mt-auto border-t border-zinc-900 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 font-bold text-black rounded-full bg-emerald-500 shrink-0">
              {manager.first_name[0]}{manager.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">{manager.first_name} {manager.last_name}</p>
              <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-1">
                <span>Nvl {data.levelInfo?.currentLevel || manager.level}</span>
                <span>{manager.xp} / {data.levelInfo?.xpRequiredForNext || '?'} XP</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${data.levelInfo?.progressPercent || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-1 rounded truncate">Reputación: {manager.reputation_level || 'Local'}</p>
            {manager.national_team_id && (
              <p className="text-[10px] text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded truncate">DT Selección Nacional</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 lg:pb-8">
        <header className="flex flex-col items-start justify-between mb-8 md:flex-row md:items-center">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 transition-colors rounded-lg bg-zinc-900 text-emerald-500 lg:hidden hover:bg-zinc-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div>
              <h2 className="text-xl md:text-3xl font-black text-white">{club.name}</h2>
              <p className="text-xs md:text-sm text-zinc-400">{club.city}, {club.country}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between w-full gap-4 md:gap-6 md:justify-end md:w-auto mt-4 md:mt-0">
            <div className="text-right">
              <p className="text-sm text-zinc-500 capitalize">{formattedDate}</p>
              <p className="text-lg md:text-xl font-bold text-emerald-400">Semana de Gestión</p>
            </div>
            <button 
              onClick={handleAdvanceWeek}
              disabled={advancing}
              className="flex items-center justify-center w-full md:w-auto gap-2 px-6 py-4 font-bold text-black transition-transform bg-emerald-500 rounded-xl hover:bg-emerald-400 hover:scale-105 disabled:opacity-50"
            >
              {advancing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FastForward className="w-5 h-5" />}
              Avanzar Semana
            </button>
          </div>
        </header>

        {/* Dynamic Event MVP */}
        {Math.random() > 0.8 && (
          <div className="p-6 mb-6 border border-blue-900/50 rounded-3xl bg-blue-900/10">
            <h3 className="mb-2 font-bold text-blue-400 flex items-center gap-2">
              <Bell className="w-5 h-5" /> Evento: Mensaje del Presidente
            </h3>
            <p className="mb-4 text-sm text-zinc-300">"Míster, confío en que el equipo empiece a mostrar los resultados prometidos. Necesitamos ganar el próximo partido."</p>
            <div className="flex gap-4">
              <button onClick={(e) => { e.target.parentElement.parentElement.style.display = 'none'; toast.success('Aceptaste el desafío') }} className="px-4 py-2 text-xs font-bold text-black bg-blue-500 rounded hover:bg-blue-400">Aceptar (+Presión)</button>
              <button onClick={(e) => { e.target.parentElement.parentElement.style.display = 'none'; toast.success('Pediste tiempo') }} className="px-4 py-2 text-xs font-bold text-white transition-colors border rounded border-zinc-700 hover:bg-zinc-800">Pedir paciencia</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Próximo Partido */}
          <div className="p-6 border lg:col-span-2 border-zinc-800 rounded-3xl bg-zinc-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white">Próximo Partido</h3>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-800 text-zinc-300">
                  {data.nextFixture ? `Fecha ${data.nextFixture.match_week}` : 'Pretemporada'}
                </span>
              </div>
              
              {data.nextFixture ? (
                <div className="flex items-center justify-center gap-4 py-8 md:gap-8">
                  <div className="w-24 text-center md:w-32 shrink-0">
                    <Shield className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 ${data.nextFixture.home_team_id === club.id ? 'text-emerald-500' : 'text-zinc-600'}`} />
                    <p className="font-bold text-white truncate" title={data.nextFixture.home.name}>{data.nextFixture.home.short_name}</p>
                  </div>
                  <div className="text-xl font-black md:text-2xl text-zinc-700 shrink-0">VS</div>
                  <div className="w-24 text-center md:w-32 shrink-0">
                    <Shield className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 ${data.nextFixture.away_team_id === club.id ? 'text-emerald-500' : 'text-zinc-600'}`} />
                    <p className="font-bold text-white truncate" title={data.nextFixture.away.name}>{data.nextFixture.away.short_name}</p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500">
                  No hay partidos programados
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button onClick={() => navigate('/tactics')} className="flex-1 py-4 font-bold transition-colors border text-zinc-300 border-zinc-700 rounded-xl bg-zinc-800 hover:bg-zinc-700">
                Táctica
              </button>
              <button 
                onClick={() => {
                  if (!data.nextFixture) return
                  navigate('/match', { state: { fixtureId: data.nextFixture.id } })
                }}
                disabled={!data.nextFixture || data.nextFixture.match_date > club.game_date}
                className="flex-1 py-4 font-bold text-black transition-transform rounded-xl bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {data.nextFixture && data.nextFixture.match_date > club.game_date 
                  ? `Jugar el ${new Date(data.nextFixture.match_date).toLocaleDateString('es-AR', {day: 'numeric', month: 'short'})}`
                  : 'Jugar Partido'}
              </button>
            </div>
          </div>

          {/* Status Panel */}
          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
            <h3 className="mb-6 font-bold text-white">Estado del Plantel</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-zinc-400">Moral Promedio</span>
                  <span className="text-emerald-400">Excelente</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800">
                  <div className="w-[85%] h-full bg-emerald-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-zinc-400">Condición Física</span>
                  <span className="text-blue-400">Óptima</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800">
                  <div className="w-[95%] h-full bg-blue-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-zinc-400">Directiva (Confianza)</span>
                  <span className="text-yellow-400">{club.board_confidence}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${club.board_confidence}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-zinc-500 text-right">Obj: {club.season_objective}</p>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-zinc-400">Hinchada (Aprobación)</span>
                  <span className="text-orange-400">{club.fans_confidence}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${club.fans_confidence}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
