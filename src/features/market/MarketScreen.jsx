import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { marketApi } from '../../api/market'
import { scoutingApi } from '../../api/scouting'
import { 
  ArrowLeft, 
  Search, 
  ShoppingCart, 
  Filter, 
  Eye, 
  Check, 
  X, 
  DollarSign, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'

export default function MarketScreen() {
  const navigate = useNavigate()
  const { club, loading: contextLoading, refreshContext, confirmAction } = useGameContext()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ players: [], marketStatus: null })
  const [filters, setFilters] = useState({ position: '', minPace: '' })
  const [buyingId, setBuyingId] = useState(null)
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  // Offer modal state
  const [offerModalPlayer, setOfferModalPlayer] = useState(null)
  const [customOffer, setCustomOffer] = useState('')
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)

  const loadData = async () => {
    try {
      if (!club?.id) return
      let players = await marketApi.getMarketPlayers(club.id, filters)
      const marketStatus = marketApi.getMarketStatus(club.game_date)
      
      const { supabase } = await import('../../api/supabase')
      const { data: scouted } = await supabase
        .from('scout_reports')
        .select('*')
        .eq('club_id', club.id)
      
      const scoutedMap = new Map(scouted?.map(s => [s.player_id, s]) || [])

      const playersWithScout = players.map(p => {
        const report = scoutedMap.get(p.id)
        return {
          ...p,
          scout_level: report ? (report.knowledge_level ?? report.level ?? 1) : 0,
          scout_date: report ? report.created_at : null,
          pros: report?.pros || [],
          recommendation: report?.recommended_action || null
        }
      })

      setData({ players: playersWithScout, marketStatus })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contextLoading || !club) return
    loadData()
  }, [contextLoading, club])

  const handleSearch = () => {
    setLoading(true)
    loadData()
  }

  const handleOpenOfferModal = (player) => {
    if (!data.marketStatus?.isOpen) {
      return toast.error('El mercado está cerrado actualmente.')
    }
    setOfferModalPlayer(player)
    setCustomOffer(player.market_value ? String(player.market_value) : '50000')
  }

  const handleConfirmOffer = async () => {
    if (!offerModalPlayer) return
    const offerAmount = parseInt(customOffer, 10)
    if (isNaN(offerAmount) || offerAmount <= 0) {
      return toast.error('Por favor ingresa un monto válido para la oferta.')
    }
    if (offerAmount > (club?.budget || 0)) {
      return toast.error('No dispones de suficiente presupuesto para esta oferta.')
    }

    try {
      setIsSubmittingOffer(true)
      await marketApi.buyPlayer(club.id, offerModalPlayer.id, offerAmount, club.manager_id)
      toast.success(`¡Acuerdo concretado! ${offerModalPlayer.last_name} ha fichado por el club por $${offerAmount.toLocaleString()}.`)
      setOfferModalPlayer(null)
      if (typeof refreshContext === 'function') {
        await refreshContext()
      }
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIsSubmittingOffer(false)
    }
  }

  const handleScoutPlayer = async (p) => {
    const confirmed = await confirmAction({
      title: `Ojear a ${p.first_name} ${p.last_name}`,
      description: `Enviar un ojeador para elaborar un informe completo revelará sus atributos, potencial y fortalezas por $300. ¿Confirmar misión?`,
      confirmText: 'Enviar Ojeador ($300)',
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return

    try {
      await scoutingApi.scoutPlayer(club.id, p.id, 'FULL')
      toast.success(`Reporte de scout completado para ${p.last_name}`)
      if (typeof refreshContext === 'function') {
        await refreshContext()
      }
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-400 font-medium text-sm animate-pulse">Explorando mercado de pases...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 sm:p-6 md:p-8 text-white bg-zinc-950 pb-28 md:pb-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-emerald-500 leading-none mb-1">MERCADO DE PASES</h1>
            <p className={`text-xs md:text-sm font-bold ${data.marketStatus?.isOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
              {data.marketStatus?.name || 'Mercado Cerrado'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-4 p-3 md:p-0 bg-zinc-900/60 md:bg-transparent rounded-xl border border-zinc-800/80 md:border-transparent">
          <div>
            <p className="text-xs text-zinc-400">Presupuesto para Fichajes</p>
            <p className="text-lg md:text-2xl font-black text-emerald-400">${Number(club?.budget || 0).toLocaleString()}</p>
          </div>
          <button 
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold text-zinc-200"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {showFiltersMobile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Panel de Filtros */}
        <div className={`space-y-4 ${showFiltersMobile ? 'block' : 'hidden md:block'}`}>
          <div className="p-4 sm:p-5 border border-zinc-800 rounded-2xl bg-zinc-900/50">
            <h2 className="flex items-center gap-2 mb-4 font-bold text-white text-sm">
              <Filter className="w-4 h-4 text-emerald-500" /> Búsqueda y Filtros
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block mb-1.5 text-xs text-zinc-400">Posición</label>
                <select 
                  value={filters.position}
                  onChange={e => setFilters({...filters, position: e.target.value})}
                  className="w-full p-2.5 text-sm border rounded-xl bg-zinc-950 border-zinc-800 focus:border-emerald-500 outline-none text-zinc-200"
                >
                  <option value="">Cualquiera</option>
                  <option value="GK">Arquero (GK)</option>
                  <option value="DF">Defensa (DF)</option>
                  <option value="MD">Mediocampista (MD)</option>
                  <option value="FW">Delantero (FW)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-xs text-zinc-400">Ritmo Mínimo</label>
                <input 
                  type="number"
                  placeholder="Ej: 70"
                  value={filters.minPace}
                  onChange={e => setFilters({...filters, minPace: e.target.value})}
                  className="w-full p-2.5 text-sm border rounded-xl bg-zinc-950 border-zinc-800 focus:border-emerald-500 outline-none text-zinc-200 placeholder:text-zinc-600"
                >
                </input>
              </div>

              <button 
                onClick={handleSearch}
                className="flex items-center justify-center w-full gap-2 py-2.5 font-bold text-black transition-colors bg-emerald-500 rounded-xl hover:bg-emerald-400 text-sm mt-2 shadow-lg shadow-emerald-500/10"
              >
                <Search className="w-4 h-4" /> Aplicar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.players.length === 0 ? (
              <div className="col-span-full p-8 text-center border border-zinc-800 rounded-2xl bg-zinc-900/50">
                <p className="text-zinc-500 text-sm">No se encontraron jugadores que coincidan con la búsqueda.</p>
              </div>
            ) : (
              data.players.map(p => {
                const price = p.market_value || (p.attr_pace * 10000)
                const isAffordable = (club?.budget || 0) >= price
                const isScouted = p.scout_level > 0

                return (
                  <div key={p.id} className="p-4 sm:p-5 border border-zinc-800 rounded-2xl bg-zinc-900/60 hover:border-zinc-700 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="pr-2">
                          <h3 className="font-bold text-base sm:text-lg text-white leading-tight">{p.first_name} {p.last_name}</h3>
                          <p className="text-xs text-zinc-400 mt-0.5">{p.clubs?.name || 'Agente Libre'} • {p.age} años</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-bold rounded-lg bg-zinc-800 text-emerald-400 border border-zinc-700 shrink-0">
                          {p.position}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        <div className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Ritmo</p>
                          <p className="font-mono text-emerald-400 font-bold text-sm">
                            {isScouted ? p.attr_pace : `${Math.max(10, p.attr_pace - 10)}-${Math.min(99, p.attr_pace + 10)}`}
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Potencial</p>
                          <p className="font-mono text-blue-400 font-bold text-sm">
                            {isScouted ? p.attr_potential : '?'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 mt-auto">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-medium">Cotización</p>
                        <p className="font-bold text-zinc-200 text-sm">
                          {isScouted ? `$${price.toLocaleString()}` : 'Desconocida'}
                        </p>
                      </div>

                      <div>
                        {!isScouted ? (
                          <button 
                            onClick={() => handleScoutPlayer(p)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-black transition-colors rounded-xl bg-blue-500 hover:bg-blue-400 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ojear ($300)
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenOfferModal(p)}
                            disabled={buyingId === p.id || !isAffordable || !data.marketStatus?.isOpen}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors shadow-sm ${
                              !data.marketStatus?.isOpen 
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' 
                                : !isAffordable 
                                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' 
                                  : 'bg-emerald-500 text-black hover:bg-emerald-400'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> Ofertar
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

      {/* In-app Offer Modal / Bottom Drawer */}
      {offerModalPlayer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Realizar Oferta de Fichaje
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {offerModalPlayer.first_name} {offerModalPlayer.last_name}
                </h3>
                <p className="text-xs text-zinc-400">{offerModalPlayer.clubs?.name || 'Agente Libre'} • {offerModalPlayer.position}</p>
              </div>
              <button 
                onClick={() => setOfferModalPlayer(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Valor de Mercado:</span>
                <span className="font-bold text-zinc-200">${Number(offerModalPlayer.market_value || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Oferta Mínima Sugerida:</span>
                <span className="font-bold text-amber-400">${Math.round((offerModalPlayer.market_value || 0) * 0.9).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-zinc-800 pt-1.5">
                <span className="text-zinc-500">Tu Presupuesto Disponible:</span>
                <span className="font-bold text-emerald-400">${Number(club?.budget || 0).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Monto de la Oferta ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500 font-bold">$</span>
                <input 
                  type="number"
                  value={customOffer}
                  onChange={(e) => setCustomOffer(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-3 py-2.5 text-white font-mono font-bold focus:border-emerald-500 outline-none"
                  placeholder="Ingresa el monto"
                />
              </div>

              {/* Quick adjustment buttons */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button 
                  type="button"
                  onClick={() => setCustomOffer(String(Math.round((offerModalPlayer.market_value || 0) * 0.9)))}
                  className="py-1 px-2 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                >
                  -10% Mínimo
                </button>
                <button 
                  type="button"
                  onClick={() => setCustomOffer(String(offerModalPlayer.market_value || 0))}
                  className="py-1 px-2 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                >
                  Valor Mercado
                </button>
                <button 
                  type="button"
                  onClick={() => setCustomOffer(String(Math.round((offerModalPlayer.market_value || 0) * 1.15)))}
                  className="py-1 px-2 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                >
                  +15% Fuerte
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setOfferModalPlayer(null)}
                className="flex-1 py-2.5 text-xs font-bold bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button"
                disabled={isSubmittingOffer}
                onClick={handleConfirmOffer}
                className="flex-1 py-2.5 text-xs font-bold bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5"
              >
                {isSubmittingOffer ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Enviar Oferta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
