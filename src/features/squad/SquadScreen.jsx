import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { playerApi } from '../../api/player'
import { contractApi } from '../../api/contracts'
import { ArrowLeft, Users, FileSignature, DollarSign, Bell } from 'lucide-react'
import { toast } from 'sonner'

export default function SquadScreen() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ club: null, players: [], offers: [] })
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const loadData = async () => {
    try {
      const user = await authApi.getSession()
      if (!user) return navigate('/auth')
      const manager = await managerApi.getManager(user.id)
      const club = await clubApi.getClubByManager(manager.id)
      const players = await playerApi.getSquad(club.id)
      
      const offers = await contractApi.getOffersForClub(club.id)
      
      setData({ club, players, offers, manager })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [navigate])

  const handleRenew = async (player) => {
    const newSalary = player.contract_salary + 5000
    if (!window.confirm(`¿Renovar a ${player.last_name} por $${newSalary}/mes?`)) return
    
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
        data.club.id, 
        offer.amount, 
        data.manager.id // We don't have manager ID directly? Wait, we have manager in data? We need to add manager to setData
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

  if (loading) return <div className="flex items-center justify-center min-h-screen text-emerald-500">Cargando plantel...</div>

  return (
    <div className="min-h-screen p-8 text-white bg-zinc-950">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-black flex items-center gap-2 text-emerald-500">
            <Users className="w-8 h-8" /> PLANTEL Y CONTRATOS
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        
        {/* Lista de Jugadores */}
        <div className="lg:col-span-3 p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-zinc-500 border-zinc-800 text-sm">
                  <th className="pb-3 font-medium">Nombre</th>
                  <th className="pb-3 font-medium">Pos</th>
                  <th className="pb-3 font-medium">Edad</th>
                  <th className="pb-3 font-medium">Rol</th>
                  <th className="pb-3 font-medium">Salario</th>
                  <th className="pb-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.players.map(p => (
                  <tr key={p.id} className="border-b border-zinc-900/50 hover:bg-zinc-800/50">
                    <td className="py-3 font-medium text-white">
                      {p.first_name} {p.last_name}
                      {p.injury_days > 0 && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold text-red-500 bg-red-500/20 rounded">Lesionado ({p.injury_days}d)</span>}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-400">
                        {p.position}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-400">{p.age}</td>
                    <td className="py-3 text-zinc-400">
                      <div>{p.contract_role || 'Rotación'}</div>
                      <div className="text-[10px] text-zinc-500">{p.personality}</div>
                    </td>
                    <td className="py-3 font-mono text-emerald-400">${(p.contract_salary || 10000).toLocaleString()}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRenew(p)}
                          className="flex items-center gap-1 text-xs font-bold text-black transition-colors bg-white rounded-lg px-3 py-1.5 hover:bg-zinc-200"
                        >
                          <FileSignature className="w-3 h-3" /> Renovar
                        </button>
                        <button 
                          onClick={() => handleTransferList(p)}
                          className={`flex items-center gap-1 text-xs font-bold transition-colors border rounded-lg px-3 py-1.5 ${
                            p.is_transfer_listed 
                              ? 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30' 
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
          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-white">
              <Users className="w-5 h-5 text-emerald-500" /> Vestuario
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-zinc-400">Cohesión</span>
                  <span className="text-emerald-400">{data.club?.cohesion || 50}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.club?.cohesion || 50}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border border-zinc-800 rounded-3xl bg-emerald-950/20">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-emerald-500">
              <Bell className="w-5 h-5" /> Ofertas ({data.offers.length})
            </h2>
            
            <div className="space-y-4">
              {data.offers.length === 0 ? (
                <p className="text-sm text-zinc-500">No hay ofertas de compra por tus jugadores en este momento.</p>
              ) : (
                data.offers.map(o => (
                  <div key={o.id} className="p-4 border rounded-xl bg-zinc-900 border-zinc-700">
                    <p className="font-bold text-white">{o.players?.first_name} {o.players?.last_name}</p>
                    <p className="text-xs text-zinc-400 mb-3">Oferta de club extranjero</p>
                    <p className="text-lg font-black text-emerald-400 mb-4">${o.amount.toLocaleString()}</p>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOffer(o, 'ACCEPTED')}
                        className="flex-1 py-2 text-xs font-bold text-black bg-emerald-500 rounded-lg hover:bg-emerald-400"
                      >
                        Aceptar
                      </button>
                      <button 
                        onClick={() => handleOffer(o, 'REJECTED')}
                        className="flex-1 py-2 text-xs font-bold text-white bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/40"
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
