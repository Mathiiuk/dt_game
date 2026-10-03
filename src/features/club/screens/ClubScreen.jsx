import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../../api/auth'
import { managerApi } from '../../../api/manager'
import { clubApi } from '../../../api/club'
import { staffApi, academyApi } from '../../../api/clubFeatures'
import { ArrowLeft, Building2, UserPlus, GraduationCap, Briefcase } from 'lucide-react'
import { toast } from 'sonner'

export default function ClubScreen() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ club: null, staff: [], youth: [], candidates: [] })
  
  const loadData = async () => {
    try {
      const user = await authApi.getSession()
      if (!user) return navigate('/auth')
      const manager = await managerApi.getManager(user.id)
      const club = await clubApi.getClubByManager(manager.id)
      
      const staff = await staffApi.getStaff(club.id)
      const youth = await academyApi.getYouthPlayers(club.id)
      const candidates = await staffApi.getAvailableStaff()
      
      const { supabase } = await import('../../api/supabase')
      const { data: history } = await supabase.from('season_history').select('*').eq('club_id', club.id).order('season_year', { ascending: false })
      const { data: idols } = await supabase.from('players').select('*').eq('club_id', club.id).eq('is_idol', true)

      setData({ club, staff, youth, candidates, history: history || [], idols: idols || [] })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [navigate])

  const handleHireStaff = async (staffMember) => {
    try {
      await staffApi.hireStaff(data.club.id, staffMember)
      toast.success(`${staffMember.name} contratado como ${staffMember.role}`)
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleGenerateProspect = async () => {
    try {
      // Costo de scouting 5k
      if (data.club.budget < 5000) return toast.error('Presupuesto insuficiente')
      await clubApi.updateClub(data.club.id, { budget: data.club.budget - 5000 })
      await academyApi.generateYouthProspect(data.club.id, data.club.academy_level || 1)
      toast.success('¡Nuevo juvenil reclutado en la academia!')
      loadData()
    } catch(e) {
      toast.error(e.message)
    }
  }

  const handlePromote = async (youthId) => {
    try {
      await academyApi.promoteToFirstTeam(youthId)
      toast.success('Jugador promovido al primer equipo')
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-emerald-500">Cargando instalaciones...</div>

  return (
    <div className="min-h-screen p-8 text-white bg-zinc-950">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-black flex items-center gap-2 text-emerald-500">
            <Building2 className="w-8 h-8" /> MI CLUB
          </h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500">Presupuesto</p>
          <p className="text-2xl font-black text-emerald-400">${Number(data.club?.budget || 0).toLocaleString()}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* Cuerpo Técnico */}
        <div className="space-y-6">
          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-white text-xl">
              <Briefcase className="w-5 h-5 text-emerald-500" /> Cuerpo Técnico
            </h2>
            
            <div className="space-y-3 mb-6">
              {data.staff.length === 0 ? (
                <p className="text-zinc-500 text-sm">No tienes cuerpo técnico. Eres el único al mando.</p>
              ) : (
                data.staff.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 border rounded-xl border-zinc-800 bg-zinc-950">
                    <div>
                      <p className="font-bold">{s.name}</p>
                      <p className="text-xs text-zinc-400">{s.role} • Nivel {s.level}</p>
                    </div>
                    <button onClick={async () => {
                      if(window.confirm('¿Despedir?')) {
                        await staffApi.fireStaff(s.id); loadData();
                      }
                    }} className="text-xs text-red-500 hover:underline">Despedir</button>
                  </div>
                ))
              )}
            </div>

            <h3 className="font-bold text-zinc-400 text-sm mb-3">Candidatos Disponibles</h3>
            <div className="space-y-3">
              {data.candidates.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-zinc-800/50 rounded-xl bg-zinc-900/30">
                  <div>
                    <p className="font-bold text-sm">{c.name}</p>
                    <p className="text-xs text-zinc-500">{c.role} • Nivel {c.level} • ${c.salary}/mes</p>
                  </div>
                  <button onClick={() => handleHireStaff(c)} className="p-2 bg-zinc-800 hover:bg-emerald-500 hover:text-black rounded-lg transition-colors">
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divisiones Inferiores */}
        <div className="space-y-6">
          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="flex items-center gap-2 font-bold text-white text-xl">
                <GraduationCap className="w-5 h-5 text-emerald-500" /> Academia (Nv. {data.club?.academy_level})
              </h2>
              <button onClick={handleGenerateProspect} className="px-4 py-2 bg-emerald-500 text-black font-bold text-sm rounded-lg hover:bg-emerald-400">
                Otear Talento (-$5k)
              </button>
            </div>

            <div className="space-y-3">
              {data.youth.length === 0 ? (
                <p className="text-zinc-500 text-sm">La academia está vacía. Invierte en scouting de juveniles.</p>
              ) : (
                data.youth.map(y => (
                  <div key={y.id} className="flex justify-between items-center p-4 border rounded-xl border-zinc-800 bg-zinc-950">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{y.first_name} {y.last_name}</p>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 rounded">
                          POT {y.attr_potential}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{y.position} • {y.age} años</p>
                    </div>
                    <button onClick={() => handlePromote(y.id)} className="text-xs font-bold text-black bg-white px-3 py-1.5 rounded hover:bg-zinc-200 transition-colors">
                      Promover
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50 mt-6">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-white text-xl">
              💼 Ofertas de Trabajo
            </h2>
            <div className="p-4 border border-zinc-800 rounded-xl bg-purple-950/20">
              <p className="mb-2 text-sm text-zinc-300">
                Tu excelente desempeño ha llamado la atención de otro equipo.
              </p>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-bold text-white">Atlético Regional (Tier {Math.max(1, (data.club?.league_tier || 1) - 1)})</p>
                  <p className="text-xs text-purple-400">Objetivo: Evitar el Descenso</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (window.confirm('¿Aceptar la oferta? Cambiarás de club (MVP: Reinicio simulado de club actual).')) {
                    toast.success('¡Has firmado con el nuevo equipo!')
                  }
                }}
                className="w-full py-2 text-xs font-bold text-black bg-purple-500 rounded-lg hover:bg-purple-400"
              >
                Aceptar Oferta
              </button>
            </div>
          </div>
        </div>

        </div>
      </div>

      {/* Historia e Ídolos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
          <h2 className="flex items-center gap-2 mb-6 font-bold text-white text-xl">
            📖 Historia del Club
          </h2>
          <div className="space-y-4">
            {data.history.length === 0 ? (
              <p className="text-zinc-500 text-sm">Aún no hay temporadas registradas.</p>
            ) : (
              data.history.map(h => (
                <div key={h.id} className="p-4 border rounded-xl border-zinc-800 bg-zinc-950 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">Temporada {h.season_year}</p>
                    <p className="text-xs text-emerald-400">Posición {h.position}</p>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    {h.matches_won}V - {h.matches_drawn}E - {h.matches_lost}D
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
          <h2 className="flex items-center gap-2 mb-6 font-bold text-white text-xl">
            ⭐ Ídolos y Leyendas
          </h2>
          <div className="space-y-4">
            {data.idols.length === 0 ? (
              <p className="text-zinc-500 text-sm">El club aún busca a sus próximos ídolos.</p>
            ) : (
              data.idols.map(i => (
                <div key={i.id} className="p-4 border rounded-xl border-zinc-800 bg-zinc-950 flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-black text-xl">
                    {i.first_name[0]}{i.last_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-white">{i.first_name} {i.last_name}</p>
                    <p className="text-xs text-zinc-400">Leyenda del Club</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
