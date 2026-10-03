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
      
      const marketStatus = marketApi.getMarketStatus(club.game_date)
      
      setData({ club, players, marketStatus, manager })
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
    if (!data.marketStatus?.isOpen) {
      return toast.error('El mercado está cerrado. Solo puedes ojer jugadores.')
    }

    const minRecommended = Math.round(player.market_value * 0.9)
    const offerStr = window.prompt(`Oferta por ${player.last_name}.\nValor de mercado: $${player.market_value.toLocaleString()}.\nEl club probablemente rechace menos de $${minRecommended.toLocaleString()}.\n\nIngresa tu oferta:`, player.market_value)
    
    if (!offerStr) return
    const offerAmount = parseInt(offerStr, 10)
    if (isNaN(offerAmount) || offerAmount <= 0) return toast.error('Monto inválido')

    setBuyingId(player.id)
    try {
      await marketApi.buyPlayer(data.club.id, player.id, offerAmount, data.manager.id)
      toast.success(`¡Acuerdo cerrado! ${player.last_name} ha fichado por el club por $${offerAmount.toLocaleString()}.`)
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBuyingId(null)
    }
  }

  if (loading && !data.club) return <div className="flex items-center justify-center min-h-screen text-emerald-500">Cargando mercado...</div>

  return (
    <div className="min-h-screen p-4 md:p-8 text-white bg-zinc-950">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 md:gap-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-emerald-500 leading-none mb-1">MERCADO DE PASES</h1>
            <p className={`text-xs md:text-sm font-bold ${data.marketStatus?.isOpen ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.marketStatus?.name || 'Mercado Cerrado'}
            </p>
          </div>
        </div>
        <div className="text-left md:text-right w-full md:w-auto bg-zinc-900 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none">
          <p className="text-xs md:text-sm text-zinc-500">Presupuesto Disponible</p>
          <p className="text-xl md:text-2xl font-black text-emerald-400">${Number(data.club?.budget || 0).toLocaleString()}</p>
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
                const price = p.market_value || (p.attr_pace * 10000)
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
                        <p className="font-mono text-emerald-400 font-bold">
                          {p.scout_level > 0 ? p.attr_pace : `${Math.max(10, p.attr_pace - 10)}-${Math.min(99, p.attr_pace + 10)}`}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-zinc-950">
                        <p className="text-zinc-500 text-xs">Potencial</p>
                        <p className="font-mono text-blue-400 font-bold">
                          {p.scout_level > 0 ? p.attr_potential : '?'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <p className="font-bold text-zinc-300">
                        {p.scout_level > 0 ? `$${price.toLocaleString()}` : 'Desconocido'}
                      </p>
                      <div className="flex gap-2">
                        {p.scout_level === 0 ? (
                          <button 
                            onClick={async () => {
                              try {
                                await marketApi.scoutPlayer(data.club.id, p.id);
                                toast.success(`Reporte de scout completado para ${p.last_name}`);
                                loadData();
                              } catch(e) {
                                toast.error(e.message);
                              }
                            }}
                            className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-black transition-colors rounded-lg bg-blue-500 hover:bg-blue-400"
                          >
                            Scoutear
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleBuy(p)}
                            disabled={buyingId === p.id || !isAffordable || !data.marketStatus?.isOpen}
                            className={`flex items-center gap-1 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                              !data.marketStatus?.isOpen ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' :
                              !isAffordable 
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                : 'bg-emerald-500 text-black hover:bg-emerald-400'
                            }`}
                          >
                            {buyingId === p.id ? '...' : <><ShoppingCart className="w-4 h-4" /> Ofertar</>}
                          </button>
                        )}
                      </div>
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
