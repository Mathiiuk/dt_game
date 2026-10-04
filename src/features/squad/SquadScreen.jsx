import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { playerApi } from '../../api/player'
import { contractApi } from '../../api/contracts'
import { 
  ArrowLeft, 
  Users, 
  FileSignature, 
  DollarSign, 
  Bell, 
  X, 
  Check, 
  UserMinus, 
  TrendingUp, 
  AlertCircle,
  Tag,
  Briefcase,
  GraduationCap,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import { queryCache } from '../../utils/cache'
import ContractRenewalModal from './ContractRenewalModal'
import MentorshipModal from './MentorshipModal'
import { personalitiesApi, PERSONALITY_ARCHETYPES } from '../../api/personalities'

export default function SquadScreen() {
  const navigate = useNavigate()
  const { club, manager, loading: contextLoading, refreshContext, confirmAction } = useGameContext()

  const cachedPlayers = club?.id ? queryCache.get(`squad:${club.id}`) : null
  const cachedOffers = club?.id ? queryCache.get(`offers:${club.id}`) : null

  const [loading, setLoading] = useState(!cachedPlayers)
  const [data, setData] = useState({ 
    players: cachedPlayers || [], 
    offers: cachedOffers || [] 
  })
  const [activeTab, setActiveTab] = useState('squad') // 'squad' | 'offers'
  const [showMentorshipModal, setShowMentorshipModal] = useState(false)

  // Modals state
  const [renewalModalPlayer, setRenewalModalPlayer] = useState(null)
  const [transferModalPlayer, setTransferModalPlayer] = useState(null)
  const [askingPriceInput, setAskingPriceInput] = useState('')
  const [counterModalOffer, setCounterModalOffer] = useState(null)
  const [counterPriceInput, setCounterPriceInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const loadData = async () => {
    try {
      if (!club?.id) return
      const [players, offers, personalitiesList] = await Promise.all([
        playerApi.getSquad(club.id),
        contractApi.getOffersForClub(club.id),
        personalitiesApi.syncSquadPersonalities(club.id).catch(() => [])
      ])
      const persMap = new Map((personalitiesList || []).map(p => [p.id, p.personality]))
      const enrichedPlayers = (players || []).map(p => ({
        ...p,
        personalityData: persMap.get(p.id) || null
      }))
      setData({ players: enrichedPlayers, offers })
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

  const handleRenew = (player) => {
    setRenewalModalPlayer(player)
  }

  const handleOpenTransferModal = (player) => {
    setTransferModalPlayer(player)
    setAskingPriceInput(player.asking_price ? String(player.asking_price) : String(player.market_value || 15000))
  }

  const handleSaveTransferStatus = async (isListed) => {
    if (!transferModalPlayer) return
    const price = parseInt(askingPriceInput, 10) || 0

    try {
      setIsProcessing(true)
      await contractApi.setTransferStatus(transferModalPlayer.id, {
        transfer_status: isListed ? 'TRANSFER_LISTED' : 'NOT_FOR_SALE',
        asking_price: isListed ? price : null
      })
      toast.success(isListed 
        ? `${transferModalPlayer.last_name} puesto en lista de transferibles por $${price.toLocaleString()}`
        : `${transferModalPlayer.last_name} retirado de la lista de transferibles`)
      setTransferModalPlayer(null)
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTerminateContract = async (player) => {
    const severance = contractApi.calculateSeveranceCost(player)
    const clubBudget = club?.budget || 0

    if (clubBudget < severance) {
      return toast.error(`Fondos insuficientes: el finiquito es de $${severance.toLocaleString()} pero la caja tiene $${clubBudget.toLocaleString()}`)
    }

    const confirmed = await confirmAction({
      title: `Rescindir Contrato de ${player.first_name} ${player.last_name}`,
      description: `La rescisión unilateral abonará el 65% de sus sueldos pendientes ($${severance.toLocaleString()}) y el jugador quedará libre. ¿Confirmar rescisión?`,
      confirmText: `Abonar Finiquito ($${severance.toLocaleString()})`,
      cancelText: 'Cancelar',
      variant: 'danger'
    })
    if (!confirmed) return

    try {
      setIsProcessing(true)
      await contractApi.terminateContract(club.id, player.id, {
        managerId: manager?.id,
        careerId: club?.career_id
      })
      toast.success(`Contrato rescindido. Se abonaron $${severance.toLocaleString()} de indemnización.`)
      if (typeof refreshContext === 'function') await refreshContext()
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAcceptOffer = async (offer) => {
    const confirmed = await confirmAction({
      title: 'Aceptar Oferta de Traspaso',
      description: `¿Confirmar la venta de ${offer.players?.first_name} ${offer.players?.last_name} a ${offer.from_club_name || 'club interesado'} por $${Number(offer.amount).toLocaleString()}? El 80% ($${Math.round(offer.amount * 0.8).toLocaleString()}) se sumará al presupuesto de fichajes.`,
      confirmText: 'Cerrar Venta',
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return

    try {
      setIsProcessing(true)
      await contractApi.resolveOffer(
        offer.id,
        'ACCEPTED',
        offer.player_id,
        offer.from_club_id,
        club.id,
        offer.amount,
        manager?.id
      )
      toast.success(`¡Venta cerrada! $${Number(offer.amount).toLocaleString()} ingresados por el traspaso.`)
      if (typeof refreshContext === 'function') await refreshContext()
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectOffer = async (offer) => {
    try {
      setIsProcessing(true)
      await contractApi.resolveOffer(
        offer.id,
        'REJECTED',
        offer.player_id,
        offer.from_club_id,
        club.id,
        offer.amount,
        manager?.id
      )
      toast.info('Oferta rechazada formalmente.')
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenCounterModal = (offer) => {
    setCounterModalOffer(offer)
    setCounterPriceInput(String(Math.round(offer.amount * 1.15)))
  }

  const handleSendCounterOffer = async () => {
    if (!counterModalOffer) return
    const counterAmount = parseInt(counterPriceInput, 10)
    if (isNaN(counterAmount) || counterAmount <= counterModalOffer.amount) {
      return toast.error('La contraoferta debe ser un monto superior a la oferta inicial.')
    }

    try {
      setIsProcessing(true)
      const res = await contractApi.resolveOffer(
        counterModalOffer.id,
        'COUNTER',
        counterModalOffer.player_id,
        counterModalOffer.from_club_id,
        club.id,
        counterModalOffer.amount,
        manager?.id,
        { counterAmount }
      )

      if (res?.status === 'ACCEPTED') {
        toast.success(`¡La contraoferta de $${counterAmount.toLocaleString()} fue aceptada! Traspaso concretado.`)
        if (typeof refreshContext === 'function') await refreshContext()
      } else {
        toast.info(res?.message || 'El club comprador ha rechazado la contraoferta.')
      }

      setCounterModalOffer(null)
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-400 font-medium text-sm animate-pulse">Cargando nómina y negociaciones...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 sm:p-6 md:p-8 text-white bg-zinc-950 pb-28 md:pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-black flex items-center gap-2 text-emerald-500 leading-none mb-1">
              <Users className="w-6 h-6 md:w-8 md:h-8 shrink-0 text-emerald-500" /> PLANTEL Y VENTAS
            </h1>
            <p className="text-xs text-zinc-400">Gestión de plantilla, renovaciones, transferibles y ofertas entrantes</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowMentorshipModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 transition-colors flex items-center gap-2 text-xs font-bold shadow-lg"
          >
            <GraduationCap className="w-4 h-4 text-purple-400" />
            <span>Mentorías y Psicología</span>
          </button>

          {/* Presupuesto */}
          <div className="p-3 sm:p-0 bg-zinc-900/60 sm:bg-transparent rounded-xl border border-zinc-800/80 sm:border-transparent flex justify-between items-center sm:block text-right">
            <span className="text-xs text-zinc-400 block">Caja Disponible</span>
            <span className="text-lg md:text-2xl font-black text-emerald-400 font-mono">
              ${Number(club?.budget || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs Mobile */}
      <div className="flex lg:hidden gap-2 mb-4">
        <button
          onClick={() => setActiveTab('squad')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'squad' 
              ? 'bg-emerald-500 text-black border-emerald-500 shadow-sm' 
              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Jugadores ({data.players.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 relative ${
            activeTab === 'offers' 
              ? 'bg-emerald-500 text-black border-emerald-500 shadow-sm' 
              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Ofertas ({data.offers.length})</span>
          {data.offers.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        
        {/* Lista de Jugadores (Visible si tab squad o en desktop) */}
        <div className={`lg:col-span-3 p-4 sm:p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50 ${activeTab === 'squad' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-bold text-white text-base md:text-lg">Plantel Profesional ({data.players.length})</h2>
              <p className="text-xs text-zinc-400">Toca un jugador para fijar precio o negociar salida</p>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {data.players.map(p => {
              const isListed = p.is_transfer_listed || p.transfer_status === 'TRANSFER_LISTED'
              return (
                <div key={p.id} className="p-4 border border-zinc-800 bg-zinc-950/80 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{p.first_name} {p.last_name}</span>
                        {p.is_injured && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded">
                            Lesionado
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded ${
                          p.position === 'GK' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          p.position === 'DEF' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          p.position === 'MED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {p.position}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {p.age} años • {p.contract_role || 'Rotación'}
                      </p>
                      {p.personalityData?.primary_archetype && (
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${PERSONALITY_ARCHETYPES[p.personalityData.primary_archetype]?.badgeColor || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                            <Sparkles className="w-2.5 h-2.5" />
                            {PERSONALITY_ARCHETYPES[p.personalityData.primary_archetype]?.name || p.personalityData.primary_archetype}
                          </span>
                        </div>
                      )}
                    </div>
                    {isListed ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                        Transferible {p.asking_price ? `$${Number(p.asking_price).toLocaleString()}` : ''}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-900 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Físico</span>
                      <span className={`font-bold ${p.state_fitness < 60 ? 'text-red-400' : p.state_fitness < 80 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        {p.state_fitness}%
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Moral</span>
                      <span className={`font-bold ${(p.morale ?? 70) < 50 ? 'text-red-400' : (p.morale ?? 70) < 75 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        {p.morale ?? 70}%
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Salario / sem</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        ${(p.contract_salary || 500).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button 
                      onClick={() => handleRenew(p)}
                      className="py-1.5 px-2 text-xs font-bold text-black bg-zinc-200 hover:bg-white rounded-xl flex items-center justify-center gap-1 transition-colors"
                    >
                      <FileSignature className="w-3.5 h-3.5" /> Renovar
                    </button>
                    <button 
                      onClick={() => handleOpenTransferModal(p)}
                      className={`py-1.5 px-2 text-xs font-bold border rounded-xl flex items-center justify-center gap-1 transition-colors ${
                        isListed 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                          : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" /> {isListed ? 'Precio' : 'Vender'}
                    </button>
                    <button 
                      onClick={() => handleTerminateContract(p)}
                      className="py-1.5 px-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl flex items-center justify-center gap-1 transition-colors"
                    >
                      <UserMinus className="w-3.5 h-3.5" /> Rescindir
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-zinc-500 border-zinc-800 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Jugador</th>
                  <th className="pb-3 font-semibold">Pos</th>
                  <th className="pb-3 font-semibold">Edad</th>
                  <th className="pb-3 font-semibold">Rol / Personalidad</th>
                  <th className="pb-3 font-semibold">Moral</th>
                  <th className="pb-3 font-semibold">Salario</th>
                  <th className="pb-3 font-semibold">Estatus Venta</th>
                  <th className="pb-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-zinc-900">
                {data.players.map(p => {
                  const isListed = p.is_transfer_listed || p.transfer_status === 'TRANSFER_LISTED'
                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span>{p.first_name} {p.last_name}</span>
                          {p.is_injured && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded">
                              Lesionado ({p.injury_type || 'Baja'})
                            </span>
                          )}
                          {p.morale_unhappy_transfer_blocked && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded">
                              Descontento
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 text-xs font-black rounded ${
                          p.position === 'GK' ? 'bg-amber-500/10 text-amber-400' :
                          p.position === 'DEF' ? 'bg-blue-500/10 text-blue-400' :
                          p.position === 'MED' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {p.position}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-400">{p.age}</td>
                      <td className="py-3 text-zinc-300">
                        <div>{p.contract_role || 'Rotación'}</div>
                        {p.personalityData?.primary_archetype ? (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${PERSONALITY_ARCHETYPES[p.personalityData.primary_archetype]?.badgeColor || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`} title={PERSONALITY_ARCHETYPES[p.personalityData.primary_archetype]?.description}>
                            <Sparkles className="w-2.5 h-2.5" />
                            {PERSONALITY_ARCHETYPES[p.personalityData.primary_archetype]?.name || p.personalityData.primary_archetype}
                          </span>
                        ) : (
                          <div className="text-[10px] text-zinc-500">{p.personality || 'Normal'}</div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-bold ${
                          (p.morale ?? 70) < 50 ? 'text-red-400' : 
                          (p.morale ?? 70) < 75 ? 'text-yellow-400' : 
                          'text-emerald-400'
                        }`}>
                          {p.morale ?? 70}%
                        </span>
                      </td>
                      <td className="py-3 font-mono text-emerald-400">${(p.contract_salary || 500).toLocaleString()}</td>
                      <td className="py-3">
                        {isListed ? (
                          <span className="px-2 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {p.asking_price ? `$${Number(p.asking_price).toLocaleString()}` : 'Transferible'}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">No transferible</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleRenew(p)}
                            title="Renovar contrato"
                            className="p-1.5 text-xs font-bold text-black transition-colors bg-white rounded-lg hover:bg-zinc-200"
                          >
                            <FileSignature className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleOpenTransferModal(p)}
                            title={isListed ? 'Editar precio de venta' : 'Poner en venta'}
                            className={`p-1.5 text-xs font-bold transition-colors border rounded-lg ${
                              isListed 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30' 
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                            }`}
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleTerminateContract(p)}
                            title="Rescindir contrato"
                            className="p-1.5 text-xs font-bold text-red-400 transition-colors bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Ofertas y Vestuario (Visible si tab offers o en desktop) */}
        <div className={`space-y-6 ${activeTab === 'offers' ? 'block' : 'hidden lg:block'}`}>
          {/* Ofertas Recibidas */}
          <div className="p-5 border border-zinc-800 rounded-3xl bg-zinc-900/60 shadow-lg">
            <h2 className="flex items-center gap-2 mb-4 font-bold text-emerald-400 text-base">
              <Bell className="w-5 h-5 text-emerald-400" /> Ofertas Entrantes ({data.offers.length})
            </h2>
            
            <div className="space-y-3">
              {data.offers.length === 0 ? (
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center">
                  <p className="text-xs text-zinc-500">No hay ofertas de clubes de IA activas por tus jugadores.</p>
                  <p className="text-[11px] text-zinc-600 mt-1">Coloca jugadores en lista de transferibles para atraer propuestas.</p>
                </div>
              ) : (
                data.offers.map(o => (
                  <div key={o.id} className="p-4 border rounded-2xl bg-zinc-950 border-zinc-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white text-sm">{o.players?.first_name} {o.players?.last_name}</p>
                        <p className="text-[11px] text-emerald-400/80 mt-0.5 font-medium">De: {o.from_club_name || 'Club de IA'}</p>
                      </div>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-zinc-800 text-zinc-400">
                        Semana {o.expires_at_week ? `expira sem ${o.expires_at_week}` : 'activa'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Monto Ofrecido</span>
                        <span className="text-base font-black text-emerald-400 font-mono">${Number(o.amount).toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold block">A Presupuesto (80%)</span>
                        <span className="text-xs font-bold text-zinc-300 font-mono">+${Math.round(o.amount * 0.8).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1.5">
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleAcceptOffer(o)}
                        className="py-2 text-xs font-bold text-black bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Aceptar
                      </button>
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleOpenCounterModal(o)}
                        className="py-2 text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <TrendingUp className="w-3.5 h-3.5" /> Contra
                      </button>
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleRejectOffer(o)}
                        className="py-2 text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vestuario */}
          <div className="p-5 border border-zinc-800 rounded-3xl bg-zinc-900/50 space-y-4">
            <h2 className="flex items-center gap-2 font-bold text-white text-base">
              <Briefcase className="w-5 h-5 text-emerald-500" /> Dinámica de Vestuario
            </h2>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-zinc-400">Moral del Plantel</span>
                  <span className="text-emerald-400 font-bold">{club?.squad_morale ?? 70}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${club?.squad_morale ?? 70}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-zinc-400">Cohesión de Grupo</span>
                  <span className="text-purple-400 font-bold">{club?.squad_cohesion ?? 70}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${club?.squad_cohesion ?? 70}%` }} />
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 leading-tight">
                Vender referentes o rechazar ofertas lucrativas de juveniles ambiciosos reduce la moral y cohesión del grupo.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Modal: Transfer List & Asking Price */}
      {transferModalPlayer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Gestión de Venta
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {transferModalPlayer.first_name} {transferModalPlayer.last_name}
                </h3>
                <p className="text-xs text-zinc-400">Posición: {transferModalPlayer.position} • {transferModalPlayer.age} años</p>
              </div>
              <button 
                onClick={() => setTransferModalPlayer(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Valor de Mercado Base:</span>
                <span className="font-bold text-zinc-200 font-mono">${Number(transferModalPlayer.market_value || 15000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Salario Actual:</span>
                <span className="font-bold text-emerald-400 font-mono">${Number(transferModalPlayer.contract_salary || 500).toLocaleString()}/sem</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Precio Pedido Sugerido ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500 font-bold">$</span>
                <input 
                  type="number"
                  value={askingPriceInput}
                  onChange={(e) => setAskingPriceInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-3 py-2.5 text-white font-mono font-bold focus:border-emerald-500 outline-none"
                  placeholder="Ej: 25000"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                <button 
                  type="button"
                  onClick={() => setAskingPriceInput(String(Math.round((transferModalPlayer.market_value || 15000) * 0.9)))}
                  className="py-1 px-2 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                >
                  Rápida (-10%)
                </button>
                <button 
                  type="button"
                  onClick={() => setAskingPriceInput(String(transferModalPlayer.market_value || 15000))}
                  className="py-1 px-2 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                >
                  Justa (100%)
                </button>
                <button 
                  type="button"
                  onClick={() => setAskingPriceInput(String(Math.round((transferModalPlayer.market_value || 15000) * 1.25)))}
                  className="py-1 px-2 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                >
                  Cotizada (+25%)
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                disabled={isProcessing}
                onClick={() => handleSaveTransferStatus(false)}
                className="flex-1 py-2.5 text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors"
              >
                No Transferible
              </button>
              <button 
                type="button"
                disabled={isProcessing}
                onClick={() => handleSaveTransferStatus(true)}
                className="flex-1 py-2.5 text-xs font-bold bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" /> Poner en Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Counter Offer */}
      {counterModalOffer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                  Regatear con el Club Comprador
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Contraoferta por {counterModalOffer.players?.first_name} {counterModalOffer.players?.last_name}
                </h3>
                <p className="text-xs text-zinc-400">Interesado: {counterModalOffer.from_club_name || 'Club de IA'}</p>
              </div>
              <button 
                onClick={() => setCounterModalOffer(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Oferta Inicial Recibida:</span>
                <span className="font-bold text-zinc-200 font-mono">${Number(counterModalOffer.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Tolerancia Máxima Estimada:</span>
                <span className="font-bold text-blue-400 font-mono">${Math.round(counterModalOffer.amount * 1.25).toLocaleString()} (+25%)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Nuevo Monto Exigido ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500 font-bold">$</span>
                <input 
                  type="number"
                  value={counterPriceInput}
                  onChange={(e) => setCounterPriceInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-3 py-2.5 text-white font-mono font-bold focus:border-blue-500 outline-none"
                  placeholder="Ingresa contraoferta"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button 
                  type="button"
                  onClick={() => setCounterPriceInput(String(Math.round(counterModalOffer.amount * 1.10)))}
                  className="py-1 px-2 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                >
                  +10% Probable
                </button>
                <button 
                  type="button"
                  onClick={() => setCounterPriceInput(String(Math.round(counterModalOffer.amount * 1.20)))}
                  className="py-1 px-2 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                >
                  +20% Exigente
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setCounterModalOffer(null)}
                className="flex-1 py-2.5 text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button"
                disabled={isProcessing}
                onClick={handleSendCounterOffer}
                className="flex-1 py-2.5 text-xs font-bold bg-blue-500 text-white rounded-xl hover:bg-blue-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Enviar Contraoferta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Negociación y Renovación de Contrato (Fase 15) */}
      {renewalModalPlayer && (
        <ContractRenewalModal 
          player={renewalModalPlayer}
          club={club}
          manager={manager}
          currentWeek={club?.current_week || 1}
          onClose={() => setRenewalModalPlayer(null)}
          onSuccess={() => {
            loadData()
            if (typeof refreshContext === 'function') refreshContext()
          }}
        />
      )}

      {/* Modal: Mentorías y Psicología de Potrero (Fase 26) */}
      {showMentorshipModal && (
        <MentorshipModal
          club={club}
          players={data.players}
          onClose={() => setShowMentorshipModal(false)}
          onMentorshipStarted={() => loadData()}
        />
      )}
    </div>
  )
}
