import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { marketApi } from '../../api/market'
import { ArrowLeft, Search, ShoppingCart, UserPlus, Filter } from 'lucide-react'
import { toast } from 'sonner'

export default function MarketScreen() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ club: null, players: [] })
  const [filters, setFilters] = useState({ position: '', minPace: '' })
  const [buyingId, setBuyingId] = useState(null)

  const loadData = async () => {
    try {
      const user = await authApi.getSession()
      if (!user) return navigate('/auth')
      const manager = await managerApi.getManager(user.id)
      const club = await clubApi.getClubByManager(manager.id)
      
      let players = await marketApi.getMarketPlayers(club.id, filters)
      
      // Si la base de datos de otros jugadores está vacía (por MVP), inyectamos agentes libres
      if (players.length === 0 && !filters.position && !filters.minPace) {
         await marketApi.generateFreeAgents(15)
         players = await marketApi.getMarketPlayers(club.id, filters)
      }
      
      setData({ club, players })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, []) // Removemos dependencias para no loopear al tipear

  const handleSearch = () => {
    setLoading(true)
    loadData()
  }

  const handleBuy = async (player) => {
    const price = player.attr_pace * 10000 // Precio mockeado basado en ritmo (ej 500k)
    
    if (!window.confirm(`¿Comprar a ${player.last_name} por $${price.toLocaleString()}?`)) return

    setBuyingId(player.id)
    try {
      await marketApi.buyPlayer(data.club.id, player.id, price)
      toast.success(`¡${player.last_name} ha fichado por el club!`)
      // Refrescar data
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBuyingId(null)
    }
  }

  if (loading && !data.club) return <div className="flex items-center justify-center min-h-screen text-emerald-500">Cargando mercado...</div>

  return (
    <div className="min-h-screen p-8 text-white bg-zinc-950">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-black text-emerald-500">MERCADO DE PASES</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500">Presupuesto Disponible</p>
          <p className="text-2xl font-black text-emerald-400">${Number(data.club?.budget || 0).toLocaleString()}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        
        {/* Panel de Filtros */}
        <div className="space-y-6">
          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-white">
              <Filter className="w-5 h-5 text-emerald-500" /> Búsqueda
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm text-zinc-400">Posición</label>
                <select 
                  value={filters.position}
                  onChange={e => setFilters({...filters, position: e.target.value})}
                  className="w-full p-3 border rounded-xl bg-zinc-950 border-zinc-800 focus:border-emerald-500"
                >
                  <option value="">Cualquiera</option>
                  <option value="GK">Arquero (GK)</option>
                  <option value="DF">Defensa (DF)</option>
                  <option value="MD">Mediocampista (MD)</option>
                  <option value="FW">Delantero (FW)</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm text-zinc-400">Ritmo Mínimo</label>
                <input 
                  type="number"
                  placeholder="Ej: 70"
                  value={filters.minPace}
                  onChange={e => setFilters({...filters, minPace: e.target.value})}
                  className="w-full p-3 border rounded-xl bg-zinc-950 border-zinc-800 focus:border-emerald-500"
                />
              </div>

              <button 
                onClick={handleSearch}
                className="flex items-center justify-center w-full gap-2 py-3 font-bold text-black transition-colors bg-emerald-500 rounded-xl hover:bg-emerald-400"
              >
                <Search className="w-5 h-5" /> Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.players.length === 0 ? (
              <div className="col-span-full p-8 text-center border border-zinc-800 rounded-3xl bg-zinc-900/50">
                <p className="text-zinc-500">No se encontraron jugadores que coincidan con la búsqueda.</p>
              </div>
            ) : (
              data.players.map(p => {
                const price = p.attr_pace * 10000
                const isAffordable = data.club?.budget >= price
                return (
                  <div key={p.id} className="p-5 border border-zinc-800 rounded-2xl bg-zinc-900/50 hover:border-zinc-700 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{p.first_name} {p.last_name}</h3>
                        <p className="text-sm text-zinc-400">{p.clubs?.name || 'Agente Libre'} • {p.age} años</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-bold rounded-md bg-zinc-800 text-zinc-300">
                        {p.position}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
                      <div className="p-2 rounded bg-zinc-950">
                        <p className="text-zinc-500 text-xs">Ritmo</p>
                        <p className="font-mono text-emerald-400 font-bold">{p.attr_pace}</p>
                      </div>
                      <div className="p-2 rounded bg-zinc-950">
                        <p className="text-zinc-500 text-xs">Físico</p>
                        <p className="font-mono text-blue-400 font-bold">{p.attr_physical}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <p className="font-bold text-zinc-300">${price.toLocaleString()}</p>
                      <button 
                        onClick={() => handleBuy(p)}
                        disabled={buyingId === p.id || !isAffordable}
                        className={`flex items-center gap-1 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                          !isAffordable 
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                            : 'bg-emerald-500 text-black hover:bg-emerald-400'
                        }`}
                      >
                        {buyingId === p.id ? '...' : <><ShoppingCart className="w-4 h-4" /> Fichar</>}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
