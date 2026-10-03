import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { tacticsApi } from '../../api/tactics'
import { playerApi } from '../../api/player'
import { ArrowLeft, Save, Loader2, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'

import { useGameContext } from '../../context/GameContext'

export default function TacticsScreen() {
  const navigate = useNavigate()
  const { club, loading: contextLoading } = useGameContext()
  const [data, setData] = useState({ tactic: null, players: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (contextLoading || !club) return
    const load = async () => {
      try {
        const tactic = await tacticsApi.getTactic(club.id)
        const players = await playerApi.getSquad(club.id)
        
        setData({ tactic, players })
        setForm(tactic)
      } catch (e) {
        toast.error(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contextLoading, club])

  const handleSave = async () => {
    setSaving(true)
    try {
      await tacticsApi.updateTactic(club.id, form)
      toast.success('Táctica guardada')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form || contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-400 font-medium text-sm animate-pulse">Cargando pizarra táctica...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 sm:p-6 md:p-8 text-white bg-zinc-950 pb-28 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4 md:gap-0">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-3xl font-black text-emerald-500 truncate leading-none">PIZARRA TÁCTICA</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 font-bold text-black transition-transform bg-emerald-500 rounded-xl hover:bg-emerald-400 hover:scale-105 disabled:opacity-50 text-sm shadow-lg shadow-emerald-500/10"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Cambios
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Panel Izquierdo: Opciones Tácticas */}
        <div className="space-y-6">
          <div className="p-4 sm:p-6 border border-zinc-800 rounded-2xl md:rounded-3xl bg-zinc-900/50">
            <h2 className="flex items-center gap-2 mb-4 sm:mb-6 text-lg sm:text-xl font-bold">
              <LayoutGrid className="w-5 h-5 text-emerald-500" /> Sistema
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-400">Formación</label>
                <select 
                  value={form.formation} 
                  onChange={e => setForm({...form, formation: e.target.value})}
                  className="w-full p-3 border rounded-xl bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus:outline-none"
                >
                  {['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2', '4-1-4-1'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-400">Mentalidad</label>
                <select 
                  value={form.mentality} 
                  onChange={e => setForm({...form, mentality: e.target.value})}
                  className="w-full p-3 border rounded-xl bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus:outline-none"
                >
                  {['Defensiva', 'Equilibrada', 'Ofensiva'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-400">Presión</label>
                <select 
                  value={form.pressure} 
                  onChange={e => setForm({...form, pressure: e.target.value})}
                  className="w-full p-3 border rounded-xl bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus:outline-none"
                >
                  {['Baja', 'Media', 'Alta'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-400">Ritmo</label>
                <select 
                  value={form.tempo} 
                  onChange={e => setForm({...form, tempo: e.target.value})}
                  className="w-full p-3 border rounded-xl bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus:outline-none"
                >
                  {['Lento', 'Normal', 'Alto'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-400">Construcción</label>
                <select 
                  value={form.build_up} 
                  onChange={e => setForm({...form, build_up: e.target.value})}
                  className="w-full p-3 border rounded-xl bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus:outline-none"
                >
                  {['Directa', 'Mixta', 'Posesión'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Plantel y Once Inicial */}
        <div className="p-6 border lg:col-span-2 border-zinc-800 rounded-3xl bg-zinc-900/50">
          <h2 className="mb-6 text-xl font-bold">Plantel</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-zinc-500 border-zinc-800">
                  <th className="pb-3 font-medium">Nº</th>
                  <th className="pb-3 font-medium">Nombre</th>
                  <th className="pb-3 font-medium">Posición</th>
                  <th className="pb-3 font-medium">Fitness</th>
                  <th className="pb-3 font-medium">Moral</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.players.map(p => (
                  <tr key={p.id} className="border-b border-zinc-900/50 hover:bg-zinc-800/50">
                    <td className="py-3 font-bold text-zinc-400">{p.shirt_number}</td>
                    <td className="py-3 font-medium text-white">{p.first_name} {p.last_name}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-400">
                        {p.position}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="w-16 h-2 rounded-full bg-zinc-800">
                        <div className="h-full bg-blue-500 rounded-full" style={{width: `${p.state_fitness}%`}} />
                      </div>
                    </td>
                    <td className="py-3 text-zinc-300">{p.state_morale}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
    </div>
  )
}
