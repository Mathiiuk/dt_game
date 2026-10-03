import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { playerApi } from '../../api/player'
import { contractApi } from '../../api/contracts'
import { ArrowLeft, Users, FileSignature, DollarSign, Bell } from 'lucide-react'
import { toast } from 'sonner'

import { useGameContext } from '../../context/GameContext'

export default function SquadScreen() {
  const navigate = useNavigate()
  const { user, manager, club, loading: contextLoading, confirmAction } = useGameContext()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ players: [], offers: [] })
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const loadData = async () => {
    try {
      const players = await playerApi.getSquad(club.id)
      const offers = await contractApi.getOffersForClub(club.id)
      
      setData({ players, offers })
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

  const handleRenew = async (player) => {
    const newSalary = player.contract_salary + 5000
    const confirmed = await confirmAction({
      title: 'Renovar Contrato',
      description: `¿Deseas ofrecer una renovación de contrato a ${player.first_name} ${player.last_name} con un nuevo salario de $${newSalary.toLocaleString()}/mes?`,
      confirmText: 'Firmar Renovación',
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return
    
    try {
      await contractApi.renewContract(player.id, { 
        contract_salary: newSalary,
        contract_role: 'Titular'
      })
      toast.success('Contrato renovado exitosamente')
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleTransferList = async (player) => {
    try {
      await playerApi.updatePlayer(player.id, { is_transfer_listed: !player.is_transfer_listed })
      toast.success(player.is_transfer_listed 
        ? `${player.last_name} ha sido retirado de la lista de transferibles.` 
        : `${player.last_name} está ahora en la lista de transferibles.`)
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleOffer = async (offer, status) => {
    try {
      await contractApi.resolveOffer(
        offer.id, 
        status, 
        offer.player_id, 
        offer.from_club_id, 
        club.id, 
        offer.amount, 
        manager.id
      )
      if (status === 'ACCEPTED') {
        toast.success(`Jugador vendido por $${offer.amount.toLocaleString()}`)
      } else {
        toast.info('Oferta rechazada')
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
        <p className="text-emerald-400 font-medium text-sm animate-pulse">Cargando plantel...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 sm:p-6 md:p-8 text-white bg-zinc-950 pb-28 md:pb-8">
      <header className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-3xl font-black flex items-center gap-2 text-emerald-500 truncate">
            <Users className="w-6 h-6 md:w-8 md:h-8 shrink-0" /> PLANTEL Y CONTRATOS
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        
        {/* Lista de Jugadores */}
        <div className="lg:col-span-3 p-4 sm:p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-white text-lg">Jugadores ({data.players.length})</h2>
            <span className="text-xs text-zinc-400">Total en nómina</span>
          </div>

          {/* Mobile Cards (Visible only on small devices) */}
          <div className="space-y-3 md:hidden">
            {data.players.map(p => (
              <div key={p.id} className="p-4 border border-zinc-800 bg-zinc-950/80 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{p.first_name} {p.last_name}</span>
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
                      {p.age} años • {p.contract_role || 'Rotación'} • <span className="text-zinc-500">{p.personality || 'Normal'}</span>
                    </p>
                  </div>
                  {p.injury_days > 0 ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold text-red-400 bg-red-500/20 border border-red-500/30 rounded">
                      {p.injury_days}d lesionado
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
                    <span className="text-zinc-500 block text-[10px]">Salario</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ${(p.contract_salary || 10000).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => handleRenew(p)}
                    className="flex-1 py-2 text-xs font-bold text-black bg-white hover:bg-zinc-200 rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <FileSignature className="w-3.5 h-3.5" /> Renovar
                  </button>
                  <button 
                    onClick={() => handleTransferList(p)}
                    className={`flex-1 py-2 text-xs font-bold border rounded-xl flex items-center justify-center gap-1 transition-colors ${
                      p.is_transfer_listed 
                        ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30' 
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" /> 
                    {p.is_transfer_listed ? 'Quitar Lista' : 'Transferible'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (Hidden on small devices) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-zinc-500 border-zinc-800 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Jugador</th>
                  <th className="pb-3 font-semibold">Pos</th>
                  <th className="pb-3 font-semibold">Edad</th>
                  <th className="pb-3 font-semibold">Rol / Personalidad</th>
                  <th className="pb-3 font-semibold">Físico</th>
                  <th className="pb-3 font-semibold">Moral</th>
                  <th className="pb-3 font-semibold">Salario</th>
                  <th className="pb-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-zinc-900">
                {data.players.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span>{p.first_name} {p.last_name}</span>
                        {p.injury_days > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold text-red-400 bg-red-500/20 border border-red-500/30 rounded">
                            {p.injury_days}d
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
                      <div className="text-[10px] text-zinc-500">{p.personality || 'Normal'}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                        p.state_fitness < 60 ? 'bg-red-500/10 text-red-400' : 
                        p.state_fitness < 80 ? 'bg-yellow-500/10 text-yellow-400' : 
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {p.state_fitness}%
                      </span>
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
                    <td className="py-3 font-mono text-emerald-400">${(p.contract_salary || 10000).toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleRenew(p)}
                          className="flex items-center gap-1 text-xs font-bold text-black transition-colors bg-white rounded-lg px-2.5 py-1.5 hover:bg-zinc-200"
                        >
                          <FileSignature className="w-3 h-3" /> Renovar
                        </button>
                        <button 
                          onClick={() => handleTransferList(p)}
                          className={`flex items-center gap-1 text-xs font-bold transition-colors border rounded-lg px-2.5 py-1.5 ${
                            p.is_transfer_listed 
                              ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30' 
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                          }`}
                        >
                          <DollarSign className="w-3 h-3" /> 
                          {p.is_transfer_listed ? 'Quitar' : 'Vender'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Ofertas y Vestuario */}
        <div className="space-y-6">
          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50 space-y-4">
            <h2 className="flex items-center gap-2 font-bold text-white text-base">
              <Users className="w-5 h-5 text-emerald-500" /> Estado del Vestuario
            </h2>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-zinc-400">Moral Global</span>
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
            </div>
          </div>

          <div className="p-6 border border-zinc-800 rounded-3xl bg-emerald-950/20">
            <h2 className="flex items-center gap-2 mb-4 font-bold text-emerald-500 text-base">
              <Bell className="w-5 h-5" /> Ofertas Recibidas ({data.offers.length})
            </h2>
            
            <div className="space-y-3">
              {data.offers.length === 0 ? (
                <p className="text-xs text-zinc-500">No hay ofertas de compra por tus jugadores en este momento.</p>
              ) : (
                data.offers.map(o => (
                  <div key={o.id} className="p-4 border rounded-2xl bg-zinc-950 border-zinc-800 space-y-3">
                    <div>
                      <p className="font-bold text-white text-sm">{o.players?.first_name} {o.players?.last_name}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Oferta de club interesado</p>
                    </div>
                    <p className="text-lg font-black text-emerald-400">${o.amount.toLocaleString()}</p>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOffer(o, 'ACCEPTED')}
                        className="flex-1 py-2 text-xs font-bold text-black bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors"
                      >
                        Aceptar
                      </button>
                      <button 
                        onClick={() => handleOffer(o, 'REJECTED')}
                        className="flex-1 py-2 text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
