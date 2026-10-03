import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clubApi } from '../../../api/club'
import { staffApi, academyApi } from '../../../api/clubFeatures'
import { clubHistoryApi } from '../../../api/clubHistory'
import { supabase } from '../../../api/supabase'
import { 
  ArrowLeft, 
  Building2, 
  UserPlus, 
  GraduationCap, 
  Briefcase, 
  DollarSign,
  History,
  Trophy,
  Crown,
  Star,
  ShieldCheck,
  Flame,
  Users,
  Award,
  Calendar,
  Sparkles,
  TrendingUp,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../../context/GameContext'

export default function ClubScreen() {
  const navigate = useNavigate()
  const { club, loading: contextLoading, confirmAction } = useGameContext()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('gestion') // 'gestion' | 'historia' | 'idolos'

  const [data, setData] = useState({
    staff: [],
    youth: [],
    candidates: [],
    history: [],
    idols: [],
    milestones: [],
    records: [],
    salaries: 0
  })

  const loadData = async () => {
    try {
      if (!club?.id) return

      const [staff, youth, candidates, historyRes, idols, milestones, records, squadRes] = await Promise.all([
        staffApi.getStaff(club.id),
        academyApi.getYouthPlayers(club.id),
        staffApi.getAvailableStaff(),
        supabase.from('season_history').select('*').eq('club_id', club.id).order('season_year', { ascending: false }),
        clubHistoryApi.getIdolsAndLegends(club.id),
        clubHistoryApi.getClubMilestones(club.id),
        clubHistoryApi.getClubRecords(club.id),
        supabase.from('players').select('contract_salary').eq('club_id', club.id)
      ])

      const playerSalaries = squadRes.data?.reduce((sum, p) => sum + Math.round((p.contract_salary || 1000) / 52), 0) || 0
      const staffSalaries = staff?.reduce((sum, s) => sum + Math.round((s.salary || 1000) / 4), 0) || 0
      const totalSalaries = playerSalaries + staffSalaries

      setData({
        staff: staff || [],
        youth: youth || [],
        candidates: candidates || [],
        history: historyRes.data || [],
        idols: idols || [],
        milestones: milestones || [],
        records: records || [],
        salaries: totalSalaries
      })
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar la información del club')
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
      if (club.budget < 5000) return toast.error('Presupuesto insuficiente ($5,000 requeridos)')
      await clubApi.updateClub(club.id, { budget: club.budget - 5000 })
      await academyApi.generateYouthProspect(club.id, club.academy_level || 1)
      toast.success('¡Nuevo juvenil oteado en la academia!')
      loadData()
    } catch (e) {
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

  if (loading || contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-emerald-400 bg-zinc-950">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 animate-pulse" />
          <span className="font-semibold text-sm">Cargando instalaciones del club...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 md:p-6 text-zinc-100 bg-zinc-950 pb-28 md:pb-12 max-w-7xl mx-auto">
      {/* Header institucional */}
      <header className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/80 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 shrink-0"
            title="Volver al panel"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
          </button>
          <div className="truncate">
            <h1 className="text-lg md:text-2xl font-black flex items-center gap-2 text-white truncate leading-tight">
              <Building2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 shrink-0" />
              <span>{club?.name || 'Mi Club'}</span>
            </h1>
            <p className="text-xs text-zinc-400 truncate">
              Fundado en {club?.founded_year || 2026} • {club?.city || 'Ciudad'}, {club?.country || 'Nacional'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[11px] text-zinc-400 font-medium">Presupuesto</p>
          <p className="text-base md:text-xl font-black text-emerald-400">
            ${Number(club?.budget || 0).toLocaleString()}
          </p>
        </div>
      </header>

      {/* Selector de pestañas */}
      <nav className="flex rounded-xl bg-zinc-900/80 p-1 mb-6 border border-zinc-800 text-xs md:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('gestion')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
            activeTab === 'gestion'
              ? 'bg-emerald-500 text-zinc-950 shadow-sm font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Briefcase className="w-4 h-4 shrink-0" />
          <span>Gestión & Staff</span>
        </button>

        <button
          onClick={() => setActiveTab('historia')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
            activeTab === 'historia'
              ? 'bg-emerald-500 text-zinc-950 shadow-sm font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span>Historia & Récords</span>
        </button>

        <button
          onClick={() => setActiveTab('idolos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
            activeTab === 'idolos'
              ? 'bg-emerald-500 text-zinc-950 shadow-sm font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Crown className="w-4 h-4 shrink-0" />
          <span>Ídolos & Leyendas</span>
        </button>
      </nav>

      {/* CONTENIDO TAB 1: GESTIÓN & STAFF */}
      {activeTab === 'gestion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cuerpo Técnico */}
          <div className="p-4 md:p-6 border border-zinc-800 rounded-2xl bg-zinc-900/40">
            <h2 className="flex items-center gap-2 mb-4 font-bold text-base md:text-lg text-white">
              <Briefcase className="w-5 h-5 text-emerald-400 shrink-0" /> Cuerpo Técnico Actual
            </h2>
            
            <div className="space-y-2.5 mb-6">
              {data.staff.length === 0 ? (
                <p className="text-zinc-500 text-xs md:text-sm py-4 text-center border border-dashed border-zinc-800 rounded-xl">
                  Sin asistentes contratados. Eres el único al mando táctico y físico.
                </p>
              ) : (
                data.staff.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 border rounded-xl border-zinc-800 bg-zinc-950/70">
                    <div>
                      <p className="font-bold text-sm text-zinc-100">{s.name}</p>
                      <p className="text-xs text-zinc-400">{s.role} • Nivel {s.level}</p>
                    </div>
                    <button 
                      onClick={async () => {
                        const confirmed = await confirmAction({
                          title: 'Despedir Staff',
                          description: `¿Estás seguro de rescindir el contrato de ${s.name}? Dejará de aportar sus bonificaciones al club.`,
                          confirmText: 'Despedir',
                          cancelText: 'Cancelar',
                          variant: 'danger'
                        })
                        if (confirmed) {
                          await staffApi.fireStaff(s.id)
                          toast.success('Contrato de staff rescindido')
                          loadData()
                        }
                      }} 
                      className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 transition-colors"
                    >
                      Despedir
                    </button>
                  </div>
                ))
              )}
            </div>

            <h3 className="font-bold text-zinc-300 text-xs md:text-sm mb-3 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-400" /> Especialistas Disponibles
            </h3>
            <div className="space-y-2">
              {data.candidates.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-zinc-800/80 rounded-xl bg-zinc-900/40">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-xs md:text-sm text-zinc-200 truncate">{c.name}</p>
                    <p className="text-[11px] text-zinc-400">{c.role} • Nv. {c.level} • ${c.salary}/mes</p>
                  </div>
                  <button 
                    onClick={() => handleHireStaff(c)} 
                    className="p-2 bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-200 rounded-lg transition-colors shrink-0"
                    title="Contratar especialista"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Divisiones Inferiores & Finanzas */}
          <div className="space-y-6">
            {/* Academia */}
            <div className="p-4 md:p-6 border border-zinc-800 rounded-2xl bg-zinc-900/40">
              <div className="flex justify-between items-center mb-4">
                <h2 className="flex items-center gap-2 font-bold text-base md:text-lg text-white">
                  <GraduationCap className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Academia (Nv. {club?.academy_level || 1})</span>
                </h2>
                <button 
                  onClick={handleGenerateProspect} 
                  className="px-3 py-1.5 bg-emerald-500 text-zinc-950 font-bold text-xs rounded-lg hover:bg-emerald-400 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Otear Talento (-$5k)</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {data.youth.length === 0 ? (
                  <p className="text-zinc-500 text-xs md:text-sm py-4 text-center border border-dashed border-zinc-800 rounded-xl">
                    La cantera está vacía. Otea talento juvenil para nutrir el semillero.
                  </p>
                ) : (
                  data.youth.map(y => (
                    <div key={y.id} className="flex justify-between items-center p-3 border rounded-xl border-zinc-800 bg-zinc-950/70">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs md:text-sm text-white">{y.first_name} {y.last_name}</p>
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                            POT {y.attr_potential}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">{y.position} • {y.age} años</p>
                      </div>
                      <button 
                        onClick={() => handlePromote(y.id)} 
                        className="text-xs font-bold text-zinc-950 bg-white px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors shrink-0"
                      >
                        Promover
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Presupuesto y Balance */}
            <div className="p-4 md:p-6 border border-zinc-800 rounded-2xl bg-zinc-900/40">
              <h2 className="flex items-center gap-2 mb-4 font-bold text-base md:text-lg text-white">
                <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" /> Presupuesto & Masa Salarial
              </h2>
              <div className="p-3.5 border border-zinc-800 rounded-xl bg-zinc-950/80 space-y-2.5">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-zinc-400">Balance en Arcas</span>
                  <span className="font-bold text-emerald-400">${Number(club?.budget || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-zinc-400">Sueldos (Plantel + Staff semanal)</span>
                  <span className="font-bold text-red-400">-${(data.salaries || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-zinc-400">Ingresos Proyectados (TV & Sponsors)</span>
                  <span className="font-bold text-emerald-400">+$40,000</span>
                </div>
                <div className="pt-2.5 border-t border-zinc-800 flex justify-between text-xs md:text-sm">
                  <span className="font-bold text-zinc-200">Margen Semanal Estimado</span>
                  <span className={`font-bold ${40000 - (data.salaries || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {40000 - (data.salaries || 0) >= 0 ? '+' : ''}${(40000 - (data.salaries || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 2: HISTORIA & RÉCORDS (FASE 36) */}
      {activeTab === 'historia' && (
        <div className="space-y-6">
          {/* Vitrina de Récords del Club */}
          <section className="p-4 md:p-6 border border-zinc-800 rounded-2xl bg-zinc-900/40">
            <h2 className="flex items-center gap-2 mb-4 font-bold text-base md:text-lg text-white">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Récords Institucionales</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.records.map((r, i) => (
                <div key={i} className="p-4 border border-zinc-800/80 rounded-xl bg-zinc-950/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      {r.record_type === 'biggest_win' && <Trophy className="w-4 h-4 text-emerald-400" />}
                      {r.record_type === 'top_scorer_history' && <Flame className="w-4 h-4 text-amber-400" />}
                      {r.record_type === 'most_appearances' && <ShieldCheck className="w-4 h-4 text-blue-400" />}
                      {r.record_type === 'highest_attendance' && <Users className="w-4 h-4 text-purple-400" />}
                      <span className="text-xs font-semibold">{r.title}</span>
                    </div>
                    <p className="text-lg md:text-xl font-black text-white">{r.record_value}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="truncate">{r.holder_name}</span>
                    <span className="text-zinc-500 shrink-0">{r.record_date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Línea de Tiempo Cronológica (Hitos del Club) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="p-4 md:p-6 border border-zinc-800 rounded-2xl bg-zinc-900/40">
              <h2 className="flex items-center gap-2 mb-4 font-bold text-base md:text-lg text-white">
                <History className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Línea de Tiempo del Club</span>
              </h2>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                {data.milestones.length === 0 ? (
                  <p className="text-zinc-500 text-xs md:text-sm">Sin hitos registrados aún.</p>
                ) : (
                  data.milestones.map((m) => (
                    <div key={m.id} className="relative">
                      {/* Nodo del timeline */}
                      <span className="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full bg-zinc-950 border-2 border-emerald-400" />
                      <div className="p-3.5 border border-zinc-800/80 rounded-xl bg-zinc-950/70">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                            {m.year}
                          </span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                            {m.category || 'Hito'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white">{m.title}</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{m.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Temporadas Jugadas */}
            <section className="p-4 md:p-6 border border-zinc-800 rounded-2xl bg-zinc-900/40">
              <h2 className="flex items-center gap-2 mb-4 font-bold text-base md:text-lg text-white">
                <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Registro de Temporadas</span>
              </h2>
              <div className="space-y-3">
                {data.history.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl">
                    <p className="text-zinc-400 text-xs md:text-sm font-medium">Temporada inaugural en curso.</p>
                    <p className="text-zinc-600 text-[11px] mt-1">El historial se actualizará al cerrar cada campeonato.</p>
                  </div>
                ) : (
                  data.history.map((h) => (
                    <div key={h.id} className="p-3.5 border rounded-xl border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white">Temporada {h.season_year}</p>
                          {h.champion && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-amber-400" /> Campeón
                            </span>
                          )}
                          {h.promoted && !h.champion && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-emerald-400" /> Ascenso
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {h.competition_name || 'Liga'} • Posición {h.position}°
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-zinc-300">
                          {h.matches_won ?? h.won ?? 0}V - {h.matches_drawn ?? h.drawn ?? 0}E - {h.matches_lost ?? h.lost ?? 0}D
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {h.points ?? 0} pts
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 3: ÍDOLOS & LEYENDAS (FASE 37) */}
      {activeTab === 'idolos' && (
        <div className="space-y-6">
          {/* Banner de Impacto Cultural e Hinchada */}
          <div className="p-4 md:p-6 border border-amber-500/30 rounded-2xl bg-amber-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base text-amber-300">Impacto en el Vestuario e Hinchada</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Los referentes y leyendas transmiten mística, elevan la moral (+5 de moral colectiva) y llenan las tribunas en los momentos decisivos.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 shrink-0">
              <Sparkles className="w-4 h-4" />
              <span>{data.idols.length} Figuras Históricas</span>
            </div>
          </div>

          {/* Galería de Ídolos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.idols.length === 0 ? (
              <div className="col-span-full p-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                <Crown className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h4 className="font-bold text-zinc-300 text-sm md:text-base">El club forja su nuevo legado</h4>
                <p className="text-zinc-500 text-xs mt-1 max-w-md mx-auto">
                  Tus jugadores ganan estatus según su trayectoria: Referente (20+ PJ), Ídolo (40+ PJ) y Leyenda (80+ PJ o máximo goleador).
                </p>
              </div>
            ) : (
              data.idols.map(i => (
                <div 
                  key={i.id} 
                  className="p-4 border rounded-2xl border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border ${
                          i.club_status === 'legend' 
                            ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20' 
                            : i.club_status === 'idol'
                            ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-blue-500 text-white border-blue-400'
                        }`}>
                          {i.first_name?.[0]}{i.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white leading-tight">
                            {i.first_name} {i.last_name}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {i.position} • {i.age} años
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${i.badge_color || 'bg-zinc-800 text-zinc-400'}`}>
                        {i.status_label || (i.club_status === 'legend' ? 'Leyenda' : i.club_status === 'idol' ? 'Ídolo' : 'Referente')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 mb-3">
                      <p className="text-[11px] text-zinc-400 italic">
                        "{i.legend_reason || 'Pilar fundamental en la historia y vestuario del club.'}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-1 font-semibold text-zinc-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{i.matches_played || 0} PJ</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-zinc-200">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>{i.goals_scored || 0} Goles</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      ${Number(i.market_value || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
