import React, { useState, useEffect } from 'react'
import { 
  Trophy, 
  History, 
  Newspaper, 
  Flame, 
  ShieldCheck, 
  Users, 
  Calendar, 
  Sparkles, 
  Filter, 
  Award, 
  PlusCircle, 
  Medal, 
  Landmark,
  TrendingUp,
  Clock,
  BookOpen
} from 'lucide-react'
import { clubHistoryApi } from '../../../api/clubHistory'
import { supabase } from '../../../api/supabase'
import { toast } from 'sonner'

export default function ClubHistoryTab({ club, confirmAction, onUpdateClub }) {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [milestones, setMilestones] = useState([])
  const [hemeroteca, setHemeroteca] = useState([])
  const [seasons, setSeasons] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subTab, setSubTab] = useState('timeline') // 'timeline' | 'hemeroteca' | 'temporadas'

  const loadHistoryData = async () => {
    try {
      setLoading(true)
      if (!club?.id) return

      const [recordsRes, milestonesRes, hemerotecaRes, seasonsRes] = await Promise.all([
        clubHistoryApi.getClubRecords(club.id),
        clubHistoryApi.getClubMilestones(club.id, categoryFilter),
        clubHistoryApi.getHemeroteca(club.id),
        supabase.from('season_history').select('*').eq('club_id', club.id).order('season_year', { ascending: false })
      ])

      setRecords(recordsRes || [])
      setMilestones(milestonesRes || [])
      setHemeroteca(hemerotecaRes || [])
      setSeasons(seasonsRes.data || [])
    } catch (err) {
      console.error('Error cargando historial del club:', err)
      toast.error('No se pudo cargar la historia del club')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistoryData()
  }, [club?.id, categoryFilter])

  const getRecordIcon = (type) => {
    switch (type) {
      case 'biggest_win':
        return <Trophy className="w-4 h-4 text-emerald-400" />
      case 'top_scorer_history':
        return <Flame className="w-4 h-4 text-amber-400" />
      case 'most_appearances':
        return <ShieldCheck className="w-4 h-4 text-blue-400" />
      case 'highest_attendance':
        return <Users className="w-4 h-4 text-purple-400" />
      case 'longest_win_streak':
        return <TrendingUp className="w-4 h-4 text-rose-400" />
      case 'record_sale':
        return <Award className="w-4 h-4 text-emerald-300" />
      default:
        return <Medal className="w-4 h-4 text-zinc-400" />
    }
  }

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'foundation':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Fundación</span>
      case 'title':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">Campeón</span>
      case 'promotion':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">Ascenso</span>
      case 'record':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">Récord</span>
      case 'legend':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">Ídolo</span>
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">Hito</span>
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-emerald-400">
        <History className="w-6 h-6 animate-spin mr-3" />
        <span className="text-sm font-semibold">Consultando archivos de la institución...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Vitrina de Récords Institucionales */}
      <section className="p-4 md:p-6 border border-zinc-800 rounded-2xl bg-zinc-900/40 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 font-bold text-base md:text-lg text-white">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Récords Institucionales Históricos</span>
          </h2>
          <span className="text-xs text-zinc-400 font-medium">Marcas vigentes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {records.map((r, i) => (
            <div key={i} className="p-4 border border-zinc-800/80 rounded-xl bg-zinc-950/70 flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div>
                <div className="flex items-center gap-2 text-zinc-400 mb-1.5">
                  {getRecordIcon(r.record_type)}
                  <span className="text-xs font-semibold">{r.title}</span>
                </div>
                <p className="text-lg md:text-xl font-black text-white">{r.record_value}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="truncate font-medium">{r.holder_name}</span>
                <span className="text-zinc-500 shrink-0">{r.record_date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sub-navegación entre Cronología, Hemeroteca y Temporadas */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setSubTab('timeline')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            subTab === 'timeline'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Línea Temporal ({milestones.length})</span>
        </button>

        <button
          onClick={() => setSubTab('hemeroteca')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            subTab === 'hemeroteca'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>Hemeroteca ({hemeroteca.length})</span>
        </button>

        <button
          onClick={() => setSubTab('temporadas')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            subTab === 'temporadas'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Temporadas ({seasons.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: LÍNEA TEMPORAL */}
      {subTab === 'timeline' && (
        <section className="p-4 md:p-6 border border-zinc-800 rounded-2xl bg-zinc-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              <span>Cronología de Hitos Oficiales</span>
            </h3>

            {/* Filtros de categoría */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0 mr-1" />
              {[
                { id: 'all', label: 'Todos' },
                { id: 'foundation', label: 'Fundación' },
                { id: 'title', label: 'Títulos' },
                { id: 'promotion', label: 'Ascensos' },
                { id: 'record', label: 'Récords' },
                { id: 'legend', label: 'Ídolos' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                    categoryFilter === f.id
                      ? 'bg-zinc-800 text-white border border-zinc-700 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
            {milestones.length === 0 ? (
              <p className="text-zinc-500 text-xs md:text-sm py-4">No hay hitos que coincidan con el filtro seleccionado.</p>
            ) : (
              milestones.map((m) => (
                <div key={m.id} className="relative group">
                  <span className="absolute -left-[29px] top-1.5 w-3.5 h-3.5 rounded-full bg-zinc-950 border-2 border-emerald-400 group-hover:scale-125 transition-transform" />
                  <div className="p-4 border border-zinc-800/80 rounded-xl bg-zinc-950/70 hover:border-zinc-700 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                          {m.year}
                        </span>
                        {getCategoryBadge(m.category)}
                      </div>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        {m.game_date || `${m.year}`}
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
      )}

      {/* SUBTAB 2: HEMEROTECA / RECORTES DE PRENSA */}
      {subTab === 'hemeroteca' && (
        <section className="p-4 md:p-6 border border-zinc-800 rounded-2xl bg-zinc-900/40">
          <div className="mb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-amber-400" />
              <span>Hemeroteca: Archivos y Crónicas de Prensa</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Las portadas y artículos que registraron las hazañas del club a lo largo de los años.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hemeroteca.length === 0 ? (
              <p className="text-zinc-500 text-xs md:text-sm py-4">No hay crónicas archivadas en la hemeroteca aún.</p>
            ) : (
              hemeroteca.map((art) => (
                <div key={art.id} className="p-4 border border-zinc-800 rounded-xl bg-zinc-950/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="font-bold uppercase tracking-wider text-amber-400">
                        {art.media_source}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
                        Temporada {art.season_year}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-zinc-100 mb-2 leading-snug">
                      "{art.headline}"
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      {art.snippet}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="font-medium">Edición Histórica</span>
                    <span className="font-bold text-zinc-400">#{art.tag || 'ARCHIVO'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* SUBTAB 3: REGISTRO DE TEMPORADAS */}
      {subTab === 'temporadas' && (
        <section className="p-4 md:p-6 border border-zinc-800 rounded-2xl bg-zinc-900/40">
          <div className="mb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span>Memoria de Temporadas Finalizadas</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Registro histórico del rendimiento competitivo al término de cada campeonato oficial.
            </p>
          </div>

          <div className="space-y-3">
            {seasons.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl">
                <BookOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-300 text-sm font-semibold">Temporada Inaugural en Curso</p>
                <p className="text-zinc-500 text-xs mt-1">
                  El registro se completará automáticamente al disputar la última fecha del torneo y procesar el cierre anual.
                </p>
              </div>
            ) : (
              seasons.map((h) => (
                <div key={h.id} className="p-3.5 border rounded-xl border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-white">Temporada {h.season_year}</p>
                      {h.promoted && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          Ascenso
                        </span>
                      )}
                      {h.champion && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Campeón
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Posición: <strong className="text-zinc-200">#{h.final_position || '-'}</strong> • Puntos: <strong className="text-zinc-200">{h.points || 0}</strong> • Goles: <strong className="text-zinc-200">{h.goals_for || 0}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-500 font-mono">
                      {h.won || 0}G / {h.drawn || 0}E / {h.lost || 0}P
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  )
}
