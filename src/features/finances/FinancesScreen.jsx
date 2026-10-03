import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { financesApi } from '../../api/finances'
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Building, ShieldPlus, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'

export default function FinancesScreen() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ club: null, finances: null })
  
  const loadData = async () => {
    try {
      const user = await authApi.getSession()
      if (!user) return navigate('/auth')
      const manager = await managerApi.getManager(user.id)
      const club = await clubApi.getClubByManager(manager.id)
      
      const finances = await financesApi.getFinances(club.id)
      
      setData({ club, finances })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [navigate])

  const handleUpgrade = async (facility, currentLevel, cost) => {
    if (!window.confirm(`¿Mejorar ${facility} por $${cost.toLocaleString()}?`)) return
    try {
      await financesApi.upgradeFacility(data.club.id, facility, cost, currentLevel)
      toast.success('Instalación mejorada con éxito')
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-emerald-500">Analizando finanzas...</div>

  const f = data.finances
  const isProfitable = f.monthlyProfit >= 0

  return (
    <div className="min-h-screen p-8 text-white bg-zinc-950">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-black flex items-center gap-2 text-emerald-500">
            <DollarSign className="w-8 h-8" /> ECONOMÍA Y ESTADIO
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Resumen Financiero */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 border rounded-3xl bg-zinc-900/50 border-zinc-800">
              <p className="text-zinc-500 font-medium mb-1">Caja (Dinero Disponible)</p>
              <p className="text-4xl font-black text-emerald-400">${f.balance.toLocaleString()}</p>
            </div>
            <div className="p-6 border rounded-3xl bg-zinc-900/50 border-zinc-800">
              <p className="text-zinc-500 font-medium mb-1">Balance Mensual</p>
              <div className="flex items-center gap-2">
                {isProfitable ? <TrendingUp className="w-6 h-6 text-emerald-500" /> : <TrendingDown className="w-6 h-6 text-red-500" />}
                <p className={`text-4xl font-black ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isProfitable ? '+' : '-'}${Math.abs(f.monthlyProfit).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-3xl bg-emerald-950/20 border-emerald-900/30">
              <h3 className="font-bold text-emerald-500 mb-4 border-b border-emerald-900/30 pb-2">Ingresos Mensuales</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between"><span className="text-zinc-400">Derechos de TV</span><span className="font-bold">${f.income.tvRights.toLocaleString()}</span></li>
                <li className="flex justify-between"><span className="text-zinc-400">Patrocinadores</span><span className="font-bold">${f.income.sponsors.toLocaleString()}</span></li>
                <li className="flex justify-between"><span className="text-zinc-400">Tienda / Merchandising</span><span className="font-bold">${f.income.storeIncome.toLocaleString()}</span></li>
                <li className="flex justify-between border-t border-emerald-900/30 pt-2 font-bold"><span className="text-emerald-500">TOTAL</span><span className="text-emerald-400">${f.income.total.toLocaleString()}</span></li>
              </ul>
            </div>

            <div className="p-6 border rounded-3xl bg-red-950/20 border-red-900/30">
              <h3 className="font-bold text-red-500 mb-4 border-b border-red-900/30 pb-2">Gastos Mensuales</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between"><span className="text-zinc-400">Sueldos Jugadores</span><span className="font-bold">${f.expenses.playerWages.toLocaleString()}</span></li>
                <li className="flex justify-between"><span className="text-zinc-400">Sueldos Staff</span><span className="font-bold">${f.expenses.staffWages.toLocaleString()}</span></li>
                <li className="flex justify-between"><span className="text-zinc-400">Mantenimiento Estadio</span><span className="font-bold">${f.expenses.maintenance.toLocaleString()}</span></li>
                <li className="flex justify-between border-t border-red-900/30 pt-2 font-bold"><span className="text-red-500">TOTAL</span><span className="text-red-400">${f.expenses.total.toLocaleString()}</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Infraestructura / Estadio */}
        <div className="space-y-6">
          <div className="p-6 border rounded-3xl bg-zinc-900/50 border-zinc-800">
            <h2 className="font-bold text-white text-xl mb-6">Infraestructura</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-zinc-400" />
                    <div>
                      <p className="font-bold text-sm">Estadio ({data.club.stadium_name})</p>
                      <p className="text-xs text-zinc-500">Nivel {data.club.stadium_level} • Capacidad: {data.club.stadium_capacity.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleUpgrade('stadium_level', data.club.stadium_level, data.club.stadium_level * 50000)}
                  className="w-full mt-2 py-2 text-xs font-bold bg-zinc-800 hover:bg-emerald-500 hover:text-black rounded-lg transition-colors"
                >
                  Ampliar Tribunas (-${(data.club.stadium_level * 50000).toLocaleString()})
                </button>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldPlus className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="font-bold text-sm">Centro Médico</p>
                      <p className="text-xs text-zinc-500">Nivel {data.club.medical_level} • Reduce lesiones</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleUpgrade('medical_level', data.club.medical_level, data.club.medical_level * 25000)}
                  className="w-full mt-2 py-2 text-xs font-bold bg-zinc-800 hover:bg-blue-500 hover:text-black rounded-lg transition-colors"
                >
                  Mejorar Equipamiento (-${(data.club.medical_level * 25000).toLocaleString()})
                </button>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="font-bold text-sm">Tienda Oficial</p>
                      <p className="text-xs text-zinc-500">Nivel {data.club.store_level} • Mejora ingresos</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleUpgrade('store_level', data.club.store_level, data.club.store_level * 15000)}
                  className="w-full mt-2 py-2 text-xs font-bold bg-zinc-800 hover:bg-yellow-500 hover:text-black rounded-lg transition-colors"
                >
                  Expandir Tienda (-${(data.club.store_level * 15000).toLocaleString()})
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
