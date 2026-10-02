import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { Home, Users, Calendar, Settings, Activity, Shield, Trophy } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState({ user: null, manager: null, club: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const user = await authApi.getSession()
        if (!user) return navigate('/auth')
        
        const manager = await managerApi.getManager(user.id)
        if (!manager) return navigate('/create-manager')
        
        const club = await clubApi.getClubByManager(manager.id)
        if (!club) return navigate('/create-club')
        
        setData({ user, manager, club })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [navigate])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-emerald-500">Cargando la oficina...</div>
  }

  const { manager, club } = data

  const navItems = [
    { icon: Home, label: 'Inicio', active: true },
    { icon: Users, label: 'Plantel' },
    { icon: Calendar, label: 'Partidos' },
    { icon: Activity, label: 'Entrenamiento' },
    { icon: Trophy, label: 'Competición' }
  ]

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside className="flex flex-col w-64 p-4 border-r border-zinc-900 bg-zinc-950">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-emerald-500">EL PIZARRÓN</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item, i) => (
            <button key={i} className={`flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-xl ${item.active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="pt-4 mt-auto border-t border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 font-bold text-black rounded-full bg-emerald-500">
              {manager.first_name[0]}{manager.last_name[0]}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{manager.first_name} {manager.last_name}</p>
              <p className="text-xs text-zinc-500">Nivel {manager.level} • XP {manager.xp}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-white">{club.name}</h2>
            <p className="text-zinc-400">{club.city}, {club.country}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500">Presupuesto</p>
            <p className="text-xl font-bold text-emerald-400">${Number(club.budget).toLocaleString()}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Próximo Partido */}
          <div className="p-6 border lg:col-span-2 border-zinc-800 rounded-3xl bg-zinc-900/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white">Próximo Partido</h3>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-800 text-zinc-300">Amistoso de Pretemporada</span>
            </div>
            
            <div className="flex items-center justify-center gap-8 py-8">
              <div className="text-center">
                <Shield className="w-16 h-16 mx-auto mb-2 text-emerald-500" />
                <p className="font-bold text-white">{club.short_name}</p>
              </div>
              <div className="text-2xl font-black text-zinc-700">VS</div>
              <div className="text-center">
                <Shield className="w-16 h-16 mx-auto mb-2 text-zinc-600" />
                <p className="font-bold text-zinc-400">Equipo Rival</p>
              </div>
            </div>

            <button className="w-full py-4 font-bold text-black transition-transform rounded-xl bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.01]">
              Preparar Partido
            </button>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
