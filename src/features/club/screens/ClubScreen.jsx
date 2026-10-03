import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../../api/auth'
import { managerApi } from '../../../api/manager'
import { clubApi } from '../../../api/club'
import { staffApi, academyApi } from '../../../api/clubFeatures'
import { ArrowLeft, Building2, UserPlus, GraduationCap, Briefcase, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

import { useGameContext } from '../../../context/GameContext'

export default function ClubScreen() {
  const navigate = useNavigate()
  const { club, loading: contextLoading, refreshContext } = useGameContext()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ staff: [], youth: [], candidates: [], history: [], idols: [] })
  
  const loadData = async () => {
    try {
      const staff = await staffApi.getStaff(club.id)
      const youth = await academyApi.getYouthPlayers(club.id)
      const candidates = await staffApi.getAvailableStaff()
      
      const { supabase } = await import('../../../api/supabase')
      const { data: history } = await supabase.from('season_history').select('*').eq('club_id', club.id).order('season_year', { ascending: false })
      const { data: idols } = await supabase.from('players').select('*').eq('club_id', club.id).eq('is_idol', true)

      const { data: squad } = await supabase.from('players').select('contract_salary').eq('club_id', club.id)
      const playerSalaries = squad?.reduce((sum, p) => sum + Math.round((p.contract_salary || 1000) / 52), 0) || 0
      const staffSalaries = staff?.reduce((sum, s) => sum + Math.round((s.salary || 1000) / 4), 0) || 0 // Assuming monthly salary for staff, so / 4 weeks
      const totalSalaries = playerSalaries + staffSalaries

      setData({ staff, youth, candidates, history: history || [], idols: idols || [], salaries: totalSalaries })
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

  const handleHireStaff = async (staffMember) => {
    try {
      await staffApi.hireStaff(club.id, staffMember)
      toast.success(`${staffMember.name} contratado como ${staffMember.role}`)
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleGenerateProspect = async () => {
    try {
      // Costo de scouting 5k
      if (club.budget < 5000) return toast.error('Presupuesto insuficiente')
      await clubApi.updateClub(club.id, { budget: club.budget - 5000 })
      await academyApi.generateYouthProspect(club.id, club.academy_level || 1)
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

  if (loading || contextLoading) return <div className="flex items-center justify-center min-h-screen text-emerald-500">Cargando instalaciones...</div>

  return (
    <div className="min-h-screen p-4 md:p-8 text-white bg-zinc-950 pb-24 lg:pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 md:gap-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-3xl font-black flex items-center gap-2 text-emerald-500 truncate leading-none mb-1">
            <Building2 className="w-6 h-6 md:w-8 md:h-8 shrink-0" /> MI CLUB
          </h1>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto bg-zinc-900 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none justify-between md:justify-end">
          <button
            onClick={async () => {
              if (window.confirm('¿Seguro que deseas retirarte? Tu carrera finalizará aquí y quedarás en la historia.')) {
                toast.success('Te has retirado del fútbol. ¡Leyenda!')
                const { supabase } = await import('../../../api/supabase')
                await supabase.from('managers').update({ is_retired: true }).eq('id', club.manager_id)
                navigate('/auth')
              }
            }}
            className="text-xs text-red-500 font-bold hover:underline"
          >
            Retirarse (DT)
          </button>
          <div className="text-right">
            <p className="text-xs md:text-sm text-zinc-500">Presupuesto</p>
            <p className="text-xl md:text-2xl font-black text-emerald-400">${Number(club?.budget || 0).toLocaleString()}</p>
          </div>
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
                <GraduationCap className="w-5 h-5 text-emerald-500" /> Academia (Nv. {club?.academy_level})
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
                  <p className="font-bold text-white">Atlético Regional (Tier {Math.max(1, (club?.league_tier || 1) - 1)})</p>
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
          
          {/* Finances */}
          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50 mt-6">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-white text-xl">
              <DollarSign className="w-5 h-5 text-emerald-500" /> Finanzas y Presupuesto
            </h2>
            <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-950">
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-zinc-400">Balance Actual</span>
                 <span className="font-bold text-emerald-400">${Number(club?.budget || 0).toLocaleString()}</span>
               </div>
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-zinc-400">Sueldos (Semanal)</span>
                 <span className="font-bold text-red-400">-{data.salaries ? `$${data.salaries.toLocaleString()}` : 'Calc...'}</span>
               </div>
               <div className="flex justify-between text-sm mb-4">
                 <span className="text-zinc-400">Ingresos (TV/Sponsors)</span>
                 <span className="font-bold text-emerald-400">+$40,000</span>
               </div>
               <div className="pt-3 border-t border-zinc-800 flex justify-between text-sm">
                 <span className="font-bold">Proyección Semanal</span>
                 <span className={`font-bold ${40000 - (data.salaries || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                   {40000 - (data.salaries || 0) >= 0 ? '+' : ''}${(40000 - (data.salaries || 0)).toLocaleString()}
                 </span>
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
